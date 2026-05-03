const logger = require('../utils/logger');
const incidentTicketRepository = require('../repositories/incidentTicketRepository');

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

    // Filtrar apenas campos obrigatórios e remover title/description
    const requiredFields = fields.filter(field => field.is_required === true)
      .filter(field => !['title', 'description'].includes(field.field_label_api));

    // Validar se há campos obrigatórios após filtro
    if (requiredFields.length === 0) {
      logger.warn('Template has no required fields (after filtering)', {
        requestId: req.requestId || null,
        route: 'getTemplateFields',
        templateId: Number(templateId),
        totalFields: fields.length
      });

      res.status(404).json({
        code: 'TEMPLATE_NO_REQUIRED_FIELDS',
        message: 'Template não possui campos obrigatórios (além de title e description)',
        details: { templateId: Number(templateId), totalFields: fields.length }
      });
      return;
    }

    // Formatar resposta com informações detalhadas dos campos
    const formattedFields = requiredFields.map(field => {
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

    logger.info('Template required fields retrieved', {
      requestId: req.requestId || null,
      route: 'getTemplateFields',
      templateId: Number(templateId),
      totalFields: fields.length,
      requiredFieldsCount: requiredFields.length
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

module.exports = {
  getTemplateFields
};
