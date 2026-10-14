import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// A file dropped outside a drop zone would make Electron navigate to it and replace the app.
window.addEventListener("dragover", (event) => {
  if (event.defaultPrevented) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "none";
});
window.addEventListener("drop", (event) => event.preventDefault());

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
