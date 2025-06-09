import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { DragDropContext } from "react-beautiful-dnd";

createRoot(document.getElementById("root")!).render(
  <App />
);
