const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce");
    console.log("Kết nối MongoDB thành công!");
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error);
    process.exit(1);
  }
}

module.exports = { connectDB };