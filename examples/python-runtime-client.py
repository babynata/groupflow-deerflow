from groupflow_deerflow.client import GroupFlowClient


groupflow = GroupFlowClient("http://127.0.0.1:8765")

groupflow.call_tool("create_project", {
    "project": {"id": "deerflow-project", "name": "DeerFlow Project"}
})
groupflow.call_tool("create_group", {
    "group": {
        "id": "deerflow-group",
        "projectId": "deerflow-project",
        "objective": "Use GroupFlow as shared state for a DeerFlow run.",
    }
})
groupflow.call_tool("register_agent", {
    "groupId": "deerflow-group",
    "agent": {"id": "researcher", "name": "Researcher", "status": "ready"},
})

context = groupflow.call_tool("get_group_context", {
    "groupId": "deerflow-group",
    "options": {"forAgentId": "researcher"},
})

groupflow.call_tool("append_finding", {
    "groupId": "deerflow-group",
    "finding": {
        "agentId": "researcher",
        "content": "GroupFlow can provide shared context during DeerFlow execution.",
    },
})
groupflow.call_tool("update_file_state", {
    "groupId": "deerflow-group",
    "fileState": {
        "path": "/mnt/user-data/outputs/groupflow-runtime-note.md",
        "role": "artifact",
        "status": "modified",
        "ownerAgentId": "researcher",
    },
})

print(context["summary"])
