require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const logger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');
const auth = require('./src/middleware/auth');
const validateProduct = require('./src/middleware/validator');
const { NotFoundError } = require('./src/errors/customErrors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(logger);

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Product API! Go to /api/products to see all products.' });
});

// Product Routes

// GET /api/products - Get all products with filtering and pagination
app.get('/api/products', (req, res) => {
  let result = [...products];
  const { category, page = 1, limit = 10, search } = req.query;

  // Filter by category if provided
  if (category) {
    result = result.filter(product => product.category === category);
  }

  // Search by name if provided
  if (search) {
    result = result.filter(product => 
      product.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Implement pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = result.length;
  result = result.slice(startIndex, endIndex);

  res.json({
    data: result,
    pagination: {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    }
  });
});

// GET /api/products/stats - Get product statistics
app.get('/api/products/stats', (req, res) => {
  const stats = products.reduce((acc, product) => {
    acc.totalProducts = (acc.totalProducts || 0) + 1;
    acc.categoryCount = acc.categoryCount || {};
    acc.categoryCount[product.category] = (acc.categoryCount[product.category] || 0) + 1;
    acc.totalValue = (acc.totalValue || 0) + product.price;
    return acc;
  }, {});

  stats.averagePrice = stats.totalValue / stats.totalProducts || 0;

  res.json(stats);
});

// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  res.json(product);
});

// POST /api/products - Create a new product
app.post('/api/products', auth, validateProduct, (req, res) => {
  const product = {
    id: uuidv4(),
    ...req.body
  };
  products.push(product);
  res.status(201).json(product);
});

// PUT /api/products/:id - Update a product
app.put('/api/products/:id', auth, validateProduct, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    throw new NotFoundError('Product not found');
  }

  products[index] = {
    ...products[index],
    ...req.body,
    id: req.params.id
  };

  res.json(products[index]);
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', auth, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    throw new NotFoundError('Product not found');
  }

  products.splice(index, 1);
  res.status(204).send();
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app;