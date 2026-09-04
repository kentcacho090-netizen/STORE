import React from "react";
import { createRoot } from "react-dom/client";
import StoreApp from "./StoreApp";
import "./styles.css";
import "./admin.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><StoreApp /></React.StrictMode>
);