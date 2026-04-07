import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { body, validationResult } from "express-validator";
import { verifyFirebaseToken } from "./middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
let apiVersion = "0.0.0";
try {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, "../package.json"), "utf8")
  );
  apiVersion = typeof pkg.version === "string" ? pkg.version : apiVersion;
} catch {
  /* ignore */
}

const app = express();
const PORT = process.env.PORT ?? 4000;

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
const defaultOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
];
const envOrigins = (process.env.CORS_ORIGIN?.split(",") ?? [])
  .map((s) => s.trim())
  .filter(Boolean);
const corsOrigins = [...new Set([...defaultOrigins, ...envOrigins])];
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "512kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ecom-api", version: apiVersion });
});

/** Protected example: requires Authorization: Bearer <Firebase ID token> */
app.get("/api/me", verifyFirebaseToken, (req, res) => {
  res.json({ uid: req.user.uid, email: req.user.email ?? null });
});

app.post(
  "/api/orders/preview",
  verifyFirebaseToken,
  body("items").isArray({ min: 1 }),
  body("items.*.productId").isString().notEmpty(),
  body("items.*.qty").isInt({ min: 1, max: 99 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return res.json({ ok: true, received: req.body.items.length });
  }
);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on port ${PORT}`);
});
