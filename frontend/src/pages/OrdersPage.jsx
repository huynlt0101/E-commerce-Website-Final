import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Headers from "../header/header";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5000";

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/dang-nhap");
      return;
    }
    fetchOrders(token);
  }, []);

  const fetchOrders = async (token) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/orders/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setOrders(data.data || []);
    } catch (err) {
      Swal.fire("Lỗi", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 0)
      return (
        <span className="badge bg-warning text-dark rounded-pill px-3 py-2">
          <i className="bi bi-hourglass-split me-1"></i>
          Chờ xác minh
        </span>
      );

    if (status === 1)
      return (
        <span className="badge bg-success rounded-pill px-3 py-2">
          <i className="bi bi-check-circle me-1"></i>
          Đã xác minh
        </span>
      );

    return (
      <span className="badge bg-secondary rounded-pill px-3 py-2">
        Không rõ
      </span>
    );
  };

  const showDetail = (order) => {
    let html = `
      <div style="text-align:left">
        <p><b>👤 Người nhận:</b> ${order.shippingAddress.fullName}</p>
        <p><b>📞 SĐT:</b> ${order.shippingAddress.phone}</p>
        <p><b>📍 Địa chỉ:</b> 
        ${order.shippingAddress.addressLine}, 
        ${order.shippingAddress.wardName}, 
        ${order.shippingAddress.districtName}, 
        ${order.shippingAddress.provinceName}
        </p>
        <hr/>
    `;

    order.items.forEach((item) => {
      html += `
        <div style="margin-bottom:6px">
          🛒 ${item.name} x ${item.qty} 
          <span style="float:right">${formatVND(
            item.price * item.qty
          )}</span>
        </div>
      `;
    });

    html += `
        <hr/>
        <div style="font-size:16px">
          <b>Tổng:</b> ${formatVND(order.total)}
        </div>
      </div>
    `;

    Swal.fire({
      title: "Chi tiết đơn hàng",
      html,
      width: 600,
    });
  };

  return (
    <div className="bg-light d-flex flex-column min-vh-100">
      <Headers />

      <div className="container py-3 py-md-4 flex-grow-1">
        <div className="d-flex align-items-center mb-4">
          <i className="bi bi-bag-check fs-3 me-2 text-danger"></i>
          <h4 className="fw-bold m-0">Đơn hàng của tôi</h4>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="card shadow-sm rounded-4 p-5 text-center">
            <i className="bi bi-cart-x fs-1 text-muted mb-3"></i>
            <p className="text-muted">Bạn chưa có đơn hàng nào.</p>
          </div>
        ) : (
          <div className="card shadow-sm rounded-4 border-0">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Mã đơn</th>
                      <th>Ngày đặt</th>
                      <th className="text-center">Sản phẩm</th>
                      <th className="text-end">Tổng tiền</th>
                      <th className="text-center">Trạng thái</th>
                      <th className="text-center">Hành động</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id} style={{ cursor: "pointer" }}>
                        <td className="fw-semibold">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>

                        <td className="text-muted">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>

                        <td className="text-center">
                          <span className="badge bg-secondary rounded-pill">
                            {order.items.length}
                          </span>
                        </td>

                        <td className="text-end fw-bold text-danger">
                          {formatVND(order.total)}
                        </td>

                        <td className="text-center">
                          {getStatusBadge(order.status)}
                        </td>

                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary rounded-pill"
                            onClick={() => showDetail(order)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
        <footer className="site-footer py-4 mt-4">
        <div className="container">
          <div className="text-center muted mt-4">
            © 2026 - E-commerce Website
          </div>
        </div>
      </footer>
    </div>
  );
}
