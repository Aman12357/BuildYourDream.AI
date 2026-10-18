import { useState } from "react";
import StaffWorkspace from "./StaffWorkspace";
import { ArrowDown, ArrowRight, Check, Code2, Download, Layers3, Menu, Sparkles, WandSparkles, X } from "lucide-react";

const examples = [
  { title: "A portfolio that feels like you", category: "Portfolio", prompt: "Create a minimal portfolio for a product designer with a bold type-led hero, selected work, and a contact section." },
  { title: "A store made for the everyday", category: "Online store", prompt: "Create a warm, modern online store for handmade home goods with a product grid, story section, and clear shopping calls to action." },
  { title: "A launch page with momentum", category: "Startup", prompt: "Create a focused SaaS landing page with a clear value proposition, feature cards, product preview, and a waitlist form." },
];

type BuildPlan = { summary: string; steps: string[] };

function App() {
  const [prompt, setPrompt] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [plan, setPlan] = useState<BuildPlan | null>(null);
  const [isGeneratingProject, setIsGeneratingProject] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  async function startBuild(value = prompt) {
    const cleaned = value.trim();
    if (!cleaned) {
      setNotice("Describe the website you want to build first.");
      return;
    }
    setPrompt(cleaned);
    setNotice("");
    setPlan(null);
    setIsCheckingApi(true);
    const apiBase = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://buildyourdream-api.onrender.com" : "http://localhost:8787")).replace(/\/$/, "");
    try {
      const response = await fetch(`${apiBase}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleaned }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setNotice(result.error || "Could not prepare a plan. Check that the backend is running.");
      else if (result.plan && Array.isArray(result.plan.steps)) {
        setPlan(result.plan as BuildPlan);
        setNotice("Plan ready. Review the steps, then generate your full-stack project.");
      } else setNotice("The API responded, but did not return a valid plan.");
    } catch {
      setNotice("Cannot reach the API. Please check that the backend is running, then try again.");
    } finally {
      setIsCheckingApi(false);
    }
  }

  async function generateProject() {
    if (!plan || !prompt.trim()) return;
    setNotice("");
    setIsGeneratingProject(true);
    const apiBase = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://buildyourdream-api.onrender.com" : "http://localhost:8787")).replace(/\/$/, "");
    try {
      const response = await fetch(`${apiBase}/api/generate-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setNotice(result.error || "Project generation failed. Please try again.");
        return;
      }
      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "buildyourdream-full-stack-project.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      const count = response.headers.get("X-Generated-File-Count");
      setNotice(`Your full-stack project ZIP is ready${count ? ` with ${count} generated source files` : ""}. Unzip it, read README.md, configure the example environment variables, and test before publishing.`);
    } catch {
      setNotice("Cannot reach the API or download the project. Please try again.");
    } finally {
      setIsGeneratingProject(false);
    }
  }

  if (workspaceOpen) return <StaffWorkspace onBack={() => setWorkspaceOpen(false)} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="BuildYourDream.AI home">
          <span className="brand-mark"><Layers3 size={19} strokeWidth={2.2} /></span>
          <span>BuildYourDream<span className="brand-dot">.AI</span></span>
        </a>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#examples" onClick={() => setMenuOpen(false)}>Explore ideas</a>
          <a href="#builder" onClick={() => setMenuOpen(false)}>Builder</a>
          <button className="workspace-nav-link" onClick={() => { setMenuOpen(false); setWorkspaceOpen(true); }}>Team workspace <ArrowRight size={14}/></button>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </nav>
        <div className="topbar-actions">
          <button className="text-button" onClick={() => setWorkspaceOpen(true)}>Team login</button>
          <button className="button button-dark button-small" onClick={() => document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" })}>Start building <ArrowRight size={15} /></button>
        </div>
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </header>

      <main id="home">
        <section className="hero">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR IDEA, MEET YOUR WEBSITE <span className="eyebrow-line" /></div>
          <h1>Big ideas deserve<br /><span className="headline-accent">beautiful websites.</span></h1>
          <p className="hero-copy">Tell us what you have in mind. BuildYourDream.AI is being built to turn your words into a website you can shape, refine, and make your own.</p>
          <div className="builder-card" id="builder">
            <div className="builder-label"><WandSparkles size={16} /><span>What would you like to build?</span><span className="label-optional">START WITH AN IDEA</span></div>
            <textarea value={prompt} onChange={(event) => { setPrompt(event.target.value); setNotice(""); }} placeholder="A website for my coffee shop with a menu, our story, and a way to order online..." rows={3} maxLength={1200} aria-label="Describe the website you want to create" />
            <div className="builder-bottom">
              <span className="prompt-hint"><Sparkles size={14} /> Be as specific as you like</span>
              <button className="button button-dark" onClick={() => startBuild()} disabled={isCheckingApi}><WandSparkles size={16} /> {isCheckingApi ? "Preparing plan..." : "Create my build plan"} <ArrowRight size={16} /></button>
            </div>
            {notice && <p className="notice" role="status">{notice}</p>}
          </div>
          {plan && <section className="plan-panel" aria-label="Website build plan">
            <div className="plan-heading"><div><p className="section-kicker">YOUR BUILD PLAN</p><h2>Here's what I'll build.</h2></div><span className="plan-ready"><Check size={14} /> Plan ready</span></div>
            <p className="plan-summary">{plan.summary}</p>
            <ol className="plan-steps">{plan.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
            <div className="plan-footer"><p><strong>Project includes:</strong> frontend, backend API, PostgreSQL schema, environment example, and setup guide.</p><button className="button button-dark" onClick={generateProject} disabled={isGeneratingProject}>{isGeneratingProject ? "Generating project..." : "Generate full-stack project"} {isGeneratingProject ? <Sparkles size={16} /> : <Download size={16} />}</button></div>
            <p className="preview-safety-note">Generation requires a working Gemini or Groq API key on the backend. Review and test generated code before production use.</p>
          </section>}
          <div className="trust-note"><span className="trust-check"><Check size={13} /></span> Start with an idea. Make it yours. <span className="trust-separator">·</span> No coding experience required.</div>
          <a className="scroll-link" href="#examples">NEED A LITTLE INSPIRATION? <ArrowDown size={14} /></a>
        </section>

        <section className="examples-section" id="examples">
          <div className="section-heading">
            <div><p className="section-kicker">A GOOD PLACE TO BEGIN</p><h2>Your idea could look like this.</h2></div>
            <p className="section-description">Choose a starting point, then make it your own.</p>
          </div>
          <div className="example-grid">
            {examples.map((example, index) => (
              <article className={`example-card example-card-${index + 1}`} key={example.title}>
                <div className="preview-window">
                  <div className="preview-chrome"><span /><span /><span /><small>YOUR NEXT WEBSITE</small></div>
                  {index === 0 && <div className="preview-portfolio"><span>INDEPENDENT DESIGNER / 2026</span><strong>Thoughtful<br />by design<span>.</span></strong><div className="preview-shapes"><i /><i /><i /></div><small>SELECTED WORK ↗</small></div>}
                  {index === 1 && <div className="preview-store"><span>OBJECTS FOR SLOW LIVING</span><strong>Make room<br />for <em>good things.</em></strong><div className="store-products"><i /><i /><i /></div><small>SHOP THE COLLECTION ↗</small></div>}
                  {index === 2 && <div className="preview-startup"><span>LESS BUSY. MORE BUILDING.</span><strong>Your work,<br />in a better <em>flow.</em></strong><div className="startup-ui"><i /><i /><i /><i /></div><small>GET EARLY ACCESS ↗</small></div>}
                </div>
                <div className="example-meta"><div><span className="example-category">{example.category}</span><h3>{example.title}</h3></div><button className="icon-button" onClick={() => { setPrompt(example.prompt); setNotice(""); setPlan(null); document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" }); }} aria-label={`Use ${example.category} example`}><ArrowRight size={18} /></button></div>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-intro"><p className="section-kicker">FROM THOUGHT TO WEBSITE</p><h2>Start simple.<br />Go as far as you dream.</h2><p>We're building a clear path from your first sentence to a site you can actually use.</p></div>
          <div className="steps-list">
            <div className="step"><span className="step-number">01</span><div><h3>Describe your idea</h3><p>Tell us who the website is for, what it should do, and the feeling you're after.</p></div><Code2 size={21} /></div>
            <div className="step"><span className="step-number">02</span><div><h3>Shape the first draft</h3><p>The planned AI workflow will create a starting point you can review and customize.</p></div><WandSparkles size={21} /></div>
            <div className="step"><span className="step-number">03</span><div><h3>Make it yours</h3><p>Refine your pages, save your project, and prepare to publish when you're ready.</p></div><ArrowRight size={21} /></div>
          </div>
        </section>

        <section className="closing-cta">
          <div><p className="section-kicker">EVERY GREAT SITE STARTS SOMEWHERE</p><h2>Let's build what's next.</h2></div>
          <button className="button button-light" onClick={() => document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" })}>Bring your idea <ArrowRight size={16} /></button>
        </section>
      </main>

      <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Layers3 size={17} /></span><span>BuildYourDream<span className="brand-dot">.AI</span></span></a><span>Made for ideas that deserve to exist.</span><span>© 2026 BuildYourDream.AI</span></footer>
    </div>
  );
}

export default App;
