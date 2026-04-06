import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Headers from "../header/header";
import "../css/header.css";
import "../css/index.css";

const API_BASE = "http://localhost:5000";
const ITEMS_PER_PAGE = 8;

export default function ProductPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keywordFromUrl = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [search, setSearch] = useState(keywordFromUrl);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const url = search
          ? `${API_BASE}/api/products?search=${encodeURIComponent(search)}`
          : `${API_BASE}/api/products`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Không thể tải sản phẩm");
        }

        setProducts(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("Lỗi lấy sản phẩm:", err);
        setProducts([]);
        setError(err.message || "Đã xảy ra lỗi");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search]);

  useEffect(() => {
    setKeyword(keywordFromUrl);
    setSearch(keywordFromUrl);
    setPage(1);
  }, [keywordFromUrl]);

  const visibleProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return products.slice(start, end);
  }, [products, page]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    setPage(1);

    if (keyword.trim()) {
      setSearchParams({ search: keyword.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setKeyword("");
    setSearch("");
    setPage(1);
    setSearchParams({});
  };

  const goToPage = (pageNumber) => {
    setPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="d-flex justify-content-center mt-4">
        <nav>
          <ul className="pagination mb-0">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              >
                «
              </button>
            </li>

            {pages.map((p) => (
              <li
                key={p}
                className={`page-item ${page === p ? "active" : ""}`}
              >
                <button className="page-link" onClick={() => goToPage(p)}>
                  {p}
                </button>
              </li>
            ))}

            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
              >
                »
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  return (
    <div className="bg-light d-flex flex-column min-vh-100">
      <Headers />

      <main className="container my-4 my-md-5 flex-grow-1">
        <div className="section-wrap p-3 p-md-4">
          {/* tiêu đề */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
            <div>
              <h2 className="fw-bold mb-1 d-flex align-items-center">
                <i className="bi bi-bag-fill text-warning me-2"></i>
                Tất cả sản phẩm
              </h2>
              {!loading && (
                <div className="text-muted small">
                  Có {products.length} sản phẩm
                </div>
              )}
            </div>

            <Link to="/" className="fw-semibold text-decoration-none">
              <i className="bi bi-arrow-left me-1"></i> Quay lại
            </Link>
          </div>

          {/* ô tìm kiếm */}
          <form onSubmit={handleSubmitSearch} className="row g-2 mb-4">
            <div className="col-12 col-md-8 col-lg-6">
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="Nhập tên sản phẩm..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="col-6 col-md-auto">
              <button type="submit" className="btn btn-warning w-100 rounded-3 fw-semibold">
                <i className="bi bi-search me-1"></i>
                Tìm kiếm
              </button>
            </div>

            <div className="col-6 col-md-auto">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 rounded-3"
                onClick={handleClearSearch}
              >
                Xóa lọc
              </button>
            </div>
          </form>

          {/* nội dung */}
          {loading ? (
            <div className="text-center py-5 text-muted">
              Đang tải sản phẩm...
            </div>
          ) : error ? (
            <div className="text-center py-5 text-danger">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Không có sản phẩm nào
            </div>
          ) : (
            <>
              <div className="row g-4">
                {visibleProducts.map((p) => (
                  <div key={p._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                      <Link
                        to={`/san-pham/${p._id}`}
                        className="text-decoration-none text-reset"
                      >
                        <img
                          src={`${API_BASE}/imgs/${p.image}`}
                          alt={p.name}
                          className="w-100"
                          style={{ height: "260px", objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/400x300?text=No+Image";
                          }}
                        />
                      </Link>

                      <div className="card-body d-flex flex-column">
                        {p.category?.name && (
                          <div className="mb-2">
                            <span className="badge bg-light text-dark border">
                              {p.category.name}
                            </span>
                          </div>
                        )}

                        <h6
                          className="fw-bold mb-2"
                          style={{
                            minHeight: "48px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {p.name}
                        </h6>

                        <div className="text-danger fw-bold fs-5 mb-2">
                          {formatVND(p.price)}
                        </div>

                        <div className="text-muted small mb-3 d-flex align-items-center gap-2">
                          <i className="bi bi-box-seam"></i>
                          <span>Còn {p.quantity} sản phẩm</span>
                        </div>

                        <Link
                          to={`/san-pham/${p._id}`}
                          className="btn btn-warning mt-auto rounded-pill fw-semibold"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {renderPagination()}
            </>
          )}
        </div>
      </main>

      <footer className="site-footer py-4 mt-4 bg-light border-top">
        <div className="container text-center">
          © 2026 - E-commerce Website
        </div>
      </footer>
    </div>
  );
}