const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('Successfully connected to PostgreSQL database using Prisma!');
  })
  .catch((err) => {
    console.error('Error connecting to database with Prisma:', err);
    process.exit(1);
  });

module.exports = prisma;