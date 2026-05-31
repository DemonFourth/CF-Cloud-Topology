import { X, Trash2, Plus, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ASSET_TYPE_OPTIONS, NODE_TYPES, type AssetType } from '../types';
import { IconPicker, getIconByName } from './IconPicker';
import { useI18n } from '../i18n';

interface NodeEditorPanelProps {
  node: any;
  onClose: () => void;
  onSave: (nodeId: string, updates: any) => void;
  onDelete: (nodeId: string) => void;
}

interface MetaEntry {
  key: string;
  value: string;
}

// P1: Metadata limits
const MAX_META_ENTRIES = 20;
const MAX_KEY_LENGTH = 64;
const MAX_VALUE_LENGTH = 512;

export function NodeEditorPanel({ node, onClose, onSave, onDelete }: NodeEditorPanelProps) {
  const { t: tr } = useI18n();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<AssetType>('provider');
  const [iconName, setIconName] = useState<string | undefined>(undefined);
  const [meta, setMeta] = useState<MetaEntry[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (node) {
      setLabel(node.data.label ?? '');
      setType(node.data.type ?? 'provider');
      setIconName(node.data.icon);
      const rawMeta = node.data.metadata ?? {};
      const entries: MetaEntry[] = Object.entries(rawMeta).map(([k, v]) => ({ key: k, value: String(v ?? '') }));
      setMeta(entries);
      setNewKey('');
      setNewVal('');
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    const metadata: Record<string, string> = {};
    meta.forEach(({ key, value }) => { if (key.trim()) metadata[key.trim()] = value; });
    onSave(node.id, { label: label.trim(), type, icon: iconName, metadata });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(tr('app.deleteNodeConfirm', { label: node.data.label }))) {
      onDelete(node.id);
      onClose();
    }
  };

  const handleMetaChange = (index: number, field: 'key' | 'value', val: string) => {
    const maxLen = field === 'key' ? MAX_KEY_LENGTH : MAX_VALUE_LENGTH;
    if (val.length > maxLen) return;
    setMeta(meta => meta.map((e, i) => i === index ? { ...e, [field]: val } : e));
  };

  const handleMetaDelete = (index: number) => {
    setMeta(meta => meta.filter((_, i) => i !== index));
  };

  const handleAddMeta = () => {
    if (!newKey.trim()) return;
    if (meta.some(e => e.key === newKey.trim())) return;
    if (meta.length >= MAX_META_ENTRIES) return;
    setMeta(meta => [...meta, { key: newKey.trim(), value: newVal }]);
    setNewKey('');
    setNewVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddMeta(); }
  };

  const typeConfig = NODE_TYPES[type];
  const defaultIcon = typeConfig.icon;
  const currentIcon = iconName ? getIconByName(iconName) : defaultIcon;
  const CurrentIcon = currentIcon ?? defaultIcon;
  const DefaultIcon = defaultIcon;
  const isAtLimit = meta.length >= MAX_META_ENTRIES;
  return (
    <>
      <aside className="absolute right-4 top-4 z-20 flex h-[calc(100%-2rem)] w-80 flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: typeConfig.color + '20' }}>
              <CurrentIcon className="h-4 w-4" style={{ color: typeConfig.color }} />
            </div>
            <span className="font-bold text-slate-700">{tr('app.editNode')}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Node ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">{tr('app.nodeId')}</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 break-all">
              {node.id}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">{tr('app.nodeType')}</label>
            <select className="select select-bordered w-full text-sm" value={type} onChange={(e) => setType(e.target.value as AssetType)}>
              {ASSET_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{tr('nodeTypes.' + t)}</option>)}
            </select>
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">{tr('app.icon')}</label>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-primary/50 cursor-pointer"
                   style={{ borderColor: iconName ? '#3b82f6' : undefined, backgroundColor: iconName ? '#eff6ff' : undefined }}
                   onClick={() => setShowIconPicker(true)}
                   title={tr('app.clickToChangeIcon')}
              >
                <CurrentIcon className="h-6 w-6" style={{ color: typeConfig.color }} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">
                  {iconName ? tr('app.customIcon', { name: iconName }) : tr('app.usingDefault')}
                </p>
                <button type="button" onClick={() => setShowIconPicker(true)} className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline">
                  <Palette className="h-3 w-3" /> {iconName ? tr('app.changeIcon') : tr('app.pickIcon')}
                </button>
              </div>
              {iconName && (
                <button type="button" onClick={() => setIconName(undefined)} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" title={tr('app.resetIcon')}>
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">{tr('app.displayName')}</label>
            <input type="text" className="input input-bordered w-full text-sm" placeholder={tr('app.nodeLabelPlaceholder')} value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          {/* Metadata key-value editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500">{tr('app.extendedProperties')}</label>
              <span className="text-[10px] text-slate-400">{tr('app.clickToEdit')}</span>
            </div>

            {/* P1: 数量限制提示 */}
            {isAtLimit && (
              <p className="text-xs text-amber-500">{tr('app.maxMetaReached', { n: MAX_META_ENTRIES })}</p>
            )}

            <div className="space-y-1.5">
              {meta.length === 0 && <p className="text-xs text-slate-400 py-2">{tr('app.noProperties')}</p>}              {meta.map((entry, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="text"
                    className="w-20 input input-bordered input-xs font-mono shrink-0"
                    value={entry.key}
                    onChange={(e) => handleMetaChange(i, 'key', e.target.value)}
                    placeholder={tr('app.metaKeyPlaceholder')}
                    maxLength={MAX_KEY_LENGTH}
                  />
                  <input
                    type="text"
                    className="flex-1 input input-bordered input-xs font-mono min-w-0"
                    value={entry.value}
                    onChange={(e) => handleMetaChange(i, 'value', e.target.value)}
                    placeholder={tr('app.metaValuePlaceholder')}
                    maxLength={MAX_VALUE_LENGTH}
                  />
                  <button
                    type="button"
                    onClick={() => handleMetaDelete(i)}
                    className="rounded p-0.5 text-red-400 transition hover:bg-red-50 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new key-value */}
            <div className="flex items-center gap-1 pt-1">
              <input
                type="text"
                className="w-20 input input-bordered input-xs font-mono shrink-0"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tr('app.newKeyPlaceholder')}
                maxLength={MAX_KEY_LENGTH}
                disabled={isAtLimit}
              />
              <input
                type="text"
                className="flex-1 input input-bordered input-xs font-mono min-w-0"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tr('app.newValuePlaceholder')}
                maxLength={MAX_VALUE_LENGTH}
                disabled={isAtLimit}
              />
              <button
                type="button"
                onClick={handleAddMeta}
                className="rounded p-0.5 text-green-600 transition hover:bg-green-50 shrink-0"
                disabled={!newKey.trim() || meta.some(e => e.key === newKey.trim()) || isAtLimit}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-slate-100 p-4">
          <button type="button" onClick={handleDelete} className="btn btn-outline btn-error btn-sm gap-1">
            <Trash2 className="h-3.5 w-3.5" />
            {tr('app.delete')}
          </button>
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">{tr('app.cancel')}</button>
          <button type="button" onClick={handleSave} className="btn btn-primary btn-sm" disabled={!label.trim()}>{tr('app.save')}</button>
        </div>
      </aside>

      {showIconPicker && (
        <IconPicker
          value={iconName}
          onChange={(name) => setIconName(name)}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </>
  );
}