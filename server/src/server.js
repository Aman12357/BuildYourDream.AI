import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const port = Number(process.env.PORT || 8787);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: clientOrigin, methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "32kb" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/", (_req, res) => {
  res.json({
    name: "BuildYourDream.AI API",
    status: "ok",
    message: "API server is running. Website generation is not connected yet.",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "buildyourdream-api", timestamp: new Date().toISOString() });
});

app.post("/api/generate", (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    return res.status(400).json({ error: "Please provide a website description in the prompt field." });
  }
  if (prompt.length > 1200) {
    return res.status(413).json({ error: "Prompt must be 1,200 characters or fewer." });
  }

  // This endpoint deliberately does not pretend to generate a website.
  // The provider adapter, credit checks, authentication, and sandbox will be added
  // before real generation is enabled.
  return res.status(501).json({
    error: "Website generation is not configured yet.",
    code: "GENERATION_NOT_CONFIGURED",
    nextStep: "Connect an AI provider and a restricted preview sandbox before enabling generation.",
  });
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Request body must contain valid JSON." });
  }
  console.error("Unhandled API error:", err);
  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`BuildYourDream.AI API listening on http://localhost:${port}`);
});
