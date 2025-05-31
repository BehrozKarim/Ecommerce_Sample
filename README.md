# E-commerce Sample Backend
## Setup Instructions
Follow the steps given below to setup the backend.
1. Ensure you have Node.js, npm and PostgreSQL installed on your system.

2. Clone the repositroy using `git clone https://github.com/BehrozKarim/Ecommerce_Sample.git`

3. Install the required packages `npm install`

4. Connect to the PostgreSQL server and Create a database. You can use psql or a GUI tool like pgAdmin to create the database.

5. Rename the `sample.env` file to `.env` and replace the `username`, `password` and `database_name` in the Database URL.

6. Initialize the **Prisma** using `npx prisma init`.

7. Apply Prisma migrations to create tables in database `npx prisma migrate dev --name init`

8. Generate prisma client using `npx prisma generate` or `prisma generate`

9. Populate the database with the demo data provided in the seed.js file by running `npm run seed`

10. Now run the application using `npm start`. By default the program will run on port 3000.

Feel Free to contact me at behrozbuzdar@gmail.com if you face any issues in the setup.

## Testing Instructions
A postman collection `Ecommerce Sample APP.postman_collection` is present in the root of the project. 
Import the collection inside postman and test the APIs. 


## API Endpoints
The API exposes the following RESTful endpoints:

### Categories (/api/category)
- GET /api/category: Get all categories
<br>

- GET /api/category/:id : Get a single category by ID.
<br>

- POST /api/category: Register a new category.
Body: { "name": "string"}
<br>

- PUT /api/category/:id : Update an existing category.
Body: { "name": "string"}

<br>

- DELETE /api/category/:id : Delete a category.

### Products (/api/products)
- GET /api/products

  Get all products with category and inventory status.
<br>

- GET /api/products/:id

  Get a single product by ID.
<br>

- POST /api/products: Register a new product.

  Body: { "name": "string", "description": "string", "price": number, "category_name": "string", "initial_quantity": number, "low_stock_threshold": number }
<br>

- PUT /api/products/:id : Update an existing product.

  Body: { "name"?: "string", "description"?: "string", "price"?: number, "category_name"?: "string" }
<br>

- DELETE /api/products/:id
  
  Delete a product.

### Sales (/api/sales)
- GET /api/sales: Get all sales data with product and category details.

  Query Params: startDate, endDate, productId, categoryName

<br>

- GET /api/sales/revenue: Analyze total revenue for a given period and date range. 

  Query Params: period (day, week, month, year), startDate (required), endDate (required)
<br>

- GET /api/sales/revenue/compare: Compare revenue across two periods or two categories.

  Query Params: 

  type=period: period1Start, period1End, period2Start, period2End

  type=category: category1Id, category2Id

### Inventory (/api/inventory)
- GET /api/inventory: Get current inventory status, including low stock alerts.

  Query Params: lowStockOnly (boolean, true to filter for low stock items)
<br>

- PUT /api/inventory/:productId/update: Update inventory level for a product. 

  Body: { "change_quantity": number } (positive to add, negative to remove)
<br>

- GET /api/inventory/history/:productId: 
  
  Get inventory change history for a specific product.

