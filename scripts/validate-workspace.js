import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createGroupMemoryRuntime } from "../src/core/group-memory-runtime.js";
import { groupFlowSeedData } from "../src/fixtures/seed-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const checks = [];

function check(name, fn) {
  checks.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

check("project wording excludes forbidden temporary language", () => {
  const files = listFiles(root).filter((file) => {
    const relative = path.relative(root, file);
    return !relative.startsWith("node_modules") && /\.(md|html|js|css|json)$/.test(file);
  });

  const forbidden = new RegExp(`\\b${["d", "e", "m", "o"].join("")}\\b`, "i");
  const offenders = files
    .map((file) => {
      const text = fs.readFileSync(file, "utf8");
      return forbidden.test(text) ? path.relative(root, file) : null;
    })
    .filter(Boolean);

  assert(offenders.length === 0, `forbidden wording found in: ${offenders.join(", ")}`);
});

check("README keeps only background, purpose, and usage intent", () => {
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  assert(readme.includes("## 项目背景"), "missing Chinese background section");
  assert(readme.includes("## 项目目的"), "missing Chinese purpose section");
  assert(readme.includes("## 如何使用"), "missing Chinese usage section");
  assert(readme.includes("## Background"), "missing English background section");
  assert(readme.includes("## Purpose"), "missing English purpose section");
  assert(readme.includes("## How to Use"), "missing English usage section");
  assert(!/Roadmap/i.test(readme), "README should not include roadmap");
});

check("fixtures contain consistent workspace group ids", () => {
  const project = groupFlowSeedData.projects.deerflow2;
  assert(project.groupIds.includes("workspace-narrative"), "workspace group id missing");
  for (const groupId of project.groupIds) {
    assert(groupFlowSeedData.groups[groupId], `missing group fixture: ${groupId}`);
  }
});

check("core runtime supports DeerFlow-style state loop", () => {
  const runtime = createGroupMemoryRuntime();
  runtime.createProject({ id: "project" });
  runtime.createGroup({
    id: "group",
    projectId: "project",
    objective: "Validate group state",
    agents: [{ id: "agent", name: "Agent", status: "ready", context: 20 }]
  });
  runtime.appendFinding("group", { agentId: "agent", content: "Finding" });
  runtime.recordDecision("group", { agentId: "agent", content: "Decision" });
  runtime.updateFileState("group", {
    path: "docs/validation-plan.md",
    role: "artifact",
    status: "modified",
    ownerAgentId: "agent"
  });
  runtime.updateAgentState("group", "agent", { status: "running", context: 45 });
  runtime.resumeGroup("group");
  const context = runtime.getGroupContext("group", { forAgentId: "agent" });
  const artifacts = runtime.listArtifacts("group");

  assert(context.status === "running", "group did not resume");
  assert(context.files.length === 1, "file state was not tracked");
  assert(context.summary.includes("Finding"), "summary did not include finding");
  assert(context.summary.includes("Decision"), "summary did not include decision");
  assert(context.agent.id === "agent", "scoped agent context missing");
  assert(context.agent.status === "running", "agent state was not updated");
  assert(artifacts.length === 1, "artifact listing failed");
});

check("workspace actions update visible group state", () => {
  const elements = new Map();
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, makeElement(selector));
      return elements.get(selector);
    }
  };

  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const appForVm = app
    .replace(
      'import { createGroupMemoryRuntime } from "./src/core/group-memory-runtime.js";',
      "const createGroupMemoryRuntime = __createGroupMemoryRuntime;"
    )
    .replace(
      'import { groupFlowSeedData } from "./src/fixtures/seed-data.js";',
      "const groupFlowSeedData = __groupFlowSeedData;"
    );
  vm.runInNewContext(appForVm, {
    document,
    console,
    __createGroupMemoryRuntime: createGroupMemoryRuntime,
    __groupFlowSeedData: groupFlowSeedData
  });

  const initialTimeline = elements.get("#timelineCount").textContent;
  for (const selector of ["#runStepButton", "#resumeButton", "#compactButton", "#refreshFilesButton"]) {
    elements.get(selector).listeners.click();
  }

  const afterActions = {
    memory: elements.get("#memoryCount").textContent,
    timeline: elements.get("#timelineCount").textContent,
    files: elements.get("#fileCount").textContent
  };

  const workspaceTab = elements
    .get("#groupTabs")
    .childButtons.find((button) => button.dataset.groupId === "workspace-narrative");
  workspaceTab.listeners.click();

  assert(initialTimeline === "2 events", "unexpected initial timeline count");
  assert(afterActions.memory === "8 entries", "workspace actions did not update memory");
  assert(afterActions.timeline === "12 events", "workspace actions did not update timeline");
  assert(afterActions.files === "2 files", "workspace actions changed file count unexpectedly");
  assert(
    elements.get("#activeGroupTitle").textContent === "Workspace Narrative Group",
    "group switching failed"
  );
});

let failures = 0;

for (const { name, fn } of checks) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(`  ${error.message}`);
  }
}

if (failures > 0) {
  process.exitCode = 1;
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function makeElement(selector) {
  const element = {
    selector,
    textContent: "",
    dataset: {},
    listeners: {},
    childButtons: [],
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    },
    querySelectorAll() {
      return this.childButtons;
    }
  };

  let html = "";
  Object.defineProperty(element, "innerHTML", {
    get() {
      return html;
    },
    set(value) {
      html = value;
      if (selector === "#groupTabs") {
        element.childButtons = [...value.matchAll(/data-group-id="([^"]+)"/g)].map((match) => {
          const button = makeElement(`tab:${match[1]}`);
          button.dataset.groupId = match[1];
          return button;
        });
      }
    }
  });

  return element;
}
