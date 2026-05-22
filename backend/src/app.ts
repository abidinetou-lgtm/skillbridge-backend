import cors = require("cors");
import express = require("express");
import { errorMiddleware } from "./middleware/errorMiddleware";
import routes from "./routes";

const app = express();

// Allow the React frontend running on Vite to call the backend API.
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

// Allows Express to read JSON request bodies.
app.use(express.json());

// Centralized API routes.
app.use(routes);

// Global error handler.
app.use(errorMiddleware);

export default app;