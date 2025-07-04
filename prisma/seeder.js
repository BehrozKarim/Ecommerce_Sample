const { PrismaClient } = require('../generated/prisma')
const UUID = require("uuid")
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clear existing data (optional, for clean re-seeding)
  await prisma.inventoryHistory.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  console.log('Cleared existing data.');

  // Insert Categories
  const electronics = await prisma.category.create({
    data: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Electronics' },
  });
  const books = await prisma.category.create({
    data: { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', name: 'Books' },
  });
  const homeGoods = await prisma.category.create({
    data: { id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', name: 'Home Goods' },
  });
  console.log('Categories created.');

  // Insert Products
  const laptopProX = await prisma.product.create({
    data: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      categoryId: electronics.id,
      name: 'Laptop Pro X',
      description: 'Powerful laptop for professionals.',
      price: 1200.00,
    },
  });
  const smartphoneZ = await prisma.product.create({
    data: {
      id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
      categoryId: electronics.id,
      name: 'Smartphone Z',
      description: 'Latest smartphone with advanced features.',
      price: 800.00,
    },
  });
  const greatNovel = await prisma.product.create({
    data: {
      id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
      categoryId: books.id,
      name: 'The Great Novel',
      description: 'A captivating story.',
      price: 25.00,
    },
  });
  const smartCoffeeMaker = await prisma.product.create({
    data: {
      id: 'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
      categoryId: homeGoods.id,
      name: 'Smart Coffee Maker',
      description: 'Brew coffee with your voice.',
      price: 150.00,
    },
  });
  console.log('Products created.');

  // Insert Inventory
  await prisma.inventory.create({
    data: { productId: laptopProX.id, quantity: 50, lowStockThreshold: 10 },
  });
  await prisma.inventory.create({
    data: { productId: smartphoneZ.id, quantity: 5, lowStockThreshold: 10 }, // low stock
  });
  await prisma.inventory.create({
    data: { productId: greatNovel.id, quantity: 100, lowStockThreshold: 20 },
  });
  await prisma.inventory.create({
    data: { productId: smartCoffeeMaker.id, quantity: 20, lowStockThreshold: 5 },
  });
  console.log('Inventory created.');

  // Insert Sales (sample data)
  await prisma.sale.createMany({
    data: [
      // Laptop Pro X sales
      { productId: laptopProX.id, totalPrice: 1200.00, quantity: 1, saleDate: new Date('2024-01-05T10:00:00Z') },
      { productId: laptopProX.id, totalPrice: 2400.00, quantity: 2, saleDate: new Date('2024-01-06T11:30:00Z') },
      { productId: laptopProX.id, totalPrice: 1200.00, quantity: 1, saleDate: new Date('2024-02-10T14:00:00Z') },
      { productId: laptopProX.id, totalPrice: 3600.00, quantity: 3, saleDate: new Date('2024-03-15T09:00:00Z') },
      { productId: laptopProX.id, totalPrice: 1200.00, quantity: 1, saleDate: new Date('2024-04-20T16:00:00Z') },
      { productId: laptopProX.id, totalPrice: 2400.00, quantity: 2, saleDate: new Date('2024-05-25T17:00:00Z') },
      { productId: laptopProX.id, totalPrice: 1200.00, quantity: 1, saleDate: new Date('2024-05-29T10:00:00Z') },

      // Smartphone Z sales
      { productId: smartphoneZ.id, totalPrice: 800.00, quantity: 1, saleDate: new Date('2024-01-10T12:00:00Z') },
      { productId: smartphoneZ.id, totalPrice: 1600.00, quantity: 2, saleDate: new Date('2024-02-12T13:00:00Z') },
      { productId: smartphoneZ.id, totalPrice: 800.00, quantity: 1, saleDate: new Date('2024-03-18T10:00:00Z') },
      { productId: smartphoneZ.id, totalPrice: 800.00, quantity: 1, saleDate: new Date('2024-05-28T09:00:00Z') },

      // The Great Novel sales
      { productId: greatNovel.id, totalPrice: 25.00, quantity: 1, saleDate: new Date('2024-01-20T15:00:00Z') },
      { productId: greatNovel.id, totalPrice: 50.00, quantity: 2, saleDate: new Date('2024-02-25T16:00:00Z') },
      { productId: greatNovel.id, totalPrice: 25.00, quantity: 1, saleDate: new Date('2024-04-01T11:00:00Z') },

      // Smart Coffee Maker sales
      { productId: smartCoffeeMaker.id, totalPrice: 150.00, quantity: 1, saleDate: new Date('2024-03-01T10:00:00Z') },
      { productId: smartCoffeeMaker.id, totalPrice: 300.00, quantity: 2, saleDate: new Date('2024-05-05T14:00:00Z') },
    ],
  });
  console.log('Sales created.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });