import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

const TYPE_STYLES = {
  location: { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', icon: '📍' },
  activity: { bg: 'rgba(139,92,246,0.15)', border: '#8b5cf6', icon: '⚙️' },
  hazard: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', icon: '⚠️' },
  barrier_failure: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', icon: '🚫' },
  pattern: { bg: 'rgba(249,115,22,0.15)', border: '#f97316', icon: '🔁' },
  sif_signal: { bg: 'rgba(239,68,68,0.2)', border: '#dc2626', icon: '🚨' },
  action: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', icon: '👁️' },
  report: { bg: 'rgba(14,165,233,0.15)', border: '#0ea5e9', icon: '📄' },
};

function CustomNode({ data }) {
  const style = TYPE_STYLES[data.type] || TYPE_STYLES.location;
  const lines = data.label.split('\n');

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: style.border, border: 'none', width: 8, height: 8 }} />
      <div style={{
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: 12,
        padding: '10px 16px',
        minWidth: 160,
        maxWidth: 200,
        boxShadow: `0 0 16px ${style.border}40`,
        transition: 'all 0.2s',
        cursor: 'default',
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            fontSize: i === 0 ? '0.85rem' : '0.72rem',
            fontWeight: i === 0 ? 700 : 600,
            color: i === 0 ? '#f1f5f9' : '#94a3b8',
            textAlign: 'center',
            lineHeight: 1.4,
          }}>
            {line}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: style.border, border: 'none', width: 8, height: 8 }} />
    </>
  );
}

const nodeTypes = { custom: CustomNode };

export default function PrecursorGraph({ nodes: initialNodes = [], edges: initialEdges = [] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!initialNodes.length) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '0.9rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🕸️</div>
          <div>Submit a report to see the intelligence graph</div>
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      defaultEdgeOptions={{
        style: { stroke: '#6366f1', strokeWidth: 2 },
        animated: true,
      }}
    >
      <Background color="#1e293b" gap={20} size={1} />
      <Controls style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }} />
      <MiniMap
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}
        nodeColor={(n) => TYPE_STYLES[n.data?.type]?.border || '#6366f1'}
      />
    </ReactFlow>
  );
}
