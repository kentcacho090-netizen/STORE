import React from "react";
import { createRoot } from "react-dom/client";
import CachoStore from "./CachoStore";
import "./styles.css";
import "./admin.css";
import "./excel.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><CachoStore /></React.StrictMode>
);
