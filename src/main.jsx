import "./categorySeed";
import "./catalogSeed";
import "./imageSeed";
import "./stockSeed";
import "./checkoutFix";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./AppClean";
import "./product-polish.css";
import "./orderBridge";
import "./orderBridge.css";
import "./storeTools";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
