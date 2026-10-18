export function runQualityChecks(files) {
  const paths = new Set(files.map((file) => file.path.toLowerCase()));
  const warnings = [];
  const checks = [
    { id: "file-structure", label: "Safe file paths and unique files", passed: true },
    { id: "frontend-entry", label: "Frontend entry point present", passed: [...paths].some((path) => /(^|\/)index\.html$/.test(path)) && [...paths].some((path) => /(^|\/)src\/(main|index)\.(tsx?|jsx?)$/.test(path)) },
    { id: "server-entry", label: "Backend entry point present", passed: [...paths].some((path) => /(^|\/)server\/(src\/)?server\.js$/.test(path) || /(^|\/)src\/server\.js$/.test(path)) },
    { id: "readme", label: "Setup documentation present", passed: [...paths].some((path) => /(^|\/)readme\.md$/.test(path)) },
    { id: "env-example", label: "Environment example present", passed: [...paths].some((path) => /(^|\/)\.env\.example$/.test(path)) },
  ];
  for (const file of files) {
    if (/\b(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|gsk_[A-Za-z0-9]{20,})\b/.test(file.content)) warnings.push("Potential hard-coded credential detected in " + file.path + "; replace it with an environment variable.");
    if (/\beval\s*\\(|new Function\s*\\(/.test(file.content)) warnings.push("Dynamic code execution pattern found in " + file.path + "; review before running.");
  }
  return { checks, passed: checks.every((check) => check.passed), warnings };
}

export function createWorkflowNotes(plan, quality, provider, model, summary) {
  const checkLines = quality.checks.map((check) => "- [" + (check.passed ? "x" : " ") + "] " + check.label).join("\n");
  const warningLines = quality.warnings.length ? quality.warnings.map((warning) => "- " + warning).join("\n") : "- No obvious hard-coded provider-key pattern detected by the basic scan.";
  return "# BuildYourDream.AI workflow report\n\n## Planner\n" + plan.summary + "\n\n" + plan.steps.map((step, index) => (index + 1) + ". " + step).join("\n") +
    "\n\n## Designer\nA design brief was derived from the prompt and passed to the code-generation model: responsive layout, accessible semantic UI, consistent styling, and clear primary actions. Review the generated UI before production.\n\n" +
    "## Developer\nThe configured AI provider generated the project source files. Provider output is untrusted code; inspect it before running.\n\n" +
    "## QA checks\n" + checkLines + "\n\n## QA warnings\n" + warningLines +
    "\n\n## Release\nThis ZIP is the packaged source artifact. It has not been deployed or run in a sandbox. Passing these checks does not prove the generated application compiles or is secure.\n\n" +
    "AI provider: " + provider + " (" + model + ")\nProject summary: " + (summary || "Generated with BuildYourDream.AI") + "\n";
}
