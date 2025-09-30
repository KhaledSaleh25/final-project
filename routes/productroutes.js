const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSearchSuggestions,
  getProductsByCategory,
  getFeaturedProducts
} = require('../controllers/productController');


router.get('/', getProducts);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/category/:category', getProductsByCategory);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProduct);


router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;