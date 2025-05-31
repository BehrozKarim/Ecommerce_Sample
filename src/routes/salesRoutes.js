const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/', salesController.getAllSales);
router.get('/revenue', salesController.analyzeRevenue);
router.get('/revenue/compare', salesController.compareRevenue);

module.exports = router;
