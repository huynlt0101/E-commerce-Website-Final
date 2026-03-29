const User = require('../models/User');

async function seedAdmin() {
  try {
    // Kiểm tra xem đã có admin chưa
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('Tài khoản admin đã tồn tại');
      return;
    }

    // Tạo tài khoản admin mặc định
    const admin = await User.create({
      username: 'admin',
      email: 'akirapanda2002@gmail.com',
      phone: '0949196206',
      password: 'Admin@123',
      role: 'admin'
    });

    
  } catch (error) {
    console.error('Lỗi khi tạo admin:', error.message);
  }
}

module.exports = seedAdmin;