import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../css/header.css";
import "../css/index.css";
import "../css/review.css";
import Headers from "../header/header";
import useCart from "../hooks/useCart";
import ReviewSection from "../components/ReviewSection";

const API_BASE = "http://localhost:5000";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleBuyNow = () => {
    addToCart(product, 1);
    navigate("/gio-hang");
  };

  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  const fallbackImg = useMemo(
    () => "https://via.placeholder.com/600x600.png?text=No+Image",
    []
  );

  useEffect(() => {
    let ignore = false;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.message || "Không tìm thấy sản phẩm");

        if (!ignore) setProduct(data?.data || null);
      } catch (err) {
        console.error(err);
        if (!ignore) setProduct(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleReviewStatsChange = ({ averageRating, numReviews }) => {
    setProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        averageRating,
        numReviews,
      };
    });
  };

  if (loading) {
    return (
      <div className="bg-light min-vh-100">
        <Headers />
        <div className="container py-5 text-center text-muted">Đang tải...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-light min-vh-100">
        <Headers />
        <div className="container py-5 text-center">
          <div className="alert alert-danger">
            Sản phẩm không tồn tại hoặc đã bị xoá.
          </div>
          <Link to="/" className="btn btn-primary rounded-pill px-4">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = product.image
    ? `${API_BASE}/imgs/${product.image}`
    : fallbackImg;

  const categoryName = product.category?.name || "Danh mục";
  const productName = product.name || "Sản phẩm";

  return (
    <div className="bg-light">
      <Headers />

      <div className="container py-3 py-md-4">
        <nav aria-label="breadcrumb" className="mb-2">
          <ol className="breadcrumb small mb-0">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none">
                Trang chủ
              </Link>
            </li>
            <li className="breadcrumb-item">
              <span className="text-decoration-none">{categoryName}</span>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {productName}
            </li>
          </ol>
        </nav>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h3 className="m-0 fw-bold">{productName}</h3>

            <div className="d-flex align-items-center gap-3 flex-wrap mt-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge rounded-pill text-bg-warning text-dark px-3 py-2">
                  ⭐ {Number(product.averageRating || 0).toFixed(1)}
                </span>
                <span className="text-muted small">
                  {product.numReviews || 0} đánh giá
                </span>
              </div>

              <div className="small text-success fw-semibold">
                {Number(product.quantity || 0) > 0 ? "Còn hàng" : "Hết hàng"}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 g-lg-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-3 p-md-4">
                <div className="ratio ratio-16x9 bg-white rounded-4 overflow-hidden border">
                  <img
                    src={imageUrl}
                    alt={productName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = fallbackImg;
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 sticky-lg-top">
              <div className="card-body p-3 p-md-4">
                <div className="mb-3">
                  <div className="d-flex align-items-end gap-2 flex-wrap">
                    <div className="h4 m-0 fw-bold text-danger">
                      {formatVND(product.price)}
                    </div>
                  </div>
                  <div className="small text-muted mt-1">
                    Giá đã gồm VAT • Miễn phí giao hàng
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-muted">Danh mục: </span>
                  <span className="fw-semibold">{categoryName}</span>
                </div>

                <div className="mb-3">
                  <span className="text-muted">Số lượng còn: </span>
                  <span className="fw-semibold">{product.quantity ?? 0}</span>
                </div>

                <div className="d-grid gap-2">
                  <button
                    className="btn btn-danger btn-lg rounded-4 fw-bold"
                    onClick={handleBuyNow}
                    disabled={Number(product.quantity || 0) <= 0}
                  >
                    MUA NGAY
                  </button>
                </div>

                <div className="mt-3 small text-muted">
                  <div className="d-flex gap-2 align-items-start mb-2">
                    <i className="bi bi-shield-check"></i>
                    <span>Bảo hành chính hãng 12 tháng</span>
                  </div>
                  <div className="d-flex gap-2 align-items-start mb-2">
                    <i className="bi bi-truck"></i>
                    <span>Giao nhanh 2h (tuỳ khu vực)</span>
                  </div>
                  <div className="d-flex gap-2 align-items-start">
                    <i className="bi bi-arrow-repeat"></i>
                    <span>Đổi trả trong 7 ngày nếu lỗi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 g-lg-4 mt-1">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-3 p-md-4">
                <h5 className="fw-bold mb-2">Mô tả sản phẩm</h5>

                <div
                  className="text-muted product-description"
                  dangerouslySetInnerHTML={{
                    __html:
                      product.description ||
                      "<p>Chưa có mô tả cho sản phẩm này.</p>",
                  }}
                />
              </div>
            </div>

            <ReviewSection
              productId={product._id}
              productName={product.name}
              onStatsChange={handleReviewStatsChange}
            />
          </div>
        </div>
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