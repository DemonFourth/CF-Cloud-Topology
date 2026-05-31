import { useState } from 'react';
import { X, Search } from 'lucide-react';
import {
  Shield, Globe2, AppWindow, Database, HardDrive,
  Mail, Lock, Container, Server, Cpu, Layers, Wifi, Key,
  Activity, Box, Link2, Globe, Zap, Code, GitBranch,
  Bot, Sparkles, Clock, AlertTriangle, Bell, BellRing,
  CheckCircle, Info, HelpCircle, Flag, Target,
  Send, Inbox, Folder, FileText, Terminal, Code2,
  MessageSquare, User, Users, Building, Building2,
  CreditCard, DollarSign, Settings, Gauge, BarChart,
  Link, Share2, Hash, AtSign, Copy, RefreshCw,
  LockOpen, Eye, EyeOff, ExternalLink, Rocket, Plane,
  MapPin, Map, Compass, Navigation, BookOpen, Bookmark,
  Star, Sun, Moon, Snowflake, Flame, Cloud, CloudOff,
  Droplet, Waves, TreeDeciduous, Mountain,
  Mic, Camera, Video, Tv, Speaker,
  Router, Battery, Plug,
  Webhook as WebhookIcon, Boxes, Component, Blocks,
  LayoutDashboard, LayoutGrid, Kanban, Workflow,
  Edit, Edit2, Edit3, Trash2, Grip, GripVertical,
  Sunrise, Sunset, Thermometer, Timer, Calendar,
  ArrowRight, Plus, Minus, X as XIcon, Check, ArrowUpRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Shield, Globe2, AppWindow, Database, HardDrive,
  Mail, Lock, Container, Server, Cpu, Layers, Wifi, Key,
  Activity, Box, Link2, Globe, Zap, Code, GitBranch,
  Bot, Sparkles, Clock, AlertTriangle, Bell, BellRing,
  CheckCircle, Info, HelpCircle, Flag, Target,
  Send, Inbox, Folder, FileText, Terminal, Code2,
  MessageSquare, User, Users, Building, Building2,
  CreditCard, DollarSign, Settings, Gauge, BarChart,
  Link, Share2, Hash, AtSign, Copy, RefreshCw,
  LockOpen, Eye, EyeOff, ExternalLink, Rocket, Plane,
  MapPin, Map, Compass, Navigation, BookOpen, Bookmark,
  Star, Sun, Moon, Snowflake, Flame, Cloud, CloudOff,
  Droplet, Waves, TreeDeciduous, Mountain,
  Mic, Camera, Video, Tv, Speaker,
  Router, Battery, Plug,
  Webhook: WebhookIcon, Boxes, Component, Blocks,
  LayoutDashboard, LayoutGrid, Kanban, Workflow,
  Edit, Edit2, Edit3, Trash2, Grip, GripVertical,
  Sunrise, Sunset, Thermometer, Timer, Calendar,
  ArrowRight, Plus, Minus, X: XIcon, Check, ArrowUpRight,
};

const POPULAR_ICONS = [
  'Cloud', 'Server', 'Database', 'Globe', 'Globe2', 'Shield', 'Mail', 'Lock',
  'Key', 'Cpu', 'HardDrive', 'Wifi', 'Link', 'Link2', 'Share2',
  'Container', 'Layers', 'AppWindow', 'Monitor', 'Zap', 'Lightning',
  'Activity', 'Pulse', 'Heart', 'Clock', 'Timer', 'Calendar',
  'AlertTriangle', 'Bell', 'BellRing', 'CheckCircle', 'XCircle', 'Info', 'HelpCircle',
  'GitBranch', 'GitMerge', 'GitPullRequest', 'GitCommit',
  'Code', 'Code2', 'Terminal', 'Box', 'Package', 'Boxes',
  'File', 'FileText', 'Folder', 'FolderOpen', 'Archive',
  'MessageSquare', 'Send', 'Inbox', 'User', 'Users',
  'Building', 'Building2', 'Home', 'Factory', 'Store',
  'Settings', 'Gauge', 'Wrench', 'BarChart',
  'Hash', 'AtSign', 'Copy', 'RefreshCw',
  'ShieldCheck', 'ShieldAlert', 'LockOpen', 'Eye', 'EyeOff',
  'ExternalLink', 'ArrowUpRight', 'ArrowRight', 'Rocket',
  'MapPin', 'Map', 'Bookmark', 'Tag',
  'Star', 'Sun', 'Moon', 'Snowflake', 'Flame',
  'Droplet', 'Waves', 'TreeDeciduous', 'Mountain',
  'Router', 'Battery', 'Plug',
  'Webhook', 'Bot', 'Sparkles', 'Brain',
  'Edit', 'Edit2', 'Edit3', 'Trash2',
  'LayoutDashboard', 'LayoutGrid', 'Kanban', 'Workflow',
  'ArrowRight', 'Plus', 'X', 'Check',
  'Mic', 'Camera', 'Video', 'Tv',
  'Microscope', 'FlaskConical',
  'HeartPulse', 'Stethoscope', 'Accessibility',
];

interface IconPickerProps {
  value: string | undefined;
  onChange: (iconName: string | undefined) => void;
  onClose: () => void;
}

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const filtered = POPULAR_ICONS.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );
  const handleSelect = (name: string) => {
    onChange(value === name ? undefined : name);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-[540px] max-h-[68vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Search icon name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-8 gap-2">
            {filtered.map(name => {
              const IconComp = ICON_MAP[name];
              const isSelected = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-all ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-slate-100'}`}
                  title={name}
                >
                  {IconComp ? (
                    <IconComp className="h-5 w-5" style={{ color: isSelected ? '#3b82f6' : '#64748b' }} />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">{name.slice(0,3)}</span>
                  )}
                  <span className="text-[9px] text-slate-500 font-mono truncate w-full text-center">{name}</span>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">No icons found for "{search}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function getIconByName(name: string | undefined): React.ComponentType<any> | null {
  if (!name) return null;
  return ICON_MAP[name] ?? null;
}