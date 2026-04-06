import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./user/Home";   // nếu chưa có thì tạo Home
import Login from "./login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import ProductDetail from "./user/ProductDetail";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AdminUsers from "./admin/AdminUsers";
import AdminOrders from "./admin/AdminOrders";
import Profile from "./user/Profile";
import AdminCategories from "./admin/AdminCategories";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CartPage from "./user/Cart";
import Checkout from "./user/Checkout";
import OrdersPage from "./pages/OrdersPage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./user/ProductPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dang-nhap" element={<Login />} />
          <Route path="/dang-ky" element={<Register />} />
          <Route path="/quen-mat-khau" element={<ForgotPassword />} />
         <Route path="/san-pham/:id" element={<ProductDetail />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/tai-khoan" element={<Profile/>} />
          <Route path="/admin/categories" element={<AdminCategories/>} />
        <Route path="/gio-hang" element={<CartPage />} />
        <Route path="/don-hang" element={<OrdersPage />} />
             <Route path="/danh-muc/:id" element={<CategoryPage />} />
        <Route path="/san-pham" element={<ProductPage />} />
<Route path="/thanh-toan" element={<Checkout />} />
      </Routes>
         <ToastContainer position="top-right" autoClose={2500} newestOnTop />
    </BrowserRouter>
  );
}
