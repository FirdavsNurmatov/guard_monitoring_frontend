import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./i18n/config.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { client } from "./config/query-client.js";

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={client}>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" reverseOrder={false} />
    </BrowserRouter>
  </QueryClientProvider>,
);
