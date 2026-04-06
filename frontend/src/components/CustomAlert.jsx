export default function CustomAlert({ type = "success", message, onClose }) {
  if (!message) return null;

  const icon =
    type === "success" ? "" :
    type === "danger" ? "" :
    type === "warning" ? "" : "";

  return (
    <div
      className={`alert alert-${type} d-flex align-items-center shadow-sm rounded-4`}
      role="alert"
      style={{ animation: "fadeIn 0.3s ease" }}
    >
      <span className="me-2 fs-5">{icon}</span>
      <div className="flex-grow-1">{message}</div>
      <button
        type="button"
        className="btn-close"
        onClick={onClose}
      ></button>
    </div>
  );
}
