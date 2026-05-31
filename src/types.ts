import {
  Shield, Globe2, AppWindow, Database, HardDrive,
  Mail, Lock, Container, Server, Cpu, Layers, Wifi, Key,
  Activity, Box, Link2, Globe, Zap, Code, GitBranch,
  Box as BoxIcon, Package, Terminal, FileText, MessageSquare,
  Settings, Monitor, Smartphone, Building, CreditCard,
  Clock, AlertTriangle, Star, Heart, Battery, Plug,
  Rocket, Cloud, CloudOff, Wind, Sun, Moon, Disc,
  Link, Share2, Hash, AtSign, Copy, RefreshCw,
  Bot, Sparkles,
  Table, BarChart, Gauge, Wrench, Hammer, User, Users,
  CheckCircle, XCircle, Info, HelpCircle, Flag, Target,
  Send, Inbox, Folder, FolderOpen, Archive, Image, Video,
  Play, Music, Headphones, Volume, Eye, EyeOff,
  KeyRound, LockOpen, ShieldCheck, ShieldAlert,
  ArrowRight, Plus, Minus, Divide, ArrowUpRight, Plane,
  MapPin, Map, Mountain, TreeDeciduous, Droplet,
  BookOpen, Bookmark, Tag, Tags, Flame, Leaf,
  Type, Scan, QrCode, Fingerprint,
  Mic, MicOff, Camera, Tv,
  Router, Building2, Home, Factory, Warehouse, Store,
  DollarSign, Wallet, ShoppingCart, Receipt,
  File, FileCode, FileJson,
  Table2, BarChart2, PieChart, LineChart, TrendingUp,
  GitMerge, GitPullRequest, GitCommit, GitCompare,
  Workflow, Component, Blocks, Layout, Grid, List,
  Boxes, Package2, PackageCheck,
  Layers2, SplitSquareVertical, GitFork,
  ArrowLeftRight, ArrowUp, ArrowDown,
  CornerDownRight, CornerUpRight, ArrowDownRight,
  ExternalLink, ZoomIn, ZoomOut,
  Move, Crop, Edit, Edit2, Edit3, Pencil, PenTool,
  Trash2, Trash, Eraser, Highlighter, Square, Circle, Hexagon,
  Triangle, Diamond, Pentagon, Octagon, Star as StarAlt,
  Crosshair, Target as TargetAlt, MousePointer, Pointer,
  MousePointer2, Hand, Grip, GripVertical,
  LayoutDashboard, LayoutGrid, LayoutList, LayoutTemplate,
  Kanban, Calendar, CalendarDays, CalendarClock, Timer,
  Hourglass, Beaker,
  Bell, BellRing, BellDot, BellOff,
  MessageCircle, Phone, PhoneCall,
  PhoneForwarded, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Pin, MapPinOff, Navigation,
  Compass, Navigation2, Earth, Languages,
  Binary, Hexagon as HexagonAlt, Octagon as OctagonAlt,
  Orbit, Atom, Dna, Microscope, FlaskConical,
  TestTube, Atom as AtomAlt, Bolt,
  Flame as FlameAlt, Sparkles as SparklesAlt, Star as StarAlt2,
  Snowflake, CloudRain, CloudSnow, CloudLightning,
  Thermometer, ThermometerSun, ThermometerSnowflake,
  Wind as WindAlt, Waves, Umbrella,
  Sunrise, Sunset, Moon as MoonAlt, Sun as SunAlt,
  CloudDrizzle, CloudFog, CloudHail, HeartPulse, Stethoscope, Pill,
  GripHorizontal, GripVertical as GripVerticalAlt,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AssetType =
  | 'provider' | 'domain' | 'app' | 'database' | 'cdn' | 'storage'
  | 'mail' | 'ssl' | 'container' | 'server' | 'dns' | 'network'
  | 'certificate' | 'worker' | 'bucket' | 'person' | 'custom'
  | 'api' | 'cron' | 'docker' | 'github' | 'webhook' | 'database_extra'
  | 'service' | 'cdn_extra' | 'monitoring' | 'logging' | 'cache'
  | 'gateway' | 'loadbalancer' | 'firewall' | 'vpn' | 'storage_extra';

export type TopologyNodeData = Record<string, unknown> & {
  type: AssetType;
  label: string;
  icon?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
};

export type TopologyNode = {
  id: string;
  type: 'custom';
  position: { x: number; y: number };
  data: TopologyNodeData;
};

export type EdgeStyle = 'solid' | 'dashed' | 'dotted';
export type EdgeArrow = 'none' | 'source' | 'target' | 'both';

export type TopologyEdgeData = Record<string, unknown> & {
  label?: string;
  color?: string;
  style?: EdgeStyle;
  arrow?: EdgeArrow;
};

export type TopologyEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  data?: TopologyEdgeData;
  animated?: boolean;
  style?: Record<string, string>;
};

