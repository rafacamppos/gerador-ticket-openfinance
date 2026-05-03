const logger = require('../utils/logger');
const incidentTicketRepository = require('../repositories/incidentTicketRepository');
const { formatTemplatePayload } = require('../utils/templatePayloadFormatter');

/**
 * GET /templates/:templateId/fields
 * Retorna todos os campos de um template específico
 */
async function getTemplateFields(req, res, next) {
  try {
    const { templateId } = req.params;

    // Validação
    if (!templateId || Number.isNaN(Number(templateId))) {
      logger.warn('Invalid template ID', {
        requestId: req.requestId || null,
        route: 'getTemplateFields',
        templateId
      });

      res.status(400).json({
        code: 'INVALID_TEMPLATE_ID',
        message: 'ID do template inválido',
        details: { templateId }
      });
      return;
    }

    // Buscar fields do template
    const fields = await incidentTicketRepository.getTemplateFields(Number(templateId));

    if (!fields || fields.length === 0) {
      logger.warn('Template not found or has no fields', {
        requestId: req.requestId || null,
        route: 'getTemplateFields',
        templateId: Number(templateId)
      });

      res.status(404).json({
        code: 'TEMPLATE_NOT_FOUND',
        message: 'Template não encontrado ou não possui campos definidos',
        details: { templateId: Number(templateId) }
      });
      return;
    }

    // Formatar resposta com informações detalhadas dos campos
    const formattedFields = fields.map(field => {
      const fieldObj = {
        context_key: field.context_key,
        field_name: field.field_name,
        field_type: field.field_type,
        is_required: field.is_required
      };

      // Adicionar list_options apenas se existir
      if (field.list_options) {
        fieldObj.list_options = field.list_options;
      }

      return fieldObj;
    });

    // Formatar resposta
    const payload = {
      template_id: Number(templateId),
      fields_count: formattedFields.length,
      fields: formattedFields
    };

    logger.info('Template fields retrieved', {
      requestId: req.requestId || null,
      route: 'getTemplateFields',
      templateId: Number(templateId),
      totalFields: fields.length,
      fieldsCount: formattedFields.length
    });

    res.status(200).json({
      data: payload
    });
  } catch (error) {
    logger.error('Error retrieving template fields', {
      requestId: req.requestId || null,
      route: 'getTemplateFields',
      error: error.message
    });

    next(error);
  }
}

/**
 * GET /templates/:templateId/payload
 * Retorna o payload formatado do template (context_key -> field_name)
 */
async function getTemplatePayload(req, res, next) {
  try {
    const { templateId } = req.params;

    if (!templateId || Number.isNaN(Number(templateId))) {
      logger.warn('Invalid template ID', {
        requestId: req.requestId || null,
        route: 'getTemplatePayload',
        templateId
      });

      res.status(400).json({
        code: 'INVALID_TEMPLATE_ID',
        message: 'ID do template inválido',
        details: { templateId }
      });
      return;
    }

    const fields = await incidentTicketRepository.getTemplateFields(Number(templateId));

    if (!fields || fields.length === 0) {
      logger.warn('Template not found or has no fields', {
        requestId: req.requestId || null,
        route: 'getTemplatePayload',
        templateId: Number(templateId)
      });

      res.status(404).json({
        code: 'TEMPLATE_NOT_FOUND',
        message: 'Template não encontrado ou não possui campos definidos',
        details: { templateId: Number(templateId) }
      });
      return;
    }

    const templateResponse = {
      data: {
        template_id: Number(templateId),
        fields_count: fields.length,
        fields: fields
      }
    };

    const payload = formatTemplatePayload(templateResponse);

    logger.info('Template payload formatted', {
      requestId: req.requestId || null,
      route: 'getTemplatePayload',
      templateId: Number(templateId),
      fieldsCount: fields.length
    });

    res.status(200).json({
      data: payload.data
    });
  } catch (error) {
    logger.error('Error formatting template payload', {
      requestId: req.requestId || null,
      route: 'getTemplatePayload',
      error: error.message
    });

    next(error);
  }
}

module.exports = {
  getTemplateFields,
  getTemplatePayload
};
