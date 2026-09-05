import "./categorySeed";
import "./catalogSeed";
import "./imageSeed";
import "./stockSeed";
import "./checkoutFix";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./CustomerD1";
import "./product-polish.css";
import "./customerOrders.css";
import "./customerOrders";
import "./customer-final.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
