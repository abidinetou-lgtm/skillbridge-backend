import cors = require("cors");
import express = require("express");
import helmet from "helmet";
import { errorMiddleware } from "./middleware/errorMiddleware";
import routes from "./routes";
import { env } from "./utils/env";

const app = express();

app.use(helmet());

// CORS controls which frontend applications are allowed to call this API.
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);

// express.json() allows Express to read JSON request bodies from clients.
app.use(express.json());

// Keep route registration in one place so new feature routes are easy to add.
app.use(routes);

// Error middleware must be registered after routes so it can catch route errors.
app.use(errorMiddleware);

export default app;
