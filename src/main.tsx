import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

import init from "p5.js-svg";
import p5 from "p5";
import { HelmetProvider } from "react-helmet-async";

init(p5);

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </HelmetProvider>
);
