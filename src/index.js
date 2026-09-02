import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./styles/colors.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { startMockApi } from "./mocks/browser";

async function boot() {
  await startMockApi();
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

boot();

reportWebVitals();
