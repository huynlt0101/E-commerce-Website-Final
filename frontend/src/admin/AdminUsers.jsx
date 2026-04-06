import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import Headers from "../header/header";
import "../css/admin.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SidebarMenu() {
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

      <button className="btn btn-outline-danger w-100 rounded-pill">
        <i className="bi bi-box-arrow-right me-2"></i>
        Đăng xuất
      </button>
    </div>
  );
}

export default function AdminUsers() {
  // ====== CONFIG ======
  const API_BASE = "http://localhost:5000"; // đổi khi deploy
  const token = localStorage.getItem("token");

  const authHeaders = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    // nếu backend bạn không cần auth thì bỏ Authorization cũng được
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  // ====== STATE ======
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // ====== HELPERS ======
  const normalizeUser = (u) => ({
    id: u._id || u.id,
    name: u.username || u.name || "-", // backend dùng username
    email: u.email || "-",
    phone: u.phone || "-"
  });

  const buildPages = (current, max) => {
    // hiển thị 1..max nếu ít, nếu nhiều thì: 1 ... current-1 current current+1 ... max
    if (max <= 7) return Array.from({ length: max }, (_, i) => i + 1);

    const pages = new Set([1, max, current, current - 1, current + 1, current - 2, current + 2]);
    const arr = Array.from(pages)
      .filter((p) => p >= 1 && p <= max)
      .sort((a, b) => a - b);

    // chèn dấu ...
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      result.push(arr[i]);
      if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) result.push("...");
    }
    return result;
  };

  const pages = useMemo(() => buildPages(page, totalPages), [page, totalPages]);

  // ====== API ======
  const fetchUsers = async ({ pageParam = page, searchParam = search } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(limit));
      if (searchParam?.trim()) params.set("search", searchParam.trim());

      const res = await fetch(`${API_BASE}/api/users?${params.toString()}`, {
        method: "GET",
        headers: authHeaders
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Lỗi tải người dùng");

      const items = Array.isArray(data?.data) ? data.data.map(normalizeUser) : [];
      setUsers(items);

      const p = data?.pagination;
      setTotal(p?.total ?? items.length);
      setTotalPages(p?.totalPages ?? 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  // ====== UI ACTIONS ======
  const onSubmitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="admin-layout">
      <Headers />
      <ToastContainer position="top-right" autoClose={2500} newestOnTop />

      {/* mobile menu button */}
      <div className="d-lg-none container pt-3">
        <button className="btn btn-dark rounded-pill px-3" data-bs-toggle="offcanvas" data-bs-target="#adminMenu">
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
                <h3 className="fw-bold mb-1">Quản lý người dùng</h3>
                <div className="text-muted">
                  Danh sách người dùng trong hệ thống {loading ? "(đang tải...)" : ""}
                </div>
              </div>

              {/* Search */}
              <form onSubmit={onSubmitSearch} className="d-flex gap-2">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    className="form-control"
                    placeholder="Tìm theo tên / email / sđt..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  Tìm
                </button>
              </form>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="small text-muted">
                    Tổng: <b>{total}</b> người dùng
                    {search ? (
                      <>
                        {" "}
                        | Từ khoá: <b>{search}</b>
                      </>
                    ) : null}
                  </div>

                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => fetchUsers({ pageParam: page, searchParam: search })}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> Tải lại
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 60 }}>#</th>
                        <th style={{ minWidth: 220 }}>Tên người dùng</th>
                        <th style={{ minWidth: 220 }}>Email</th>
                        <th style={{ width: 160 }}>Số điện thoại</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            Đang tải dữ liệu...
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            Chưa có người dùng nào.
                          </td>
                        </tr>
                      ) : (
                        users.map((u, idx) => (
                          <tr key={u.id}>
                            <td className="text-muted">{(page - 1) * limit + idx + 1}</td>
                            <td className="fw-semibold">{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.phone}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                  <div className="small text-muted">
                    Trang <b>{page}</b> / <b>{totalPages}</b>
                  </div>

                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={loading || page <= 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>

                    {pages.map((p, i) =>
                      p === "..." ? (
                        <button key={`dots-${i}`} className="btn btn-outline-secondary" disabled>
                          ...
                        </button>
                      ) : (
                        <button
                          key={p}
                          className={`btn ${p === page ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => setPage(p)}
                          disabled={loading}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={loading || page >= totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
