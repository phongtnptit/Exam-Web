import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router/AppRouter";

export default function App() {
  useEffect(() => {
    const handleMouseMove = (e) => {
      const root = document.documentElement;
      root.style.setProperty("--mouse-x", `${e.clientX}px`);
      root.style.setProperty("--mouse-y", `${e.clientY}px`);

      // Hiệu ứng Spotlight & 3D Tilt nhẹ khi di chuột lên các thẻ Glass Card
      const card = e.target.closest(
        ".exam-card, .stat-box, .hero-feature-item, .intro-metric-item, .auth-card"
      );
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--card-x", `${x}px`);
        card.style.setProperty("--card-y", `${y}px`);

        // Tính góc nghiêng 3D nhẹ (tối đa ±4 độ cho exam-card / stat-box)
        if (!card.classList.contains("auth-card")) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -4;
          const rotateY = ((x - centerX) / centerX) * 4;
          card.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
          card.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Vầng sáng Aurora đi theo con trỏ chuột trên toàn trang */}
        <div className="cursor-spotlight" aria-hidden="true" />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
