/**
 * Merge inteligente de payload base com template_data
 * Estratégia: PAYLOAD BASE SOBRESCREVE template_data
 * - Payload base contém campos obrigatórios e críticos
 * - Template_data contém apenas campos específicos do template
 * - Se um campo existe em ambos, o do payload base vence
 */

const logger = require('../utils/logger');

/**
 * Faz merge do payload base com template_data
 * Base sobrescreve template_data em caso de conflito
 */
function mergePayload(payloadBase, templateData = null) {
  // Starts with template_data (if exists)
  const merged = templateData && typeof templateData === 'object'
    ? { ...templateData }
    : {};

  // Base sobrescreve tudo (including template_data fields)
  return {
    ...merged,
    ...payloadBase,
  };
}

/**
 * Extrai dados de categoria do payload
 */
function extractCategoryData(payload) {
  const categoryData = payload.category_data;

  if (!categoryData || typeof categoryData !== 'object') {
    const error = new Error('Field "category_data" must be a valid object');
    error.code = 'INVALID_CATEGORY_DATA';
    throw error;
  }

  const { category_name, sub_category_name, third_level_category_name } = categoryData;

  if (!category_name || !sub_category_name || !third_level_category_name) {
    const error = new Error(
      'Field "category_data" must contain: category_name, sub_category_name, third_level_category_name'
    );
    error.code = 'INCOMPLETE_CATEGORY_DATA';
    throw error;
  }

  return {
    category_name,
    sub_category_name,
    third_level_category_name,
  };
}

/**
 * Extrai dados de template do payload (optional)
 */
function extractTemplateData(payload) {
  const templateData = payload.template_data;

  if (!templateData) {
    return null;
  }

  if (typeof templateData !== 'object') {
    const error = new Error('Field "template_data" must be a valid object or null');
    error.code = 'INVALID_TEMPLATE_DATA';
    throw error;
  }

  return templateData;
}

/**
 * Normaliza o payload completo após merge
 * Separa campos do base dos campos do template
 */
function normalizePayload(mergedPayload) {
  const { category_data, template_data, ...baseFields } = mergedPayload;

  // Extrair categoria
  const categoryData = extractCategoryData({
    category_data: typeof category_data === 'string'
      ? JSON.parse(category_data)
      : category_data,
  });

  // Extrair template (se existir)
  let templateDataExtracted = null;
  if (template_data) {
    templateDataExtracted = extractTemplateData({
      template_data: typeof template_data === 'string'
        ? JSON.parse(template_data)
        : template_data,
    });
  }

  return {
    baseFields,
    categoryData,
    templateData: templateDataExtracted,
  };
}

/**
 * Registra o merge (para debug)
 */
function logMerge(payloadBase, templateData, merged) {
  logger.debug('Incident payload merged', {
    baseFieldsCount: Object.keys(payloadBase || {}).length,
    templateFieldsCount: Object.keys(templateData || {}).length,
    mergedFieldsCount: Object.keys(merged || {}).length,
  });
}

module.exports = {
  mergePayload,
  extractCategoryData,
  extractTemplateData,
  normalizePayload,
  logMerge,
};
