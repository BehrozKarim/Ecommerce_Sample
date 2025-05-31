const prisma = require('../db');

const inventoryController = {
    /**
     * Get current inventory status for all products. Can optionally filter to show only low stock items.
     * @queryParam {boolean} lowStockOnly - If 'true', only returns products where quantity <= low_stock_threshold.
     */
    getInventoryStatus: async (req, res) => {
        const { lowStockOnly } = req.query;

        try {
            let inventories = await prisma.inventory.findMany({
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            price: true,
                            category: {
                                select: { name: true }
                            }
                        }
                    }
                },
                orderBy: {
                    product: {
                        name: 'asc'
                    }
                }
            });

            // Filter for low stock if requested
            if (lowStockOnly === 'true') {
                inventories = inventories.filter(i => i.quantity <= i.lowStockThreshold);
            }

            const formattedInventories = inventories.map(i => ({
                inventory_id: i.id,
                product_id: i.productId,
                product_name: i.product.name,
                product_description: i.product.description,
                product_price: i.product.price,
                category_name: i.product.category.name,
                quantity: i.quantity,
                low_stock_threshold: i.lowStockThreshold,
                is_low_stock: i.quantity <= i.lowStockThreshold,
            }));

            res.status(200).json(formattedInventories);
        } catch (error) {
            console.error('Error fetching inventory status:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    /**
     * Update inventory level for a specific product.
     * @body {number} change_quantity - The quantity to add or remove. The number can be both positive and negative.
     */
    updateInventory: async (req, res) => {
        const { productId } = req.params;
        const { change_quantity } = req.body; // Can be positive (add) or negative (remove)

        if (change_quantity === undefined || isNaN(change_quantity)) {
            return res.status(400).json({ message: 'Invalid or missing "change_quantity".' });
        }

        try {
            const updatedInventory = await prisma.$transaction(async (prisma) => {
                const currentInventory = await prisma.inventory.findUnique({
                    where: { productId: productId },
                });

                if (!currentInventory) {
                    throw new Error('Inventory for product not found.');
                }

                const oldQuantity = currentInventory.quantity;
                const newQuantity = oldQuantity + parseInt(change_quantity);

                if (newQuantity < 0) {
                    throw new Error('Cannot set inventory quantity below zero.');
                }

                const inventory = await prisma.inventory.update({
                    where: { productId: productId },
                    data: {
                        quantity: newQuantity,
                    },
                });

                // Record inventory history
                await prisma.inventoryHistory.create({
                    data: {
                        productId: productId,
                        changeQuantity: parseInt(change_quantity),
                        newQuantity: newQuantity,
                    },
                });
                return inventory;
            });

            res.status(200).json({
                message: 'Inventory updated successfully',
                inventory: updatedInventory
            });
        } catch (error) {
            console.error(`Error updating inventory for product ${productId}:`, error);
            if (error.message === 'Inventory for product not found.') {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === 'Cannot set inventory quantity below zero.') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Get the historical changes for a specific product's inventory.
    getInventoryHistory: async (req, res) => {
        const { productId } = req.params;
        try {
            const history = await prisma.inventoryHistory.findMany({
                where: { productId: productId },
                include: {
                    product: {
                        select: { name: true }
                    }
                },
                orderBy: {
                    changedAt: 'desc'
                }
            });

            if (history.length === 0) {
                return res.status(404).json({ message: 'No inventory history found for this product.' });
            }

            const formattedHistory = history.map(h => ({
                id: h.id,
                product_id: h.productId,
                product_name: h.product.name,
                change_quantity: h.changeQuantity,
                new_quantity: h.newQuantity,
                changed_at: h.changedAt,
            }));

            res.status(200).json(formattedHistory);
        } catch (error) {
            console.error(`Error fetching inventory history for product ${productId}:`, error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
};

module.exports = inventoryController;
