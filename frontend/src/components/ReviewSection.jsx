import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const API_BASE = "http://localhost:5000";
import Swal from "sweetalert2";
function getAuthToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("userToken") ||
    ""
  );
}

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleString("vi-VN");
  } catch {
    return "";
  }
}

function StarRating({
  value = 0,
  onChange,
  size = 22,
  readOnly = false,
  className = "",
}) {
  return (
    <div>
    <div className={`d-flex align-items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            className="btn p-0 border-0 bg-transparent review-star-btn"
            onClick={() => !readOnly && onChange?.(star)}
            disabled={readOnly}
            aria-label={`${star} sao`}
            title={`${star} sao`}
            style={{
              cursor: readOnly ? "default" : "pointer",
              lineHeight: 1,
            }}
          >
            <i
              className={`bi ${active ? "bi-star-fill" : "bi-star"}`}
              style={{
                fontSize: size,
                color: active ? "#f59e0b" : "#cbd5e1",
              }}
            />
          </button>
        );
      })}
    </div></div>
  );
}

export default function ReviewSection({ productId, productName, onStatsChange }) {
  const [stats, setStats] = useState({
    averageRating: 0,
    numReviews: 0,
    stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);

  const [form, setForm] = useState({
    rating: 5,
    comment: "",
  });

  const [editingId, setEditingId] = useState(null);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = getAuthToken();

  const headers = useMemo(() => {
    const base = {
      "Content-Type": "application/json",
    };
    if (token) base.Authorization = `Bearer ${token}`;
    return base;
  }, [token]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch(`${API_BASE}/api/reviews/product/${productId}/stats`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Không lấy được thống kê đánh giá");
      }

      const nextStats = {
        averageRating: data?.product?.averageRating || 0,
        numReviews: data?.product?.numReviews || 0,
        stars: data?.stars || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };

      setStats(nextStats);
      onStatsChange?.(nextStats);
    } catch (error) {
      console.error("fetchStats error:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await fetch(`${API_BASE}/api/reviews/product/${productId}?page=1&limit=50`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Không lấy được danh sách bình luận");
      }

      setReviews(data?.reviews || []);
    } catch (error) {
      console.error("fetchReviews error:", error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchMyReview = async () => {
    if (!token) {
      setMyReview(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/reviews/my-review/${productId}`, {
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        setMyReview(null);
        return;
      }

      setMyReview(data);
    } catch (error) {
      console.error("fetchMyReview error:", error);
      setMyReview(null);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchStats(), fetchReviews(), fetchMyReview()]);
  };

  useEffect(() => {
    if (!productId) return;
    refreshAll();
  }, [productId]);

  const startEdit = (review) => {
    setEditingId(review._id);
    setForm({
      rating: review.rating || 5,
      comment: review.comment || "",
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ rating: 5, comment: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
    toast.warning("Vui lòng đăng nhập để đánh giá sản phẩm");
      return;
    }

    if (!form.comment.trim()) {
     toast.warning("Vui lòng nhập nội dung bình luận");
      return;
    }

    try {
      setSubmitting(true);

      const url = editingId
        ? `${API_BASE}/api/reviews/${editingId}`
        : `${API_BASE}/api/reviews`;

      const method = editingId ? "PUT" : "POST";

      const body = editingId
        ? {
            rating: Number(form.rating),
            comment: form.comment.trim(),
          }
        : {
            productId,
            rating: Number(form.rating),
            comment: form.comment.trim(),
          };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Gửi đánh giá thất bại");
      }

     toast.success(
  editingId
    ? "Cập nhật đánh giá thành công "
    : "Gửi đánh giá thành công "
);

      cancelEdit();
      await refreshAll();
    } catch (error) {
      console.error("handleSubmit error:", error);
      toast.warning(error.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
  if (!token) {
    toast.warning("Vui lòng đăng nhập");
    return;
  }

 
  const result = await Swal.fire({
    title: "Xóa bình luận?",
    text: "Bạn sẽ không thể khôi phục lại!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    
    Swal.fire({
      title: "Đang xóa...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await fetch(`${API_BASE}/api/reviews/${reviewId}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Xóa bình luận thất bại");
    }

    
    Swal.close();

    toast.success("Đã xóa bình luận");

    if (editingId === reviewId) cancelEdit();
    await refreshAll();
  } catch (error) {
    console.error("handleDelete error:", error);

    Swal.close();

    toast.error(error.message || "Có lỗi xảy ra ");
  }
};

  const ratingPercent = (star) => {
    if (!stats.numReviews) return 0;
    return Math.round(((stats.stars?.[star] || 0) / stats.numReviews) * 100);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 mt-3">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h5 className="fw-bold mb-1">Đánh giá & bình luận</h5>
            <div className="text-muted small">
              Chia sẻ cảm nhận của bạn về sản phẩm {productName || ""}
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Summary */}
          <div className="col-12 col-lg-5">
            <div className="review-summary-box p-3 rounded-4 h-100">
              {loadingStats ? (
                <div className="text-muted">Đang tải thống kê đánh giá...</div>
              ) : (
                <>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="review-average-number">
                      {Number(stats.averageRating || 0).toFixed(1)}
                    </div>

                    <div>
                      <StarRating
                        value={Math.round(stats.averageRating || 0)}
                        readOnly
                        size={20}
                      />
                      <div className="small text-muted mt-1">
                        {stats.numReviews} lượt đánh giá
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div
                        key={star}
                        className="d-flex align-items-center gap-2 review-breakdown-row"
                      >
                        <div className="small fw-semibold" style={{ width: 28 }}>
                          {star}★
                        </div>
                        <div className="progress flex-grow-1 review-progress">
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${ratingPercent(star)}%` }}
                            aria-valuenow={ratingPercent(star)}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>
                        <div className="small text-muted" style={{ width: 40 }}>
                          {stats.stars?.[star] || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="col-12 col-lg-7">
            <div className="review-form-box p-3 rounded-4 h-100">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <h6 className="fw-bold mb-0">
                  {editingId ? "Sửa đánh giá của bạn" : "Viết đánh giá của bạn"}
                </h6>
                {!token && (
                  <span className="badge text-bg-warning">Cần đăng nhập để gửi</span>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Chọn số sao</label>
                  <StarRating
                    value={form.rating}
                    onChange={(value) => setForm((prev) => ({ ...prev, rating: value }))}
                    size={28}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Nội dung bình luận</label>
                  <textarea
                    className="form-control rounded-4"
                    rows="4"
                    placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn về sản phẩm..."
                    value={form.comment}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    maxLength={1000}
                  />
                  <div className="text-muted small mt-1">
                    {form.comment.length}/1000 ký tự
                  </div>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="submit"
                    className="btn btn-danger rounded-pill px-4"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Đang xử lý..."
                      : editingId
                      ? "Cập nhật đánh giá"
                      : "Gửi đánh giá"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={cancelEdit}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Review list */}
        <div className="mt-4">
          <h6 className="fw-bold mb-3">Tất cả bình luận</h6>

          {loadingReviews ? (
            <div className="text-muted">Đang tải bình luận...</div>
          ) : reviews.length === 0 ? (
            <div className="review-empty-box rounded-4 p-4 text-center text-muted">
              Chưa có đánh giá nào cho sản phẩm này.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {reviews.map((review) => {
                const isMine = myReview?._id === review._id;

                return (
                  <div key={review._id} className="review-item rounded-4 p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div>
                        <div className="fw-bold">{review.username || review.user?.username || "Người dùng"}</div>
                        <StarRating value={review.rating} readOnly size={16} className="mt-1" />
                        <div className="small text-muted mt-1">
                          {formatDate(review.createdAt)}
                        </div>
                      </div>

                      {isMine && (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill"
                            onClick={() => startEdit(review)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={() => handleDelete(review._id)}
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 review-comment-text">
                      {review.comment}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}