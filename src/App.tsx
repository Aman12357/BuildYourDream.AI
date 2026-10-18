import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, Bot, Check, ChevronDown, CircleAlert,
  CircleCheck, Clock3, Code2, Command, Download, Eye, FileCode2, FolderKanban,
  Gauge, GitBranch, Layers3, LayoutDashboard, Menu, MessageSquareText, Monitor,
  Play, Plus, RefreshCw, Send, ShieldCheck, Sparkles, Terminal, WandSparkles, X
} from "lucide-react";

type BuildPlan = { summary: string; steps: string[] };
type View = "studio" | "agents" | "projects";
type AgentState = "Ready" | "Waiting" | "Complete" | "Working";
const examples = [
  { title: "Independent designer portfolio", category: "Portfolio", prompt: "Build a polished portfolio for an independent product designer. Include a bold editorial hero, selected projects, about section, testimonials, and a contact form. Use responsive layouts and accessible components." },
  { title: "A warm home-goods store", category: "E-commerce", prompt: "Create a modern e-commerce storefront for handmade home goods with product cards, category filters, product details, cart flow, brand story, and responsive mobile navigation." },
  { title: "SaaS launch website", category: "Startup", prompt: "Build a conversion-focused SaaS landing page with clear positioning, features, pricing, testimonials, FAQ, and a waitlist form. Use a clean visual system and mobile-first responsive design." },
];
const agents = [
  { id: "planner", name: "Planner", role: "Scope & architecture", icon: GitBranch, color: "mint" },
  { id: "designer", name: "Designer", role: "UX & design system", icon: Layers3, color: "amber" },
  { id: "developer", name: "Developer", role: "Frontend & API code", icon: Code2, color: "blue" },
  { id: "qa", name: "QA engineer", role: "Checks & fixes", icon: ShieldCheck, color: "violet" },
  { id: "release", name: "Release agent", role: "Package & delivery", icon: Download, color: "slate" },
];

