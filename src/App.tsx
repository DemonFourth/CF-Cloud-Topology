import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import axios from 'axios';
import { AlertCircle, Check, CheckCircle2, ChevronDown, Cloud, FolderOpen, Languages, Pencil, Plus, Trash2, X } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import {
  ASSET_TYPE_OPTIONS,
  NODE_TYPES,
  LOCAL_GRAPH_KEY,
  canvasGraphKey,
  LOCAL_CANVAS_STORE_KEY,
  type TopologyNode,
  type TopologyEdge,
  type LocalCanvas,
} from './types';
import { CustomNode, CustomEdge } from './components/CustomNode';
import { NodeEditorPanel } from './components/NodeEditorPanel';
import { EdgeEditorPanel } from './components/EdgeEditorPanel';
import { I18nProvider, useI18n } from './i18n';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';
const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

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

// -- Canvas Store helpers --

function readCanvasStore(): LocalCanvas[] {
  const raw = localStorage.getItem(LOCAL_CANVAS_STORE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function writeCanvasStore(canvases: LocalCanvas[]) {
  localStorage.setItem(LOCAL_CANVAS_STORE_KEY, JSON.stringify(canvases));
}

function ensureDefaultCanvas(): LocalCanvas {
  const canvases = readCanvasStore();
  if (canvases.length > 0) return canvases[0];
  const defaultCanvas: LocalCanvas = {
    id: 'default',
    name: 'My Topology',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  writeCanvasStore([defaultCanvas]);
  return defaultCanvas;
}

// -- Legacy data migration --

function migrateLegacyData(canvasId: string) {
  const key = canvasGraphKey(canvasId);
  const existing = localStorage.getItem(key);
  if (existing) return;

  const legacy = localStorage.getItem(LOCAL_GRAPH_KEY);
  if (legacy) {
    localStorage.setItem(key, legacy);
  }
}

// -- Graph helpers --

function readGraph(canvasId: string) {
  const raw = localStorage.getItem(canvasGraphKey(canvasId));
  if (!raw) return { nodes: [], edges: [] };
  try { return JSON.parse(raw); } catch { return { nodes: [], edges: [] }; }
}

function writeGraph(canvasId: string, nodes: TopologyNode[], edges: TopologyEdge[]) {
  localStorage.setItem(canvasGraphKey(canvasId), JSON.stringify({ nodes, edges }));
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

function AppInner() {
  const { t: tr, toggleLang, lang } = useI18n();
  const [nodes, setNodes, onNodesChange] = useNodesState<TopologyNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TopologyEdge>([]);
  const [loading, setLoading] = useState(true);
  const [syncMode, setSyncMode] = useState('api');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  // -- Canvas state --
  const [canvases, setCanvases] = useState<LocalCanvas[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string>('default');
  const [showCanvasMenu, setShowCanvasMenu] = useState(false);
  const [editingCanvasId, setEditingCanvasId] = useState<string | null>(null);
  const [canvasNameInput, setCanvasNameInput] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [nodeType, setNodeType] = useState('provider');
  const [label, setLabel] = useState('');
  const [editingNode, setEditingNode] = useState<TopologyNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<TopologyEdge | null>(null);

  const activeCanvas = useMemo(
    () => canvases.find((c) => c.id === activeCanvasId) ?? null,
    [canvases, activeCanvasId]
  );

  const showToast = useCallback((key: string, toastType: Toast['type'] = 'success') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message: tr(key), type: toastType }]);
    setTimeout(() => setToasts((prev) => prev.filter((ti) => ti.id !== id)), 3000);
  }, [tr]);

  // -- Canvas operations --

  const updateCanvasStore = useCallback((updated: LocalCanvas[]) => {
    setCanvases(updated);
    writeCanvasStore(updated);
  }, []);

  const handleCreateCanvas = useCallback(() => {
    const name = tr('canvas.defaultName', { n: String(canvases.length + 1) });
    const newCanvas: LocalCanvas = {
      id: 'canvas-' + Date.now(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...canvases, newCanvas];
    updateCanvasStore(updated);
    setActiveCanvasId(newCanvas.id);
    setShowCanvasMenu(false);
    showToast('canvas.created');
  }, [canvases, updateCanvasStore, showToast, tr]);

  const handleRenameCanvas = useCallback((canvasId: string) => {
    if (!canvasNameInput.trim()) return;
    const updated = canvases.map((c) =>
      c.id === canvasId ? { ...c, name: canvasNameInput.trim(), updatedAt: Date.now() } : c
    );
    updateCanvasStore(updated);
    setEditingCanvasId(null);
    setCanvasNameInput('');
    showToast('canvas.renamed');
  }, [canvases, updateCanvasStore, canvasNameInput, showToast]);

  const handleDeleteCanvas = useCallback((canvasId: string) => {
    if (canvases.length === 1) {
      showToast('canvas.deleteLast', 'error');
      return;
    }
    if (!window.confirm(tr('canvas.deleteConfirm'))) return;
    const updated = canvases.filter((c) => c.id !== canvasId);
    updateCanvasStore(updated);
    localStorage.removeItem(canvasGraphKey(canvasId));
    if (activeCanvasId === canvasId) {
      setActiveCanvasId(updated[0].id);
    }
    showToast('canvas.deleted', 'info');
  }, [canvases, activeCanvasId, updateCanvasStore, showToast, tr]);

  const handleSwitchCanvas = useCallback((canvasId: string) => {
    writeGraph(activeCanvasId, nodes, edges);
    setActiveCanvasId(canvasId);
    setShowCanvasMenu(false);
    setEditingNode(null);
    setEditingEdge(null);
  }, [activeCanvasId, nodes, edges]);

  const startRename = useCallback((canvas: LocalCanvas) => {
    setEditingCanvasId(canvas.id);
    setCanvasNameInput(canvas.name);
    setShowCanvasMenu(true);
  }, []);

  // -- Load graph data when active canvas changes --

  const loadGraphForCanvas = useCallback(
    (canvasId: string) => {
      setLoading(true);
      migrateLegacyData(canvasId);
      const graph = readGraph(canvasId);
      setNodes((graph.nodes as TopologyNode[]).map(normalizeNode) as any[]);
      setEdges(graph.edges as TopologyEdge[]);
      setLoading(false);
    },
    [setNodes, setEdges]
  );

  // Initialize canvases on mount
  useEffect(() => {
    const stored = readCanvasStore();
    if (stored.length === 0) {
      const defaultCanvas = ensureDefaultCanvas();
      setCanvases([defaultCanvas]);
      setActiveCanvasId(defaultCanvas.id);
    } else {
      setCanvases(stored);
      setActiveCanvasId(stored[0].id);
    }
  }, []);

  // Load graph when active canvas id is determined
  useEffect(() => {
    if (!activeCanvasId) return;
    loadGraphForCanvas(activeCanvasId);
  }, [activeCanvasId, loadGraphForCanvas]);

  // Persist graph on change
  useEffect(() => {
    if (!loading && activeCanvasId) {
      writeGraph(activeCanvasId, nodes as TopologyNode[], edges as TopologyEdge[]);
      // Update canvas's updatedAt
      const updated = canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, updatedAt: Date.now() } : c
      );
      updateCanvasStore(updated);
    }
  }, [nodes, edges, loading, activeCanvasId, canvases, updateCanvasStore]);

  // Node events
  useEffect(() => {
    const onEditNode = (e: Event) => {
      const nodeId = (e as CustomEvent).detail;
      const node = nodes.find((n: TopologyNode) => n.id === nodeId);
      if (node) setEditingNode(node);
    };
    const onDeleteNode = (e: Event) => {
      const nodeId = (e as CustomEvent).detail;
      setNodes((ns: TopologyNode[]) => (ns.filter((n: TopologyNode) => n.id !== nodeId)) as any[]);
      setEdges((es: TopologyEdge[]) =>
        (es.filter((ed: TopologyEdge) => ed.source !== nodeId && ed.target !== nodeId)) as any[]
      );
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

  const onNodeDragStop = useCallback(
    (_: any, node: TopologyNode) => {
      setNodes((ns: TopologyNode[]) =>
        (ns.map((n: TopologyNode) => (n.id === node.id ? { ...n, position: node.position } : n)) as any[])
      );
      const raw = nodes.find((n: TopologyNode) => n.id === node.id);
      if (raw) axios.post(API_BASE + '/api/nodes', { ...raw, position: node.position }).catch(() => setSyncMode('local'));
    },
    [nodes, setNodes]
  );

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    const id = nodeType + '-' + Date.now();
    const template = METADATA_TEMPLATES[nodeType] ?? [];
    const metadata: Record<string, string> = {};
    template.forEach(([k]) => { metadata[k] = ''; });
    const newNode: TopologyNode = {
      id,
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { type: nodeType as any, label: label.trim(), metadata },
    };
    setNodes((ns: TopologyNode[]) => [...ns, newNode] as any[]);
    axios.post(API_BASE + '/api/nodes', { id, type: nodeType, label: label.trim(), metadata }).catch(() => setSyncMode('local'));
    setLabel('');
    setShowAddForm(false);
    showToast('nodeAdded');
  };

  const handleSaveNode = (nodeId: string, updates: any) => {
    setNodes((ns: TopologyNode[]) =>
      ns.map((n: TopologyNode) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
      ) as any[]
    );
    setEditingNode(null);
    showToast('nodeSaved');
    axios.post(API_BASE + '/api/nodes', { id: nodeId, ...updates }).catch(() => setSyncMode('local'));
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((ns: TopologyNode[]) => ns.filter((n: TopologyNode) => n.id !== nodeId) as any[]);
    setEdges((es: TopologyEdge[]) => es.filter((e: TopologyEdge) => e.source !== nodeId && e.target !== nodeId) as any[]);
    setEditingNode(null);
    showToast('nodeDeleted', 'info');
    axios.delete(API_BASE + '/api/nodes/' + nodeId).catch(() => setSyncMode('local'));
  };

  const handleSaveEdge = (edgeId: string, data: any) => {
    setEdges((es: TopologyEdge[]) =>
      es.map((e: TopologyEdge) => (e.id === edgeId ? { ...e, data: { ...(e.data ?? {}), ...data } } : e))
    );
    setEditingEdge(null);
    showToast('edgeSaved');
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((es: TopologyEdge[]) => es.filter((e: TopologyEdge) => e.id !== edgeId));
    setEditingEdge(null);
    showToast('edgeDeleted', 'info');
  };

  const currentTypeConfig = useMemo(
    () => NODE_TYPES[nodeType as keyof typeof NODE_TYPES] ?? NODE_TYPES.custom,
    [nodeType]
  );

  return (
    <div className='flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900'>
      {/* Toasts */}
      <div className='fixed right-4 bottom-4 z-50 flex flex-col gap-2'>
        {toasts.map((ti) => (
          <div
            key={ti.id}
            className='flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg transition-all'
          >
            {ti.type === 'success' ? <Check className='h-4 w-4' /> : <AlertCircle className='h-4 w-4' />}
            {ti.message}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className='z-10 flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white shadow-xl'>
        {/* Header with canvas selector */}
        <div className='border-b border-slate-200 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h1 className='flex items-center gap-2 text-lg font-extrabold text-primary'>
              <Cloud className='h-5 w-5' />
              {tr('app.title')}
            </h1>
            <button
              type='button'
              onClick={toggleLang}
              className='flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-primary/40'
            >
              <Languages className='h-3.5 w-3.5' />
              {lang === 'en' ? 'EN' : 'ZH'}
            </button>
          </div>

          {/* Canvas selector */}
          <div className='relative mt-3'>
            <button
              type='button'
              onClick={() => setShowCanvasMenu(!showCanvasMenu)}
              className='flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:bg-slate-100'
            >
              <FolderOpen className='h-4 w-4 shrink-0 text-slate-500' />
              <span className='flex-1 truncate text-left font-semibold text-slate-700'>
                {activeCanvas?.name ?? tr('canvas.select')}
              </span>
              <ChevronDown className='h-4 w-4 text-slate-400 transition' />
            </button>

            {showCanvasMenu && (
              <div className='absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl'>
                <div className='max-h-64 overflow-y-auto p-1'>
                  {canvases.map((canvas) => (
                    <div
                      key={canvas.id}
                      className='group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition'
                    >
                      {editingCanvasId === canvas.id ? (
                        <div className='flex flex-1 items-center gap-2'>
                          <input
                            type='text'
                            value={canvasNameInput}
                            onChange={(e) => setCanvasNameInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameCanvas(canvas.id);
                              if (e.key === 'Escape') setEditingCanvasId(null);
                            }}
                            className='flex-1 rounded border border-slate-300 px-2 py-0.5 text-sm focus:border-primary focus:outline-none'
                            autoFocus
                          />
                          <button
                            type='button'
                            onClick={() => handleRenameCanvas(canvas.id)}
                            className='rounded p-1 text-green-600 hover:bg-green-50'
                            title={tr('canvas.confirm')}
                          >
                            <CheckCircle2 className='h-4 w-4' />
                          </button>
                          <button
                            type='button'
                            onClick={() => setEditingCanvasId(null)}
                            className='rounded p-1 text-slate-400 hover:bg-slate-100'
                            title={tr('app.cancel')}
                          >
                            <X className='h-4 w-4' />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type='button'
                            onClick={() => handleSwitchCanvas(canvas.id)}
                            className='flex flex-1 items-center gap-2 truncate text-left'
                          >
                            <FolderOpen className='h-3.5 w-3.5 shrink-0' />
                            {canvas.name}
                          </button>
                          <div className='hidden items-center gap-0.5 group-hover:flex'>
                            <button
                              type='button'
                              onClick={() => startRename(canvas)}
                              className='rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600'
                              title={tr('canvas.rename')}
                            >
                              <Pencil className='h-3.5 w-3.5' />
                            </button>
                            <button
                              type='button'
                              onClick={() => handleDeleteCanvas(canvas.id)}
                              className='rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-500'
                              title={tr('canvas.delete')}
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className='border-t border-slate-100 p-2'>
                  <button
                    type='button'
                    onClick={handleCreateCanvas}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/5'
                  >
                    <Plus className='h-4 w-4' />
                    {tr('canvas.new')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className='mt-2 text-xs text-slate-400'>
            {tr('app.nodesEdges', {
              count: String(nodes.length),
              edges: String(edges.length),
            })}
          </p>
        </div>

        {/* Add node form */}
        <div className='border-b border-slate-200 p-5'>
          {!showAddForm ? (
            <button
              type='button'
              onClick={() => setShowAddForm(true)}
              className='btn btn-primary w-full gap-2'
            >
              <Plus className='h-4 w-4' />
              {tr('app.addNode')}
            </button>
          ) : (
            <form onSubmit={handleAddNode} className='space-y-3'>
              <div className='form-control'>
                <label className='label py-0'>
                  <span className='label-text text-xs font-semibold text-slate-500'>Type</span>
                </label>
                <div className='relative'>
                  <select
                    className='select select-bordered w-full text-sm appearance-none'
                    value={nodeType}
                    onChange={(e) => setNodeType(e.target.value)}
                  >
                    {ASSET_TYPE_OPTIONS.map((at) => (
                      <option key={at} value={at}>
                        {tr('nodeTypes.' + at)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                </div>
              </div>

              {(METADATA_TEMPLATES[nodeType]?.length ?? 0) > 0 && (
                <div className='space-y-1'>
                  <span className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>
                    {tr('app.preFilledFields')}
                  </span>
                  <div className='flex flex-wrap gap-1'>
                    {METADATA_TEMPLATES[nodeType].map(([k]) => (
                      <span
                        key={k}
                        className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600'
                      >
                        {tr('metadata.' + nodeType + '.' + k)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className='form-control'>
                <label className='label py-0'>
                  <span className='label-text text-xs font-semibold text-slate-500'>Label</span>
                </label>
                <input
                  type='text'
                  className='input input-bordered w-full text-sm'
                  placeholder={tr('nodeTypes.' + nodeType)}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className='flex gap-2 pt-1'>
                <button
                  type='button'
                  onClick={() => { setShowAddForm(false); setLabel(''); }}
                  className='btn btn-ghost btn-sm flex-1'
                >
                  {tr('app.cancel')}
                </button>
                <button type='submit' className='btn btn-primary btn-sm flex-1 gap-1'>
                  <Plus className='h-3.5 w-3.5' />
                  {tr('app.addNode')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Node type list */}
        <div className='flex-1 overflow-y-auto p-5 pt-4'>
          <p className='mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400'>
            {tr('app.nodeTypes', { count: String(ASSET_TYPE_OPTIONS.length) })}
          </p>
          <div className='space-y-1'>
            {ASSET_TYPE_OPTIONS.map((at) => {
              const cfg = NODE_TYPES[at as keyof typeof NODE_TYPES];
              const Icon = cfg.icon;
              const count = nodes.filter((n: TopologyNode) => n.data.type === at).length;
              const cls = nodeType === at ? 'bg-slate-100 font-semibold' : 'text-slate-600';
              return (
                <div
                  key={at}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${cls}`}
                  onClick={() => { setNodeType(at); setShowAddForm(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  <Icon className='h-3.5 w-3.5 shrink-0' style={{ color: cfg.color }} />
                  <span className='flex-1'>{tr('nodeTypes.' + at)}</span>
                  <span className='font-mono text-[10px] text-slate-400'>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className='border-t border-slate-200 p-4'>
          <p className='text-[10px] leading-relaxed text-slate-400'>{tr('app.hints')}</p>
        </div>
      </aside>

      {/* Canvas area */}
      <main className='relative h-full flex-1'>
        {loading && (
          <div className='absolute left-4 top-4 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow'>
            {tr('app.loading')}
          </div>
        )}
        <div className='absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow'>
          <div
            className={`h-1.5 w-1.5 rounded-full ${syncMode === 'api' ? 'bg-green-400' : 'bg-amber-400'}`}
          />
          {syncMode === 'api' ? tr('app.apiSync') : tr('app.localMode')}
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
          deleteKeyCode='Delete'
          selectionOnDrag
          panOnDrag={[2]}
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color='#e2e8f0' />
        </ReactFlow>
      </main>

      <NodeEditorPanel node={editingNode} onClose={() => setEditingNode(null)} onSave={handleSaveNode} onDelete={handleDeleteNode} />
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

export default function App() {
  return (
    <I18nProvider>
      <ReactFlowProvider>
        <AppInner />
      </ReactFlowProvider>
    </I18nProvider>
  );
}
