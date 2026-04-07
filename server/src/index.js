import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { body, validationResult } from "express-validator";
import { verifyFirebaseToken } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "512kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ecom-api" });
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

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
