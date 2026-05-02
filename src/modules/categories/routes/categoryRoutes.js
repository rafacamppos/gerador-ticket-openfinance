const express = require('express');
const categoryController = require('../controllers/categoryController');
const categoryHierarchyController = require('../controllers/categoryHierarchyController');

const router = express.Router();

router.get('/hierarchy', categoryHierarchyController.list);
router.get('/', categoryController.list);
router.get('/:categoryId', categoryController.getById);

module.exports = router;
