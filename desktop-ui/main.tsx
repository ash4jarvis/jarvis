import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import DesktopApp from "./App";
import "../src/Chat.css";
import "./desktop.css";

createRoot(document.getElementById("root")!).render(<BrowserRouter><DesktopApp/></BrowserRouter>);
