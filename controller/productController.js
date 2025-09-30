const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');


const getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    brand,
    inStock,
    featured,
    sortBy,
    page = 1,
    limit = 12
  } = req.query;

  
  let filter = { isActive: true };

  
  if (search) {
    filter.$text = { $search: search };
  }

 
  if (category) {
    filter.category = category;
  }

  
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  
  if (brand) {
    filter.brand = { $in: brand.split(',') };
  }

 
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  
  if (featured === 'true') {
    filter.isFeatured = true;
  }

  
  let sortOptions = {};
  switch (sortBy) {
    case 'price_asc':
      sortOptions = { price: 1 };
      break;
    case 'price_desc':
      sortOptions = { price: -1 };
      break;
    case 'rating':
      sortOptions = { 'ratings.average': -1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    case 'name':
      sortOptions = { name: 1 };
      break;
    default:
      sortOptions = { createdAt: -1 };
  }

  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

 
  const products = await Product.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .populate('vendor', 'name email');

  
  const total = await Product.countDocuments(filter);
  const totalPages = Math.ceil(total / limitNum);

  res.json({
    success: true,
    data: products,
    pagination: {
      current: pageNum,
      totalPages,
      totalProducts: total,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  });
});


const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('vendor', 'name email')
    .populate('reviews');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({
    success: true,
    data: product
  });
});


const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    comparePrice,
    category,
    subcategory,
    brand,
    sku,
    images,
    stock,
    tags,
    features,
    specifications,
    weight,
    dimensions,
    isFeatured,
    vendor
  } = req.body;

  
  if (sku) {
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      res.status(400);
      throw new Error('SKU already exists');
    }
  }

  const product = new Product({
    name,
    description,
    price,
    comparePrice,
    category,
    subcategory,
    brand,
    sku,
    images: images || [],
    stock: stock || 0,
    tags: tags || [],
    features: features || [],
    specifications: specifications || {},
    weight,
    dimensions,
    isFeatured: isFeatured || false,
    vendor: vendor || req.user.id
  });

  const createdProduct = await product.save();
  res.status(201).json({
    success: true,
    data: createdProduct
  });
});


const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  
  if (req.body.sku && req.body.sku !== product.sku) {
    const existingProduct = await Product.findOne({ sku: req.body.sku });
    if (existingProduct) {
      res.status(400);
      throw new Error('SKU already exists');
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedProduct
  });
});


const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  
  product.isActive = false;
  await product.save();

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});


const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json({
      success: true,
      data: []
    });
  }

  const suggestions = await Product.find(
    {
      $text: { $search: q },
      isActive: true
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .select('name category brand images price');

  res.json({
    success: true,
    data: suggestions
  });
});


const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { subcategory, page = 1, limit = 12 } = req.query;

  let filter = { 
    category: category.toLowerCase(), 
    isActive: true 
  };

  if (subcategory) {
    filter.subcategory = subcategory;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Product.countDocuments(filter);
  const totalPages = Math.ceil(total / limitNum);

  res.json({
    success: true,
    data: products,
    pagination: {
      current: pageNum,
      totalPages,
      totalProducts: total
    }
  });
});


const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isFeatured: true,
    isActive: true,
    stock: { $gt: 0 }
  })
    .limit(8)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: products
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSearchSuggestions,
  getProductsByCategory,
  getFeaturedProducts
};