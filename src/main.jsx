import "./categorySeed";
import "./catalogSeed";
import "./imageSeed";
import "./stockSeed";
import "./cartCategories";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./hero.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
