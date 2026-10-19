import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, Bot, Check, ChevronDown, CircleAlert,
  CircleCheck, Clock3, Code2, Command, Download, Eye, FileCode2, FolderKanban,
  GitBranch, Layers3, LayoutDashboard, LayoutTemplate, Menu, MessageSquareText, Maximize2, Minimize2, Monitor, Search,
  Play, Plus, RefreshCw, ShieldCheck, Smartphone, Sparkles, Terminal, WandSparkles, X
} from "lucide-react";

type BuildPlan = { summary: string; steps: string[] };
type View = "home" | "studio" | "templates" | "agents" | "projects";
type AgentState = "Ready" | "Waiting" | "Complete" | "Working";
const examples = [
  { title: "Independent designer portfolio", category: "Portfolio", prompt: "Build a polished portfolio for an independent product designer. Include a bold editorial hero, selected projects, about section, testimonials, and a contact form. Use responsive layouts and accessible components." },
  { title: "A warm home-goods store", category: "E-commerce", prompt: "Create a modern e-commerce storefront for handmade home goods with product cards, category filters, product details, cart flow, brand story, and responsive mobile navigation." },
  { title: "SaaS launch website", category: "Startup", prompt: "Build a conversion-focused SaaS landing page with clear positioning, features, pricing, testimonials, FAQ, and a waitlist form. Use a clean visual system and mobile-first responsive design." },
];

type WebsiteTemplate = { id: string; title: string; category: string; layout: string; style: string; prompt: string; categoryIndex: number; styleIndex: number };
const templateCategories = [
  "Business & Corporate", "Portfolio & Resume", "E-commerce & Retail", "SaaS & Technology", "Restaurant & Food",
  "Real Estate", "Education & Courses", "Health & Wellness", "Beauty & Salon", "Travel & Hospitality",
  "Finance & Consulting", "Agency & Creative", "Blog & Magazine", "Events & Weddings", "Nonprofit & Charity",
  "Fitness & Sports", "Entertainment & Media", "Legal Services", "Construction & Architecture", "Automotive",
  "Pets & Veterinary", "Photography", "Landing Pages", "Community & Membership", "Personal Brand",
];
const templateLayouts = [
  "Editorial hero", "Split-screen landing", "Minimal grid", "Bold typography", "Product showcase",
  "Story-led scroll", "Dashboard-inspired", "Gallery-first", "Conversion-focused", "Classic multi-page",
];
const templateStyles = [
  "Modern minimal", "Warm organic", "Premium dark", "Playful colorful", "Editorial luxury",
  "Clean corporate", "Neo-brutalist", "Soft gradient",
];
const templateCatalog: WebsiteTemplate[] = templateCategories.flatMap((category, categoryIndex) =>
  templateLayouts.flatMap((layout, layoutIndex) =>
    templateStyles.map((style, styleIndex) => {
      const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const title = category.split(" & ")[0] + " " + layout.toLowerCase() + " " + (styleIndex + 1);
      return {
        id: categorySlug + "-" + (layoutIndex + 1) + "-" + (styleIndex + 1),
        title, category, layout, style, categoryIndex, styleIndex,
        prompt: "Create a complete, responsive website using this selected template direction. Category: " + category +
          ". Layout: " + layout + ". Visual style: " + style +
          ". Include realistic sample content, a clear navigation, a polished hero, category-appropriate sections, strong typography, accessible contrast, responsive mobile layout, and working visible interactions where appropriate. Avoid placeholder lorem ipsum and fake metrics. Make the result visually distinct and ready for customization."
      };
    })
  )
);

const agents = [
  { id: "planner", name: "Planner", role: "Scope & architecture", icon: GitBranch, color: "mint" },
  { id: "designer", name: "Designer", role: "UX & design system", icon: Layers3, color: "amber" },
  { id: "developer", name: "Developer", role: "Frontend & API code", icon: Code2, color: "blue" },
  { id: "qa", name: "QA engineer", role: "Checks & fixes", icon: ShieldCheck, color: "violet" },
  { id: "release", name: "Release agent", role: "Package & delivery", icon: Download, color: "slate" },
];

