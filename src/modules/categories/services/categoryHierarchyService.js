const categoryHierarchyRepository = require('../repositories/categoryHierarchyRepository');

async function getCategoryHierarchy(filters) {
  if (filters.subCategory) {
    return categoryHierarchyRepository.listThirdLevelCategoryNames(filters.subCategory);
  }

  if (filters.category) {
    return categoryHierarchyRepository.listSubCategoryNames(filters.category);
  }

  return categoryHierarchyRepository.listCategoryNames();
}

module.exports = {
  getCategoryHierarchy,
};
