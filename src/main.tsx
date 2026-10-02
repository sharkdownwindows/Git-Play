import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { bootstrap } from "./app/bootstrap";
import "./app/layout.css";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Bootstrap chạy song song với render — tiến độ nạp xong thì store phát sự kiện.
void bootstrap();
