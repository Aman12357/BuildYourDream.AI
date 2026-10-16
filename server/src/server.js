import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import archiver from "archiver";

const app = express();
app.set("trust proxy", 1);
const port = Number(process.env.PORT || 8787);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function makePlan(prompt) {
  const lower = prompt.toLowerCase();
  const items = ["Responsive frontend with the pages and components your idea needs"];
  if (/shop|store|ecommerce|e-commerce|product|cart|checkout/.test(lower)) items.push("Product catalogue, cart flow, and order-related API endpoints");
  if (/login|auth|account|member|user|dashboard|admin/.test(lower)) items.push("Authentication-ready backend routes and role-aware account screens");
  if (/book|appointment|reservation|schedule/.test(lower)) items.push("Booking forms, availability workflow, and booking data model");
  if (/blog|article|news|content/.test(lower)) items.push("Content listing/detail pages and content-management data model");
  if (/payment|subscription|billing|credit/.test(lower)) items.push("Payment integration placeholders with secrets kept server-side");
  items.push("Node.js API, PostgreSQL schema/migrations, setup instructions, and environment-variable examples");
  return { summary: "I'll turn your idea into a multi-file full-stack starter project, not a single fixed HTML template.", steps: [...new Set(items)].slice(0, 6) };
}

function providerConfig() {
  if (process.env.GEMINI_API_KEY) return {
    name: "Gemini",
    url: `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    headers: { "Content-Type": "application/json" },
    body: (prompt) => ({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
    extract: (data) => data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "",
  };
  return null;
}

async function askGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is not configured");
  const cfg = providerConfig();
  const response = await fetch(cfg.url, { method: "POST", headers: cfg.headers, body: JSON.stringify(cfg.body(prompt)), signal: AbortSignal.timeout(120000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Gemini request failed (${response.status}): ${data.error?.message || "provider error"}`);
  return cfg.extract(data);
}

