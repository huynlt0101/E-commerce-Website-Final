require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const seedAdmin = require('./config/seedAdmin');
const path = require("path");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/imgs", express.static(path.join(__dirname, "imgs")));
// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-commerce API đang chạy',
    version: '1.0.0'
  });
});

// Khởi động server
async function startServer() {
  try {
    // 1. Kết nối database
    await connectDB();
    
    // 2. Tạo admin mặc định (nếu chưa có)
    await seedAdmin();
    
    // 3. Khởi động server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server đang chạy trên port ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Lỗi khởi động server:', error);
    process.exit(1);
  }
}

startServer();