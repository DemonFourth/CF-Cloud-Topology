import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useOnSelectionChange,
} from '@xyflow/react';
import axios from 'axios';
import { Cloud, Plus, ChevronDown, Check } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import {
  ASSET_TYPE_OPTIONS,
  NODE_TYPES,
  LOCAL_GRAPH_KEY,
  type TopologyNode,
  type TopologyEdge,
} from './types';
import { CustomNode, CustomEdge } from './components/CustomNode';
import { NodeEditorPanel } from './components/NodeEditorPanel';
import { EdgeEditorPanel } from './components/EdgeEditorPanel';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';
const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

// Metadata field templates per node type (label, input type)
const METADATA_TEMPLATES: Record<string, [string, string][]> = {
  provider:    [['Name', 'text'], ['Account ID', 'text'], ['Notes', 'text']],
  domain:      [['Registrar', 'text'], ['Expiry Date', 'text'], ['Nameservers', 'text']],
  app:         [['URL', 'text'], ['Framework', 'text'], ['Status', 'text']],
  database:    [['Connection String', 'text'], ['Version', 'text'], ['Host', 'text']],
  cdn:         [['Zone Name', 'text'], ['Origin', 'text']],
  storage:     [['Bucket Name', 'text'], ['Region', 'text'], ['CDN Domain', 'text']],
  mail:        [['MX Record', 'text'], ['Provider', 'text']],
  ssl:         [['Domain', 'text'], ['Expiry', 'text']],
  container:   [['Image', 'text'], ['Port', 'text'], ['Status', 'text']],
  server:      [['IP Address', 'text'], ['Port', 'text'], ['OS', 'text'], ['Region', 'text']],
  dns:         [['Record Type', 'text'], ['TTL', 'text'], ['Value', 'text']],
  network:     [['IP Range', 'text'], ['Protocol', 'text'], ['Port Range', 'text']],
  certificate: [['Domain', 'text'], ['Issuer', 'text'], ['Expiry', 'text']],
  worker:      [['Route', 'text'], ['Environment', 'text']],
  bucket:      [['Name', 'text'], ['Region', 'text'], ['Access URL', 'text']],
  person:      [['Email', 'text'], ['Role', 'text'], ['Notes', 'text']],
  custom:     [['Notes', 'text']],
  api:         [['Endpoint URL', 'text'], ['Auth Type', 'text'], ['Version', 'text']],
  cron:        [['Schedule', 'text'], ['Command', 'text'], ['Timezone', 'text']],
  docker:      [['Image Name', 'text'], ['Registry', 'text'], ['Tag', 'text']],
  github:      [['Repository', 'text'], ['Workflow', 'text'], ['Trigger', 'text']],
  webhook:     [['URL', 'text'], ['Secret', 'text'], ['Events', 'text']],
  database_extra: [['Host', 'text'], ['Port', 'text'], ['Engine', 'text']],
  service:     [['Name', 'text'], ['Version', 'text'], ['Endpoint', 'text']],
  cdn_extra:   [['Zone', 'text'], ['Plan', 'text']],
  monitoring:  [['Endpoint', 'text'], ['Interval (s)', 'text']],
  logging:     [['Endpoint', 'text'], ['Index', 'text']],
  cache:       [['Host', 'text'], ['Port', 'text'], ['TTL (s)', 'text']],
  gateway:     [['Endpoint', 'text'], ['Auth', 'text']],
  loadbalancer:[['Algorithm', 'text'], ['Targets', 'text']],
  firewall:   [['Rules', 'text'], ['Interface', 'text']],
  vpn:        [['Remote IP', 'text'], ['Protocol', 'text']],
  storage_extra: [['Name', 'text'], ['Region', 'text'], ['Class', 'text']],
};

function readLocalGraph() {
  const raw = window.localStorage.getItem(LOCAL_GRAPH_KEY);
  if (!raw) return { nodes: [], edges: [] };
  try { return JSON.parse(raw); }
  catch { return { nodes: [], edges: [] }; }
}

function writeLocalGraph(nodes: TopologyNode[], edges: TopologyEdge[]) {
  window.localStorage.setItem(LOCAL_GRAPH_KEY, JSON.stringify({ nodes, edges }));
}

