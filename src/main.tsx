import "./game/bootGuard"; // полифиллы matchMedia/scrollTo — выполняются до импорта App
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

try {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("В index.html отсутствует элемент #root");
  ReactDOM.createRoot(rootEl).render(<App />);
} catch (err) {
  // Страховка от «пустого экрана»: читаемое сообщение вместо чёрной пустоты.
  window.setTimeout(() => {
    void import("./game/bootGuard").then((m) =>
      m.showBootFallback(err instanceof Error ? err.message : String(err)),
    );
  }, 0);
  throw err;
}