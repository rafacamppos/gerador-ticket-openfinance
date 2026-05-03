const logger = require('../utils/logger');
const incidentTicketRepository = require('../repositories/incidentTicketRepository');

async function listApiVersions(req, res, next) {
  try {
    const versions = await incidentTicketRepository.listApiVersions();

    if (!versions || versions.length === 0) {
      logger.info('No API versions found', {
        requestId: req.requestId || null,
        route: 'listApiVersions'
      });

      res.status(200).json({
        data: {
          total_versions: 0,
          versions: []
        }
      });
      return;
    }

    logger.info('API versions retrieved', {
      requestId: req.requestId || null,
      route: 'listApiVersions',
      total_versions: versions.length
    });

    res.status(200).json({
      data: {
        total_versions: versions.length,
        versions: versions.map(version => ({
          id: version.id,
          api_name_version: version.api_name_version,
          api_version: version.api_version,
          product_feature: version.product_feature,
          stage_name_version: version.stage_name_version
        }))
      }
    });
  } catch (error) {
    logger.error('Error retrieving API versions', {
      requestId: req.requestId || null,
      route: 'listApiVersions',
      error: error.message
    });

    next(error);
  }
}

async function getApiVersionById(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: 'Field "id" is required.'
      });
    }

    const version = await incidentTicketRepository.getApiVersionById(id);

    if (!version) {
      logger.info('API version not found', {
        requestId: req.requestId || null,
        route: 'getApiVersionById',
        versionId: id
      });

      return res.status(404).json({
        message: 'API version not found.'
      });
    }

    logger.info('API version retrieved', {
      requestId: req.requestId || null,
      route: 'getApiVersionById',
      versionId: id
    });

    res.status(200).json({
      data: {
        id: version.id,
        api_name_version: version.api_name_version,
        api_version: version.api_version,
        product_feature: version.product_feature,
        stage_name_version: version.stage_name_version
      }
    });
  } catch (error) {
    logger.error('Error retrieving API version', {
      requestId: req.requestId || null,
      route: 'getApiVersionById',
      error: error.message
    });

    next(error);
  }
}

module.exports = {
  listApiVersions,
  getApiVersionById
};
