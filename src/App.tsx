import { useState } from "react";
import { ArrowDown, ArrowRight, Check, Code2, Layers3, Menu, Sparkles, WandSparkles, X } from "lucide-react";

const examples = [
  { title: "A portfolio that feels like you", category: "Portfolio", prompt: "Create a minimal portfolio for a product designer with a bold type-led hero, selected work, and a contact section." },
  { title: "A store made for the everyday", category: "Online store", prompt: "Create a warm, modern online store for handmade home goods with a product grid, story section, and clear shopping calls to action." },
  { title: "A launch page with momentum", category: "Startup", prompt: "Create a focused SaaS landing page with a clear value proposition, feature cards, product preview, and a waitlist form." },
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  async function startBuild(value = prompt) {
    const cleaned = value.trim();
    if (!cleaned) {
      setNotice("Describe the website you want to build first.");
      return;
    }
    setPrompt(cleaned);
    setNotice("");
    setIsCheckingApi(true);
    const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");
    try {
      const response = await fetch(`${apiBase}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleaned }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 501 && result.code === "GENERATION_NOT_CONFIGURED") {
        setNotice("The API connection is working, but AI website generation is not configured yet. Next we need to connect an AI provider and a safe preview sandbox.");
      } else if (!response.ok) {
        setNotice(result.error || "The API returned an error. Check that the backend is running.");
      } else {
        setNotice("The API accepted the request.");
      }
    } catch {
      setNotice("Cannot reach the API. Start the backend in the server folder with npm install and npm run dev, then try again.");
    } finally {
      setIsCheckingApi(false);
    }
  }

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
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </nav>
        <div className="topbar-actions">
          <button className="text-button" onClick={() => setNotice("Authentication will be added in Phase 2.")}>Log in</button>
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
              <button className="button button-dark" onClick={() => startBuild()} disabled={isCheckingApi}><WandSparkles size={16} /> {isCheckingApi ? "Checking API..." : "Build my website"} <ArrowRight size={16} /></button>
            </div>
            {notice && <p className="notice" role="status">{notice}</p>}
          </div>
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
                <div className="example-meta"><div><span className="example-category">{example.category}</span><h3>{example.title}</h3></div><button className="icon-button" onClick={() => { setPrompt(example.prompt); setNotice(""); document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" }); }} aria-label={`Use ${example.category} example`}><ArrowRight size={18} /></button></div>
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
