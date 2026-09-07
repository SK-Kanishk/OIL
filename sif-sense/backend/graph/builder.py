"""
SIF-Sense AI — SIF Precursor Intelligence Graph Builder
Uses NetworkX to build and serialize a cross-report precursor graph.

Graph Node Types:
  - location
  - activity
  - hazard
  - barrier_failure
  - report
  - sif_signal

Graph Edges represent relationships:
  location → activity → hazard → barrier_failure → report → sif_signal
"""

import networkx as nx
from typing import List, Optional


def build_report_graph(report: dict) -> dict:
    """
    Build a precursor intelligence graph for a single report.
    Returns React Flow compatible nodes + edges.
    """
    G = nx.DiGraph()
    nodes = []
    edges = []

    location = report.get("location", "Unspecified Location")
    activity = report.get("activity", "General Work")
    hazard = report.get("hazard", "Unspecified Hazard")
    barrier = report.get("barrier_failure")
    risk_score = report.get("risk_score", 0)
    sif_potential = report.get("sif_potential", False)
    similar_count = report.get("similar_report_count", 0)

    # ── NODES ────────────────────────────────────────────────────────────────
    node_defs = [
        {
            "id": "n_location",
            "type": "location",
            "label": f"📍 {location}",
            "color": "#6366f1",
            "level": 0,
        },
        {
            "id": "n_activity",
            "type": "activity",
            "label": f"⚙️ {activity}",
            "color": "#8b5cf6",
            "level": 1,
        },
        {
            "id": "n_hazard",
            "type": "hazard",
            "label": f"⚠️ {hazard}",
            "color": "#f59e0b",
            "level": 2,
        },
    ]

    if barrier:
        node_defs.append({
            "id": "n_barrier",
            "type": "barrier_failure",
            "label": f"🚫 {barrier}",
            "color": "#ef4444",
            "level": 3,
        })

    if similar_count > 0:
        node_defs.append({
            "id": "n_similar",
            "type": "pattern",
            "label": f"🔁 {similar_count} Related Reports",
            "color": "#f97316",
            "level": 4,
        })

    if sif_potential:
        node_defs.append({
            "id": "n_sif",
            "type": "sif_signal",
            "label": f"🚨 SIF Potential\n{risk_score}/100",
            "color": "#dc2626",
            "level": 5,
        })
        node_defs.append({
            "id": "n_action",
            "type": "action",
            "label": "👁️ HSE Review\nRequired",
            "color": "#059669",
            "level": 6,
        })
    else:
        node_defs.append({
            "id": "n_action",
            "type": "action",
            "label": "✅ Monitor\n& Log",
            "color": "#059669",
            "level": 5,
        })

    # Position nodes vertically with spacing
    x_positions = [0, 0, 0, 0, 0, 0, 0]
    y_spacing = 120

    for i, nd in enumerate(node_defs):
        nodes.append({
            "id": nd["id"],
            "data": {
                "label": nd["label"],
                "type": nd["type"],
                "color": nd["color"],
            },
            "position": {"x": 300, "y": i * y_spacing},
            "type": "custom",
        })

    # ── EDGES ────────────────────────────────────────────────────────────────
    node_ids = [nd["id"] for nd in node_defs]
    for i in range(len(node_ids) - 1):
        edges.append({
            "id": f"e{i}",
            "source": node_ids[i],
            "target": node_ids[i + 1],
            "animated": sif_potential,
            "style": {"stroke": "#6366f1", "strokeWidth": 2},
        })

    return {"nodes": nodes, "edges": edges}


def build_pattern_graph(reports: List[dict]) -> dict:
    """
    Build a multi-report pattern graph showing connections across reports.
    Groups reports by location + activity + hazard.
    Returns React Flow compatible nodes + edges.
    """
    G = nx.DiGraph()
    nodes = []
    edges = []
    node_map = {}
    node_counter = [0]

    def get_or_create_node(label: str, node_type: str, color: str) -> str:
        if label not in node_map:
            nid = f"node_{node_counter[0]}"
            node_counter[0] += 1
            node_map[label] = nid
            nodes.append({
                "id": nid,
                "data": {"label": label, "type": node_type, "color": color},
                "position": {"x": 0, "y": 0},
                "type": "custom",
            })
        return node_map[label]

    edge_set = set()

    for report in reports:
        loc = report.get("location", "Unknown")
        act = report.get("activity", "Unknown")
        haz = report.get("hazard", "Unknown")
        barr = report.get("barrier_failure")
        rid = str(report.get("id", "?"))

        loc_id = get_or_create_node(f"📍 {loc}", "location", "#6366f1")
        act_id = get_or_create_node(f"⚙️ {act}", "activity", "#8b5cf6")
        haz_id = get_or_create_node(f"⚠️ {haz}", "hazard", "#f59e0b")
        rep_id = get_or_create_node(f"📄 Report #{rid}", "report", "#0ea5e9")

        for src, tgt in [(loc_id, act_id), (act_id, haz_id), (haz_id, rep_id)]:
            eid = f"e_{src}_{tgt}"
            if eid not in edge_set:
                edge_set.add(eid)
                edges.append({
                    "id": eid,
                    "source": src,
                    "target": tgt,
                    "animated": True,
                    "style": {"stroke": "#6366f1", "strokeWidth": 1.5},
                })

        if barr:
            barr_id = get_or_create_node(f"🚫 {barr}", "barrier_failure", "#ef4444")
            eid = f"e_{rep_id}_{barr_id}"
            if eid not in edge_set:
                edge_set.add(eid)
                edges.append({
                    "id": eid,
                    "source": rep_id,
                    "target": barr_id,
                    "style": {"stroke": "#ef4444", "strokeWidth": 1.5},
                })

    # Apply force-directed-like layout (simple grid)
    cols = max(1, int(len(nodes) ** 0.5) + 1)
    for i, node in enumerate(nodes):
        node["position"] = {
            "x": (i % cols) * 220,
            "y": (i // cols) * 130
        }

    return {"nodes": nodes, "edges": edges}
