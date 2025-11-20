import React, { useEffect, useState } from "react";

const messages = [
  "Chúc bạn Giáng Sinh an lành!",
  "Merry Christmas và năm mới hạnh phúc!",
  "Giáng Sinh vui vẻ bên người thân yêu!",
  "Chúc bạn mùa lễ hội tràn đầy yêu thương!",
  "An lành, hạnh phúc và thành công!",
  "Giáng Sinh ấm áp, ngập tràn niềm vui!",
  "Chúc bạn một mùa Noel tuyệt vời!",
  "Merry Christmas & Happy Holidays!",
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Component tuyết rơi
const Snowflake = ({ id }) => {
  const [position, setPosition] = useState({
    x: randomBetween(0, 100),
    y: randomBetween(-10, 0),
    opacity: randomBetween(0.5, 1),
    size: randomBetween(8, 20),
    speed: randomBetween(1, 3),
    swing: randomBetween(-20, 20),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => ({
        ...prev,
        y: prev.y + prev.speed,
        x: prev.x + Math.sin(prev.y * 0.05) * 0.5,
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (position.y > 100) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}%`,
        top: `${position.y}%`,
        fontSize: `${position.size}px`,
        opacity: position.opacity,
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      ❄️
    </div>
  );
};

// Component cây thông chuyển động
const ChristmasTree = ({ style }) => {
  const [rotate, setRotate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotate((prev) => (prev + 0.5) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        ...style,
        fontSize: 80,
        transform: `rotate(${rotate * 0.3}deg) scale(1.1)`,
        transition: "transform 0.05s linear",
        filter: "drop-shadow(0 0 10px rgba(34, 139, 34, 0.6))",
      }}
    >
      🎄
    </div>
  );
};

// Component hoa chuyển động
const Flower = ({ style }) => {
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBounce((prev) => (prev + 0.1) % (Math.PI * 2));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        ...style,
        fontSize: 60,
        transform: `translateY(${Math.sin(bounce) * 15}px) scale(1.1)`,
        transition: "transform 0.05s ease-in-out",
        filter: "drop-shadow(0 0 8px rgba(255, 105, 180, 0.7))",
      }}
    >
      🌹
    </div>
  );
};

export default function christmasMain() {
  const [items, setItems] = useState([]);
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    // Khởi tạo vị trí, góc xoay và tốc độ ngẫu nhiên cho từng câu chúc
    const initialItems = messages.map((msg, index) => ({
      id: index,
      text: msg,
      x: randomBetween(0, 90),
      y: randomBetween(0, 80),
      rotate: randomBetween(-15, 15),
      scale: randomBetween(0.8, 1.2),
      dx: randomBetween(-0.3, 0.3),
      dy: randomBetween(-0.3, 0.3),
      dRotate: randomBetween(-0.3, 0.3),
    }));
    setItems(initialItems);

    // Khởi tạo tuyết
    setSnowflakes(Array.from({ length: 30 }, (_, i) => i));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((oldItems) =>
        oldItems.map((item) => {
          let newX = item.x + item.dx;
          let newY = item.y + item.dy;
          let newRotate = item.rotate + item.dRotate;

          if (newX < 0 || newX > 90) item.dx = -item.dx;
          if (newY < 0 || newY > 80) item.dy = -item.dy;

          if (newRotate < -30 || newRotate > 30) item.dRotate = -item.dRotate;

          return {
            ...item,
            x: newX,
            y: newY,
            rotate: newRotate,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        background:
          "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)",
        overflow: "hidden",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#fff",
        padding: 24,
      }}
    >
      {/* Tuyết rơi */}
      {snowflakes.map((id) => (
        <Snowflake key={id} id={id} />
      ))}

      {/* Cây thông góc trái */}
      <ChristmasTree
        style={{
          position: "absolute",
          left: 20,
          top: 100,
          zIndex: 5,
        }}
      />

      {/* Cây thông góc phải */}
      <ChristmasTree
        style={{
          position: "absolute",
          right: 20,
          top: 100,
          zIndex: 5,
        }}
      />

      {/* Hoa góc trái dưới */}
      <Flower
        style={{
          position: "absolute",
          left: 30,
          bottom: 100,
          zIndex: 5,
        }}
      />

      {/* Hoa góc phải dưới */}
      <Flower
        style={{
          position: "absolute",
          right: 30,
          bottom: 100,
          zIndex: 5,
        }}
      />

      <h1
        style={{
          textAlign: "center",
          marginBottom: 40,
          textShadow: "2px 2px 8px #a83232",
          fontSize: 48,
          zIndex: 10,
          position: "relative",
        }}
      >
        🎄 Mừng Giáng Sinh an lành 🎅
      </h1>

      {items.map(({ id, text, x, y, rotate, scale }) => (
        <div
          key={id}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            transform: `rotate(${rotate}deg) scale(${scale})`,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            padding: "10px 18px",
            borderRadius: 12,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            fontWeight: "600",
            cursor: "default",
            userSelect: "none",
            whiteSpace: "nowrap",
            transition: "background-color 0.3s ease",
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
            e.currentTarget.style.transform = `rotate(${rotate}deg) scale(${scale * 1.2})`;
            e.currentTarget.style.zIndex = "10";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.transform = `rotate(${rotate}deg) scale(${scale})`;
            e.currentTarget.style.zIndex = "2";
          }}
        >
          {text}
        </div>
      ))}

      <footer
        style={{
          position: "absolute",
          bottom: 12,
          width: "100%",
          textAlign: "center",
          fontSize: 14,
          color: "rgba(255,255,255,0.7)",
          fontStyle: "italic",
          zIndex: 10,
        }}
      >
        Chúc bạn một mùa Giáng Sinh an lành và tràn đầy niềm vui!
      </footer>
    </div>
  );
}