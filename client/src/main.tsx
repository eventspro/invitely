// v2 — force bundle hash bust (hash collision fix)
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
