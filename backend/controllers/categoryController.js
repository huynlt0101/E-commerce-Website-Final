const Category = require("../models/Category");

// GET all
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET by id
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: "ID không hợp lệ" });
  }
};

// CREATE
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Tên danh mục là bắt buộc" });
    }

    const existed = await Category.findOne({ name: name.trim() });
    if (existed) {
      return res.status(409).json({ success: false, message: "Danh mục đã tồn tại" });
    }

    const category = await Category.create({
      name: name.trim(),
      icon: icon || "bi-tag",
      isActive: isActive ?? true
    });

    res.status(201).json({
      success: true,
      message: "Thêm danh mục thành công",
      data: category
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE
exports.updateCategory = async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });

    if (name !== undefined) category.name = name.trim();
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: category
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });

    await category.deleteOne();

    res.json({ success: true, message: "Xóa danh mục thành công" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// TOGGLE isActive
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      success: true,
      message: "Đổi trạng thái thành công",
      data: category
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
