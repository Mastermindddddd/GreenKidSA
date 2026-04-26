// Path: /app/admin/page.tsx
// Route: /admin

// @ts-nocheck
"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Inbox, Truck, Users, Activity,
  BarChart3, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  XCircle, ChevronDown, ChevronRight, Search, Filter,
  MapPin, Weight, Zap, Leaf, Recycle, Package,
  TrendingUp, TrendingDown, ArrowUpRight, Eye,
  UserCheck, UserX, Bell, Download, Calendar,
  Loader2, MoreVertical, Circle,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Request {
  _id: string;
  userName: string;
  userEmail: string;
  address: string;
  location: string;
  wasteType: string;
  amount: string;
  urgency: "low" | "normal" | "high";
  status: string;
  createdAt: string;
  collectorName?: string;
  hasOpenIssue?: boolean;
  preferredDate?: string;
  preferredTime?: string;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
  totalJobsCompleted: number;
  totalKgCollected: number;
  totalPoints: number;
  activeJob?: string;
  status: "active" | "idle" | "offline";
}

interface Truck {
  _id: string;
  plate: string;
  model: string;
  status: "available" | "on_route" | "maintenance";
  driverName?: string;
  lastLocation?: string;
  capacityKg: number;
  currentLoadKg?: number;
}

interface Stats {
  totalRequests: number;
  pendingRequests: number;
  assignedRequests: number;
  completedToday: number;
  totalDrivers: number;
  activeDrivers: number;
  totalTrucks: number;
  trucksOnRoute: number;
  kgCollectedToday: number;
  openIssues: number;
  requestsTrend: number;
  completionRate: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "requests", label: "Requests", Icon: Inbox },
  { id: "drivers", label: "Drivers", Icon: Users },
  { id: "trucks", label: "Trucks", Icon: Truck },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "reports", label: "Reports", Icon: BarChart3 },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  pending:    { label: "Pending",    color: "#92400e", bg: "#FEF3C7", Icon: Clock },
  assigned:   { label: "Assigned",   color: "#1e40af", bg: "#DBEAFE", Icon: UserCheck },
  en_route:   { label: "En Route",   color: "#6d28d9", bg: "#EDE9FE", Icon: Truck },
  collecting: { label: "Collecting", color: "#065f46", bg: "#D1FAE5", Icon: Package },
  collected:  { label: "Collected",  color: "#166534", bg: "#DCFCE7", Icon: CheckCircle2 },
  verified:   { label: "Verified",   color: "#14532d", bg: "#BBF7D0", Icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  color: "#991b1b", bg: "#FEE2E2", Icon: XCircle },
};

const WASTE_ICONS: Record<string, any> = {
  general: Package, organic: Leaf, recycling: Recycle, hazardous: Zap,
};

const URGENCY_COLOR: Record<string, string> = {
  high: "#EF4444", normal: "#F59E0B", low: "#22C55E",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, color: "#374151", bg: "#F3F4F6", Icon: Circle };
  const { Icon } = m;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: m.color, backgroundColor: m.bg }}>
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, trend, accent }: {
  label: string; value: string | number; sub?: string;
  icon: any; trend?: number; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + "20" }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 font-mono tracking-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}% vs yesterday
        </div>
      )}
    </div>
  );
}