export type NodeTypeConfig = {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: LucideIcon;
  category?: string;
};

const Gateway = Layers;

export const NODE_TYPES: Record<AssetType, NodeTypeConfig> = {
  provider:      { label: 'Provider',           color: '#3b82f6', bgClass: 'bg-blue-50',    textClass: 'text-blue-800',    borderClass: 'border-blue-500',    icon: Shield,        category: 'Cloud' },
  domain:        { label: 'Domain',             color: '#10b981', bgClass: 'bg-emerald-50', textClass: 'text-emerald-800', borderClass: 'border-emerald-500', icon: Globe2,        category: 'DNS' },
  app:           { label: 'App',               color: '#d946ef', bgClass: 'bg-fuchsia-50', textClass: 'text-fuchsia-800', borderClass: 'border-fuchsia-500', icon: AppWindow,     category: 'Application' },
  database:      { label: 'Database',           color: '#f97316', bgClass: 'bg-orange-50',  textClass: 'text-orange-800',  borderClass: 'border-orange-500',  icon: Database,      category: 'Data' },
  cdn:           { label: 'CDN',               color: '#8b5cf6', bgClass: 'bg-violet-50',   textClass: 'text-violet-800',   borderClass: 'border-violet-500',   icon: Layers,        category: 'Network' },
  storage:       { label: 'Storage',            color: '#06b6d4', bgClass: 'bg-cyan-50',    textClass: 'text-cyan-800',    borderClass: 'border-cyan-500',    icon: HardDrive,     category: 'Data' },
  mail:          { label: 'Mail Service',        color: '#eab308', bgClass: 'bg-yellow-50',  textClass: 'text-yellow-800',  borderClass: 'border-yellow-500',  icon: Mail,          category: 'Communication' },
  ssl:           { label: 'SSL Certificate',    color: '#84cc16', bgClass: 'bg-lime-50',    textClass: 'text-lime-800',    borderClass: 'border-lime-500',    icon: Lock,          category: 'Security' },
  container:     { label: 'Container',          color: '#0ea5e9', bgClass: 'bg-sky-50',    textClass: 'text-sky-800',    borderClass: 'border-sky-500',    icon: Container,     category: 'Infrastructure' },
  server:        { label: 'Server / VPS',        color: '#6366f1', bgClass: 'bg-indigo-50',  textClass: 'text-indigo-800',  borderClass: 'border-indigo-500',  icon: Server,        category: 'Infrastructure' },
  dns:           { label: 'DNS Service',        color: '#14b8a6', bgClass: 'bg-teal-50',    textClass: 'text-teal-800',    borderClass: 'border-teal-500',    icon: Wifi,          category: 'DNS' },
  network:       { label: 'Network / VPN',      color: '#a855f7', bgClass: 'bg-purple-50',  textClass: 'text-purple-800',  borderClass: 'border-purple-500',  icon: Link2,         category: 'Network' },
  certificate:   { label: 'Certificate',        color: '#22c55e', bgClass: 'bg-green-50',   textClass: 'text-green-800',   borderClass: 'border-green-500',   icon: Key,           category: 'Security' },
  worker:        { label: 'Edge Worker',        color: '#f97316', bgClass: 'bg-orange-50',  textClass: 'text-orange-800',  borderClass: 'border-orange-500',  icon: Cpu,           category: 'Compute' },
  bucket:        { label: 'Storage Bucket',      color: '#64748b', bgClass: 'bg-slate-100',  textClass: 'text-slate-800',   borderClass: 'border-slate-400',   icon: Box,           category: 'Data' },
  person:        { label: 'Person',             color: '#ec4899', bgClass: 'bg-pink-50',    textClass: 'text-pink-800',    borderClass: 'border-pink-500',    icon: Activity,      category: 'People' },
  custom:        { label: 'Custom',             color: '#94a3b8', bgClass: 'bg-gray-100',   textClass: 'text-gray-800',    borderClass: 'border-gray-400',    icon: BoxIcon,       category: 'Other' },
  api:           { label: 'API Endpoint',       color: '#3b82f6', bgClass: 'bg-blue-50',    textClass: 'text-blue-800',    borderClass: 'border-blue-500',    icon: Zap,           category: 'Compute' },
  cron:          { label: 'Cron Job',            color: '#eab308', bgClass: 'bg-yellow-50',  textClass: 'text-yellow-800',  borderClass: 'border-yellow-500',  icon: Clock,         category: 'Compute' },
  docker:        { label: 'Docker Image',        color: '#0ea5e9', bgClass: 'bg-sky-50',    textClass: 'text-sky-800',    borderClass: 'border-sky-500',    icon: Container,     category: 'Infrastructure' },
  github:        { label: 'GitHub Action',      color: '#a855f7', bgClass: 'bg-purple-50',  textClass: 'text-purple-800',  borderClass: 'border-purple-500',  icon: GitBranch,     category: 'DevOps' },
  webhook:       { label: 'Webhook',              color: '#22c55e', bgClass: 'bg-green-50',   textClass: 'text-green-800',   borderClass: 'border-green-500',   icon: Sparkles,      category: 'Integration' },
  database_extra:{ label: 'DB Instance',      color: '#f97316', bgClass: 'bg-orange-50',  textClass: 'text-orange-800',  borderClass: 'border-orange-500',  icon: Database,      category: 'Data' },
  service:       { label: 'Microservice',        color: '#8b5cf6', bgClass: 'bg-violet-50',   textClass: 'text-violet-800',   borderClass: 'border-violet-500',   icon: Boxes,         category: 'Application' },
  cdn_extra:     { label: 'CDN Zone',            color: '#8b5cf6', bgClass: 'bg-violet-50',   textClass: 'text-violet-800',   borderClass: 'border-violet-500',   icon: Globe,         category: 'Network' },
  monitoring:    { label: 'Monitoring',         color: '#ec4899', bgClass: 'bg-pink-50',    textClass: 'text-pink-800',    borderClass: 'border-pink-500',    icon: Activity,      category: 'Ops' },
  logging:       { label: 'Log Service',        color: '#06b6d4', bgClass: 'bg-cyan-50',    textClass: 'text-cyan-800',    borderClass: 'border-cyan-500',    icon: FileText,      category: 'Ops' },
  cache:         { label: 'Cache Layer',          color: '#14b8a6', bgClass: 'bg-teal-50',    textClass: 'text-teal-800',    borderClass: 'border-teal-500',    icon: Zap,           category: 'Data' },
  gateway:       { label: 'API Gateway',        color: '#6366f1', bgClass: 'bg-indigo-50',  textClass: 'text-indigo-800',  borderClass: 'border-indigo-500',  icon: Gateway,       category: 'Network' },
  loadbalancer:  { label: 'Load Balancer',    color: '#a855f7', bgClass: 'bg-purple-50',  textClass: 'text-purple-800',  borderClass: 'border-purple-500',  icon: Layers,        category: 'Network' },
  firewall:      { label: 'Firewall',           color: '#ef4444', bgClass: 'bg-red-50',     textClass: 'text-red-800',     borderClass: 'border-red-500',     icon: Shield,        category: 'Security' },
  vpn:           { label: 'VPN Tunnel',          color: '#14b8a6', bgClass: 'bg-teal-50',    textClass: 'text-teal-800',    borderClass: 'border-teal-500',    icon: Lock,          category: 'Network' },
  storage_extra: { label: 'Object Storage',    color: '#06b6d4', bgClass: 'bg-cyan-50',    textClass: 'text-cyan-800',    borderClass: 'border-cyan-500',    icon: HardDrive,     category: 'Data' },
};