function normalizeNode(raw: any): TopologyNode {
  return {
    id: raw.id,
    type: 'custom',
    position: raw.position ?? { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
    data: {
      type: (raw.data?.type) ?? (raw.type) ?? 'custom',
      label: raw.data?.label ?? raw.label ?? raw.id,
      icon: raw.data?.icon,
      metadata: raw.data?.metadata ?? {},
    },
  };
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<TopologyNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TopologyEdge>([]);
  const [loading, setLoading] = useState(true);
  const [syncMode, setSyncMode] = useState('api');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState('provider');
  const [label, setLabel] = useState('');
  const [editingNode, setEditingNode] = useState<TopologyNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<TopologyEdge | null>(null);

  const showToast = useCallback((message: string, toastType: Toast['type'] = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type: toastType }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // Track selected nodes for highlight
  useOnSelectionChange({
    onChange: ({ nodes: selected }) => {
      setSelectedNodeIds(selected.map(n => n.id));
    },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await axios.get(API_BASE + '/api/graph');
      const normNodes = resp.data.nodes.map(normalizeNode);
      setNodes(normNodes as any[]);
      setEdges(resp.data.edges ?? []);
      setSyncMode('api');
    } catch {
      const local = readLocalGraph();
      setNodes((local.nodes as TopologyNode[]).map(normalizeNode) as any[]);
      setEdges(local.edges as TopologyEdge[]);
      setSyncMode('local');
    } finally {
      setLoading(false);
    }
  }, [setEdges, setNodes]);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    if (!loading) writeLocalGraph(nodes as TopologyNode[], edges as TopologyEdge[]);
  }, [nodes, edges, loading]);

  useEffect(() => {
    const onEditNode = (e: Event) => {
      const nodeId = (e as CustomEvent).detail;
      const node = nodes.find((n: TopologyNode) => n.id === nodeId);
      if (node) setEditingNode(node);
    };
    const onDeleteNode = (e: Event) => {
      const nodeId = (e as CustomEvent).detail;
      setNodes((ns: TopologyNode[]) => (ns.filter((n: TopologyNode) => n.id !== nodeId)) as any[]);
      setEdges((es: TopologyEdge[]) => (es.filter((ed: TopologyEdge) => ed.source !== nodeId && ed.target !== nodeId)) as any[]);
      axios.delete(API_BASE + '/api/nodes/' + nodeId).catch(() => setSyncMode('local'));
    };
    window.addEventListener('cloud-topology:edit-node', onEditNode);
    window.addEventListener('cloud-topology:delete-node', onDeleteNode);
    return () => {
      window.removeEventListener('cloud-topology:edit-node', onEditNode);
      window.removeEventListener('cloud-topology:delete-node', onDeleteNode);
    };
  }, [nodes, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: TopologyNode) => {
    setEditingNode(node);
  }, []);

  const onEdgeDoubleClick = useCallback((_: any, edge: TopologyEdge) => {
    setEditingEdge(edge);
  }, []);

  const onConnect = useCallback((params: any) => {
    if (!params.source || !params.target) return;
    const id = 'e-' + params.source + '-' + params.target + '-' + Date.now();
    const newEdge: TopologyEdge = {
      id,
      source: params.source,
      target: params.target,
      data: { label: '', color: '#94a3b8', style: 'solid', arrow: 'target' },
    };
    setEdges((es: TopologyEdge[]) => addEdge(newEdge, es) as TopologyEdge[]);
    axios.post(API_BASE + '/api/edges', newEdge).catch(() => setSyncMode('local'));
  }, [setEdges]);

  const onNodeDragStop = useCallback((_: any, node: TopologyNode) => {
    setNodes((ns: TopologyNode[]) => (ns.map((n: TopologyNode) => n.id === node.id ? { ...n, position: node.position } : n)) as any[]);
    const raw = nodes.find((n: TopologyNode) => n.id === node.id);
    if (raw) axios.post(API_BASE + '/api/nodes', { ...raw, position: node.position }).catch(() => setSyncMode('local'));
  }, [nodes, setNodes]);

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    const id = type + '-' + Date.now();
    const template = METADATA_TEMPLATES[type] ?? [];
    const metadata: Record<string, string> = {};
    template.forEach(([k]) => { metadata[k] = ''; });
    const newNode: TopologyNode = {
      id,
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { type: type as any, label: label.trim(), metadata },
    };
    setNodes((ns: TopologyNode[]) => [...ns, newNode] as any[]);
    axios.post(API_BASE + '/api/nodes', { id, type, label: label.trim() }).catch(() => setSyncMode('local'));
    setLabel('');
    setShowAddForm(false);
    showToast('Node added', 'success');
  };

  const handleSaveNode = (nodeId: string, updates: any) => {
    setNodes((ns: TopologyNode[]) =>
      ns.map((n: TopologyNode) => n.id === nodeId
        ? { ...n, data: { ...n.data, ...updates } }
        : n
      ) as any[]
    );
    setEditingNode(null);
    showToast('Node saved', 'success');
    axios.post(API_BASE + '/api/nodes', { id: nodeId, ...updates }).catch(() => setSyncMode('local'));
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((ns: TopologyNode[]) => ns.filter((n: TopologyNode) => n.id !== nodeId) as any[]);
    setEdges((es: TopologyEdge[]) => es.filter((e: TopologyEdge) => e.source !== nodeId && e.target !== nodeId) as any[]);
    setEditingNode(null);
    showToast('Node deleted', 'info');
    axios.delete(API_BASE + '/api/nodes/' + nodeId).catch(() => setSyncMode('local'));
  };

  const handleSaveEdge = (edgeId: string, data: any) => {
    setEdges((es: TopologyEdge[]) =>
      es.map((e: TopologyEdge) => e.id === edgeId
        ? { ...e, data: { ...(e.data ?? {}), ...data } }
        : e
      )
    );
    setEditingEdge(null);
    showToast('Edge saved', 'success');
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((es: TopologyEdge[]) => es.filter((e: TopologyEdge) => e.id !== edgeId));
    setEditingEdge(null);
    showToast('Edge deleted', 'info');
  };

  const currentTypeConfig = useMemo(() => NODE_TYPES[type as keyof typeof NODE_TYPES] ?? NODE_TYPES.custom, [type]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Toast notifications */}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg transition-all ${
              t.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' :
              t.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' :
              'border-blue-200 bg-blue-50 text-blue-700'
            }`}
          >
            <Check className="h-4 w-4" />
            {t.message}
          </div>
        ))}
      </div>

      <aside className="z-10 flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-5 pb-4">
          <h1 className="flex items-center gap-2 text-lg font-extrabold text-primary">
            <Cloud className="h-5 w-5" />
            Cloud-Topology
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            {nodes.length} nodes / {edges.length} edges
          </p>
        </div>

        <div className="border-b border-slate-200 p-5">
          {!showAddForm ? (
            <button type="button" onClick={() => setShowAddForm(true)} className="btn btn-primary w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Node
            </button>
          ) : (
            <form onSubmit={handleAddNode} className="space-y-3">
              <div className="form-control">
                <label className="label py-0">
                  <span className="label-text text-xs font-semibold text-slate-500">Type</span>
                </label>
                <div className="relative">
                  <select
                    className="select select-bordered w-full text-sm appearance-none"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {ASSET_TYPE_OPTIONS.map((t) => (<option key={t} value={t}>{NODE_TYPES[t as keyof typeof NODE_TYPES].label}</option>))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {(METADATA_TEMPLATES[type]?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Pre-filled fields</span>
                  <div className="flex flex-wrap gap-1">
                    {METADATA_TEMPLATES[type].map(([k]) => (
                      <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-control">
                <label className="label py-0">
                  <span className="label-text text-xs font-semibold text-slate-500">Label</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full text-sm"
                  placeholder={currentTypeConfig.label}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowAddForm(false); setLabel(''); }} className="btn btn-ghost btn-sm flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm flex-1 gap-1"><Plus className="h-3.5 w-3.5" />Add</button>
              </div>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Node Types ({ASSET_TYPE_OPTIONS.length})</p>
          <div className="space-y-1">
            {ASSET_TYPE_OPTIONS.map((t) => {
              const cfg = NODE_TYPES[t as keyof typeof NODE_TYPES];
              const Icon = cfg.icon;
              const count = nodes.filter((n: TopologyNode) => n.data.type === t).length;
              const cls = type === t ? 'bg-slate-100 font-semibold' : 'text-slate-600';
              return (
                <div
                  key={t}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${cls}`}
                  onClick={() => { setType(t); setShowAddForm(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
                  <span className="flex-1">{cfg.label}</span>
                  <span className="font-mono text-[10px] text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
          <p className="text-[10px] leading-relaxed text-slate-400">
            Click node to edit / Double-click edge to edit / Drag between nodes to connect
          </p>
        </div>
      </aside>

      <main className="relative h-full flex-1">
        {loading && (<div className="absolute left-4 top-4 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow">Loading...</div>)}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow">
          <div className={`h-1.5 w-1.5 rounded-full ${syncMode === 'api' ? 'bg-green-400' : 'bg-amber-400'}`} />
          {syncMode === 'api' ? 'API Sync' : 'Local Mode'}
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          fitView
          deleteKeyCode="Delete"
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
        </ReactFlow>
      </main>

      <NodeEditorPanel
        node={editingNode}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
      />
      {editingEdge && (
        <EdgeEditorPanel
          edge={editingEdge}
          onClose={() => setEditingEdge(null)}
          onSave={handleSaveEdge}
          onDelete={handleDeleteEdge}
        />
      )}
    </div>
  );
}