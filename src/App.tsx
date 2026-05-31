import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import axios from 'axios';
import { Cloud, Cpu, Globe, Plus, Shield } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { AssetType, CustomNode, TopologyNode, TopologyNodeData } from './components/CustomNode';

const API_BASE = import.meta.env.VITE_API_URL;
const LOCAL_GRAPH_KEY = 'cloud-topology-local-graph';
const nodeTypes: NodeTypes = { custom: CustomNode };

type ApiNode = TopologyNode & {
  type?: string;
  label?: string;
  data: TopologyNodeData;
};

type GraphResponse = {
  nodes?: ApiNode[];
  edges?: Edge[];
};

function readLocalGraph(): GraphResponse {
  const rawGraph = window.localStorage.getItem(LOCAL_GRAPH_KEY);
  if (!rawGraph) {
    return { nodes: [], edges: [] };
  }

  try {
    return JSON.parse(rawGraph) as GraphResponse;
  } catch {
    return { nodes: [], edges: [] };
  }
}

function writeLocalGraph(nodes: TopologyNode[], edges: Edge[]) {
  window.localStorage.setItem(
    LOCAL_GRAPH_KEY,
    JSON.stringify({
      nodes,
      edges,
    }),
  );
}

function normalizeNode(node: ApiNode): TopologyNode {
  return {
    ...node,
    type: 'custom',
    data: {
      type: node.data?.type ?? (node.type as AssetType) ?? 'provider',
      label: node.data?.label ?? node.label ?? node.id,
      metadata: node.data?.metadata ?? {},
    },
  };
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<TopologyNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<AssetType>('provider');
  const [platform, setPlatform] = useState('cloudflare');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncMode, setSyncMode] = useState<'api' | 'local'>('api');

  const typeIcon = useMemo(() => {
    if (type === 'provider') return <Shield className="h-4 w-4" />;
    if (type === 'domain') return <Globe className="h-4 w-4" />;
    return <Cpu className="h-4 w-4" />;
  }, [type]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<GraphResponse>(`${API_BASE}/api/graph`);
      setNodes((response.data.nodes ?? []).map(normalizeNode));
      setEdges(response.data.edges ?? []);
      setSyncMode('api');
    } catch (error) {
      console.warn('API 暂不可用，已切换到本地测试模式。', error);
      const localGraph = readLocalGraph();
      setNodes((localGraph.nodes ?? []).map(normalizeNode));
      setEdges(localGraph.edges ?? []);
      setSyncMode('local');
    } finally {
      setLoading(false);
    }
  }, [setEdges, setNodes]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const onDeleteNode = (event: Event) => {
      const nodeId = (event as CustomEvent<string>).detail;

      setNodes((currentNodes) => {
        const nextNodes = currentNodes.filter((node) => node.id !== nodeId);
        setEdges((currentEdges) => {
          const nextEdges = currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
          writeLocalGraph(nextNodes, nextEdges);
          return nextEdges;
        });
        return nextNodes;
      });

      axios.delete(`${API_BASE}/api/nodes/${nodeId}`).catch(() => {
        setSyncMode('local');
      });
    };

    window.addEventListener('cloud-topology:delete-node', onDeleteNode);
    return () => window.removeEventListener('cloud-topology:delete-node', onDeleteNode);
  }, [setEdges, setNodes]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;

      const newEdge: Edge = {
        id: `e-${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        label: '',
      };

      setEdges((currentEdges) => {
        const nextEdges = addEdge(newEdge, currentEdges);
        writeLocalGraph(nodes, nextEdges);
        return nextEdges;
      });

      axios.post(`${API_BASE}/api/edges`, newEdge).catch(() => {
        setSyncMode('local');
      });
    },
    [nodes, setEdges],
  );

  const onNodeDragStop = useCallback(
    async (_event: React.MouseEvent, node: TopologyNode) => {
      const rawNode = nodes.find((item) => item.id === node.id);
      if (!rawNode) return;

      const nextNodes = nodes.map((item) => (item.id === node.id ? { ...item, position: node.position } : item));
      setNodes(nextNodes);
      writeLocalGraph(nextNodes, edges);

      axios.post(`${API_BASE}/api/nodes`, {
        id: node.id,
        type: rawNode.data.type,
        label: rawNode.data.label,
        position: node.position,
        data: rawNode.data,
      }).catch(() => {
        setSyncMode('local');
      });
    },
    [edges, nodes, setNodes],
  );

  const handleAddNode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!label.trim()) return;

    const id = `${type}-${Date.now()}`;
    const newNode: TopologyNode = {
      id,
      type: 'custom',
      position: {
        x: Math.random() * 240 + 120,
        y: Math.random() * 240 + 120,
      },
      data: {
        type,
        label: label.trim(),
        metadata: {
          platform: type === 'provider' ? platform.trim() : undefined,
          email: type === 'provider' ? email.trim() : undefined,
          url: type === 'app' ? url.trim() : undefined,
        },
      },
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    writeLocalGraph(nextNodes, edges);

    axios.post(`${API_BASE}/api/nodes`, {
      ...newNode,
      type: newNode.data.type,
      label: newNode.data.label,
    }).catch(() => {
      setSyncMode('local');
    });

    setLabel('');
    setEmail('');
    setUrl('');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      <aside className="z-10 flex w-80 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-6 shadow-xl">
        <div>
          <h1 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-primary">
            <Cloud className="h-6 w-6" />
            Cloud-Topology
          </h1>

          <form onSubmit={handleAddNode} className="space-y-4">
            <div className="form-control">
              <label className="label" htmlFor="node-type">
                <span className="label-text">节点类型</span>
              </label>
              <select
                id="node-type"
                className="select select-bordered"
                value={type}
                onChange={(event) => setType(event.target.value as AssetType)}
              >
                <option value="provider">账号提供商</option>
                <option value="domain">域名</option>
                <option value="app">部署应用</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="node-label">
                <span className="label-text">显示名称</span>
              </label>
              <input
                id="node-label"
                type="text"
                className="input input-bordered"
                placeholder="例如: CF-个人, myapp.top"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                required
              />
            </div>

            {type === 'provider' ? (
              <>
                <div className="form-control">
                  <label className="label" htmlFor="node-platform">
                    <span className="label-text">平台</span>
                  </label>
                  <input
                    id="node-platform"
                    type="text"
                    className="input input-bordered"
                    placeholder="例如: cloudflare, freenom, aws"
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="node-email">
                    <span className="label-text">登录邮箱</span>
                  </label>
                  <input
                    id="node-email"
                    type="email"
                    className="input input-bordered"
                    placeholder="Login Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </>
            ) : null}

            {type === 'app' ? (
              <div className="form-control">
                <label className="label" htmlFor="node-url">
                  <span className="label-text">应用 URL</span>
                </label>
                <input
                  id="node-url"
                  type="url"
                  className="input input-bordered"
                  placeholder="https://..."
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </div>
            ) : null}

            <button type="submit" className="btn btn-primary mt-4 w-full">
              <Plus className="h-4 w-4" />
              放入画布
            </button>
          </form>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          在画布中拖动节点，并将两个节点边缘的圆点连接起来，即可建立对应关系。
        </p>
      </aside>

      <main className="relative h-full flex-1">
        {loading ? (
          <div className="absolute left-4 top-4 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow">
            正在加载拓扑数据...
          </div>
        ) : null}

        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow">
          {typeIcon}
          当前新增类型：{type} · {syncMode === 'api' ? 'API 同步' : '本地测试'}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </main>
    </div>
  );
}
