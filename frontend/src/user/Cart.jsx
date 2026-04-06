import { Link, useNavigate } from "react-router-dom";

import Headers from "../header/header";
import useCart from "../hooks/useCart";

const API_BASE = "http://localhost:5000";

export default function CartPage() {
  const { items, inc, dec, remove, subtotal } = useCart();
 const navigate = useNavigate();
const handleCheckout = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user"); // string JSON

  // chưa login
  if (!token || !user) {
    // lưu trang muốn quay lại sau login
    localStorage.setItem("redirectAfterLogin", "/checkout");
    navigate("/dang-nhap");
    return;
  }

  // đã login
  navigate("/thanh-toan");
};
  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  const imgUrl = (img) =>
    img ? `${API_BASE}/imgs/${img}` : "https://via.placeholder.com/120x120.png?text=No+Image";

  return (
    <div className="bg-light d-flex flex-column min-vh-100">
      <Headers />

      <div className="container py-3 py-md-4 flex-grow-1">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="m-0 fw-bold">Giỏ hàng</h4>
          <Link to="/" className="btn btn-outline-secondary rounded-4">
            Tiếp tục mua
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 text-center">
              <div className="text-muted mb-3">Giỏ hàng đang trống.</div>
              <Link to="/" className="btn btn-danger rounded-4 fw-bold px-4">
                Mua sắm ngay
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-0">
                  {items.map((p, idx) => (
                    <div
                      key={p._id}
                      className={`p-3 p-md-4 d-flex gap-3 align-items-start ${
                        idx !== items.length - 1 ? "border-bottom" : ""
                      }`}
                    >
                      <img
                        src={imgUrl(p.image)}
                        alt={p.name}
                        style={{ width: 84, height: 84, objectFit: "contain" }}
                        className="bg-white border rounded-3"
                      />

                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between gap-2">
                          <div>
                            <div className="fw-semibold">{p.name}</div>
                            <div className="text-danger fw-bold mt-1">
                              {formatVND(p.price)}
                            </div>
                          </div>

                          <button
                            className="btn btn-link text-danger p-0 text-decoration-none"
                            onClick={() => remove(p._id)}
                          >
                            Xoá
                          </button>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-3">
                          <div className="btn-group" role="group" aria-label="qty">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => dec(p._id)}
                            >
                              –
                            </button>
                            <button className="btn btn-outline-secondary" disabled>
                              {p.qty}
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => inc(p._id)}
                            >
                              +
                            </button>
                          </div>

                          <div className="fw-bold">
                            {formatVND(Number(p.price) * Number(p.qty))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="small text-muted mt-2">
                Tạm tính ({items.reduce((s, x) => s + x.qty, 0)} sản phẩm).
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-3 p-md-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Tạm tính</span>
                    <span className="fw-bold">{formatVND(subtotal)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Phí ship</span>
                    <span className="fw-bold">0đ</span>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold">Tổng</span>
                    <span className="h5 m-0 fw-bold text-danger">
                      {formatVND(subtotal)}
                    </span>
                  </div>

                  <button className="btn btn-danger btn-lg w-100 rounded-4 fw-bold"   onClick={handleCheckout}>
                    THANH TOÁN
                  </button>

                  <div className="small text-muted mt-3">
                    Bằng cách đặt hàng, bạn đồng ý với điều khoản của cửa hàng.
                  </div>
                </div>
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
