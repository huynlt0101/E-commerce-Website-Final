import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Headers from "../header/header";
import Swal from "sweetalert2";
import "../css/admin.css";

const API_BASE = "http://localhost:5000";

function SidebarMenu() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/dang-nhap");
  };

  return (
    <div className="p-3">
      <div className="d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-speedometer2 fs-4 text-primary"></i>
        <div className="admin-brand">ADMIN PANEL</div>
      </div>

      <div className="nav flex-column admin-menu">
        <NavLink to="/admin" end className="nav-link">
          <i className="bi bi-grid"></i> Dashboard
        </NavLink>

        <NavLink to="/admin/users" className="nav-link">
          <i className="bi bi-people"></i> Quản lý người dùng
        </NavLink>

        <NavLink to="/admin/categories" className="nav-link">
          <i className="bi bi-tags"></i> Quản lý danh mục
        </NavLink>

        <NavLink to="/admin/products" className="nav-link">
          <i className="bi bi-box-seam"></i> Quản lý sản phẩm
        </NavLink>

        <NavLink to="/admin/orders" className="nav-link">
          <i className="bi bi-receipt"></i> Quản lý đơn hàng
        </NavLink>
      </div>

      <hr />

      <button onClick={handleLogout} className="btn btn-outline-danger w-100 rounded-pill">
        <i className="bi bi-box-arrow-right me-2"></i>
        Đăng xuất
      </button>
    </div>
  );
}

const statusBadge = (statusNumber) => {
  const s = Number(statusNumber);
  if (s === 0) return "badge text-bg-warning";
  if (s === 1) return "badge text-bg-success";
  return "badge text-bg-secondary";
};

const statusText = (statusNumber) => {
  const s = Number(statusNumber);
  if (s === 0) return "Chờ xác minh";
  if (s === 1) return "Đã xác minh";
  return "Không rõ";
};

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  const token = useMemo(() => localStorage.getItem("token"), []);

  // ✅ check admin login
  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) {
      navigate("/dang-nhap");
      return;
    }

    try {
      const u = JSON.parse(userRaw);
      if (u?.role !== "admin") {
        navigate("/");
        return;
      }
    } catch {
      navigate("/dang-nhap");
      return;
    }

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ GET all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không lấy được đơn hàng");

      setOrders(data.data || []);
    } catch (err) {
      Swal.fire("Lỗi", err.message || "Không thể tải đơn hàng", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ PATCH status
  const changeStatus = async (orderId, nextStatus) => {
    const confirm = await Swal.fire({
      title: "Xác nhận cập nhật?",
      text: `Đổi trạng thái sang: ${statusText(nextStatus)}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Cập nhật",
      cancelButtonText: "Huỷ",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: Number(nextStatus) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại");

      // update local state
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: Number(nextStatus) } : o))
      );

      Swal.fire("Thành công", "Đã cập nhật trạng thái đơn hàng", "success");
    } catch (err) {
      Swal.fire("Lỗi", err.message || "Không thể cập nhật", "error");
    }
  };

  const showDetail = (order) => {
    let html = `
      <div style="text-align:left">
        <div><b>Mã đơn:</b> ${String(order._id).slice(-8).toUpperCase()}</div>
        <div><b>Trạng thái:</b> ${statusText(order.status)}</div>
        <hr />
        <div><b>Người mua:</b> ${
          order.user?.name || order.user?.fullName || order.user?.email || "N/A"
        }</div>
        <div><b>Email:</b> ${order.user?.email || "N/A"}</div>
        <hr />
        <div><b>Người nhận:</b> ${order.shippingAddress?.fullName || ""}</div>
        <div><b>SĐT:</b> ${order.shippingAddress?.phone || ""}</div>
        <div><b>Địa chỉ:</b> 
          ${order.shippingAddress?.addressLine || ""}, 
          ${order.shippingAddress?.wardName || ""}, 
          ${order.shippingAddress?.districtName || ""}, 
          ${order.shippingAddress?.provinceName || ""}
        </div>
        <hr />
        <div><b>Sản phẩm:</b></div>
    `;

    (order.items || []).forEach((it) => {
      html += `
        <div style="margin:6px 0">
          • ${it.name} x ${it.qty}
          <span style="float:right">${formatVND(Number(it.price) * Number(it.qty))}</span>
        </div>
      `;
    });

    html += `
        <hr />
        <div><b>Tạm tính:</b> ${formatVND(order.subtotal)}</div>
        <div><b>Phí ship:</b> ${formatVND(order.shippingFee)}</div>
        <div style="font-size:16px"><b>Tổng:</b> ${formatVND(order.total)}</div>
      </div>
    `;

    Swal.fire({
      title: "Chi tiết đơn hàng",
      html,
      width: 700,
    });
  };

  return (
    <div className="admin-layout">
      <Headers />

      {/* mobile menu button */}
      <div className="d-lg-none container pt-3">
        <button
          className="btn btn-dark rounded-pill px-3"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminMenu"
        >
          <i className="bi bi-list me-2"></i> Menu
        </button>
      </div>

      {/* offcanvas sidebar mobile */}
      <div className="offcanvas offcanvas-start d-lg-none" tabIndex="-1" id="adminMenu">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Admin Menu</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body p-0">
          <SidebarMenu />
        </div>
      </div>

      <div className="d-flex">
        {/* desktop sidebar */}
        <aside className="admin-sidebar">
          <SidebarMenu />
        </aside>

        {/* content */}
        <main className="admin-content">
          <div className="container py-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h3 className="fw-bold mb-1">Quản lý đơn hàng</h3>
                <div className="text-muted">Danh sách đơn hàng & trạng thái</div>
              </div>

              <button onClick={fetchOrders} className="btn btn-outline-primary rounded-pill">
                <i className="bi bi-arrow-clockwise me-2"></i>
                Tải lại
              </button>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <div className="text-muted mt-2">Đang tải đơn hàng...</div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: 60 }}>#</th>
                          <th style={{ minWidth: 220 }}>Người mua</th>
                          <th style={{ width: 120 }}>Số SP</th>
                          <th style={{ width: 170 }}>Tổng tiền</th>
                          <th style={{ width: 260 }}>Trạng thái</th>
                          <th style={{ width: 160 }} className="text-end">Chi tiết</th>
                        </tr>
                      </thead>

                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-4">
                              Chưa có đơn hàng nào.
                            </td>
                          </tr>
                        ) : (
                          orders.map((o, idx) => (
                            <tr key={o._id}>
                              <td className="text-muted">{idx + 1}</td>

                              <td>
                                <div className="fw-semibold">
                                  {o.user?.username}
                                </div>
                                <div className="small text-muted">
                                  {o.user?.email || ""}
                                </div>
                              </td>

                              <td>
                                <span className="badge text-bg-secondary">
                                  {(o.items || []).length}
                                </span>
                              </td>

                              <td className="fw-bold text-danger">
                                {formatVND(o.total)}
                              </td>

                              <td>
                                <div className="d-flex flex-wrap align-items-center gap-2">
                                  <span className={statusBadge(o.status)}>
                                    {statusText(o.status)}
                                  </span>

                                  <select
                                    className="form-select form-select-sm"
                                    style={{ width: 170 }}
                                    value={Number(o.status)}
                                    onChange={(e) => changeStatus(o._id, e.target.value)}
                                  >
                                    <option value={0}>Chờ xác minh</option>
                                    <option value={1}>Đã xác minh</option>
                                  </select>
                                </div>
                              </td>

                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-outline-primary rounded-pill"
                                  onClick={() => showDetail(o)}
                                >
                                  <i className="bi bi-eye me-1"></i> Xem
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}


              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
