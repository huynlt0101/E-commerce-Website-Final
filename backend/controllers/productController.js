const Product = require("../models/Product");
const Category = require("../models/Category");
const fs = require("fs");
const path = require("path");


// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, price, quantity, description, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng upload ảnh" });
    }

    const cate = await Category.findById(category);
    if (!cate) {
      return res.status(404).json({ success: false, message: "Danh mục không tồn tại" });
    }

    const product = await Product.create({
      name,
      price,
      quantity,
      description,
      category,
      image: req.file.filename
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// GET /api/products?search=iphone
exports.getAllProducts = async (req, res) => {
  try {
    const { search } = req.query;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" }; // tìm theo chữ cái
    }

    const products = await Product.find(query)
      .populate("category", "name icon")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.getTotalProducts = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();

    res.json({
      success: true,
      totalProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name");

    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: "ID không hợp lệ" });
  }
};


// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { name, price, quantity, description, category, isActive } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    // nếu upload ảnh mới → xoá ảnh cũ
    if (req.file) {
      const oldPath = path.join("imgs", product.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      product.image = req.file.filename;
    }

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (quantity !== undefined) product.quantity = quantity;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    res.json({ success: true, message: "Cập nhật sản phẩm thành công", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    // xoá ảnh
    const imgPath = path.join("imgs", product.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

    await product.deleteOne();

    res.json({ success: true, message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await Product.find({
      category: categoryId,
      isActive: true
    }).populate("category", "name"); // lấy thêm tên category

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
