const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getInventoryStatus);
router.put('/:productId/update', inventoryController.updateInventory);
router.get('/history/:productId', inventoryController.getInventoryHistory);

module.exports = router;
