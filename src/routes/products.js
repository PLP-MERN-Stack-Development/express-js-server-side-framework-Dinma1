const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError } = require('../errors/customErrors');
const validateProduct = require('../middleware/validator');
const auth = require('../middleware/auth');

const router = express.Router();

// In-memory storage for products
let products = [];

// List all products with filtering, pagination and search
router.get('/', (req, res) => {
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

// Get product statistics
router.get('/stats', (req, res) => {
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

// Get specific product
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  res.json(product);
});

// Create new product
router.post('/', auth, validateProduct, (req, res) => {
  const product = {
    id: uuidv4(),
    ...req.body
  };
  products.push(product);
  res.status(201).json(product);
});

// Update product
router.put('/:id', auth, validateProduct, (req, res) => {
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

// Delete product
router.delete('/:id', auth, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    throw new NotFoundError('Product not found');
  }

  products.splice(index, 1);
  res.status(204).send();
});

module.exports = router;