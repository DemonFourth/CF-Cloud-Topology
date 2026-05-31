import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { Cpu, ExternalLink, Globe, Shield, Trash2 } from 'lucide-react';

export type AssetType = 'provider' | 'domain' | 'app';

export type TopologyNodeData = Record<string, unknown> & {
  type: AssetType;
  label: string;
  metadata?: {
    email?: string;
    platform?: string;
    url?: string;
  };
};

export type TopologyNode = Node<TopologyNodeData, 'custom'>;

const styles = {
  provider: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    icon: <Shield className="h-4 w-4 text-blue-500" />,
  },
  domain: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    icon: <Globe className="h-4 w-4 text-emerald-500" />,
  },
  app: {
    border: 'border-fuchsia-500',
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-800',
    icon: <Cpu className="h-4 w-4 text-fuchsia-500" />,
  },
};

export function CustomNode({ id, data, selected }: NodeProps<TopologyNode>) {
  const style = styles[data.type] ?? styles.provider;

  const onDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!window.confirm(`确定要删除 ${data.label} 吗？`)) {
      return;
    }

    window.dispatchEvent(new CustomEvent('cloud-topology:delete-node', { detail: id }));
  };

  return (
    <div
      className={`min-w-[220px] rounded-lg border-2 bg-white px-4 py-3 shadow-lg ${style.border} ${
        selected ? 'ring-4 ring-primary/35' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="h-2 w-2 !bg-gray-400" />

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}
          >
            {style.icon}
            {data.type.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 text-red-500 transition hover:bg-red-100"
            title="删除节点"
            aria-label="删除节点"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-1 break-words font-mono text-sm font-bold">{data.label}</div>

        {data.metadata?.email ? <div className="text-[10px] text-gray-500">{data.metadata.email}</div> : null}
        {data.metadata?.platform ? (
          <div className="text-[10px] text-gray-500">平台: {data.metadata.platform}</div>
        ) : null}
        {data.metadata?.url ? (
          <a
            href={data.metadata.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            访问链接
          </a>
        ) : null}
      </div>

      <Handle type="source" position={Position.Right} className="h-2 w-2 !bg-gray-400" />
    </div>
  );
}
