const categoryRepository = require('../repositories/categoryRepository');

async function getAllCategories() {
  return categoryRepository.listAll();
}

async function getCategoryById(id) {
  if (!id || Number.isNaN(Number(id))) {
    const error = new Error('ID da categoria inválido.');
    error.status = 400;
    error.details = { categoryId: id };
    throw error;
  }

  const category = await categoryRepository.findById(id);

  if (!category) {
    const error = new Error('Categoria não encontrada.');
    error.status = 404;
    error.details = { categoryId: Number(id) };
    throw error;
  }

  return category;
}

module.exports = {
  getAllCategories,
  getCategoryById,
};
