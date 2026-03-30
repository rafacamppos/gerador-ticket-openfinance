function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'sim', 'yes', '1', 'y', 'enabled', 'ativado'].includes(normalized)) {
      return true;
    }
    if (['false', 'nao', 'não', 'no', '0', 'n', 'disabled', 'desativado'].includes(normalized)) {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getPreferredEntryValue(entry) {
  if (!isPlainObject(entry)) {
    return null;
  }

  if (Array.isArray(entry.value)) {
    return entry.value;
  }

  if (entry.valueCaption !== undefined && entry.valueCaption !== null && entry.valueCaption !== '') {
    return entry.valueCaption;
  }

  return entry.value ?? null;
}

function buildUserInfoMap(payload = {}) {
  const userInfo = Array.isArray(payload?.user?.info) ? payload.user.info : [];
  const infoMap = new Map();

  for (const entry of userInfo) {
    if (!isPlainObject(entry)) {
      continue;
    }

    const preferredValue = getPreferredEntryValue(entry);
    const aliases = [
      entry.key,
      entry.keyCaption,
      entry.fieldName,
      entry.label,
      entry.name,
    ].filter(Boolean);

    for (const alias of aliases) {
      infoMap.set(normalizeKey(alias), preferredValue);
    }
  }

  return infoMap;
}

function collectEntries(value, bucket = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectEntries(item, bucket);
    }
    return bucket;
  }

  if (!isPlainObject(value)) {
    return bucket;
  }

  const rawFieldKey = value.key || value.name || value.label || value.fieldName;
  if (rawFieldKey && Object.prototype.hasOwnProperty.call(value, 'value')) {
    bucket.push([normalizeKey(rawFieldKey), value.value]);
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    bucket.push([normalizeKey(key), nestedValue]);
    collectEntries(nestedValue, bucket);
  }

  return bucket;
}

function findValue(payload, aliases, fallback = null) {
  const entries = collectEntries(payload);

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    const found = entries.find(([key, value]) => key === normalizedAlias && value !== undefined && value !== null && value !== '');
    if (found) {
      return found[1];
    }
  }

  return fallback;
}

function findArray(payload, aliases) {
  const entries = collectEntries(payload);

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    const found = entries.find(([key, value]) => key === normalizedAlias && Array.isArray(value));
    if (found) {
      return found[1];
    }
  }

  return [];
}

function findUserInfoValue(infoMap, aliases, fallback = null) {
  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    if (infoMap.has(normalizedAlias)) {
      const value = infoMap.get(normalizedAlias);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }

  return fallback;
}

function formatGroup(group) {
  if (!isPlainObject(group)) {
    return {
      nome: null,
      nivel_suporte: null,
    };
  }

  return {
    nome:
      findValue(group, ['name', 'nome', 'group_name', 'support_group_name']) || null,
    nivel_suporte:
      findValue(group, ['supportLevel', 'nivel_suporte', 'support_level']) ?? null,
  };
}

function formatSessionResponse(payload = {}, sessionState = {}) {
  const userInfoMap = buildUserInfoMap(payload);
  const groups =
    findUserInfoValue(userInfoMap, ['user_groups'], null) ||
    findArray(payload, ['groups', 'supportGroups', 'grupos']);

  const isDisabled = findUserInfoValue(userInfoMap, ['disable', 'desabilitado'], null);

  return {
    sistema: {
      versao: findValue(payload, ['sysaid_version', 'version', 'versao', 'buildVersion', 'systemVersion']),
      idioma: findValue(payload, ['language', 'idioma', 'lang']),
      formato_data: findValue(payload, [
        'date_format',
        'dateTimeFormat',
        'formato_data',
        'dateFormat',
        'datetimeformat',
        'data_format',
        'date_time_format',
      ]),
    },

    usuario: {
      id: String(findValue(payload, ['userId', 'id', 'userid', 'user_id'], '')),
      nome:
        findUserInfoValue(userInfoMap, [
          'calculated_user_name',
          'display_name',
          'first_name',
          'nome',
        ]) ||
        findValue(payload, [
          'userName',
          'nome',
          'displayName',
          'fullName',
          'username',
          'user_name',
        ]),
      login:
        findUserInfoValue(userInfoMap, ['login_user', 'email_address', 'login do usuario']) ||
        findValue(payload, [
          'loginName',
          'login',
          'userLogin',
          'emailAddress',
          'email',
          'user_email',
        ]),
      email:
        findUserInfoValue(userInfoMap, ['email_address', 'e_mail', 'email']) ||
        findValue(payload, ['email', 'emailAddress', 'mail', 'user_email']),
      empresa:
        findUserInfoValue(userInfoMap, ['company', 'empresa', 'company_name']) ||
        findValue(payload, [
          'companyName',
          'empresa',
          'company',
          'accountName',
          'company_name',
        ]),

      perfil: {
        tipo:
          findUserInfoValue(userInfoMap, ['user_type', 'tipo de usuario']) ||
          findValue(payload, [
            'roleType',
            'tipo_perfil',
            'roleName',
            'userType',
            'role_type',
            'profile_type',
          ]),
        isAdmin: toBoolean(findValue(payload, ['isAdmin', 'admin'])),
        isManager: toBoolean(findValue(payload, ['isManager', 'manager'])),
        isSysAidAdmin: toBoolean(findValue(payload, ['isSysAidAdmin', 'sysaidAdmin'])),
        isGuest: toBoolean(findValue(payload, ['isGuest', 'guest'])),
        ativo:
          isDisabled !== null
            ? !['y', 'yes', 'true', '1', 'sim'].includes(String(isDisabled).trim().toLowerCase())
            : toBoolean(findValue(payload, ['isActive', 'ativo', 'active'])),
        usuario_integracao: toBoolean(
          findUserInfoValue(userInfoMap, ['customcolumn94user', 'usuario de integracao']) ??
            findValue(payload, ['isIntegrationUser', 'usuario_integracao', 'integrationUser'])
        ),
      },

      acesso: {
        grupos: groups.map(formatGroup).filter((group) => group.nome || group.nivel_suporte !== null),
        permissoes_por_grupo: toBoolean(
          findUserInfoValue(userInfoMap, ['permissions_by_groups', 'permissoes por grupos de usuario']) ??
            findValue(payload, ['groupPermissionsEnabled', 'permissoes_por_grupo'])
        ),
      },

      configuracoes: {
        timezone:
          findUserInfoValue(userInfoMap, ['timezone', 'fuso horario']) ||
          findValue(payload, ['timezone', 'timeZone', 'time_zone']),
        locale:
          findUserInfoValue(userInfoMap, ['locale', 'idioma']) ||
          findValue(payload, ['locale', 'regionalSettings', 'regional_setting']),
        notificacoes_email: toBoolean(
          findUserInfoValue(userInfoMap, ['email_notifications', 'receber notificacoes de e_mail de chamados automaticas']) ??
            findValue(payload, ['emailNotificationsEnabled', 'notificacoes_email', 'emailNotifications'])
        ),
      },

      auditoria: {
        ultimo_login:
          findUserInfoValue(userInfoMap, ['customcolumn143user', 'last login', 'last_login']) ||
          findValue(payload, ['lastLogin', 'ultimo_login', 'last_login']),
        login_source:
          findUserInfoValue(userInfoMap, ['customcolumn144user', 'login source', 'login_source']) ||
          findValue(payload, ['loginSource', 'login_source']),
      },
    },

    sessao: {
      account_id: findValue(payload, ['accountId', 'account_id']),
      cookie_presente: Boolean(sessionState.cookie),
    },
  };
}

module.exports = {
  formatSessionResponse,
};
