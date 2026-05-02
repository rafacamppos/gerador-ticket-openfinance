const { openFinanceApiBaseUrl } = require('../config/env');

const OPEN_FINANCE_ENVIRONMENTS = [
  {
    key: 'production',
    label: 'PRODUCAO',
    baseUrl: 'https://servicedesk.openfinancebrasil.org.br',
  },
  {
    key: 'homologation',
    label: 'HOMOLOGACAO',
    baseUrl: 'https://servicedesksandbox.openfinancebrasil.org.br',
  },
];

function getDefaultEnvironment() {
  return resolveEnvironment(openFinanceApiBaseUrl) || OPEN_FINANCE_ENVIRONMENTS[0];
}

function listAvailableEnvironments() {
  return OPEN_FINANCE_ENVIRONMENTS.map((environment) => ({ ...environment }));
}

function resolveEnvironment(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  return (
    OPEN_FINANCE_ENVIRONMENTS.find(
      (environment) =>
        environment.key.toLowerCase() === normalizedValue ||
        environment.label.toLowerCase() === normalizedValue ||
        environment.baseUrl.toLowerCase() === normalizedValue
    ) || null
  );
}

module.exports = {
  getDefaultEnvironment,
  listAvailableEnvironments,
  resolveEnvironment,
};
