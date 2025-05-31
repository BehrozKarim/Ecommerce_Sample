const prisma = require('../db');

const categoryController = {
    //  Get all categories
    getAllCategories: async (req, res) => {
        try {
            const categories = await prisma.category.findMany({
                orderBy: {
                    name: 'asc'
                }
            });

            const formattedCategories = categories.map(p => ({
                id: p.id,
                name: p.name,
            }));

            res.status(200).json(formattedCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Get a single category by its ID
    getCategoryById: async (req, res) => {
        const { id } = req.params;
        try {
            const category = await prisma.category.findUnique({
                where: { id: id },
            });

            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            const formattedCategory = {
                id: category.id,
                name: category.name,
            };

            res.status(200).json(formattedCategory);
        } catch (error) {
            console.error(`Error fetching category with ID ${id}:`, error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    /**
     * Register a new category.
     * @body {string} name - Category name (required)
     */
    registerCategory: async (req, res) => {
        const { name} = req.body;

        if (!name ) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        try {
            const result = await prisma.$transaction(async (prisma) => {
    
                const category = await prisma.category.create({
                    data: {
                        name: name,
                    },
                });            
                return category;
            });

            res.status(201).json({ message: 'Category registered successfully', category: result });
        } catch (error) {
            console.error('Error registering category:', error);
            if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
                return res.status(409).json({ message: 'A category with this name already exists.' });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    /**
     * Update an existing category's details.
     * @body {string} name - New category name
     */
    updateCategory: async (req, res) => {
        const { id } = req.params;
        const { name} = req.body;

        try {
            const updatedCategory = await prisma.$transaction(async (prisma) => {

                const dataToUpdate = {};
                if (name) dataToUpdate.name = name;

                if (Object.keys(dataToUpdate).length === 0) {
                    return res.status(200).json({ message: 'No fields provided for update.' });
                }

                const category = await prisma.category.update({
                    where: { id: id },
                    data: dataToUpdate,
                });
                return category;
            });

            res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
        } catch (error) {
            console.error(`Error updating category with ID ${id}:`, error);
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Category not found' });
            }
            if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
                return res.status(409).json({ message: 'A category with this name already exists.' });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    //Delete a category by its ID.
    deleteCategory: async (req, res) => {
        const { id } = req.params;
        try {
            await prisma.category.delete({
                where: { id: id },
            });
            res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            console.error(`Error deleting category with ID ${id}:`, error);
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
};

module.exports = categoryController;