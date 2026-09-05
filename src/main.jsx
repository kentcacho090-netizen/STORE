import "./categorySeed";
import "./catalogSeed";
import "./imageSeed";
import "./stockSeed";
import "./checkoutFix";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./CustomerApp";
import "./product-polish.css";
import "./customerOrders";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
