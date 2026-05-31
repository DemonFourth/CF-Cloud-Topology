import { Handle, Position } from '@xyflow/react';
import { Trash2, Edit3 } from 'lucide-react';
import { NODE_TYPES, type TopologyNodeData } from '../types';
import { getIconByName } from './IconPicker';

interface CustomNodeProps {
  id: string;
  data: TopologyNodeData;
  selected?: boolean;
}

export function CustomNode({ id, data, selected }: CustomNodeProps) {
  const config = NODE_TYPES[data.type] ?? NODE_TYPES.custom;
  const customIcon = data.icon ? getIconByName(data.icon) : null;
  const Icon = customIcon ?? config.icon;

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const label = data.label;
    if (!window.confirm('Delete node "' + label + '"? This cannot be undone.')) return;
    window.dispatchEvent(new CustomEvent('cloud-topology:delete-node', { detail: id }));
  };

  const onEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('cloud-topology:edit-node', { detail: id }));
  };

  const metaKeys = data.metadata ? Object.keys(data.metadata) : [];

  return (
    <div className={`relative min-w-[200px] rounded-xl border-2 bg-white px-4 py-3 shadow-lg transition-all duration-150 ${config.borderClass} ${selected ? 'ring-4 ring-primary/40 scale-105' : 'hover:shadow-xl'}`}>
      <Handle type="target" position={Position.Left} className="h-2 w-2 !bg-gray-400" />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${config.bgClass} ${config.textClass}`}>
            <Icon className="h-3 w-3" style={{ color: config.color }} />
            {config.label}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onEditClick} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" title="Edit node" aria-label="Edit node">
              <Edit3 className="h-3 w-3" />
            </button>
            <button type="button" onClick={onDelete} className="rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-500" title="Delete node" aria-label="Delete node">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="mt-0.5 break-words font-mono text-sm font-bold text-slate-800">{data.label}</div>
        {metaKeys.map((key) => {
          const val = data.metadata?.[key];
          if (val === undefined || val === '' || val === null) return null;
          return (
            <div key={key} className="flex gap-1 text-[10px] text-slate-500">
              <span className="font-medium">{key}:</span>
              <span className="truncate max-w-\[180px\]" title={String(val)}>{String(val)}</span>
            </div>
          );
        })}
      </div>
      <Handle type="source" position={Position.Right} className="h-2 w-2 !bg-gray-400" />
    </div>
  );
}

export function EdgeLabel({ label, style }: { label?: string; style?: React.CSSProperties }) {
  if (!label) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', color: '#475569', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', ...style }}>
      {label}
    </div>
  );
}

export function CustomEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: any) {
  const edgeData = (data ?? {}) as any;
  const color = edgeData.color ?? '#94a3b8';
  const lineStyle = edgeData.style ?? 'solid';
  const strokeDasharray = lineStyle === 'dashed' ? '8,4' : lineStyle === 'dotted' ? '2,3' : undefined;
  const cpOffset = 50;
  const cpx1 = sourcePosition === Position.Right ? sourceX + cpOffset : sourceX - cpOffset;
  const cpy1 = sourceY;
  const cpx2 = targetPosition === Position.Left ? targetX - cpOffset : targetX + cpOffset;
  const cpy2 = targetY;
  const path = `M ${sourceX},${sourceY} C ${cpx1},${cpy1} ${cpx2},${cpy2} ${targetX},${targetY}`;
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const safeId = id.replace(/[^a-zA-Z0-9]/g, '');
  const markerId = 'arrow-' + safeId;
  const markerIdRev = 'arrow-' + safeId + 'rev';
  const showTarget = edgeData.arrow === 'target' || edgeData.arrow === 'both';
  const showSource = edgeData.arrow === 'source' || edgeData.arrow === 'both';
  return (
    <>
      <defs>
        {showTarget && (
          <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        )}
        {showSource && (
          <marker id={markerIdRev} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        )}
      </defs>
      <path
        id={id}
        className="react-flow__edge-path"
        d={path}
        style={{ stroke: color, strokeWidth: selected ? 3 : 2, strokeDasharray, fill: 'none' }}
        markerEnd={showTarget ? 'url(#' + markerId + ')' : undefined}
        markerStart={showSource ? 'url(#' + markerIdRev + ')' : undefined}
      />
      {edgeData.label && (
        <foreignObject x={midX - 60} y={midY - 15} width={120} height={30} style={{ overflow: 'visible', pointerEvents: 'none' }}>
          <EdgeLabel label={edgeData.label} />
        </foreignObject>
      )}
    </>
  );
}