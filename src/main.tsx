
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { register } from "./registerSW";

  // Registrar Service Worker para PWA
  register();

  createRoot(document.getElementById("root")!).render(<App />);
  