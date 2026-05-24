"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./utils/env");
// server.ts only starts the HTTP server.
// Keeping startup separate from app.ts makes the Express app easier to test.
app_1.default.listen(env_1.env.port, () => {
    console.log(`API server is running on port ${env_1.env.port}`);
});
//# sourceMappingURL=server.js.map