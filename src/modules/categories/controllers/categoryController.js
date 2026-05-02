const logger = require('../../../utils/logger');
const categoryService = require('../services/categoryService');

async function list(req, res, next) {
  try {
    const categories = await categoryService.getAllCategories();

    logger.info('Categories listed', {
      requestId: req.requestId || null,
      route: 'categories.list',
      count: categories.length,
    });

    res.status(200).json({
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const { categoryId } = req.params;

    const category = await categoryService.getCategoryById(categoryId);

    logger.info('Category retrieved', {
      requestId: req.requestId || null,
      route: 'categories.getById',
      categoryId: category.id,
      categoryName: category.category_name,
    });

    res.status(200).json({
      data: category,
    });
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      logger.warn(`Category operation failed: ${error.message}`, {
        requestId: req.requestId || null,
        route: 'categories.getById',
        status: error.status,
        details: error.details,
      });

      return res.status(error.status).json({
        message: error.message,
        details: error.details || null,
      });
    }

    next(error);
  }
}

module.exports = {
  list,
  getById,
};
