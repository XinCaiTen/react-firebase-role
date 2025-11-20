import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectWithName = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Chuyển hướng sau 2 giây
    setTimeout(() => {
      window.location.href = "https://thehoang21.github.io/ntp-luong/";
      // hoặc dùng navigate nếu là route nội bộ
      // navigate("https://thehoang21.github.io/ntp-luong/", { replace: true });
    }, 2000);
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Đang chuyển đến trang: <b>NTP Lương</b></h2>
      <p>Vui lòng chờ giây lát...</p>
    </div>
  );
};

// Sử dụng trong Route
<Route path="/" element={<RedirectWithName />} />
