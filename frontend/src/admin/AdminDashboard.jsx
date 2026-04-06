import { useEffect, useMemo, useState } from "react";
import Headers from "../header/header";
import { NavLink, useNavigate } from "react-router-dom";
import "../css/admin.css";

// Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
          <i className="bi bi-grid"></i>
          Dashboard
        </NavLink>

        <NavLink to="/admin/users" className="nav-link">
          <i className="bi bi-people"></i>
          Quản lý người dùng
        </NavLink>

        <NavLink to="/admin/categories" className="nav-link">
          <i className="bi bi-tags"></i>
          Quản lý danh mục
        </NavLink>

        <NavLink to="/admin/products" className="nav-link">
          <i className="bi bi-box-seam"></i>
          Quản lý sản phẩm
        </NavLink>

        <NavLink to="/admin/orders" className="nav-link">
          <i className="bi bi-receipt"></i>
          Quản lý đơn hàng
        </NavLink>
      </div>

      <hr />

      <button
        className="btn btn-outline-danger w-100 rounded-pill"
        onClick={handleLogout}
      >
        <i className="bi bi-box-arrow-right me-2"></i>
        Đăng xuất
      </button>
    </div>
  );
}

function formatVND(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
}

export default function AdminDashboard() {
  const [totals, setTotals] = useState({
    users: 0,
    orders: 0,
    products: 0,
  });

  const [loadingTotals, setLoadingTotals] = useState(true);
  const [totalsError, setTotalsError] = useState("");

  const [year, setYear] = useState(new Date().getFullYear());

  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        setLoadingTotals(true);
        setTotalsError("");

        const token = localStorage.getItem("token");

        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const [usersRes, ordersRes, productsRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/total`, { headers }),
          fetch(`${API_BASE}/api/orders/total`, { headers }),
          fetch(`${API_BASE}/api/products/total`, { headers }),
        ]);

        const usersText = await usersRes.text();
        const ordersText = await ordersRes.text();
        const productsText = await productsRes.text();

        const usersJson = usersText ? JSON.parse(usersText) : {};
        const ordersJson = ordersText ? JSON.parse(ordersText) : {};
        const productsJson = productsText ? JSON.parse(productsText) : {};

        if (!usersRes.ok) {
          throw new Error(usersJson.message || "Lỗi lấy tổng người dùng");
        }
        if (!ordersRes.ok) {
          throw new Error(ordersJson.message || "Lỗi lấy tổng đơn hàng");
        }
        if (!productsRes.ok) {
          throw new Error(productsJson.message || "Lỗi lấy tổng sản phẩm");
        }

        setTotals({
          users: Number(usersJson.totalUsers || 0),
          orders: Number(ordersJson.totalOrders || 0),
          products: Number(productsJson.totalProducts || 0),
        });
      } catch (error) {
        console.error("fetchTotals error:", error);
        setTotalsError(error.message || "Không thể tải dữ liệu thống kê");
      } finally {
        setLoadingTotals(false);
      }
    };

    fetchTotals();
  }, []);

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        setLoadingStats(true);
        setStatsError("");

        const token = localStorage.getItem("token");

        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(
          `${API_BASE}/api/orders/stats/monthly?year=${year}`,
          { headers }
        );

        const text = await res.text();
        const json = text ? JSON.parse(text) : {};

        if (!res.ok) {
          throw new Error(json.message || "Lỗi lấy thống kê theo tháng");
        }

        setMonthlyStats(Array.isArray(json.monthlyStats) ? json.monthlyStats : []);
      } catch (error) {
        console.error("fetchMonthlyStats error:", error);
        setStatsError(error.message || "Không thể tải dữ liệu biểu đồ");
        setMonthlyStats([]);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchMonthlyStats();
  }, [year]);

  const months = useMemo(
    () => ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
    []
  );

  const normalizedMonthlyStats = useMemo(() => {
    if (monthlyStats.length === 12) return monthlyStats;

    const fallback = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: months[i],
      revenue: 0,
      orders: 0,
      sold: 0,
    }));

    for (const item of monthlyStats) {
      const idx = Number(item.month) - 1;
      if (idx >= 0 && idx < 12) {
        fallback[idx] = {
          month: idx + 1,
          label: item.label || months[idx],
          revenue: Number(item.revenue || 0),
          orders: Number(item.orders || 0),
          sold: Number(item.sold || 0),
        };
      }
    }

    return fallback;
  }, [monthlyStats, months]);

  const lineData = useMemo(() => {
    return {
      labels: normalizedMonthlyStats.map((item) => item.label),
      datasets: [
        {
          label: `Doanh thu - ${year}`,
          data: normalizedMonthlyStats.map((item) => item.revenue),
          tension: 0.35,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    };
  }, [normalizedMonthlyStats, year]);

  const barData = useMemo(() => {
    return {
      labels: normalizedMonthlyStats.map((item) => item.label),
      datasets: [
        {
          label: `Số bán - ${year}`,
          data: normalizedMonthlyStats.map((item) => item.sold),
          borderWidth: 1,
        },
        {
          label: `Số đơn - ${year}`,
          data: normalizedMonthlyStats.map((item) => item.orders),
          borderWidth: 1,
        },
      ],
    };
  }, [normalizedMonthlyStats, year]);

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${formatVND(context.raw)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return Number(value).toLocaleString("vi-VN");
            },
          },
        },
      },
    }),
    []
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    }),
    []
  );

  const summary = useMemo(() => {
    return normalizedMonthlyStats.reduce(
      (acc, item) => {
        acc.revenue += Number(item.revenue || 0);
        acc.orders += Number(item.orders || 0);
        acc.sold += Number(item.sold || 0);
        return acc;
      },
      { revenue: 0, orders: 0, sold: 0 }
    );
  }, [normalizedMonthlyStats]);

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
                <h3 className="fw-bold mb-1">Dashboard</h3>
                <div className="text-muted">Tổng quan hệ thống & thống kê theo năm</div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="text-muted fw-semibold">Năm:</span>
                <select
                  className="form-select"
                  style={{ width: 120 }}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {totalsError && (
              <div className="alert alert-danger rounded-4 mb-3">
                {totalsError}
              </div>
            )}

            {statsError && (
              <div className="alert alert-warning rounded-4 mb-3">
                {statsError}
              </div>
            )}

            <div className="row g-3 mb-3">
              <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-muted">Tổng người dùng</div>
                        <div className="fs-3 fw-bold">
                          {loadingTotals ? "..." : totals.users}
                        </div>
                      </div>
                      <div className="fs-2">
                        <i className="bi bi-people"></i>
                      </div>
                    </div>
                    <div className="small text-muted mt-2">Tính đến hiện tại</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-muted">Tổng đơn hàng</div>
                        <div className="fs-3 fw-bold">
                          {loadingTotals ? "..." : totals.orders}
                        </div>
                      </div>
                      <div className="fs-2">
                        <i className="bi bi-receipt"></i>
                      </div>
                    </div>
                    <div className="small text-muted mt-2">Đơn đã tạo</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-muted">Tổng sản phẩm</div>
                        <div className="fs-3 fw-bold">
                          {loadingTotals ? "..." : totals.products}
                        </div>
                      </div>
                      <div className="fs-2">
                        <i className="bi bi-box-seam"></i>
                      </div>
                    </div>
                    <div className="small text-muted mt-2">Đang kinh doanh</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-lg-7">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fw-bold">Doanh thu theo tháng</div>
                      <span className="badge text-bg-light border">Năm {year}</span>
                    </div>

                    {loadingStats ? (
                      <div className="text-muted py-5 text-center">Đang tải biểu đồ doanh thu...</div>
                    ) : (
                      <Line data={lineData} options={lineOptions} />
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-5">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fw-bold">Số bán / số đơn theo tháng</div>
                      <span className="badge text-bg-light border">Năm {year}</span>
                    </div>

                    {loadingStats ? (
                      <div className="text-muted py-5 text-center">Đang tải biểu đồ đơn hàng...</div>
                    ) : (
                      <Bar data={barData} options={barOptions} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <div className="text-muted">Tổng doanh thu năm {year}</div>
                    <div className="fs-4 fw-bold">{formatVND(summary.revenue)}</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <div className="text-muted">Tổng số đơn năm {year}</div>
                    <div className="fs-4 fw-bold">{summary.orders}</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <div className="text-muted">Tổng số bán năm {year}</div>
                    <div className="fs-4 fw-bold">{summary.sold}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mt-3">
              <div className="card-body">
                <div className="fw-bold mb-2">Tóm tắt theo tháng</div>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr className="text-muted">
                        <th>Tháng</th>
                        <th>Số đơn</th>
                        <th>Số bán</th>
                        <th>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalizedMonthlyStats.map((item) => (
                        <tr key={item.month}>
                          <td className="fw-semibold">{item.label}</td>
                          <td>{item.orders}</td>
                          <td>{item.sold}</td>
                          <td>{formatVND(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="small text-muted mt-2">
                  * Dữ liệu biểu đồ và bảng đang lấy từ API thật theo năm đã chọn.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}