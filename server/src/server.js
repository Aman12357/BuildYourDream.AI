import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
// Render runs this service behind one trusted reverse-proxy hop.
app.set("trust proxy", 1);
const port = Number(process.env.PORT || 8787);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
// Free mode: website drafts are generated locally from templates, with no paid AI API.
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function makeFreeWebsite(prompt) {
  const safePrompt = escapeHtml(prompt);
  const title = escapeHtml(
    prompt.replace(/^(create|build|make|design)\s+(a|an|the)?\s*/i, "").split(/[.!?\n]/)[0].trim().slice(0, 72) || "Your next big idea"
  );
  const lower = prompt.toLowerCase();
  const isPortfolio = /portfolio|designer|developer|photographer|artist/.test(lower);
  const isCafe = /cafe|coffee|restaurant|bakery|food|menu/.test(lower);
  const isStore = /store|shop|product|ecommerce|e-commerce/.test(lower);
  const accent = isCafe ? "#b65b35" : isStore ? "#34745a" : isPortfolio ? "#6558c8" : "#2463eb";
  const sectionTitle = isCafe ? "Made fresh, served with care." : isStore ? "Good things, thoughtfully made." : isPortfolio ? "A little about the work." : "A better way to bring your idea to life.";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>
:root{color-scheme:light;--accent:${accent};--ink:#17211c;--muted:#68736e;--paper:#f8f8f4}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
header{max-width:1120px;margin:auto;padding:24px 6%;display:flex;justify-content:space-between;align-items:center;gap:20px}header strong{font-size:1.1rem;letter-spacing:-.04em}nav{display:flex;gap:24px}a{color:inherit;text-decoration:none;font-size:.92rem}.hero{max-width:1120px;margin:54px auto 90px;padding:60px 6%;display:grid;grid-template-columns:1.2fr .8fr;gap:48px;align-items:center}
.kicker{text-transform:uppercase;letter-spacing:.16em;font-size:.72rem;font-weight:750;color:var(--accent)}h1{font-size:clamp(2.8rem,7vw,5.6rem);line-height:.98;letter-spacing:-.075em;margin:18px 0 24px;max-width:780px}p{color:var(--muted)}.hero p{max-width:560px;font-size:1.1rem}.cta{display:inline-block;background:var(--accent);color:white;padding:13px 20px;border-radius:7px;margin-top:14px;font-weight:650}
.art{min-height:300px;border-radius:24px;background:linear-gradient(140deg,color-mix(in srgb,var(--accent) 85%,white),#f1d7a8);display:flex;align-items:center;justify-content:center;padding:28px;overflow:hidden}.art-card{width:100%;min-height:220px;border-radius:16px;background:#fffdf8;box-shadow:0 20px 60px #17211c20;padding:26px;transform:rotate(3deg)}.art-card span{display:block;width:65%;height:10px;border-radius:9px;background:#d8dcd4;margin:14px 0}.art-card span:first-child{width:40%;background:var(--accent);height:7px}.art-card span:last-child{width:50%}
section.content{padding:75px 6%;background:white}.inner{max-width:1000px;margin:auto}.inner h2{font-size:clamp(2rem,4vw,3.2rem);line-height:1.05;letter-spacing:-.055em;max-width:650px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:35px}.card{padding:25px;border:1px solid #e5e9e4;border-radius:13px;background:#fff}.card b{font-size:1.1rem}.card p{font-size:.95rem}footer{max-width:1120px;margin:auto;padding:28px 6%;display:flex;justify-content:space-between;gap:16px;font-size:.86rem;color:var(--muted)}
@media(max-width:700px){nav{display:none}.hero{grid-template-columns:1fr;margin:10px auto 50px;padding-top:40px}.art{min-height:220px}.cards{grid-template-columns:1fr}section.content{padding:55px 6%}footer{flex-direction:column}}
</style></head><body>
<header><strong>${title}</strong><nav><a href="#about">About</a><a href="#features">What we do</a><a href="#contact">Contact</a></nav></header>
<main><section class="hero"><div><div class="kicker">A fresh start</div><h1>${title}</h1><p>${safePrompt}</p><a class="cta" href="#contact">Let's get started ↗</a></div><div class="art" aria-hidden="true"><div class="art-card"><span></span><h2 style="font-size:clamp(1.6rem,3vw,2.4rem);line-height:1.1;letter-spacing:-.05em">${sectionTitle}</h2><span></span><span></span><span></span></div></div></section>
<section class="content" id="about"><div class="inner"><div class="kicker">Thoughtfully made</div><h2>${sectionTitle}</h2><p>Built around your idea, with a clear message and a simple experience for every visitor.</p><div class="cards" id="features"><article class="card"><b>Clear by design</b><p>A focused layout that helps people understand what matters.</p></article><article class="card"><b>Made for everyone</b><p>Responsive styling designed to work on mobile, tablet, and desktop.</p></article><article class="card"><b>Ready to grow</b><p>A flexible starting point you can customize as your idea evolves.</p></article></div></div></section>
<section class="content" id="contact" style="background:var(--paper)"><div class="inner"><div class="kicker">Your next step</div><h2>Have an idea? Let's make it real.</h2><p>This is a free starter template. Customize the copy, links, and sections to fit your project.</p><a class="cta" href="mailto:hello@example.com">Get in touch ↗</a></div></section></main>
<footer><strong>${title}</strong><span>Free website starter · Customize before publishing</span><span>© 2026</span></footer></body></html>`;
}

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: clientOrigin.split(",").map((value) => value.trim()), methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "32kb" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/", (_req, res) => {
  res.json({ name: "BuildYourDream.AI API", status: "ok", generationConfigured: true });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "buildyourdream-api",
    generationConfigured: true,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/generate", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    return res.status(400).json({ error: "Please provide a website description in the prompt field." });
  }
  if (prompt.length > 1200) {
    return res.status(413).json({ error: "Prompt must be 1,200 characters or fewer." });
  }

  // No API key, external AI call, or paid usage is required in free mode.
  const html = makeFreeWebsite(prompt);
  return res.json({
    html,
    model: "free-template-builder",
    message: "Your free website starter is ready. This version uses templates, not a paid AI model.",
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
  console.log(`BuildYourDream.AI API listening on port ${port}`);
});
