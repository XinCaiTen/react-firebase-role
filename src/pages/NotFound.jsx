// src/pages/NotFound.jsx
import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>404 - Không tìm thấy trang</h2>
      <Link to="/">Về trang chủ</Link>
    </div>
  );
}
