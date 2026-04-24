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

      <button
        onClick={handleLogout}
        className="btn btn-outline-danger w-100 rounded-pill"
      >
        <i className="bi bi-box-arrow-right me-2"></i>
        Đăng xuất
      </button>
    </div>
  );
}

const statusBadgeClass = (statusNumber) => {
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

const paymentMethodText = (paymentMethod) => {
  if (paymentMethod === "MOMO") return "MoMo";
  if (paymentMethod === "COD") return "COD";
  return "Không rõ";
};

const paymentMethodBadgeClass = (paymentMethod) => {
  if (paymentMethod === "MOMO") return "badge text-bg-primary";
  if (paymentMethod === "COD") return "badge text-bg-dark";
  return "badge text-bg-secondary";
};

const paymentStatusText = (paymentStatus, isPaid) => {
  if (paymentStatus === "paid" || isPaid === true) return "Đã thanh toán";
  if (paymentStatus === "pending") return "Chờ thanh toán";
  if (paymentStatus === "failed") return "Thanh toán lỗi";
  if (paymentStatus === "unpaid") return "Chưa thanh toán";
  if (paymentStatus === "refunded") return "Đã hoàn tiền";
  return "Không rõ";
};

const paymentStatusBadgeClass = (paymentStatus, isPaid) => {
  if (paymentStatus === "paid" || isPaid === true) return "badge text-bg-success";
  if (paymentStatus === "pending") return "badge text-bg-warning";
  if (paymentStatus === "failed") return "badge text-bg-danger";
  if (paymentStatus === "unpaid") return "badge text-bg-secondary";
  if (paymentStatus === "refunded") return "badge text-bg-info";
  return "badge text-bg-secondary";
};

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  const token = useMemo(() => localStorage.getItem("token"), []);

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
  }, [navigate, token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Không lấy được đơn hàng");

      setOrders(data.data || []);
    } catch (err) {
      Swal.fire("Lỗi", err.message || "Không thể tải đơn hàng", "error");
    } finally {
      setLoading(false);
    }
  };

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
      if (!res.ok) throw new Error(data?.message || "Cập nhật thất bại");

      const updatedOrder = data?.data;

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                ...(updatedOrder || {}),
                status: updatedOrder?.status ?? Number(nextStatus),
                paymentStatus: updatedOrder?.paymentStatus ?? o.paymentStatus,
                isPaid: updatedOrder?.isPaid ?? o.isPaid,
                paidAt: updatedOrder?.paidAt ?? o.paidAt,
                momo: updatedOrder?.momo ?? o.momo,
              }
            : o
        )
      );

      Swal.fire("Thành công", "Đã cập nhật trạng thái đơn hàng", "success");
    } catch (err) {
      Swal.fire("Lỗi", err.message || "Không thể cập nhật", "error");
    }
  };

  const showDetail = (order) => {
    const paidAtText = order?.paidAt
      ? new Date(order.paidAt).toLocaleString("vi-VN")
      : "Chưa có";

    let html = `
      <div style="text-align:left">
        <div><b>Mã đơn:</b> ${String(order._id).slice(-8).toUpperCase()}</div>
        <div><b>Trạng thái đơn:</b> ${statusText(order.status)}</div>
        <div><b>Phương thức thanh toán:</b> ${paymentMethodText(
          order.paymentMethod
        )}</div>
        <div><b>Trạng thái thanh toán:</b> ${paymentStatusText(
          order.paymentStatus,
          order.isPaid
        )}</div>
        <div><b>Đã thanh toán:</b> ${order.isPaid ? "Có" : "Chưa"}</div>
        <div><b>Thời gian thanh toán:</b> ${paidAtText}</div>
        ${
          order?.momo?.transId
            ? `<div><b>Mã giao dịch MoMo:</b> ${order.momo.transId}</div>`
            : ""
        }
        ${
          order?.momo?.orderId
            ? `<div><b>Mã đơn MoMo:</b> ${order.momo.orderId}</div>`
            : ""
        }
        ${
          typeof order?.momo?.resultCode !== "undefined" &&
          order?.momo?.resultCode !== null
            ? `<div><b>MoMo resultCode:</b> ${order.momo.resultCode}</div>`
            : ""
        }
        ${
          order?.momo?.message
            ? `<div><b>MoMo message:</b> ${order.momo.message}</div>`
            : ""
        }
        <hr />
        <div><b>Người mua:</b> ${
          order.user?.username ||
          order.user?.name ||
          order.user?.fullName ||
          order.user?.email ||
          "N/A"
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
        <div><b>Ghi chú:</b> ${order.shippingAddress?.note || "Không có"}</div>
        <hr />
        <div><b>Sản phẩm:</b></div>
    `;

    (order.items || []).forEach((it) => {
      html += `
        <div style="margin:6px 0">
          • ${it.name} x ${it.qty}
          <span style="float:right">${formatVND(
            Number(it.price) * Number(it.qty)
          )}</span>
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
      width: 760,
      confirmButtonText: "Đóng",
    });
  };

  return (
    <div className="admin-layout">
      <Headers />

      <div className="d-lg-none container pt-3">
        <button
          className="btn btn-dark rounded-pill px-3"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminMenu"
        >
          <i className="bi bi-list me-2"></i> Menu
        </button>
      </div>

      <div
        className="offcanvas offcanvas-start d-lg-none"
        tabIndex="-1"
        id="adminMenu"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Admin Menu</h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
          ></button>
        </div>
        <div className="offcanvas-body p-0">
          <SidebarMenu />
        </div>
      </div>

      <div className="d-flex">
        <aside className="admin-sidebar">
          <SidebarMenu />
        </aside>

        <main className="admin-content">
          <div className="container py-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h3 className="fw-bold mb-1">Quản lý đơn hàng</h3>
                <div className="text-muted">
                  Danh sách đơn hàng, trạng thái và thanh toán
                </div>
              </div>

              <button
                onClick={fetchOrders}
                className="btn btn-outline-primary rounded-pill"
              >
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
                          <th style={{ width: 110 }}>Số SP</th>
                          <th style={{ width: 150 }}>Tổng tiền</th>
                          <th style={{ width: 130 }}>Thanh toán</th>
                          <th style={{ width: 160 }}>TT thanh toán</th>
                          <th style={{ width: 260 }}>Trạng thái đơn</th>
                          <th style={{ width: 160 }} className="text-end">
                            Chi tiết
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center text-muted py-4">
                              Chưa có đơn hàng nào.
                            </td>
                          </tr>
                        ) : (
                          orders.map((o, idx) => (
                            <tr key={o._id}>
                              <td className="text-muted">{idx + 1}</td>

                              <td>
                                <div className="fw-semibold">
                                  {o.user?.username ||
                                    o.user?.fullName ||
                                    o.user?.email ||
                                    "N/A"}
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
                                <span className={paymentMethodBadgeClass(o.paymentMethod)}>
                                  {paymentMethodText(o.paymentMethod)}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={paymentStatusBadgeClass(
                                    o.paymentStatus,
                                    o.isPaid
                                  )}
                                >
                                  {paymentStatusText(o.paymentStatus, o.isPaid)}
                                </span>
                              </td>

                              <td>
                                <div className="d-flex flex-wrap align-items-center gap-2">
                                  <span className={statusBadgeClass(o.status)}>
                                    {statusText(o.status)}
                                  </span>

                                  <select
                                    className="form-select form-select-sm"
                                    style={{ width: 170 }}
                                    value={Number(o.status)}
                                    onChange={(e) =>
                                      changeStatus(o._id, e.target.value)
                                    }
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