const categoryRoutes = require('./routes/categoryRoutes');
const categoryController = require('./controllers/categoryController');
const categoryService = require('./services/categoryService');
const categoryRepository = require('./repositories/categoryRepository');

module.exports = {
  routes: categoryRoutes,
  controller: categoryController,
  service: categoryService,
  repository: categoryRepository,
};
