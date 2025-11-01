import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set default title
document.title = "AI Telegram Moderator";

createRoot(document.getElementById("root")!).render(<App />);
