const {
  ticketOwnerClassificationEnabled,
} = require('../config/env');
const logger = require('../utils/logger');

const DEFAULT_FALLBACK_OWNER = {
  slug: 'su-super-usuarios',
  name: 'SU (Super Usuário)',
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let ownersCache = null;
let rulesCache = null;
let ownersCacheExpiresAt = 0;
let rulesCacheExpiresAt = 0;

function getTicketOwnerRepository() {
  // Lazy-load the repository so tests and local runs can still work
  // even when the PostgreSQL driver is not installed.
  return require('../repositories/ticketOwnerRepository');
}

function normalizeComparableValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function buildRoutingContext(ticket = {}) {
  return {
    id: ticket?.ticket?.id || '',
    title: ticket?.ticket?.title || '',
    status: ticket?.ticket?.status || '',
    type: ticket?.ticket?.type || '',
    sr_type: ticket?.ticket?.sr_type || '',
    template: ticket?.ticket?.template || '',
    problem_type: ticket?.ticket?.category?.nivel1 || '',
    problem_sub_type: ticket?.ticket?.category?.nivel2 || '',
    third_level_category: ticket?.ticket?.category?.nivel3 || '',
    assigned_group: ticket?.assignment?.grupo || '',
    request_user: ticket?.assignment?.solicitante || '',
    responsibility: ticket?.assignment?.responsavel || '',
    current_support_level: ticket?.assignment?.nivel_suporte_atual || '',
    instituicao_requerente: ticket?.assignment?.instituicao_requerente || '',
    endpoint: ticket?.api_context?.endpoint || '',
    http_status: ticket?.api_context?.http_status || '',
    interaction_id: ticket?.api_context?.interaction_id || '',
  };
}

function precompileRules(rules) {
  return rules.map((rule) => {
    if (rule.operator !== 'regex') {
      return rule;
    }
    try {
      return { ...rule, _compiledRegex: new RegExp(rule.expected_value, 'i') };
    } catch {
      return { ...rule, _compiledRegex: null };
    }
  });
}

function evaluateRule(fieldValue, operator, expectedValue, compiledRegex = null) {
  const normalizedFieldValue = normalizeComparableValue(fieldValue);
  const normalizedExpectedValue = normalizeComparableValue(expectedValue);

  switch (operator) {
    case 'equals':
      return normalizedFieldValue === normalizedExpectedValue;
    case 'not_equals':
      return normalizedFieldValue !== normalizedExpectedValue;
    case 'contains':
      return normalizedFieldValue.includes(normalizedExpectedValue);
    case 'starts_with':
      return normalizedFieldValue.startsWith(normalizedExpectedValue);
    case 'ends_with':
      return normalizedFieldValue.endsWith(normalizedExpectedValue);
    case 'in':
      return normalizedExpectedValue
        .split(/[;,|]/)
        .map((value) => value.trim())
        .filter(Boolean)
        .includes(normalizedFieldValue);
    case 'regex':
      try {
        const re = compiledRegex || new RegExp(expectedValue, 'i');
        return re.test(String(fieldValue || ''));
      } catch {
        return false;
      }
    default:
      return false;
  }
}

function resolveFallbackOwner(owners = []) {
  return (
    owners.find((owner) => owner.is_fallback_owner) ||
    DEFAULT_FALLBACK_OWNER
  );
}

function applyRouting(ticket, owner, resolutionType, matchedRuleGroup = null) {
  return {
    ...ticket,
    routing: {
      owner_slug: owner?.slug || null,
      owner_name: owner?.name || null,
      resolution_type: resolutionType,
      matched_rule_group: matchedRuleGroup,
    },
  };
}

function classifyTicketWithRules(ticket, owners, rules) {
  const fallbackOwner = resolveFallbackOwner(owners);
  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));
  const routingContext = buildRoutingContext(ticket);
  const groups = new Map();

  for (const rule of rules) {
    const owner = ownerMap.get(rule.ticket_owner_id);
    if (!owner) {
      continue;
    }

    const groupKey = `${rule.ticket_owner_id}:${rule.rule_group_code}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        owner,
        ruleGroupCode: rule.rule_group_code,
        logicalOperator: rule.logical_operator,
        priorityOrder: rule.priority_order,
        items: [],
      });
    }

    groups.get(groupKey).items.push(rule);
  }

  const matches = [];

  for (const group of groups.values()) {
    const evaluations = group.items.map((rule) =>
      evaluateRule(routingContext[rule.field_code], rule.operator, rule.expected_value, rule._compiledRegex || null)
    );

    const matched =
      group.logicalOperator === 'OR'
        ? evaluations.some(Boolean)
        : evaluations.every(Boolean);

    if (matched) {
      matches.push(group);
    }
  }

  matches.sort((left, right) => left.priorityOrder - right.priorityOrder);

  if (matches.length === 1) {
    return applyRouting(ticket, matches[0].owner, 'automatic', matches[0].ruleGroupCode);
  }

  if (matches.length > 1) {
    return applyRouting(ticket, fallbackOwner, 'rule_conflict');
  }

  return applyRouting(ticket, fallbackOwner, 'fallback_su');
}

async function getCachedOwners(repository) {
  if (!ownersCache || Date.now() > ownersCacheExpiresAt) {
    ownersCache = await repository.listActiveOwners();
    ownersCacheExpiresAt = Date.now() + CACHE_TTL_MS;
  }
  return ownersCache;
}

async function getCachedRules(repository) {
  if (!rulesCache || Date.now() > rulesCacheExpiresAt) {
    rulesCache = await repository.listActiveRules();
    rulesCacheExpiresAt = Date.now() + CACHE_TTL_MS;
  }
  return rulesCache;
}

function clearClassificationCache() {
  ownersCache = null;
  rulesCache = null;
  ownersCacheExpiresAt = 0;
  rulesCacheExpiresAt = 0;
}

async function classifyTickets(tickets) {
  if (!ticketOwnerClassificationEnabled || !Array.isArray(tickets) || !tickets.length) {
    return tickets;
  }

  try {
    const ticketOwnerRepository = getTicketOwnerRepository();
    const [owners, rawRules] = await Promise.all([
      getCachedOwners(ticketOwnerRepository),
      getCachedRules(ticketOwnerRepository),
    ]);
    const rules = precompileRules(rawRules);

    return tickets.map((ticket) => classifyTicketWithRules(ticket, owners, rules));
  } catch (error) {
    logger.error('Ticket owner classification failed', {
      errorMessage: error.message,
    });
    return tickets.map((ticket) =>
      applyRouting(ticket, DEFAULT_FALLBACK_OWNER, 'classification_unavailable')
    );
  }
}

async function classifyTicket(ticket) {
  const [classifiedTicket] = await classifyTickets(ticket ? [ticket] : []);
  return classifiedTicket || ticket;
}

module.exports = {
  buildRoutingContext,
  classifyTicketWithRules,
  classifyTicket,
  classifyTickets,
  clearClassificationCache,
};