// ─── PANEL: Overview ──────────────────────────────────────────────────────────
function OverviewPanel({ stats, requests, loading }: { stats: Stats; requests: Request[]; loading: boolean }) {
  const recentRequests = requests.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={stats.totalRequests} sub={`${stats.pendingRequests} pending`} icon={Inbox} trend={stats.requestsTrend} accent="#6366f1" />
        <StatCard label="Completed Today" value={stats.completedToday} sub={`${stats.completionRate}% rate`} icon={CheckCircle2} trend={4} accent="#22c55e" />
        <StatCard label="Active Drivers" value={`${stats.activeDrivers}/${stats.totalDrivers}`} sub="on shift now" icon={Users} accent="#f59e0b" />
        <StatCard label="Kg Collected" value={`${stats.kgCollectedToday}`} sub="today" icon={Weight} trend={12} accent="#14b8a6" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Trucks On Route" value={`${stats.trucksOnRoute}/${stats.totalTrucks}`} icon={Truck} accent="#8b5cf6" />
        <StatCard label="Open Issues" value={stats.openIssues} sub={stats.openIssues > 0 ? "need attention" : "all clear"} icon={AlertTriangle} accent="#ef4444" />
        <StatCard label="Assigned Jobs" value={stats.assignedRequests} icon={UserCheck} accent="#0ea5e9" />
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} icon={TrendingUp} trend={2} accent="#10b981" />
      </div>

      {/* Recent requests table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Requests</h3>
          <span className="text-xs text-gray-400">{loading ? "Refreshing…" : "Live"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Resident</th>
                <th className="text-left px-6 py-3">Address</th>
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Urgency</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentRequests.map((r) => {
                const WIcon = WASTE_ICONS[r.wasteType] ?? Package;
                return (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-semibold text-gray-800">{r.userName}</p>
                      <p className="text-xs text-gray-400">{r.userEmail}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600 max-w-[180px] truncate">{r.address}</td>
                    <td className="px-6 py-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        <WIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{r.wasteType}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold capitalize" style={{ color: URGENCY_COLOR[r.urgency] }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: URGENCY_COLOR[r.urgency] }} />
                        {r.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{r.collectorName ?? "—"}</td>
                  </tr>
                );
              })}
              {!loading && recentRequests.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No requests yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PANEL: Requests ──────────────────────────────────────────────────────────
function RequestsPanel({ requests, drivers, loading, onAssign, onRefresh }: {
  requests: Request[];
  drivers: Driver[];
  loading: boolean;
  onAssign: (requestId: string, driverId: string, driverName: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = requests.filter((r) => {
    const matchSearch = !search || r.address.toLowerCase().includes(search.toLowerCase()) || r.userName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchUrgency = filterUrgency === "all" || r.urgency === filterUrgency;
    return matchSearch && matchStatus && matchUrgency;
  });

  const handleAssign = async (requestId: string, driverId: string) => {
    const driver = drivers.find((d) => d._id === driverId);
    if (!driver) return;
    setAssigningId(requestId);
    try {
      await onAssign(requestId, driverId, driver.name);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search address or resident…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="all">All urgencies</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <p className="text-xs text-gray-400 font-medium">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>

      <div className="space-y-2">
        {filtered.map((r) => {
          const WIcon = WASTE_ICONS[r.wasteType] ?? Package;
          const isExpanded = expandedId === r._id;
          return (
            <div key={r._id} className={`bg-white rounded-2xl border transition-all overflow-hidden ${r.hasOpenIssue ? "border-red-200" : "border-gray-100"}`}>
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(isExpanded ? null : r._id)}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: URGENCY_COLOR[r.urgency] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{r.address}</span>
                    {r.hasOpenIssue && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Issue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{r.userName} · {new Date(r.createdAt).toLocaleDateString("en-ZA")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <WIcon className="w-3.5 h-3.5" /><span className="capitalize hidden sm:inline">{r.wasteType}</span>
                  </span>
                  <StatusBadge status={r.status} />
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-xs text-gray-400 mb-1">Amount</p><p className="font-semibold">{r.amount}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">Preferred Time</p><p className="font-semibold">{r.preferredTime || "—"}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">Urgency</p><p className="font-semibold capitalize">{r.urgency}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">Driver</p><p className="font-semibold">{r.collectorName ?? "Unassigned"}</p></div>
                  </div>

                  {(r.status === "pending" || r.status === "assigned") && (
                    <div className="flex items-center gap-3">
                      <select
                        id={`assign-${r._id}`}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                        defaultValue=""
                      >
                        <option value="" disabled>Select a driver…</option>
                        {["active", "idle", "offline"].map((s) => {
                          const group = drivers.filter((d) => d.status === s);
                          if (!group.length) return null;
                          const label = s === "active" ? "● Online" : s === "idle" ? "◑ Idle" : "○ Offline";
                          return (
                            <optgroup key={s} label={label}>
                              {group.map((d) => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                      <button
                        onClick={() => {
                          const sel = document.getElementById(`assign-${r._id}`) as HTMLSelectElement;
                          if (sel.value) handleAssign(r._id, sel.value);
                        }}
                        disabled={assigningId === r._id}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {assigningId === r._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No requests match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PANEL: Drivers ───────────────────────────────────────────────────────────
function DriversPanel({ drivers, loading }: { drivers: Driver[]; loading: boolean }) {
  const STATUS_COLOR = { active: "#22c55e", idle: "#f59e0b", offline: "#9ca3af" };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((d) => (
          <div key={d._id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {d.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{d.name}</p>
                <p className="text-xs text-gray-400 truncate">{d.email}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold capitalize" style={{ color: STATUS_COLOR[d.status] }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[d.status] }} />
                {d.status}
              </span>
            </div>

            {d.activeJob && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs">
                <p className="text-green-600 font-semibold">Active Job</p>
                <p className="text-green-800 truncate">{d.activeJob}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Jobs", value: d.totalJobsCompleted },
                { label: "Kg", value: d.totalKgCollected?.toFixed(0) ?? "0" },
                { label: "Points", value: d.totalPoints },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl py-2">
                  <p className="font-bold text-gray-900 font-mono">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {drivers.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No drivers registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PANEL: Trucks ────────────────────────────────────────────────────────────
function TrucksPanel({ trucks, loading }: { trucks: Truck[]; loading: boolean }) {
  const STATUS_META_TRUCK: Record<string, { label: string; color: string; bg: string }> = {
    available:   { label: "Available",   color: "#166534", bg: "#DCFCE7" },
    on_route:    { label: "On Route",    color: "#1e40af", bg: "#DBEAFE" },
    maintenance: { label: "Maintenance", color: "#991b1b", bg: "#FEE2E2" },
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.map((t) => {
          const sm = STATUS_META_TRUCK[t.status] ?? { label: t.status, color: "#374151", bg: "#F3F4F6" };
          const loadPct = t.currentLoadKg != null ? Math.min(100, Math.round((t.currentLoadKg / t.capacityKg) * 100)) : 0;
          return (
            <div key={t._id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">{t.plate}</p>
                  <p className="text-xs text-gray-400">{t.model}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ color: sm.color, backgroundColor: sm.bg }}>
                  {sm.label}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Load capacity</span>
                  <span className="font-mono font-semibold">{t.currentLoadKg ?? 0}/{t.capacityKg} kg</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${loadPct}%`,
                      backgroundColor: loadPct > 80 ? "#ef4444" : loadPct > 50 ? "#f59e0b" : "#22c55e",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1 text-sm">
                {t.driverName && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {t.driverName}
                  </div>
                )}
                {t.lastLocation && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {t.lastLocation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {trucks.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No trucks registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PANEL: Activity Feed ─────────────────────────────────────────────────────
function ActivityPanel({ activity, loading }: { activity: any[]; loading: boolean }) {
  const iconFor = (type: string) => {
    if (type === "status_change") return Activity;
    if (type === "field_issue") return AlertTriangle;
    if (type === "collection_completed") return CheckCircle2;
    if (type === "assigned") return UserCheck;
    return Bell;
  };

  const colorFor = (type: string) => {
    if (type === "field_issue") return "#ef4444";
    if (type === "collection_completed") return "#22c55e";
    if (type === "assigned") return "#3b82f6";
    return "#6366f1";
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Live Activity Feed</h3>
        <p className="text-xs text-gray-400 mt-0.5">All system events in real time</p>
      </div>
      <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
        {activity.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No activity yet</p>
          </div>
        ) : (
          activity.map((a, i) => {
            const Icon = iconFor(a.type);
            const color = colorFor(a.type);
            return (
              <div key={a._id ?? i} className="flex gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: color + "15" }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(a.createdAt).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                {a.type === "field_issue" && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold self-start flex-shrink-0">Issue</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── PANEL: Reports ───────────────────────────────────────────────────────────
function ReportsPanel({ stats, requests }: { stats: Stats; requests: Request[] }) {
  const wasteBreakdown = ["general", "organic", "recycling", "hazardous"].map((type) => ({
    type,
    count: requests.filter((r) => r.wasteType === type).length,
    pct: requests.length > 0 ? Math.round((requests.filter((r) => r.wasteType === type).length / requests.length) * 100) : 0,
  }));

  const statusBreakdown = Object.keys(STATUS_META).map((status) => ({
    status,
    count: requests.filter((r) => r.status === status).length,
  })).filter((s) => s.count > 0);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/reports/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `greenkidsa-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    }
  };

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Reports & Analytics</h3>
          <p className="text-xs text-gray-400 mt-0.5">Based on all-time data</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste type breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h4 className="font-bold text-gray-800 mb-4">Waste Type Distribution</h4>
          <div className="space-y-3">
            {wasteBreakdown.map(({ type, count, pct }, i) => {
              const WIcon = WASTE_ICONS[type] ?? Package;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700 capitalize">
                      <WIcon className="w-4 h-4" style={{ color: COLORS[i] }} />
                      {type}
                    </span>
                    <span className="text-sm font-mono font-bold text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h4 className="font-bold text-gray-800 mb-4">Status Distribution</h4>
          <div className="space-y-2">
            {statusBreakdown.map(({ status, count }) => {
              const m = STATUS_META[status];
              const pct = requests.length > 0 ? Math.round((count / requests.length) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: m?.color ?? "#6b7280" }} />
                  </div>
                  <span className="text-sm font-mono font-bold text-gray-700 w-8 text-right">{count}</span>
                </div>
              );
            })}
            {statusBreakdown.length === 0 && <p className="text-gray-400 text-sm">No data yet</p>}
          </div>
        </div>

        {/* Summary numbers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
          <h4 className="font-bold text-gray-800 mb-4">All-Time Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Requests",   value: stats.totalRequests },
              { label: "Completed",        value: stats.completedToday },
              { label: "Active Drivers",   value: stats.totalDrivers },
              { label: "Open Issues",      value: stats.openIssues },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold font-mono text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [dataLoading, setDataLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [requests, setRequests] = useState<Request[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0, pendingRequests: 0, assignedRequests: 0,
    completedToday: 0, totalDrivers: 0, activeDrivers: 0,
    totalTrucks: 0, trucksOnRoute: 0, kgCollectedToday: 0,
    openIssues: 0, requestsTrend: 0, completionRate: 0,
  });

  const isAdmin = (user as any)?.role === "admin" || (user as any)?.role === "dispatcher";

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
    if (!authLoading && user && !isAdmin) router.push("/");
  }, [user, authLoading, isAdmin, router]);

  const fetchAll = useCallback(async () => {
    setDataLoading(true);
    try {
      const [reqRes, drvRes, truckRes, actRes, statsRes] = await Promise.all([
        fetch("/api/admin/requests"),
        fetch("/api/admin/drivers"),
        fetch("/api/admin/trucks"),
        fetch("/api/admin/activity"),
        fetch("/api/admin/stats"),
      ]);

      if (reqRes.ok)   setRequests((await reqRes.json()).requests ?? []);
      if (drvRes.ok)   setDrivers((await drvRes.json()).drivers ?? []);
      if (truckRes.ok) setTrucks((await truckRes.json()).trucks ?? []);
      if (actRes.ok)   setActivity((await actRes.json()).activity ?? []);
      if (statsRes.ok) setStats(await statsRes.json());

      setLastRefresh(new Date());
    } catch (e) {
      console.error("Admin fetch error", e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAll();
      const interval = setInterval(fetchAll, 30_000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchAll]);

  const handleAssign = async (requestId: string, driverId: string, driverName: string) => {
    const res = await fetch("/api/admin/assign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, driverId, driverName }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => r._id === requestId ? { ...r, status: "assigned", collectorName: driverName } : r)
      );
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-green-900 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-green-400" />
              </div>
              <span className="font-bold text-gray-900">Admin Dashboard</span>
              {stats.openIssues > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.openIssues} issue{stats.openIssues !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:block">
                Last updated {lastRefresh.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <button
                onClick={fetchAll}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-700 font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === id
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === "requests" && stats.pendingRequests > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {stats.pendingRequests}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview"  && <OverviewPanel stats={stats} requests={requests} loading={dataLoading} />}
        {activeTab === "requests"  && <RequestsPanel requests={requests} drivers={drivers} loading={dataLoading} onAssign={handleAssign} onRefresh={fetchAll} />}
        {activeTab === "drivers"   && <DriversPanel drivers={drivers} loading={dataLoading} />}
        {activeTab === "trucks"    && <TrucksPanel trucks={trucks} loading={dataLoading} />}
        {activeTab === "activity"  && <ActivityPanel activity={activity} loading={dataLoading} />}
        {activeTab === "reports"   && <ReportsPanel stats={stats} requests={requests} />}
      </div>
    </div>
  );
}