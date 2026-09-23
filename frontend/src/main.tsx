import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CoupleProvider } from "./context/CoupleContext";
import "./styles/theme.css";
import "./styles/index.css";

document.documentElement.setAttribute("data-theme", "minimal");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CoupleProvider>
          <App />
        </CoupleProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
