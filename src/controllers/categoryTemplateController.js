const logger = require('../utils/logger');
const categoryTemplateRepository = require('../repositories/categoryTemplateRepository');

async function listCategories(req, res, next) {
  try {
    const categories = await categoryTemplateRepository.listAllCategories();

    logger.info('Categories listed', {
      requestId: req.requestId || null,
      route: 'listCategories',
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

async function getCategoryById(req, res, next) {
  try {
    const { categoryId } = req.params;

    if (!categoryId || Number.isNaN(Number(categoryId))) {
      res.status(400).json({
        message: 'ID da categoria inválido.',
        details: { categoryId },
      });
      return;
    }

    const category = await categoryTemplateRepository.getCategoryById(categoryId);

    if (!category) {
      logger.warn('Category not found', {
        requestId: req.requestId || null,
        route: 'getCategoryById',
        categoryId: Number(categoryId),
      });

      res.status(404).json({
        message: 'Categoria não encontrada.',
        details: { categoryId: Number(categoryId) },
      });
      return;
    }

    logger.info('Category retrieved', {
      requestId: req.requestId || null,
      route: 'getCategoryById',
      categoryId: category.id,
      categoryName: category.category_name,
    });

    res.status(200).json({
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCategories,
  getCategoryById,
};