export const ASSET_TYPE_OPTIONS: AssetType[] = [
  'provider', 'domain', 'app', 'database', 'cdn', 'storage',
  'mail', 'ssl', 'container', 'server', 'dns', 'network',
  'certificate', 'worker', 'bucket', 'person', 'custom',
  'api', 'cron', 'docker', 'github', 'webhook', 'database_extra',
  'service', 'cdn_extra', 'monitoring', 'logging', 'cache',
  'gateway', 'loadbalancer', 'firewall', 'vpn', 'storage_extra',
];

export const AVAILABLE_ICONS: string[] = [
  'Cloud', 'Server', 'Database', 'Globe', 'Globe2', 'Shield', 'Mail', 'Lock',
  'Key', 'KeyRound', 'Cpu', 'HardDrive', 'Wifi', 'Link', 'Link2', 'Share2',
  'Network', 'Container', 'Layers', 'Layers2', 'AppWindow', 'Monitor', 'Laptop',
  'Smartphone', 'Zap', 'Bolt', 'Activity', 'Heart', 'HeartPulse',
  'Clock', 'Timer', 'Calendar', 'CalendarDays', 'AlertTriangle', 'Bell', 'BellRing',
  'CheckCircle', 'XCircle', 'Info', 'HelpCircle',
  'GitBranch', 'GitMerge', 'GitPullRequest', 'GitCommit',
  'Code', 'Code2', 'Terminal', 'Box', 'Package', 'Boxes',
  'File', 'FileText', 'Folder', 'FolderOpen', 'Archive',
  'MessageSquare', 'Send', 'Inbox',
  'User', 'Users', 'UserCheck', 'UserPlus',
  'Building', 'Building2', 'Home', 'Factory', 'Warehouse', 'Store',
  'CreditCard', 'DollarSign', 'Wallet', 'ShoppingCart',
  'Settings', 'Gauge', 'Wrench', 'Hammer', 'BarChart',
  'Table', 'Table2', 'PieChart', 'LineChart', 'TrendingUp',
  'Hash', 'AtSign', 'Type', 'Copy', 'Scissors', 'Clipboard',
  'RefreshCw', 'RotateCw', 'Repeat',
  'ShieldCheck', 'ShieldAlert', 'ShieldX',
  'LockOpen', 'Eye', 'EyeOff', 'Fingerprint',
  'ExternalLink', 'ArrowUpRight', 'ArrowLeftRight', 'ArrowDownRight',
  'Plus', 'Minus', 'X', 'Check', 'ArrowRight',
  'Bot', 'Sparkles', 'Brain', 'Atom',
  'Rocket', 'Plane', 'Map', 'MapPin', 'Pin',
  'BookOpen', 'Bookmark', 'Tag', 'Tags',
  'Flag', 'Target', 'Crosshair', 'Scan', 'QrCode',
  'Disc', 'Circle', 'Hexagon', 'Square', 'Triangle',
  'Star', 'Sun', 'Moon', 'Snowflake', 'Flame',
  'Droplet', 'Waves', 'TreeDeciduous', 'Mountain',
  'Mic', 'Camera', 'Video', 'Tv', 'Speaker',
  'Router', 'Battery', 'Plug',
  'Microscope', 'FlaskConical', 'TestTube', 'Beaker',
  'Webhook', 'Binary', 'Orbit', 'Component', 'Blocks',
  'Layout', 'LayoutDashboard', 'LayoutGrid', 'Kanban',
  'Workflow', 'GitFork', 'SplitSquareVertical',
  'CornerDownRight', 'CornerUpRight',
  'ZoomIn', 'ZoomOut',
  'Move', 'Edit', 'Edit2', 'Edit3', 'Pencil', 'PenTool',
  'Trash2', 'Eraser', 'Grip', 'GripVertical',
  'Sunrise', 'Sunset', 'Thermometer',
  'Compass', 'Navigation', 'Navigation2',
  'Languages', 'Earth',
];

export const EDGE_COLORS = [
  { value: '#94a3b8', label: 'Gray' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f59e0b', label: 'Amber' },
];

export const EDGE_STYLE_OPTIONS: { value: EdgeStyle; label: string }[] = [
  { value: 'solid',   label: 'Solid' },
  { value: 'dashed',  label: 'Dashed' },
  { value: 'dotted',  label: 'Dotted' },
];

export const EDGE_ARROW_OPTIONS: { value: EdgeArrow; label: string }[] = [
  { value: 'none',   label: 'No Arrow' },
  { value: 'target', label: '-> Target' },
  { value: 'source', label: '<- Source' },
  { value: 'both',   label: '<-> Both' },
];

export const LOCAL_GRAPH_KEY = 'cloud-topology-graph-v3';

export interface LocalCanvas {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export const LOCAL_CANVAS_STORE_KEY = 'cloud-topology-canvases';

export function canvasGraphKey(canvasId: string): string {
  return cloud-topology-graph-;
}
