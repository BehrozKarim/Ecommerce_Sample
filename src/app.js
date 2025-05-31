require('dotenv').config();

const express = require('express');
const prisma = require('./db'); // Import the Prisma client instance
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const categoryRoutes = require('./routes/categoryRoutes');


const app = express();
const PORT = process.env.PORT || 3000; // Default port 3000

app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/category', categoryRoutes);

app.get('/', (req, res) => {
    res.send('E-commerce Admin API is running!');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});