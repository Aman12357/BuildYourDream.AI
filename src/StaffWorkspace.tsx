import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Check, ChevronDown, CircleDollarSign, ClipboardList, Clock3, Crown, FileText, Users, UserRoundCog, UserRoundCheck, Plus, Send, ShieldCheck, Sparkles } from "lucide-react";

type Role = "CEO" | "Manager" | "HR" | "Team" | "Client";
type Stage = "New request" | "Manager review" | "Awaiting CEO approval" | "Approved" | "In progress" | "Delivered";
type TaskStatus = "Todo" | "In progress" | "Review" | "Done";
type Task = { id: number; title: string; owner: string; status: TaskStatus };
type Project = { id: number; client: string; title: string; scope: string; managerPrice: number; finalPrice: number | null; stage: Stage; tasks: Task[]; manager: string };

const initialProjects: Project[] = [
  { id: 1048, client: "Northstar Coffee", title: "E-commerce website", scope: "Responsive storefront, product catalogue, cart, and contact form", managerPrice: 48000, finalPrice: null, stage: "Awaiting CEO approval", manager: "Riya Sharma", tasks: [{ id: 1, title: "UI design and responsive layout", owner: "Aarav · Design", status: "Todo" }, { id: 2, title: "Storefront and product pages", owner: "Meera · Frontend", status: "Todo" }, { id: 3, title: "API and database setup", owner: "Dev · Backend", status: "Todo" }] },
  { id: 1047, client: "GreenLeaf Studio", title: "Business landing page", scope: "Five sections, enquiry form, mobile layout, and basic SEO", managerPrice: 22000, finalPrice: 20000, stage: "In progress", manager: "Riya Sharma", tasks: [{ id: 4, title: "Landing page build", owner: "Meera · Frontend", status: "In progress" }, { id: 5, title: "Visual assets and polish", owner: "Aarav · Design", status: "Review" }] },
];

