const prisma = require('../db'); // Import the Prisma client instance

const salesController = {
    /**
     * Retrieve all sales data, with optional filtering by date range, product, or category.
     * @queryParam {string} startDate - Optional, filter sales from this date (YYYY-MM-DD)
     * @queryParam {string} endDate - Optional, filter sales up to this date (YYYY-MM-DD)
     * @queryParam {string} productId - Optional, filter sales by product ID
     * @queryParam {string} categoryName - Optional, filter sales by category name (case-insensitive)
     */
    getAllSales: async (req, res) => {
        const { startDate, endDate, productId, categoryName } = req.query;
        const whereClause = {};

        if (startDate || endDate) {
            whereClause.saleDate = {};
            if (startDate) whereClause.saleDate.gte = new Date(startDate);
            if (endDate) whereClause.saleDate.lte = new Date(endDate);
        }
        if (productId) {
            whereClause.productId = productId;
        }
        if (categoryName) {
            whereClause.product = {
                category: {
                    name: {
                        contains: categoryName,
                        mode: 'insensitive',
                    },
                },
            };
        }

        try {
            const sales = await prisma.sale.findMany({
                where: whereClause,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            category: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                },
                orderBy: {
                    saleDate: 'desc'
                }
            });

            const formattedSales = sales.map(s => ({
                sale_id: s.id,
                total_price: s.totalPrice,
                quantity: s.quantity,
                sale_date: s.saleDate,
                product_id: s.product.id,
                product_name: s.product.name,
                product_unit_price: s.product.price,
                category_id: s.product.category.id,
                category_name: s.product.category.name,
            }));

            res.status(200).json(formattedSales);
        } catch (error) {
            console.error('Error fetching sales data:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    /**
     * Analyze revenue based on a given period (daily, weekly, monthly, annual) 
     * within a specified start and end date.
     * @queryParam {string} period - Required (day, week, month, year)
     * @queryParam {string} startDate - Required, filter revenue from this date (YYYY-MM-DD)
     * @queryParam {string} endDate - Required, filter revenue up to this date (YYYY-MM-DD)
     */
    analyzeRevenue: async (req, res) => {
        const { period, startDate, endDate, categoryId, productId } = req.query;

        if (!period || !['day', 'week', 'month', 'year'].includes(period)) {
            return res.status(400).json({ message: 'Invalid or missing "period" parameter. Must be one of: day, week, month, year.' });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required for revenue analysis.' });
        }

        const whereClause = {
            saleDate: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        };

        try {
            const sales = await prisma.sale.findMany({
                where: whereClause,
                select: {
                    saleDate: true,
                    totalPrice: true,
                    quantity: true,
                },
                orderBy: {
                    saleDate: 'asc',
                },
            });

            const aggregatedData = {};

            sales.forEach(sale => {
                const saleDate = sale.saleDate;
                let periodKey;

                switch (period) {
                    case 'day':
                        periodKey = saleDate.toISOString().split('T')[0]; // YYYY-MM-DD
                        break;
                    case 'week':
                        // Calculate the week number based on start and end date.
                        const startDateTime = new Date(startDate);
                        const diffTime = Math.abs(saleDate.getTime() - startDateTime.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const weekNumber = Math.floor(diffDays / 7) + 1;
                        periodKey = `Week ${weekNumber}`;
                        break;
                    case 'month':
                        periodKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
                        break;
                    case 'year':
                        periodKey = saleDate.getFullYear().toString(); // YYYY
                        break;
                }

                if (!aggregatedData[periodKey]) {
                    aggregatedData[periodKey] = {
                        total_revenue: 0,
                        total_quantity_sold: 0,
                    };
                }

                aggregatedData[periodKey].total_revenue += parseFloat(sale.totalPrice.toString());
                aggregatedData[periodKey].total_quantity_sold += sale.quantity;
            });

            const result = Object.keys(aggregatedData)
                .sort()
                .map(periodKey => ({
                    period_key: periodKey,
                    total_revenue: parseFloat(aggregatedData[periodKey].total_revenue.toFixed(2)), // Format to 2 decimal places
                    total_quantity_sold: aggregatedData[periodKey].total_quantity_sold,
                }));

            res.status(200).json(result);
        } catch (error) {
            console.error('Error analyzing revenue:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    /**
     * Compare revenue across two different periods or two different categories.
     * @queryParam {string} type - Required ('period' or 'category')
     * @queryParam {string} period1Start - Required if type='period' (YYYY-MM-DD)
     * @queryParam {string} period1End - Required if type='period' (YYYY-MM-DD)
     * @queryParam {string} period2Start - Required if type='period' (YYYY-MM-DD)
     * @queryParam {string} period2End - Required if type='period' (YYYY-MM-DD)
     * @queryParam {string} category1Id - Required if type='category' (UUID)
     * @queryParam {string} category2Id - Required if type='category' (UUID)
     */
    compareRevenue: async (req, res) => {
        const { type, period1Start, period1End, period2Start, period2End, category1Id, category2Id } = req.query;

        if (!type || !['period', 'category'].includes(type)) {
            return res.status(400).json({ message: 'Invalid or missing "type" parameter. Must be "period" or "category".' });
        }

        try {
            let comparisonData = {};

            if (type === 'period') {
                if (!period1Start || !period1End || !period2Start || !period2End) {
                    return res.status(400).json({ message: 'For period comparison, period1Start, period1End, period2Start, and period2End are required.' });
                }

                const queryPeriodRevenue = async (start, end) => {
                    const result = await prisma.sale.aggregate({
                        _sum: {
                            totalPrice: true,
                        },
                        where: {
                            saleDate: {
                                gte: new Date(start),
                                lte: new Date(end),
                            },
                        },
                    });
                    return parseFloat(result._sum.totalPrice || 0);
                };

                const revenue1 = await queryPeriodRevenue(period1Start, period1End);
                const revenue2 = await queryPeriodRevenue(period2Start, period2End);

                comparisonData = {
                    period1: {
                        startDate: period1Start,
                        endDate: period1End,
                        revenue: revenue1
                    },
                    period2: {
                        startDate: period2Start,
                        endDate: period2End,
                        revenue: revenue2
                    },
                    difference: revenue2 - revenue1,
                    percentage_change: revenue1 === 0 ? (revenue2 === 0 ? 0 : 'N/A (period1 revenue is zero)') : ((revenue2 - revenue1) / revenue1) * 100
                };

            } else if (type === 'category') {
                if (!category1Id || !category2Id) {
                    return res.status(400).json({ message: 'For category comparison, category1Id and category2Id are required.' });
                }

                const queryCategoryRevenue = async (catId) => {
                    const result = await prisma.sale.aggregate({
                        _sum: {
                            totalPrice: true,
                        },
                        where: {
                            product: {
                                categoryId: catId,
                            },
                        },
                    });
                    return parseFloat(result._sum.totalPrice || 0);
                };

                const category1NameResult = await prisma.category.findUnique({ where: { id: category1Id } });
                const category2NameResult = await prisma.category.findUnique({ where: { id: category2Id } });

                if (!category1NameResult || !category2NameResult) {
                    return res.status(404).json({ message: 'One or both categories not found.' });
                }

                const category1Name = category1NameResult.name;
                const category2Name = category2NameResult.name;

                const revenue1 = await queryCategoryRevenue(category1Id);
                const revenue2 = await queryCategoryRevenue(category2Id);

                comparisonData = {
                    category1: {
                        id: category1Id,
                        name: category1Name,
                        revenue: revenue1
                    },
                    category2: {
                        id: category2Id,
                        name: category2Name,
                        revenue: revenue2
                    },
                    difference: revenue2 - revenue1,
                    percentage_change: revenue1 === 0 ? (revenue2 === 0 ? 0 : 'N/A (category1 revenue is zero)') : ((revenue2 - revenue1) / revenue1) * 100
                };
            }

            res.status(200).json(comparisonData);
        } catch (error) {
            console.error('Error comparing revenue:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
};

module.exports = salesController;
