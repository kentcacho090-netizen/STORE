import "./categorySeed";
import "./catalogSeed";
import "./imageSeed";
import "./stockSeed";
import "./remoteCatalog";
import React from "react";
import { createRoot } from "react-dom/client";
import CachoStore from "./CachoStore";
import "./styles.css";
import "./hero.css";
import "./mobile.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><CachoStore /></React.StrictMode>
);