async function askGroq(prompt) {
  if (!process.env.GROQ_API_KEY) throw new Error("Groq API key is not configured");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.GROQ_MODEL || "openai/gpt-oss-120b", temperature: 0.2, response_format: { type: "json_object" }, messages: [
      { role: "system", content: "You generate complete, secure, runnable full-stack website starter projects. Return only valid JSON." },
      { role: "user", content: prompt },
    ] }),
    signal: AbortSignal.timeout(120000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Groq request failed (${response.status}): ${data.error?.message || "provider error"}`);
  return data.choices?.[0]?.message?.content || "";
}

async function generateProject(prompt) {
  const instructions = `Create a runnable full-stack starter project based on this user's idea: ${JSON.stringify(prompt)}.
Return ONLY JSON shaped exactly as {"projectName":"short-kebab-case","summary":"one short sentence","files":[{"path":"relative/path","content":"complete file text"}]}.
Generate between 7 and 16 useful files, including:
- frontend/index.html and frontend/src/main.tsx or main.jsx, frontend/src/App.tsx or App.jsx, frontend/src/styles.css
- server/package.json and server/src/server.js (Node.js + Express REST API)
- database/schema.sql with PostgreSQL tables, foreign keys, constraints, and indexes appropriate to the idea
- .env.example with placeholders only (never secrets)
- README.md with install/run instructions and required environment variables
Use a coherent stack: React + Vite for frontend, Node.js + Express for backend, PostgreSQL for data. Make the UI responsive and polished, with real working frontend interactions and matching API endpoints. Server must validate inputs, use parameterized SQL with pg when database operations are implemented, use environment variables, and include CORS/security basics. Include package dependencies required by generated code. Do not claim services are configured if they need credentials. Do not put API keys in frontend files. Do not use TODO-only files or merely describe code: provide complete source code. Use safe placeholder configuration where a real provider key or database URL is required. Keep each path relative, do not include absolute paths, and do not include node_modules or generated build output.`;
  const failures = [];
  if (process.env.GEMINI_API_KEY) {
    try { return { raw: await askGemini(instructions), model: process.env.GEMINI_MODEL || "gemini-2.5-flash", provider: "Gemini" }; }
    catch (error) { failures.push(String(error.message || error)); console.error("Gemini generation failed:", error.message || error); }
  }
  if (process.env.GROQ_API_KEY) {
    try { return { raw: await askGroq(instructions), model: process.env.GROQ_MODEL || "openai/gpt-oss-120b", provider: "Groq" }; }
    catch (error) { failures.push(String(error.message || error)); console.error("Groq generation failed:", error.message || error); }
  }
  const error = new Error(failures.length ? "Both configured AI providers failed. Check Render logs and provider quota/model settings." : "AI generation is not configured yet. Add GEMINI_API_KEY and/or GROQ_API_KEY to the Render backend environment variables.");
  error.statusCode = 503;
  throw error;
}

function safeProjectName(value) {
  const cleaned = String(value || "buildyourdream-project").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return cleaned || "buildyourdream-project";
}

function validateFiles(payload) {
  if (!payload || !Array.isArray(payload.files) || payload.files.length < 1 || payload.files.length > 24) {
    throw new Error("The AI provider returned an invalid project structure. Please try again with a more specific prompt.");
  }
  const seen = new Set();
  const files = payload.files.map((file) => {
    if (!file || typeof file.path !== "string" || typeof file.content !== "string") throw new Error("The AI provider returned an invalid file.");
    const path = file.path.replace(/\\/g, "/").replace(/^\.\//, "");
    if (!path || path.startsWith("/") || path.split("/").some((part) => !part || part === "." || part === "..") || /^[a-z]:/i.test(path)) {
      throw new Error("The AI provider returned an unsafe file path.");
    }
    if (seen.has(path)) throw new Error("The AI provider returned duplicate file paths.");
    seen.add(path);
    if (file.content.length > 500000) throw new Error("A generated file exceeded the size limit.");
    return { path, content: file.content };
  });
  return files;
}

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: clientOrigin.split(",").map((value) => value.trim()), methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "32kb" }));
app.use("/api", rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/", (_req, res) => res.json({ name: "BuildYourDream.AI API", status: "ok", mode: "AI full-stack project generator" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "buildyourdream-api", geminiConfigured: Boolean(process.env.GEMINI_API_KEY), groqConfigured: Boolean(process.env.GROQ_API_KEY), timestamp: new Date().toISOString() }));

app.post("/api/plan", (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) return res.status(400).json({ error: "Please describe the website you want to build." });
  if (prompt.length > 4000) return res.status(413).json({ error: "Please keep the description under 4,000 characters." });
  return res.json({ plan: makePlan(prompt) });
});

app.post("/api/generate-project", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) return res.status(400).json({ error: "Please describe the website you want to build." });
  if (prompt.length > 4000) return res.status(413).json({ error: "Please keep the description under 4,000 characters." });
  try {
    const generated = await generateProject(prompt);
    let parsed;
    try {
      const cleaned = generated.raw.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("The AI provider returned invalid JSON. Please try again.");
    }
    const files = validateFiles(parsed);
    const projectName = safeProjectName(parsed.projectName);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${projectName}.zip"`);
    res.setHeader("X-Generated-File-Count", String(files.length));
    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (error) => { console.error("Project ZIP error:", error); if (!res.headersSent) res.status(500).end(); else res.destroy(error); });
    archive.pipe(res);
    archive.append(`# ${projectName}\n\n${parsed.summary || "Generated with BuildYourDream.AI"}\n\nAI provider: ${generated.provider} (${generated.model})\n\nGenerated source code must be reviewed and tested before production use.\n`, { name: `${projectName}/GENERATION-NOTES.md` });
    for (const file of files) archive.append(file.content, { name: `${projectName}/${file.path}` });
    await archive.finalize();
  } catch (error) {
    console.error("Project generation failed:", error.message || error);
    res.status(error.statusCode || 502).json({ error: error.message || "Project generation failed. Please try again." });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ error: "Request body must contain valid JSON." });
  console.error("Unhandled API error:", err);
  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(port, () => console.log(`BuildYourDream.AI API listening on port ${port}`));
