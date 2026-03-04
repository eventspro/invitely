// v3 — force bundle hash bust: remove old pink spinner
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error("[4ever.am] Root element missing");
}
