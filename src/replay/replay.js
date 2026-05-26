export function replayTimeline(state, groupId) {
  const group = requireGroup(state, groupId);
  return group.timeline.map((event, index) => ({
    index,
    title: event.title,
    detail: event.detail || "",
    actor: event.actor || "groupflow",
    at: event.at || null
  }));
}

export function getMemoryVersions(state, groupId) {
  const group = requireGroup(state, groupId);
  const memoryEvents = group.timeline.filter((event) => {
    return ["Finding appended", "Decision recorded", "Group Memory compacted"].includes(event.title);
  });

  return [
    ...memoryEvents.map((event, index) => ({
      index,
      source: "timeline",
      title: event.title,
      actor: event.actor || "groupflow",
      detail: event.detail || ""
    })),
    {
      index: memoryEvents.length,
      source: "current",
      title: "Current memory snapshot",
      memory: clone(group.memory)
    }
  ];
}

export function getFileStateVersions(state, groupId) {
  const group = requireGroup(state, groupId);
  const fileEvents = group.timeline.filter((event) => event.title === "File state updated");

  return [
    ...fileEvents.map((event, index) => ({
      index,
      source: "timeline",
      title: event.title,
      actor: event.actor || "groupflow",
      detail: event.detail || ""
    })),
    {
      index: fileEvents.length,
      source: "current",
      title: "Current file state snapshot",
      files: clone(group.files)
    }
  ];
}

function requireGroup(state, groupId) {
  const group = state.groups?.[groupId];
  if (!group) throw new Error(`Unknown group: ${groupId}`);
  return group;
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