function App() {
  const [view, setView] = useState<View>("home");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("All templates");
  const [templatePage, setTemplatePage] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<BuildPlan | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [workflowComplete, setWorkflowComplete] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncFullscreenState = () => setIsPreviewFullscreen(document.fullscreenElement === previewFrameRef.current);
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  async function togglePreviewFullscreen() {
    try {
      if (document.fullscreenElement === previewFrameRef.current) {
        await document.exitFullscreen();
      } else if (previewFrameRef.current?.requestFullscreen) {
        await previewFrameRef.current.requestFullscreen();
      } else {
        setNotice("Fullscreen mode is not supported by this browser.");
      }
    } catch {
      setNotice("Could not open fullscreen mode. Use your browser controls or press Esc to exit.");
    }
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("New website");
  const [activity, setActivity] = useState<string[]>(["Workspace ready. Describe a website to start.", "Connected to the configured project API when a build is requested."]);
  const apiBase = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://buildyourdream-api.onrender.com" : "http://localhost:8787")).replace(/\/$/, "");
  const agentStates = useMemo(() => {
    const states: Record<string, AgentState> = { planner: plan ? "Complete" : "Ready", designer: workflowComplete ? "Complete" : plan ? "Waiting" : "Ready", developer: workflowComplete ? "Complete" : plan ? "Waiting" : "Ready", qa: workflowComplete ? "Complete" : plan ? "Waiting" : "Ready", release: workflowComplete ? "Complete" : plan ? "Waiting" : "Ready" };
    return states;
  }, [plan, workflowComplete]);

  function log(message: string) {
    setActivity(current => [message, ...current].slice(0, 7));
  }

  async function startBuild(value = prompt) {
    const cleaned = value.trim();
    if (!cleaned) { setNotice("Add a short description of your website first."); return; }
    setPrompt(cleaned); setSelectedProject(cleaned.length > 34 ? cleaned.slice(0, 34).trim() + "…" : cleaned);
    setNotice(""); setPlan(null); setPreviewHtml(""); setWorkflowComplete(false); setBusy(true); setView("studio");
    log("Planner received a new brief.");
    try {
      const response = await fetch(`${apiBase}/api/plan`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: cleaned }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.error || "The planning API could not prepare a plan.";
        setNotice(message); log("Planner request failed: " + message);
      } else if (result.plan && Array.isArray(result.plan.steps)) {
        setPlan(result.plan as BuildPlan); setNotice("Plan returned by the backend. Generate a preview to see your website.");
        log("Planning API returned " + result.plan.steps.length + " steps.");
        log("Plan ready for your review.");
      } else {
        setNotice("The API responded without a valid plan."); log("Planner response did not match the expected format.");
      }
    } catch {
      setNotice("Could not reach the backend. Check the API deployment and try again.");
      log("Backend connection failed. No agent run was completed.");
    } finally { setBusy(false); }
  }

  async function generateProject() {
    if (!plan || !prompt.trim()) return;
    setNotice(""); setGenerating(true); setWorkflowComplete(false); setPreviewHtml(""); setView("studio");
    log("Generating website source and requesting an isolated HTML preview from the backend.");
    try {
      const response = await fetch(`${apiBase}/api/preview-project`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.error || "Website preview generation failed.";
        setNotice(message); log("Preview generation failed: " + message); return;
      }
      if (typeof result.previewHtml !== "string" || !result.previewHtml.trim()) {
        setNotice("The AI response did not contain a usable website preview. Try a more specific prompt.");
        log("Preview endpoint returned no HTML."); return;
      }
      setPreviewHtml(result.previewHtml);
      setWorkflowComplete(true);
      setNotice("Your generated website preview is ready. Try the desktop and mobile views.");
      log("Live HTML preview received from the backend. No download was started.");
    } catch {
      setNotice("Could not reach the backend to generate the preview. Please try again.");
      log("Preview request could not be completed.");
    } finally { setGenerating(false); }
  }

  const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "home", label: "Home", icon: LayoutDashboard },
    { id: "studio", label: "Website studio", icon: Monitor },
    { id: "templates", label: "Template library", icon: LayoutTemplate },
    { id: "agents", label: "Agent command", icon: Activity },
    { id: "projects", label: "Projects", icon: FolderKanban },
  ];

  return <div className="hybrid-app">
    <aside className={menuOpen ? "hybrid-sidebar sidebar-open" : "hybrid-sidebar"}>
      <a className="hybrid-brand" href="#home" onClick={() => setView("home")}><span className="hybrid-brand-mark"><Layers3 size={19}/></span><span>BuildYourDream<span>.AI</span><small>AI WEBSITE WORKSPACE</small></span></a>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="hybrid-nav" aria-label="Workspace navigation">
        {navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "hybrid-nav-item active" : "hybrid-nav-item"} onClick={() => { setView(item.id); setMenuOpen(false); }}><Icon size={17}/><span>{item.label}</span>{item.id === "agents" && plan && <i className="nav-count">1</i>}</button>; })}
      </nav>
      <div className="sidebar-section-label sidebar-project-label">CURRENT PROJECT</div>
      <button className="current-project" onClick={() => setView("studio")}><span className="project-thumb"><Monitor size={16}/></span><span><strong>{selectedProject}</strong><small>{plan ? "Plan ready for review" : "Start with a brief"}</small></span><ChevronDown size={14}/></button>
      <div className="sidebar-bottom">
        <div className="connection-card"><span className="connection-dot"/><div><strong>API integration</strong><small>Configured endpoint</small></div><span className="connection-state">Ready</span></div>
        <div className="profile-row"><span className="profile-avatar">BY</span><span><strong>Workspace owner</strong><small>Prototype mode</small></span><button aria-label="Workspace options"><ChevronDown size={15}/></button></div>
      </div>
    </aside>

    <main className="hybrid-main">
      <header className="hybrid-topbar">
        <button className="sidebar-toggle" aria-label="Toggle sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button>
        <div className="breadcrumb"><span>Workspace</span><ArrowRight size={13}/><strong>{navItems.find(n => n.id === view)?.label}</strong></div>
        <div className="topbar-right"><span className="prototype-chip"><span/> Frontend prototype</span><button className="help-button" onClick={() => { setNotice("This prototype calls /api/plan and /api/preview-project. The generated HTML is displayed in a sandboxed iframe; agent cards are workflow visibility, not separate autonomous services."); setView("studio"); }}>How it works</button><span className="top-avatar">A</span></div>
      </header>

      {view === "home" && <div className="wix-home">
        <section className="wix-welcome-row">
          <div><div className="wix-kicker"><Sparkles size={14}/> YOUR WEBSITE WORKSPACE</div><h1>Good morning, welcome to your dashboard</h1><p>Everything you need to plan, build, and manage your website in one place.</p></div>
          <button className="wix-primary" onClick={() => { setView("studio"); setNotice(""); document.getElementById("website-prompt")?.focus(); }}><Plus size={16}/> Create a website</button>
        </section>

        <section className="wix-ask-card">
          <div className="wix-ask-heading"><div className="wix-aria-icon"><Sparkles size={20}/></div><div><h2>What would you like to build today?</h2><p>Describe your idea and let your AI website assistant help you get started.</p></div></div>
          <textarea aria-label="Describe your website idea" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="For example: Create a modern website for my business with services, customer reviews, and a contact form…" rows={3} maxLength={1200}/>
          <div className="wix-ask-footer"><span><ShieldCheck size={14}/> You can review your plan before generating a preview.</span><button className="wix-primary" disabled={busy} onClick={() => startBuild()}>{busy ? <><RefreshCw size={15} className="spin"/> Preparing…</> : <>Start with AI <ArrowRight size={15}/></>}</button></div>
          {notice && <div className="wix-inline-notice" role="status"><CircleAlert size={15}/>{notice}</div>}
        </section>

        <section className="wix-overview">
          <div className="wix-section-title"><div><h2>Website overview</h2><p>Your project at a glance</p></div><button className="wix-quiet-button" onClick={() => setView("projects")}>View projects <ArrowRight size={14}/></button></div>
          <div className="wix-site-card">
            <div className="wix-site-identity"><div className="wix-site-icon"><Monitor size={22}/></div><div><strong>{selectedProject === "New website" ? "Your website project" : selectedProject}</strong><span>{plan ? "Your plan is ready to review" : "Your website workspace is ready"}</span></div><span className={plan ? "wix-status ready" : "wix-status"}><i/>{plan ? "Plan ready" : "In progress"}</span></div>
            <div className="wix-site-details"><div><span>Website plan</span><strong>{plan ? "Prepared" : "Not created yet"}</strong></div><div><span>Preview status</span><strong>{previewHtml ? "Preview available" : "Waiting for generation"}</strong></div><div><span>AI connection</span><strong><i className="wix-green-dot"/> Backend configured</strong></div></div>
            <div className="wix-site-actions"><button onClick={() => setView("studio")}><Monitor size={15}/> Open website studio</button><button onClick={() => setView("templates")}><LayoutTemplate size={15}/> Choose a template</button><button onClick={() => setView("projects")}><FolderKanban size={15}/> Manage projects</button></div>
          </div>
        </section>

        <section className="wix-quick-section">
          <div className="wix-section-title"><div><h2>Quick actions</h2><p>Jump straight into the tools you use most</p></div><span className="wix-small-label">WORKSPACE TOOLS</span></div>
          <div className="wix-quick-grid">
            <button className="wix-quick-card" onClick={() => { setView("studio"); setNotice(""); }}><span className="wix-quick-icon lilac"><WandSparkles size={19}/></span><span><strong>Create with AI</strong><small>Turn an idea into a website plan</small></span><ArrowRight size={16}/></button>
            <button className="wix-quick-card" onClick={() => setView("templates")}><span className="wix-quick-icon blue"><LayoutTemplate size={19}/></span><span><strong>Explore templates</strong><small>Browse layouts and visual styles</small></span><ArrowRight size={16}/></button>
            <button className="wix-quick-card" onClick={() => setView("projects")}><span className="wix-quick-icon green"><FolderKanban size={19}/></span><span><strong>Manage projects</strong><small>Open your current website work</small></span><ArrowRight size={16}/></button>
            <button className="wix-quick-card" onClick={() => setView("agents")}><span className="wix-quick-icon amber"><Activity size={19}/></span><span><strong>Build activity</strong><small>Review requests and workflow status</small></span><ArrowRight size={16}/></button>
          </div>
        </section>

        <section className="wix-bottom-grid">
          <div className="wix-info-panel"><div className="wix-section-title"><div><h2>Build progress</h2><p>Your current website workflow</p></div><span className="wix-progress-count">{workflowComplete ? "3 of 3" : plan ? "2 of 3" : "1 of 3"}</span></div>
            <div className="wix-progress-list"><div className="wix-progress-item"><span className="wix-step-icon done"><Check size={14}/></span><div><strong>Workspace created</strong><small>Your project space is ready to use.</small></div><span>Complete</span></div><div className="wix-progress-item"><span className={plan ? "wix-step-icon done" : "wix-step-icon"}>{plan ? <Check size={14}/> : "2"}</span><div><strong>Prepare your website plan</strong><small>Describe the site and review its structure.</small></div><span>{plan ? "Complete" : "Next step"}</span></div><div className="wix-progress-item"><span className={workflowComplete ? "wix-step-icon done" : "wix-step-icon"}>{workflowComplete ? <Check size={14}/> : "3"}</span><div><strong>Generate a website preview</strong><small>See your generated website before moving on.</small></div><span>{workflowComplete ? "Complete" : "Not started"}</span></div></div>
            <button className="wix-link-button" onClick={() => setView("studio")}>{plan ? "Continue building" : "Complete your first step"} <ArrowRight size={14}/></button>
          </div>
          <div className="wix-info-panel wix-tips-panel"><div className="wix-section-title"><div><h2>Helpful tips</h2><p>Get a better result from your first prompt</p></div><Sparkles size={17}/></div>
            <div className="wix-tip"><span className="wix-tip-number">01</span><div><strong>Tell us who your website is for</strong><p>Include your audience, business, and main goal.</p></div></div>
            <div className="wix-tip"><span className="wix-tip-number">02</span><div><strong>List the pages you need</strong><p>For example, Home, Services, About, and Contact.</p></div></div>
            <div className="wix-tip"><span className="wix-tip-number">03</span><div><strong>Describe the look and feel</strong><p>Mention colors, examples, and the style you prefer.</p></div></div>
            <button className="wix-link-button" onClick={() => { setPrompt("Create a responsive website for my business. Audience: [describe audience]. Goal: [describe goal]. Pages: Home, About, Services, and Contact. Visual style: clean, modern, accessible, and mobile-friendly. Include realistic content and useful interactions."); setView("studio"); setNotice("A guided website brief has been added. Replace the bracketed details with your own."); }}>Use a guided brief <ArrowRight size={14}/></button>
          </div>
        </section>
        <footer className="wix-home-footer"><span>BuildYourDream.AI workspace</span><span>Plan your idea. Build your website. Refine at your pace.</span><button onClick={() => setView("studio")}>Open website studio <ArrowRight size={13}/></button></footer>
      </div>}

      {view === "studio" && <div className="hybrid-content">
        <div className="view-heading"><div><div className="eyebrow"><Sparkles size={14}/> WEBSITE STUDIO</div><h1>From brief to <em>build.</em></h1><p>Describe the outcome. Review the plan. Keep the build process visible.</p></div><div className="heading-actions"><span className="autosave-label"><span/> Local draft</span><button className="outline-action" onClick={() => { setPrompt(""); setPlan(null); setPreviewHtml(""); setNotice(""); setSelectedProject("New website"); log("Started a fresh draft."); }}><Plus size={15}/> New brief</button></div></div>
        <div className="studio-grid">
          <section className="panel brief-panel">
            <div className="panel-heading"><div className="panel-icon"><MessageSquareText size={17}/></div><div><h2>Your website brief</h2><p>Tell the planner what to make</p></div><span className="step-tag">STEP 01</span></div>
            <label className="field-label" htmlFor="website-prompt">WHAT ARE WE BUILDING?</label>
            <textarea id="website-prompt" className="brief-input" value={prompt} onChange={e => { setPrompt(e.target.value); setNotice(""); }} placeholder="A modern website for a local bakery with a menu, online ordering, our story, and a contact page…" maxLength={1200} rows={7}/>
            <div className="brief-foot"><span>{prompt.length}/1200 characters</span><span><Sparkles size={13}/> Specific prompts work better</span></div>
            <div className="prompt-chips"><span>Try a starting point</span>{examples.map(e => <button key={e.category} onClick={() => { setPrompt(e.prompt); setNotice(""); }}>{e.category}</button>)}</div>
            <button className="primary-action full-action" onClick={() => startBuild()} disabled={busy || generating}>{busy ? <><RefreshCw size={16} className="spin"/> Asking planner…</> : <><WandSparkles size={16}/> Generate build plan <ArrowRight size={16}/></>}</button>
            {notice && <div className="inline-notice" role="status"><CircleAlert size={16}/><span>{notice}</span></div>}
            <div className="privacy-note"><ShieldCheck size={15}/><span>Review generated code and configure secrets before deployment. This workspace does not provide production authentication yet.</span></div>
          </section>

          <section className="panel preview-panel">
            <div className="panel-heading preview-heading"><div className="panel-icon preview-icon"><Eye size={17}/></div><div><h2>Website preview</h2><p>{previewHtml ? "Generated website · interactive preview" : plan ? "Plan received · ready to generate" : "Your canvas starts here"}</p></div><div className="preview-controls"><div className="preview-device-switch"><button className={previewMode === "desktop" ? "selected" : ""} onClick={() => setPreviewMode("desktop")} aria-label="Desktop preview" title="Desktop preview"><Monitor size={14}/></button><button className={previewMode === "mobile" ? "selected" : ""} onClick={() => setPreviewMode("mobile")} aria-label="Mobile preview" title="Mobile preview"><Smartphone size={14}/></button></div><button className="preview-fullscreen-button" onClick={togglePreviewFullscreen} aria-label={isPreviewFullscreen ? "Exit fullscreen preview" : "Open preview in fullscreen"} title={isPreviewFullscreen ? "Exit fullscreen (Esc)" : "Open preview in fullscreen"}>{isPreviewFullscreen ? <><Minimize2 size={14}/> Exit fullscreen</> : <><Maximize2 size={14}/> Full screen</>}</button></div></div>
            <div className="browser-frame" ref={previewFrameRef}>
              <div className="browser-toolbar"><div className="browser-dots"><i/><i/><i/></div><div className="browser-address"><ShieldCheck size={11}/> your-project.preview</div><span className="browser-menu">•••</span></div>
              {previewHtml ? <iframe title="Generated website preview" sandbox="allow-scripts" srcDoc={previewHtml} className={previewMode === "mobile" ? "live-preview-frame mobile-preview-frame" : "live-preview-frame"} /> : plan ? <div className="preview-generated"><div className="preview-site-nav"><span>{selectedProject.replace(/…$/, "") || "Your Brand"}</span><div><i/><i/><i/></div><b>Get started ↗</b></div><div className="preview-site-hero"><span className="preview-overline">A FIRST DRAFT STARTS HERE</span><strong>{plan.summary.length > 95 ? plan.summary.slice(0, 95) + "…" : plan.summary}</strong><p>This is a plan-based placeholder, not a rendered website yet.</p><div className="preview-skeleton-button">Explore the concept <ArrowRight size={12}/></div><div className="preview-skeleton-grid"><i/><i/><i/></div></div></div> : <div className="empty-canvas"><div className="canvas-orbit orbit-one"/><div className="canvas-orbit orbit-two"/><div className="canvas-center"><Monitor size={26}/></div><span className="canvas-spark spark-one">✳</span><span className="canvas-spark spark-two">✦</span><h3>Your canvas is waiting</h3><p>Submit a brief to get a plan from the connected backend. A real visual preview will need a renderer for generated files.</p><button onClick={() => document.getElementById("website-prompt")?.focus()}>Write your first brief <ArrowDownRight size={15}/></button></div>}
            </div>
            <div className="preview-footer"><span><span className={plan ? "status-led led-green" : "status-led"}/>{plan ? "Plan available" : "No preview generated"}</span><button disabled={!plan} onClick={() => setView("agents")}>View agent activity <ArrowRight size={14}/></button></div>
            <div className="deliverable-strip"><div><FileCode2 size={17}/><span><strong>Website preview</strong><small>Export can be added later</small></span></div><div><Terminal size={17}/><span><strong>Setup guide</strong><small>README & env example</small></span></div></div>
          </section>
        </div>
        {plan && <section className="panel plan-result"><div className="panel-heading"><div className="panel-icon"><GitBranch size={17}/></div><div><h2>Build plan</h2><p>Returned by the planning API</p></div><span className="completed-tag"><CircleCheck size={14}/> Ready to review</span></div><p className="plan-result-summary">{plan.summary}</p><div className="plan-result-steps">{plan.steps.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p><Check size={15}/></div>)}</div><div className="plan-result-footer"><span><Clock3 size={14}/> Review the plan before generation</span><button className="primary-action" onClick={generateProject} disabled={generating}>{generating ? <><RefreshCw size={15} className="spin"/> Generating preview…</> : <><Play size={15}/> Generate full-stack project <ArrowRight size={15}/></>}</button></div></section>}
        <div className="bottom-note"><Command size={14}/> Tip: use the Agent Command tab to inspect what the current backend has actually completed.</div>
      </div>}

      {view === "templates" && <div className="hybrid-content template-library-content">
        <div className="view-heading"><div><div className="eyebrow"><LayoutTemplate size={14}/> TEMPLATE LIBRARY</div><h1>Start with a <em>layout.</em></h1><p>Browse 2,000 template combinations across 25 categories, 10 layout patterns, and 8 visual styles. Choose one, then customize the brief before generating.</p></div><div className="template-total"><strong>{templateCatalog.length.toLocaleString()}</strong><span>template combinations</span></div></div>
        <section className="panel template-browser">
          <div className="template-search-row">
            <label className="template-search"><Search size={17}/><input value={templateSearch} onChange={e => { setTemplateSearch(e.target.value); setTemplatePage(1); }} placeholder="Search templates, categories, layouts or styles…" aria-label="Search templates"/></label>
            <span className="template-results-count">{templateCatalog.filter(t => (templateCategory === "All templates" || t.category === templateCategory) && (t.title + " " + t.category + " " + t.layout + " " + t.style).toLowerCase().includes(templateSearch.toLowerCase())).length.toLocaleString()} results</span>
          </div>
          <div className="template-category-row" aria-label="Filter templates by category">
            <button className={templateCategory === "All templates" ? "template-category active" : "template-category"} onClick={() => { setTemplateCategory("All templates"); setTemplatePage(1); }}>All templates <span>{templateCatalog.length.toLocaleString()}</span></button>
            {templateCategories.map(category => <button key={category} className={templateCategory === category ? "template-category active" : "template-category"} onClick={() => { setTemplateCategory(category); setTemplatePage(1); }}>{category}<span>80</span></button>)}
          </div>
          {(() => {
            const filtered = templateCatalog.filter(t => (templateCategory === "All templates" || t.category === templateCategory) && (t.title + " " + t.category + " " + t.layout + " " + t.style).toLowerCase().includes(templateSearch.toLowerCase()));
            const pageCount = Math.max(1, Math.ceil(filtered.length / 24));
            const currentPage = Math.min(templatePage, pageCount);
            return <>
              <div className="template-grid">
                {filtered.slice((currentPage - 1) * 24, currentPage * 24).map(template => <article className="template-card" key={template.id}>
                  <div className={"template-art art-style-" + template.styleIndex} aria-hidden="true">
                    <div className="template-art-nav"><i/><i/><i/><b/></div>
                    <div className="template-art-hero"><span/><strong/><strong/><small/></div>
                    <div className="template-art-content"><i/><i/><i/></div>
                  </div>
                  <div className="template-card-body"><span className="template-card-category">{template.category}</span><h3>{template.title}</h3><p>{template.layout} · {template.style}</p><button className="template-use-button" onClick={() => { setPrompt(template.prompt); setSelectedProject(template.title); setNotice("Template brief loaded. Customize it, then generate your build plan."); setView("studio"); log("Selected template: " + template.title); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Use template <ArrowRight size={14}/></button></div>
                </article>)}
              </div>
              {filtered.length === 0 && <div className="template-empty"><Search size={24}/><h3>No matching templates</h3><p>Try a different search or choose another category.</p><button className="outline-action" onClick={() => { setTemplateSearch(""); setTemplateCategory("All templates"); setTemplatePage(1); }}>Clear filters</button></div>}
              {filtered.length > 0 && <div className="template-pagination"><span>Showing {(currentPage - 1) * 24 + 1}–{Math.min(currentPage * 24, filtered.length)} of {filtered.length.toLocaleString()}</span><div><button className="outline-action" disabled={currentPage === 1} onClick={() => setTemplatePage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button className="outline-action" disabled={currentPage >= pageCount} onClick={() => setTemplatePage(currentPage + 1)}>Next</button></div></div>}
            </>;
          })()}
        </section>
      </div>}

      {view === "agents" && <div className="hybrid-content">
        <div className="view-heading"><div><div className="eyebrow"><Activity size={14}/> AGENT COMMAND CENTER</div><h1>See the work <em>behind the build.</em></h1><p>Track the workflow, inspect activity, and separate real API results from prototype states.</p></div><button className="outline-action" onClick={() => { setActivity(["Activity log cleared.", ...activity.slice(0, 3)]); }}><RefreshCw size={15}/> Refresh view</button></div>
        <div className="command-summary"><div><span>ACTIVE PROJECT</span><strong>{selectedProject}</strong><small>{plan ? "Planning API completed" : "Waiting for project brief"}</small></div><div><span>PLAN STATUS</span><strong>{plan ? "Ready for review" : "Not started"}</strong><small>{plan ? `${plan.steps.length} steps returned` : "Submit a brief in Website Studio"}</small></div><div><span>GENERATION</span><strong>{generating ? "In progress" : "Not running"}</strong><small>Uses existing backend endpoint</small></div></div>
        <div className="command-grid">
          <section className="panel agent-panel"><div className="panel-heading"><div className="panel-icon"><Bot size={17}/></div><div><h2>Agent pipeline</h2><p>Role cards show current prototype state, not independent agent sessions.</p></div><span className="step-tag">5 ROLES</span></div>
            <div className="agent-flow">{agents.map((agent,index) => { const Icon=agent.icon; const state=agentStates[agent.id]; return <div key={agent.id} className={"agent-node "+(state==="Complete"?"node-complete":state==="Working"?"node-working":"")}><div className={"agent-avatar "+agent.color}><Icon size={18}/></div><div className="agent-node-copy"><strong>{agent.name}</strong><small>{agent.role}</small></div><span className={"agent-status "+state.toLowerCase()}>{state==="Complete"&&<Check size={12}/ >}{state==="Working"&&<RefreshCw size={12} className="spin"/>}{state}</span>{index < agents.length-1 && <div className="agent-connector"><span/></div>}</div>; })}</div>
            <div className="pipeline-explainer"><CircleAlert size={16}/><p><strong>Important:</strong> the backend now runs a rules-based planner, AI project generation with design guidance, static QA checks, and ZIP packaging. These are workflow stages, not separate autonomous agents. QA blocks release if required source files are missing; generated code is not compiled or run in a sandbox.</p></div>
            <button className="primary-action full-action" onClick={() => setView("studio")}><Plus size={15}/> Return to brief <ArrowRight size={15}/></button>
          </section>
          <section className="panel activity-panel"><div className="panel-heading"><div className="panel-icon activity-icon"><Terminal size={17}/></div><div><h2>Execution activity</h2><p>Client-side event log from actual requests</p></div><span className="live-label"><span/> LIVE VIEW</span></div>
            <div className="activity-list">{activity.map((entry,index)=><div className="activity-entry" key={entry+"-"+index}><span className="activity-time">{String(activity.length-index).padStart(2,"0")}</span><span className={index===0?"activity-marker marker-current":"activity-marker"}/><p>{entry}</p></div>)}</div>
            <div className="activity-footer"><span><span className="status-led led-green"/> Latest browser events</span><span>Newest first</span></div>
          </section>
        </div>
        {plan && <section className="panel command-plan"><div className="panel-heading"><div className="panel-icon"><Check size={17}/></div><div><h2>Planner output</h2><p>Verified response received from /api/plan</p></div><span className="completed-tag"><CircleCheck size={14}/> Actual API result</span></div><p>{plan.summary}</p><ol>{plan.steps.map((step,i)=><li key={step}><span>{i+1}</span>{step}</li>)}</ol><button className="primary-action" onClick={generateProject} disabled={generating}>{generating?"Generating…":"Generate website preview"} <ArrowRight size={15}/></button></section>}
      </div>}

      {view === "projects" && <div className="hybrid-content">
        <div className="view-heading"><div><div className="eyebrow"><FolderKanban size={14}/> PROJECTS</div><h1>Your build <em>history.</em></h1><p>Prototype projects currently live in this browser session only.</p></div><button className="primary-action" onClick={() => { setView("studio"); setPrompt(""); setPlan(null); setNotice(""); setSelectedProject("New website"); }}><Plus size={15}/> New project</button></div>
        <section className="panel projects-panel"><div className="projects-empty-icon"><FolderKanban size={25}/></div><h2>{plan ? selectedProject : "Your next project starts here"}</h2><p>{plan ? "A plan has been returned by the connected API in this session. Persistent project history is not implemented yet." : "Start with a website brief to see your plan here. Persistent accounts and a saved project database are not connected in this prototype."}</p>{plan && <div className="project-row-summary"><span><CircleCheck size={15}/> Planning complete</span><span>{plan.steps.length} plan steps</span><button onClick={() => setView("studio")}>Open project <ArrowRight size={14}/></button></div>}<button className="primary-action" onClick={() => setView("studio")}><WandSparkles size={15}/> Open website studio</button></section>
      </div>}
    </main>
  </div>;
}

export default App;
