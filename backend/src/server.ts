import app from "./app";
import { env } from "./utils/env";

// server.ts only starts the HTTP server.
// Keeping startup separate from app.ts makes the Express app easier to test.
app.listen(env.port, () => {
  console.log(`API server is running on port ${env.port}`);
});
