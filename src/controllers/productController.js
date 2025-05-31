const prisma = require('../db'); // Import the Prisma client instance

const productController = {

    // Get all products with their category and current inventory status.
    getAllProducts: async (req, res) => {
        try {
            const products = await prisma.product.findMany({
                include: {
                    category: {
                        select: { name: true }
                    },
                    inventory: {
                        select: { quantity: true, lowStockThreshold: true }
                    }
                },
                orderBy: {
                    name: 'asc'
                }
            });

            const formattedProducts = products.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price,
                category_name: p.category.name,
                inventory_quantity: p.inventory ? p.inventory.quantity : null,
                low_stock_threshold: p.inventory ? p.inventory.lowStockThreshold : null,
            }));

            res.status(200).json(formattedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Get a single product by its ID, including category and inventory.
    getProductById: async (req, res) => {
        const { id } = req.params;
        try {
            const product = await prisma.product.findUnique({
                where: { id: id },
                include: {
                    category: {
                        select: { name: true }
                    },
                    inventory: {
                        select: { quantity: true, lowStockThreshold: true }
                    }
                }
            });

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            const formattedProduct = {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                category_name: product.category.name,
                inventory_quantity: product.inventory ? product.inventory.quantity : null,
                low_stock_threshold: product.inventory ? product.inventory.lowStockThreshold : null,
            };

            res.status(200).json(formattedProduct);
        } catch (error) {
            console.error(`Error fetching product with ID ${id}:`, error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    /**
     * Register a new product, optionally creating a new category and initial inventory.
     * @body {string} name - Product name (required)
     * @body {string} description - Product description
     * @body {number} price - Product price (required)
     * @body {string} category_name - Category name (required, will be created if not exists)
     * @body {number} initial_quantity - Optional, initial stock quantity
     * @body {number} low_stock_threshold - Optional, low stock threshold for inventory
     */
    registerProduct: async (req, res) => {
        const { name, description, price, category_name, initial_quantity, low_stock_threshold } = req.body;

        if (!name || !price || !category_name) {
            return res.status(400).json({ message: 'Product name, price, and category name are required.' });
        }

        try {
            const result = await prisma.$transaction(async (prisma) => {
                const category = await prisma.category.upsert({
                    where: { name: category_name },
                    update: {}, // No update if found
                    create: { name: category_name },
                });

                const product = await prisma.product.create({
                    data: {
                        categoryId: category.id,
                        name: name,
                        description: description,
                        price: parseFloat(price),
                    },
                });

                if (initial_quantity !== undefined && initial_quantity >= 0) {
                    const quantity = parseInt(initial_quantity);
                    const threshold = low_stock_threshold !== undefined ? parseInt(low_stock_threshold) : 10;

                    await prisma.inventory.create({
                        data: {
                            productId: product.id,
                            quantity: quantity,
                            lowStockThreshold: threshold,
                        },
                    });

                    // Record initial inventory history
                    await prisma.inventoryHistory.create({
                        data: {
                            productId: product.id,
                            changeQuantity: quantity,
                            newQuantity: quantity,
                        },
                    });
                }
                return product;
            });

            res.status(201).json({ message: 'Product registered successfully', product: result });
        } catch (error) {
            console.error('Error registering product:', error);
            if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
                return res.status(409).json({ message: 'A product with this name already exists.' });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    /**
     * Update an existing product's details.
     * @access Public
     * @body {string} name - New product name
     * @body {string} description - New product description
     * @body {number} price - New product price
     * @body {string} category_name - New category name (will be created if not exists)
     */
    updateProduct: async (req, res) => {
        const { id } = req.params;
        const { name, description, price, category_name } = req.body;

        try {
            const updatedProduct = await prisma.$transaction(async (prisma) => {
                let categoryId;
                if (category_name) {
                    const category = await prisma.category.upsert({
                        where: { name: category_name },
                        update: {},
                        create: { name: category_name },
                    });
                    categoryId = category.id;
                }

                const dataToUpdate = {};
                if (name) dataToUpdate.name = name;
                if (description) dataToUpdate.description = description;
                if (price !== undefined) dataToUpdate.price = parseFloat(price);
                if (categoryId) dataToUpdate.categoryId = categoryId;

                if (Object.keys(dataToUpdate).length === 0) {
                    return res.status(200).json({ message: 'No fields provided for update.' });
                }

                const product = await prisma.product.update({
                    where: { id: id },
                    data: dataToUpdate,
                });
                return product;
            });

            res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
        } catch (error) {
            console.error(`Error updating product with ID ${id}:`, error);
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Product not found' });
            }
            if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
                return res.status(409).json({ message: 'A product with this name already exists.' });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Delete a product by its ID.
    deleteProduct: async (req, res) => {
        const { id } = req.params;
        try {
            await prisma.product.delete({
                where: { id: id },
            });
            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error(`Error deleting product with ID ${id}:`, error);
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
};

module.exports = productController;