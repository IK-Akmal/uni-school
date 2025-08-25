import React from "react";
import ReactDOM from "react-dom/client";
import Providers from "./app/providers";

import "@/shared/styles/global.css";
import { ErrorBoundary } from "./shared/ui/error-boundary";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Providers />
    </ErrorBoundary>
  </React.StrictMode>
);