function App() {
  const [view, setView] = useState<View>("studio");
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<BuildPlan | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("New website");
  const [activity, setActivity] = useState<string[]>(["Workspace ready. Describe a website to start.", "Connected to the configured project API when a build is requested."]);
  const apiBase = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://buildyourdream-api.onrender.com" : "http://localhost:8787")).replace(/\/$/, "");
  const agentStates = useMemo(() => {
    const states: Record<string, AgentState> = { planner: plan ? "Complete" : "Ready", designer: plan ? "Waiting" : "Ready", developer: plan ? "Waiting" : "Ready", qa: plan ? "Waiting" : "Ready", release: generating ? "Working" : "Waiting" };
    return states;
  }, [plan, generating]);

  function log(message: string) {
    setActivity(current => [message, ...current].slice(0, 7));
  }

  async function startBuild(value = prompt) {
    const cleaned = value.trim();
    if (!cleaned) { setNotice("Add a short description of your website first."); return; }
    setPrompt(cleaned); setSelectedProject(cleaned.length > 34 ? cleaned.slice(0, 34).trim() + "…" : cleaned);
    setNotice(""); setPlan(null); setBusy(true); setView("studio");
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
        setPlan(result.plan as BuildPlan); setNotice("Plan returned by the backend. Review it before generating the project.");
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
    setNotice(""); setGenerating(true); setView("agents"); log("Project generation requested from backend.");
    try {
      const response = await fetch(`${apiBase}/api/generate-project`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const message = result.error || "Project generation failed.";
        setNotice(message); log("Generation failed: " + message); return;
      }
      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a"); link.href = url; link.download = "buildyourdream-full-stack-project.zip";
      document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      const count = response.headers.get("X-Generated-File-Count");
      setNotice(`Project ZIP downloaded${count ? ` with ${count} source files` : ""}. Review and test the code before publishing.`);
      log("Backend returned a project ZIP for download.");
    } catch {
      setNotice("Could not reach the backend or download the project. Please try again.");
      log("Project generation request could not be completed.");
    } finally { setGenerating(false); }
  }

  const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "studio", label: "Website studio", icon: Monitor },
    { id: "agents", label: "Agent command", icon: Activity },
    { id: "projects", label: "Projects", icon: FolderKanban },
  ];

  return <div className="hybrid-app">
    <aside className={menuOpen ? "hybrid-sidebar sidebar-open" : "hybrid-sidebar"}>
      <a className="hybrid-brand" href="#studio" onClick={() => setView("studio")}><span className="hybrid-brand-mark"><Layers3 size={19}/></span><span>BuildYourDream<span>.AI</span><small>AI WEBSITE WORKSPACE</small></span></a>
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
        <div className="topbar-right"><span className="prototype-chip"><span/> Frontend prototype</span><button className="help-button" onClick={() => { setNotice("This prototype calls the existing /api/plan and /api/generate-project endpoints. Agent cards are workflow visibility, not separate autonomous services."); setView("studio"); }}>How it works</button><span className="top-avatar">A</span></div>
      </header>

      {view === "studio" && <div className="hybrid-content">
        <div className="view-heading"><div><div className="eyebrow"><Sparkles size={14}/> WEBSITE STUDIO</div><h1>From brief to <em>build.</em></h1><p>Describe the outcome. Review the plan. Keep the build process visible.</p></div><div className="heading-actions"><span className="autosave-label"><span/> Local draft</span><button className="outline-action" onClick={() => { setPrompt(""); setPlan(null); setNotice(""); setSelectedProject("New website"); log("Started a fresh draft."); }}><Plus size={15}/> New brief</button></div></div>
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
            <div className="panel-heading preview-heading"><div className="panel-icon preview-icon"><Eye size={17}/></div><div><h2>Website preview</h2><p>{plan ? "Plan received · preview placeholder" : "Your canvas starts here"}</p></div><span className="preview-device"><Monitor size={14}/> Desktop</span></div>
            <div className="browser-frame">
              <div className="browser-toolbar"><div className="browser-dots"><i/><i/><i/></div><div className="browser-address"><ShieldCheck size={11}/> your-project.preview</div><span className="browser-menu">•••</span></div>
              {plan ? <div className="preview-generated"><div className="preview-site-nav"><span>{selectedProject.replace(/…$/, "") || "Your Brand"}</span><div><i/><i/><i/></div><b>Get started ↗</b></div><div className="preview-site-hero"><span className="preview-overline">A FIRST DRAFT STARTS HERE</span><strong>{plan.summary.length > 95 ? plan.summary.slice(0, 95) + "…" : plan.summary}</strong><p>This is a plan-based placeholder, not a rendered website yet.</p><div className="preview-skeleton-button">Explore the concept <ArrowRight size={12}/></div><div className="preview-skeleton-grid"><i/><i/><i/></div></div></div> : <div className="empty-canvas"><div className="canvas-orbit orbit-one"/><div className="canvas-orbit orbit-two"/><div className="canvas-center"><Monitor size={26}/></div><span className="canvas-spark spark-one">✳</span><span className="canvas-spark spark-two">✦</span><h3>Your canvas is waiting</h3><p>Submit a brief to get a plan from the connected backend. A real visual preview will need a renderer for generated files.</p><button onClick={() => document.getElementById("website-prompt")?.focus()}>Write your first brief <ArrowDownRight size={15}/></button></div>}
            </div>
            <div className="preview-footer"><span><span className={plan ? "status-led led-green" : "status-led"}/>{plan ? "Plan available" : "No preview generated"}</span><button disabled={!plan} onClick={() => setView("agents")}>View agent activity <ArrowRight size={14}/></button></div>
            <div className="deliverable-strip"><div><FileCode2 size={17}/><span><strong>Source files</strong><small>Included in generated ZIP</small></span></div><div><Terminal size={17}/><span><strong>Setup guide</strong><small>README & env example</small></span></div></div>
          </section>
        </div>
        {plan && <section className="panel plan-result"><div className="panel-heading"><div className="panel-icon"><GitBranch size={17}/></div><div><h2>Build plan</h2><p>Returned by the planning API</p></div><span className="completed-tag"><CircleCheck size={14}/> Ready to review</span></div><p className="plan-result-summary">{plan.summary}</p><div className="plan-result-steps">{plan.steps.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p><Check size={15}/></div>)}</div><div className="plan-result-footer"><span><Clock3 size={14}/> Review the plan before generation</span><button className="primary-action" onClick={generateProject} disabled={generating}>{generating ? <><RefreshCw size={15} className="spin"/> Generating ZIP…</> : <><Play size={15}/> Generate full-stack project <ArrowRight size={15}/></>}</button></div></section>}
        <div className="bottom-note"><Command size={14}/> Tip: use the Agent Command tab to inspect what the current backend has actually completed.</div>
      </div>}

      {view === "agents" && <div className="hybrid-content">
        <div className="view-heading"><div><div className="eyebrow"><Activity size={14}/> AGENT COMMAND CENTER</div><h1>See the work <em>behind the build.</em></h1><p>Track the workflow, inspect activity, and separate real API results from prototype states.</p></div><button className="outline-action" onClick={() => { setActivity(["Activity log cleared.", ...activity.slice(0, 3)]); }}><RefreshCw size={15}/> Refresh view</button></div>
        <div className="command-summary"><div><span>ACTIVE PROJECT</span><strong>{selectedProject}</strong><small>{plan ? "Planning API completed" : "Waiting for project brief"}</small></div><div><span>PLAN STATUS</span><strong>{plan ? "Ready for review" : "Not started"}</strong><small>{plan ? `${plan.steps.length} steps returned` : "Submit a brief in Website Studio"}</small></div><div><span>GENERATION</span><strong>{generating ? "In progress" : "Not running"}</strong><small>Uses existing backend endpoint</small></div></div>
        <div className="command-grid">
          <section className="panel agent-panel"><div className="panel-heading"><div className="panel-icon"><Bot size={17}/></div><div><h2>Agent pipeline</h2><p>Role cards show current prototype state, not independent agent sessions.</p></div><span className="step-tag">5 ROLES</span></div>
            <div className="agent-flow">{agents.map((agent,index) => { const Icon=agent.icon; const state=agentStates[agent.id]; return <div key={agent.id} className={"agent-node "+(state==="Complete"?"node-complete":state==="Working"?"node-working":"")}><div className={"agent-avatar "+agent.color}><Icon size={18}/></div><div className="agent-node-copy"><strong>{agent.name}</strong><small>{agent.role}</small></div><span className={"agent-status "+state.toLowerCase()}>{state==="Complete"&&<Check size={12}/ >}{state==="Working"&&<RefreshCw size={12} className="spin"/>}{state}</span>{index < agents.length-1 && <div className="agent-connector"><span/></div>}</div>; })}</div>
            <div className="pipeline-explainer"><CircleAlert size={16}/><p><strong>Important:</strong> only the planner and project-generation HTTP endpoints are currently wired here. Design, developer, QA, and release are workflow stages in this frontend prototype, not separate autonomous agents.</p></div>
            <button className="primary-action full-action" onClick={() => setView("studio")}><Plus size={15}/> Return to brief <ArrowRight size={15}/></button>
          </section>
          <section className="panel activity-panel"><div className="panel-heading"><div className="panel-icon activity-icon"><Terminal size={17}/></div><div><h2>Execution activity</h2><p>Client-side event log from actual requests</p></div><span className="live-label"><span/> LIVE VIEW</span></div>
            <div className="activity-list">{activity.map((entry,index)=><div className="activity-entry" key={entry+"-"+index}><span className="activity-time">{String(activity.length-index).padStart(2,"0")}</span><span className={index===0?"activity-marker marker-current":"activity-marker"}/><p>{entry}</p></div>)}</div>
            <div className="activity-footer"><span><span className="status-led led-green"/> Latest browser events</span><span>Newest first</span></div>
          </section>
        </div>
        {plan && <section className="panel command-plan"><div className="panel-heading"><div className="panel-icon"><Check size={17}/></div><div><h2>Planner output</h2><p>Verified response received from /api/plan</p></div><span className="completed-tag"><CircleCheck size={14}/> Actual API result</span></div><p>{plan.summary}</p><ol>{plan.steps.map((step,i)=><li key={step}><span>{i+1}</span>{step}</li>)}</ol><button className="primary-action" onClick={generateProject} disabled={generating}>{generating?"Generating…":"Generate project ZIP"} <ArrowRight size={15}/></button></section>}
      </div>}

      {view === "projects" && <div className="hybrid-content">
        <div className="view-heading"><div><div className="eyebrow"><FolderKanban size={14}/> PROJECTS</div><h1>Your build <em>history.</em></h1><p>Prototype projects currently live in this browser session only.</p></div><button className="primary-action" onClick={() => { setView("studio"); setPrompt(""); setPlan(null); setNotice(""); setSelectedProject("New website"); }}><Plus size={15}/> New project</button></div>
        <section className="panel projects-panel"><div className="projects-empty-icon"><FolderKanban size={25}/></div><h2>{plan ? selectedProject : "Your next project starts here"}</h2><p>{plan ? "A plan has been returned by the connected API in this session. Persistent project history is not implemented yet." : "Start with a website brief to see your plan here. Persistent accounts and a saved project database are not connected in this prototype."}</p>{plan && <div className="project-row-summary"><span><CircleCheck size={15}/> Planning complete</span><span>{plan.steps.length} plan steps</span><button onClick={() => setView("studio")}>Open project <ArrowRight size={14}/></button></div>}<button className="primary-action" onClick={() => setView("studio")}><WandSparkles size={15}/> Open website studio</button></section>
      </div>}
    </main>
  </div>;
}

export default App;