const roleInfo: { role: Role; description: string; icon: typeof Crown }[] = [
  { role: "CEO", description: "Final scope and price approval", icon: Crown },
  { role: "Manager", description: "Estimate and distribute work", icon: BriefcaseBusiness },
  { role: "HR", description: "People, skills and availability", icon: Users },
  { role: "Team", description: "Tasks and progress updates", icon: ClipboardList },
  { role: "Client", description: "Submit a new project request", icon: UserRoundCheck },
];

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function StaffWorkspace({ onBack }: { onBack: () => void }) {
  const [role, setRole] = useState<Role>("CEO");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedId, setSelectedId] = useState(1048);
  const [clientName, setClientName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [scope, setScope] = useState("");
  const [estimate, setEstimate] = useState("35000");
  const [finalPrice, setFinalPrice] = useState("35000");
  const [notice, setNotice] = useState("Demo workspace: changes stay in this browser session.");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskOwner, setTaskOwner] = useState("Meera · Frontend");

  const selected = projects.find(p => p.id === selectedId) ?? projects[0];
  const activeCount = projects.filter(p => !["Delivered"].includes(p.stage)).length;
  const needsApproval = projects.filter(p => p.stage === "Awaiting CEO approval").length;
  const doneTasks = projects.reduce((n, p) => n + p.tasks.filter(t => t.status === "Done").length, 0);
  const totalTasks = projects.reduce((n, p) => n + p.tasks.length, 0);
  const progress = useMemo(() => selected?.tasks.length ? Math.round(selected.tasks.filter(t => t.status === "Done").length / selected.tasks.length * 100) : 0, [selected]);

  function patchProject(id: number, patch: Partial<Project>) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }
  function createRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!clientName.trim() || !projectTitle.trim() || !scope.trim()) return;
    const id = Math.max(1048, ...projects.map(p => p.id)) + 1;
    const project: Project = { id, client: clientName.trim(), title: projectTitle.trim(), scope: scope.trim(), managerPrice: 0, finalPrice: null, stage: "New request", manager: "Unassigned", tasks: [] };
    setProjects(prev => [project, ...prev]);
    setSelectedId(id);
    setClientName(""); setProjectTitle(""); setScope("");
    setRole("Manager");
    setNotice("Request received. The manager can review scope and submit a price estimate.");
  }
  function proposePrice() {
    const amount = Number(estimate);
    if (!Number.isFinite(amount) || amount <= 0) { setNotice("Enter a valid positive estimate in INR."); return; }
    patchProject(selected.id, { managerPrice: amount, stage: "Awaiting CEO approval", manager: "Riya Sharma" });
    setFinalPrice(String(amount));
    setRole("CEO");
    setNotice("Manager estimate submitted. Final approval is now with the CEO.");
  }
  function approvePrice() {
    const amount = Number(finalPrice);
    if (!Number.isFinite(amount) || amount <= 0) { setNotice("Enter a valid final price in INR."); return; }
    patchProject(selected.id, { finalPrice: amount, stage: "Approved" });
    setNotice("Final price approved. The manager can now assign work to the team.");
  }
  function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    patchProject(selected.id, { tasks: [...selected.tasks, { id: Date.now(), title: taskTitle.trim(), owner: taskOwner, status: "Todo" }], stage: "In progress" });
    setTaskTitle("");
    setNotice("Task assigned. Team members can update its status in the Team workspace.");
  }
  function updateTask(id: number, status: TaskStatus) {
    const tasks = selected.tasks.map(t => t.id === id ? { ...t, status } : t);
    const allDone = tasks.length > 0 && tasks.every(t => t.status === "Done");
    patchProject(selected.id, { tasks, stage: allDone ? "Delivered" : "In progress" });
    setNotice(allDone ? "All tasks are done. The project is marked delivered in this demo." : "Task progress updated.");
  }

  return <div className="workspace-shell">
    <header className="workspace-topbar">
      <button className="workspace-back" onClick={onBack}><ArrowLeft size={16} /> BuildYourDream.AI</button>
      <div className="workspace-brand"><span className="workspace-logo"><LayersIcon /></span><span>DreamOps <small>PROJECT WORKSPACE</small></span></div>
      <div className="workspace-top-right"><span className="workspace-demo"><span /> Demo data</span><button className="workspace-avatar" aria-label="CEO workspace">A</button></div>
    </header>
    <div className="workspace-layout">
      <aside className="workspace-sidebar">
        <p className="workspace-nav-label">WORKSPACE</p>
        {roleInfo.map(item => { const Icon = item.icon; return <button key={item.role} className={role === item.role ? "workspace-role active" : "workspace-role"} onClick={() => { setRole(item.role); setNotice(""); }}><Icon size={18}/><span><strong>{item.role}</strong><small>{item.description}</small></span>{item.role === "CEO" && needsApproval > 0 && <i>{needsApproval}</i>}</button>; })}
        <div className="workspace-sidebar-note"><ShieldCheck size={17}/><p><strong>Approval control</strong><span>Only the CEO role can finalise project pricing in this prototype.</span></p></div>
      </aside>
      <main className="workspace-main">
        <div className="workspace-heading"><div><p className="workspace-kicker">{role === "Client" ? "CLIENT INTAKE" : "OPERATIONS / " + role.toUpperCase()}</p><h1>{role === "CEO" ? "Executive overview" : role === "Manager" ? "Project delivery" : role === "HR" ? "People & capacity" : role === "Team" ? "My team's tasks" : "Start a project"}</h1><p>{role === "CEO" ? "Review proposals, approve the final price, and keep every project moving." : role === "Manager" ? "Turn client requests into scoped work, estimates, and clear assignments." : role === "HR" ? "Coordinate people, roles, and team capacity." : role === "Team" ? "Update task status so project progress stays visible." : "Tell us what you need. A manager will review the scope and prepare a quote."}</p></div><span className="workspace-date"><span/> Workspace active</span></div>
        {role !== "Client" && <div className="workspace-metrics"><div><span>Active projects</span><strong>{activeCount}</strong><small><BriefcaseBusiness size={14}/> Across all stages</small></div><div><span>Awaiting approval</span><strong>{needsApproval}</strong><small><Clock3 size={14}/> Needs CEO decision</small></div><div><span>Tasks completed</span><strong>{doneTasks}<em> / {totalTasks}</em></strong><small><Check size={14}/> Team progress</small></div></div>}
        {notice && <div className="workspace-notice" role="status"><Sparkles size={16}/>{notice}</div>}
        {role === "Client" && <section className="workspace-panel workspace-intake"><div className="workspace-panel-title"><div><span className="workspace-panel-icon"><FileText size={18}/></span><div><h2>Project brief</h2><p>Share the outcome you want. Pricing is not final until the CEO approves it.</p></div></div><span className="workspace-step">STEP 01 / 03</span></div><form onSubmit={createRequest} className="workspace-form"><label>Client or company name<input required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Northstar Coffee"/></label><label>What should we build?<input required value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="e.g. E-commerce website"/></label><label>Scope and requirements<textarea required rows={4} value={scope} onChange={e => setScope(e.target.value)} placeholder="Describe pages, features, integrations, deadline, and success criteria..."/></label><button className="workspace-primary" type="submit">Submit project request <ArrowRight size={16}/></button></form></section>}
        {role === "CEO" && <section className="workspace-panel"><div className="workspace-panel-title"><div><span className="workspace-panel-icon"><Crown size={18}/></span><div><h2>CEO approval queue</h2><p>Review the manager's proposal, then set the final client price.</p></div></div><span className="workspace-step">{needsApproval} PENDING</span></div>{projects.filter(p => p.stage === "Awaiting CEO approval").length === 0 ? <div className="workspace-empty"><BadgeCheck size={24}/><strong>You're all caught up</strong><p>No pricing approvals are waiting right now. New manager proposals will appear here.</p></div> : projects.filter(p => p.stage === "Awaiting CEO approval").map(p => <button key={p.id} className={selectedId === p.id ? "approval-row selected" : "approval-row"} onClick={() => {setSelectedId(p.id);setFinalPrice(String(p.managerPrice));}}><span className="approval-client"><strong>{p.client}</strong><small>#{p.id} · {p.title}</small></span><span className="approval-price"><small>Manager estimate</small><strong>{money(p.managerPrice)}</strong></span><span className="approval-arrow"><ArrowRight size={17}/></span></button>)}{selected.stage === "Awaiting CEO approval" && <div className="approval-detail"><div className="approval-scope"><span>PROPOSED SCOPE</span><p>{selected.scope}</p><small>Manager: {selected.manager}</small></div><div className="workspace-form price-form"><label>Manager's estimate<input value={money(selected.managerPrice)} readOnly/></label><label>CEO final price (INR)<input type="number" min="1" value={finalPrice} onChange={e => setFinalPrice(e.target.value)} /></label><button className="workspace-primary" onClick={approvePrice}>Approve final price <Check size={16}/></button></div></div>}{selected.stage === "Approved" && <div className="workspace-approved"><Check size={17}/> Final price approved: <strong>{money(selected.finalPrice || 0)}</strong>. Manager can assign tasks.</div>}</section>}
        {role === "Manager" && <><section className="workspace-panel"><div className="workspace-panel-title"><div><span className="workspace-panel-icon"><CircleDollarSign size={18}/></span><div><h2>Scope & pricing proposal</h2><p>Review a new client request and submit your estimate for CEO approval.</p></div></div></div><div className="workspace-project-select"><label>Select project<select value={selectedId} onChange={e => {setSelectedId(Number(e.target.value));setEstimate(String(projects.find(p => p.id === Number(e.target.value))?.managerPrice || 35000));}}>{projects.map(p => <option key={p.id} value={p.id}>#{p.id} · {p.client} — {p.stage}</option>)}</select></label><span className={"stage-pill stage-" + selected.stage.toLowerCase().replaceAll(" ", "-")}>{selected.stage}</span></div><div className="approval-scope"><span>CLIENT BRIEF / {selected.client}</span><h3>{selected.title}</h3><p>{selected.scope}</p></div><div className="workspace-form price-form"><label>Estimated price (INR)<input type="number" min="1" value={estimate} onChange={e => setEstimate(e.target.value)}/></label><button className="workspace-primary" onClick={proposePrice}>Send proposal to CEO <Send size={15}/></button></div></section><section className="workspace-panel"><div className="workspace-panel-title"><div><span className="workspace-panel-icon"><ClipboardList size={18}/></span><div><h2>Task distribution</h2><p>Work can be assigned after the CEO approves the final price.</p></div></div></div>{selected.stage !== "Approved" && selected.stage !== "In progress" && selected.stage !== "Delivered" ? <p className="workspace-gate"><ShieldCheck size={16}/> Waiting for CEO approval before work assignment.</p> : <><form className="workspace-task-form" onSubmit={addTask}><input required value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task name, e.g. Build product page"/><select value={taskOwner} onChange={e => setTaskOwner(e.target.value)}><option>Aarav · Design</option><option>Meera · Frontend</option><option>Dev · Backend</option><option>Riya · QA</option></select><button className="workspace-primary" type="submit"><Plus size={16}/> Assign</button></form><TaskList project={selected} onUpdate={updateTask}/></>}</section></>}
        {role === "HR" && <><section className="workspace-panel"><div className="workspace-panel-title"><div><span className="workspace-panel-icon"><Users size={18}/></span><div><h2>People directory</h2><p>Example team roster for the workflow prototype.</p></div></div><span className="workspace-step">4 TEAM MEMBERS</span></div><div className="people-list">{[{name:"Riya Sharma",job:"Project Manager",skill:"Planning · Client communication",initial:"R",color:"lavender"},{name:"Aarav Singh",job:"UI/UX Designer",skill:"Figma · Design systems",initial:"A",color:"peach"},{name:"Meera Kapoor",job:"Frontend Developer",skill:"React · Responsive UI",initial:"M",color:"mint"},{name:"Dev Patel",job:"Backend Developer",skill:"Node.js · PostgreSQL",initial:"D",color:"blue"}].map(person=><div className="person-row" key={person.name}><span className={"person-avatar " + person.color}>{person.initial}</span><span className="person-info"><strong>{person.name}</strong><small>{person.job}</small></span><span className="person-skills">{person.skill}</span><span className="person-status"><i/> Available</span></div>)}</div></section><section className="workspace-panel"><div className="workspace-panel-title"><div><span className="workspace-panel-icon"><UserRoundCog size={18}/></span><div><h2>HR workflow</h2><p>Suggested controls for a future connected employee system.</p></div></div></div><div className="hr-checks"><div><Check size={16}/><span><strong>Role clarity</strong><small>Each person has a defined role and skill set.</small></span></div><div><Check size={16}/><span><strong>Capacity review</strong><small>Check workload before assigning new tasks.</small></span></div><div><Check size={16}/><span><strong>Progress follow-up</strong><small>Use task updates and review stages to surface blockers.</small></span></div></div></section></>}
        {role === "Team" && <section className="workspace-panel"><div className="workspace-panel-title"><div><span className="workspace-panel-icon"><ClipboardList size={18}/></span><div><h2>Assigned work</h2><p>Select a task status to update the project timeline.</p></div></div></div><div className="workspace-project-select"><label>Project<select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}>{projects.map(p => <option key={p.id} value={p.id}>#{p.id} · {p.client}</option>)}</select></label><span className="stage-pill">{selected.stage}</span></div><div className="task-progress"><div><span>Completion</span><strong>{progress}%</strong></div><div className="task-progress-track"><i style={{width: progress + "%"}}/></div></div><TaskList project={selected} onUpdate={updateTask}/></section>}
        <section className="workspace-panel workspace-projects"><div className="workspace-panel-title"><div><span className="workspace-panel-icon"><BriefcaseBusiness size={18}/></span><div><h2>Project tracker</h2><p>Every client request, decision, and task in one place.</p></div></div><span className="workspace-step">{projects.length} PROJECTS</span></div><div className="project-table-wrap"><table className="project-table"><thead><tr><th>CLIENT / PROJECT</th><th>STAGE</th><th>PRICE</th><th>PROGRESS</th></tr></thead><tbody>{projects.map(p=>{const pct=p.tasks.length?Math.round(p.tasks.filter(t=>t.status==="Done").length/p.tasks.length*100):0;return <tr key={p.id} onClick={()=>{setSelectedId(p.id);setFinalPrice(String(p.managerPrice||p.finalPrice||35000));setEstimate(String(p.managerPrice||35000));}}><td><strong>{p.client}</strong><small>#{p.id} · {p.title}</small></td><td><span className={"stage-pill stage-" + p.stage.toLowerCase().replaceAll(" ","-")}>{p.stage}</span></td><td>{p.finalPrice?money(p.finalPrice):p.managerPrice?money(p.managerPrice)+" proposed":"Not set"}</td><td><div className="table-progress"><span><i style={{width:pct+"%"}}/></span><small>{pct}%</small></div></td></tr>})}</tbody></table></div></section>
        <p className="workspace-footnote"><ShieldCheck size={14}/> Demo prototype only. Role switching is for preview; real authentication, permissions, database persistence, notifications and audit logs must be implemented before production.</p>
      </main>
    </div>
  </div>;
}

function LayersIcon() { return <Sparkles size={18}/>; }

function TaskList({ project, onUpdate }: { project: Project; onUpdate: (id: number, status: TaskStatus) => void }) {
  if (!project.tasks.length) return <div className="workspace-empty"><ClipboardList size={22}/><strong>No tasks assigned yet</strong><p>Once the price is approved, the manager can break the scope into tasks.</p></div>;
  return <div className="workspace-task-list">{project.tasks.map(task=><div className="workspace-task-row" key={task.id}><span className={"task-status-icon status-" + task.status.toLowerCase().replace(" ","-")}>{task.status==="Done"?<Check size={15}/>:<ClipboardList size={15}/>}</span><span className="workspace-task-info"><strong>{task.title}</strong><small>{task.owner}</small></span><label className="task-status-select"><span>Status</span><select value={task.status} onChange={e=>onUpdate(task.id,e.target.value as TaskStatus)}><option>Todo</option><option>In progress</option><option>Review</option><option>Done</option></select><ChevronDown size={13}/></label></div>)}</div>;
}
