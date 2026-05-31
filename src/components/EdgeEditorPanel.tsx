import { X, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  EDGE_COLORS,
  EDGE_STYLE_OPTIONS,
  EDGE_ARROW_OPTIONS,
  type TopologyEdge,
  type TopologyEdgeData,
  type EdgeStyle,
  type EdgeArrow,
} from '../types';

interface EdgeEditorPanelProps {
  edge: TopologyEdge | null;
  onClose: () => void;
  onSave: (edgeId: string, data: Partial<TopologyEdgeData>) => void;
  onDelete: (edgeId: string) => void;
}

const PRESET_LABELS = [
  '解析到', '运行在', '调用', '依赖于', '同步到', '部署在', '连接至', '转发给',
];

export function EdgeEditorPanel({ edge, onClose, onSave, onDelete }: EdgeEditorPanelProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#94a3b8');
  const [style, setStyle] = useState<EdgeStyle>('solid');
  const [arrow, setArrow] = useState<EdgeArrow>('target');

  useEffect(() => {
    if (edge) {
      const d = (edge.data ?? {}) as TopologyEdgeData;
      setLabel(d.label ?? '');
      setColor(d.color ?? '#94a3b8');
      setStyle(d.style ?? 'solid');
      setArrow(d.arrow ?? 'target');
    }
  }, [edge]);

  if (!edge) return null;

  const handleSave = () => {
    onSave(edge.id, { label, color, style, arrow });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这条连线吗？')) {
      onDelete(edge.id);
      onClose();
    }
  };

  return (
    <aside className="absolute left-1/2 top-4 z-20 flex w-72 -translate-x-1/2 flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <span className="text-sm font-bold text-slate-700">编辑连线</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-4">
        {/* Edge ID */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">连线 ID</label>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[10px] text-slate-500 break-all">
            {edge.id}
          </div>
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">关系标签</label>
          <input
            type="text"
            className="input input-bordered input-sm w-full text-sm"
            placeholder="例如: 解析到"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <div className="flex flex-wrap gap-1">
            {PRESET_LABELS.map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setLabel(lbl)}
                className={`rounded-full px-2 py-0.5 text-[10px] transition ${
                  label === lbl
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">颜色</label>
          <div className="flex flex-wrap gap-2">
            {EDGE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`h-6 w-6 rounded-full border-2 transition-all ${
                  color === c.value ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Style */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">线条样式</label>
          <div className="flex gap-2">
            {EDGE_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStyle(opt.value)}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  style === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Style preview */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-0.5 flex-1 rounded-full" style={{
              backgroundColor: color,
              ...(style === 'dashed' ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0, ${color} 8px, transparent 8px, transparent 12px)` } : {}),
              ...(style === 'dotted' ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0, ${color} 2px, transparent 2px, transparent 5px)` } : {}),
            }} />
          </div>
        </div>

        {/* Arrow */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">箭头方向</label>
          <div className="grid grid-cols-2 gap-2">
            {EDGE_ARROW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setArrow(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  arrow === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={handleDelete}
          className="btn btn-outline btn-error btn-sm gap-1"
        >
          <Trash2 className="h-3 w-3" />
          删除
        </button>
        <div className="flex-1" />
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          取消
        </button>
        <button type="button" onClick={handleSave} className="btn btn-primary btn-sm">
          保存
        </button>
      </div>
    </aside>
  );
}
