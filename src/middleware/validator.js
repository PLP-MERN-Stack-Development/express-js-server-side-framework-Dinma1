const { ValidationError } = require('../errors/customErrors');

const validateProduct = (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;

  if (!name || typeof name !== 'string') {
    throw new ValidationError('Name is required and must be a string');
  }

  if (!description || typeof description !== 'string') {
    throw new ValidationError('Description is required and must be a string');
  }

  if (!price || typeof price !== 'number' || price < 0) {
    throw new ValidationError('Price is required and must be a positive number');
  }

  if (!category || typeof category !== 'string') {
    throw new ValidationError('Category is required and must be a string');
  }

  if (typeof inStock !== 'boolean') {
    throw new ValidationError('inStock must be a boolean');
  }

  next();
};

module.exports = validateProduct;