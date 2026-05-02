const categoryHierarchyService = require('../services/categoryHierarchyService');

async function list(req, res, next) {
  try {
    const filters = {
      category: req.query.category,
      subCategory: req.query.sub_category,
    };

    const data = await categoryHierarchyService.getCategoryHierarchy(filters);

    res.status(200).json({
      data,
      count: data.length,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
};
