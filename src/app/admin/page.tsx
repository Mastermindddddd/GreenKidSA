// Path: /app/admin/page.tsx
// @ts-nocheck
"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Inbox, Truck, Users, Activity,
  BarChart3, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  XCircle, ChevronRight, Search, MapPin, Weight,
  Zap, Leaf, Recycle, Package, TrendingUp, TrendingDown,
  UserCheck, Download, Loader2, Circle, Shield,
} from "lucide-react";

interface Request {
  _id: string; userName: string; userEmail: string; address: string;
  location: string; wasteType: string; amount: string;
  urgency: "low"|"normal"|"high"; status: string; createdAt: string;
  collectorName?: string; hasOpenIssue?: boolean;
  preferredDate?: string; preferredTime?: string;
}
interface Driver {
  _id: string; name: string; email: string;
  totalJobsCompleted: number; totalKgCollected: number; totalPoints: number;
  activeJob?: string; status: "active"|"idle"|"offline";
}
interface TruckType {
  _id: string; plate: string; model: string;
  status: "available"|"on_route"|"maintenance";
  driverName?: string; lastLocation?: string;
  capacityKg: number; currentLoadKg?: number;
}
interface Stats {
  totalRequests: number; pendingRequests: number; assignedRequests: number;
  completedToday: number; totalDrivers: number; activeDrivers: number;
  totalTrucks: number; trucksOnRoute: number; kgCollectedToday: number;
  openIssues: number; requestsTrend: number; completionRate: number;
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "requests", label: "Requests", Icon: Inbox },
  { id: "drivers",  label: "Drivers",  Icon: Users },
  { id: "trucks",   label: "Trucks",   Icon: Truck },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "reports",  label: "Reports",  Icon: BarChart3 },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string; Icon: any }> = {
  pending:    { label:"Pending",    color:"#92400e", bg:"#FEF9EE", dot:"#F59E0B", Icon:Clock },
  assigned:   { label:"Assigned",   color:"#1e40af", bg:"#EFF6FF", dot:"#3B82F6", Icon:UserCheck },
  en_route:   { label:"En Route",   color:"#6d28d9", bg:"#F5F3FF", dot:"#8B5CF6", Icon:Truck },
  collecting: { label:"Collecting", color:"#065f46", bg:"#F0FDF9", dot:"#10B981", Icon:Package },
  collected:  { label:"Collected",  color:"#166534", bg:"#F0FDF4", dot:"#22C55E", Icon:CheckCircle2 },
  verified:   { label:"Verified",   color:"#14532d", bg:"#DCFCE7", dot:"#16A34A", Icon:CheckCircle2 },
  cancelled:  { label:"Cancelled",  color:"#991b1b", bg:"#FEF2F2", dot:"#EF4444", Icon:XCircle },
};

const WASTE_ICONS: Record<string, any> = {
  general:Package, organic:Leaf, recycling:Recycle, hazardous:Zap,
};

const URGENCY: Record<string, { color: string; bg: string }> = {
  high:   { color:"#DC2626", bg:"#FEF2F2" },
  normal: { color:"#D97706", bg:"#FFFBEB" },
  low:    { color:"#16A34A", bg:"#F0FDF4" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label:status, color:"#374151", bg:"#F3F4F6", dot:"#9CA3AF", Icon:Circle };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color:m.color, backgroundColor:m.bg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor:m.dot }} />
      {m.label}
    </span>
  );
}

function KpiCard({ label, value, sub, icon:Icon, trend, accent }: {
  label:string; value:string|number; sub?:string; icon:any; trend?:number; accent:string;
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 flex flex-col gap-2 lg:gap-3 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.07] -translate-y-4 translate-x-4" style={{ backgroundColor:accent }} />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor:accent+"18" }}>
          <Icon className="w-4 h-4" style={{ color:accent }} />
        </div>
      </div>
      <p className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight font-mono">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? "text-emerald-600":"text-red-500"}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
          {Math.abs(trend)}% vs yesterday
        </div>
      )}
    </div>
  );
}

function OverviewPanel({ stats, requests, loading }: { stats:Stats; requests:Request[]; loading:boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Requests"  value={stats.totalRequests}    sub={`${stats.pendingRequests} pending`} icon={Inbox}        trend={stats.requestsTrend} accent="#6366F1"/>
        <KpiCard label="Completed Today" value={stats.completedToday}   sub={`${stats.completionRate}% rate`}    icon={CheckCircle2} trend={4}                   accent="#10B981"/>
        <KpiCard label="Active Drivers"  value={`${stats.activeDrivers}/${stats.totalDrivers}`} sub="on shift"  icon={Users}        accent="#F59E0B"/>
        <KpiCard label="Kg Collected"    value={stats.kgCollectedToday} sub="today"                              icon={Weight}       trend={12}                  accent="#14B8A6"/>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Trucks On Route" value={`${stats.trucksOnRoute}/${stats.totalTrucks}`} icon={Truck}       accent="#8B5CF6"/>
        <KpiCard label="Open Issues"     value={stats.openIssues} sub={stats.openIssues > 0 ? "need attention":"all clear"} icon={AlertTriangle} accent="#EF4444"/>
        <KpiCard label="Assigned Jobs"   value={stats.assignedRequests} icon={UserCheck} accent="#0EA5E9"/>
        <KpiCard label="Completion Rate" value={`${stats.completionRate}%`} icon={TrendingUp} trend={2} accent="#10B981"/>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Recent Requests</h3>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${loading ? "bg-amber-100 text-amber-700":"bg-emerald-100 text-emerald-700"}`}>
            {loading ? "Refreshing…":"● Live"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                {["Resident","Address","Type","Urgency","Status","Driver"].map(h=>(
                  <th key={h} className="text-left px-4 lg:px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.slice(0,8).map(r => {
                const WIcon = WASTE_ICONS[r.wasteType] ?? Package;
                const urg = URGENCY[r.urgency];
                return (
                  <tr key={r._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 lg:px-6 py-3">
                      <p className="font-semibold text-gray-800 text-sm">{r.userName}</p>
                      <p className="text-xs text-gray-400 hidden lg:block">{r.userEmail}</p>
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-500 text-xs max-w-[140px] truncate">{r.address}</td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <WIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"/>
                        <span className="capitalize hidden sm:inline">{r.wasteType}</span>
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold capitalize" style={{ color:urg?.color, backgroundColor:urg?.bg }}>{r.urgency}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3"><StatusBadge status={r.status}/></td>
                    <td className="px-4 lg:px-6 py-3 text-gray-400 text-xs">{r.collectorName ?? "—"}</td>
                  </tr>
                );
              })}
              {!loading && requests.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No requests yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RequestsPanel({ requests, drivers, loading, onAssign, onRefresh }: {
  requests:Request[]; drivers:Driver[]; loading:boolean;
  onAssign:(reqId:string,drvId:string,drvName:string)=>Promise<void>; onRefresh:()=>void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [assigningId, setAssigningId] = useState<string|null>(null);
  const [expandedId, setExpandedId] = useState<string|null>(null);

  const filtered = requests.filter(r => {
    const s = search.toLowerCase();
    return (!s || r.address.toLowerCase().includes(s) || r.userName.toLowerCase().includes(s))
      && (filterStatus==="all" || r.status===filterStatus)
      && (filterUrgency==="all" || r.urgency===filterUrgency);
  });

  const handleAssign = async (requestId:string, driverId:string) => {
    const driver = drivers.find(d => d._id===driverId);
    if (!driver) return;
    setAssigningId(requestId);
    try { await onAssign(requestId, driverId, driver.name); }
    finally { setAssigningId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 lg:gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input type="text" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400 transition-all"/>
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400/40 min-w-0">
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterUrgency} onChange={e=>setFilterUrgency(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400/40">
          <option value="all">All urgencies</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <button onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 font-medium transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-green-600":"text-gray-400"}`}/>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
      <p className="text-xs text-gray-400 font-semibold">{filtered.length} result{filtered.length!==1?"s":""}</p>
      <div className="space-y-2">
        {filtered.map(r => {
          const WIcon = WASTE_ICONS[r.wasteType] ?? Package;
          const isExp = expandedId===r._id;
          const urg = URGENCY[r.urgency];
          return (
            <div key={r._id} className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-sm ${r.hasOpenIssue ? "border-red-200":"border-gray-100 hover:border-gray-200"}`}>
              <div className="flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={()=>setExpandedId(isExp?null:r._id)}>
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor:urg?.color }}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{r.address}</span>
                    {r.hasOpenIssue && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3"/> Issue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.userName} · {new Date(r.createdAt).toLocaleDateString("en-ZA")}</p>
                </div>
                <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                  <span className="hidden md:flex items-center gap-1 text-xs text-gray-500 font-medium">
                    <WIcon className="w-3.5 h-3.5"/><span className="capitalize">{r.wasteType}</span>
                  </span>
                  <StatusBadge status={r.status}/>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExp?"rotate-90":""}`}/>
                </div>
              </div>
              {isExp && (
                <div className="border-t border-gray-100 px-4 lg:px-5 py-4 bg-gray-50/60 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {[{label:"Amount",value:r.amount},{label:"Preferred Time",value:r.preferredTime||"—"},{label:"Urgency",value:<span className="capitalize">{r.urgency}</span>},{label:"Driver",value:r.collectorName??"Unassigned"}].map(({label,value})=>(
                      <div key={label}>
                        <p className="text-xs text-gray-400 mb-0.5 font-medium">{label}</p>
                        <p className="font-semibold text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                  {(r.status==="pending"||r.status==="assigned") && (
                    <div className="flex items-center gap-2 lg:gap-3">
                      <select id={`assign-${r._id}`} defaultValue=""
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400/40 min-w-0">
                        <option value="" disabled>Select a driver…</option>
                        {["active","idle","offline"].map(s=>{
                          const group=drivers.filter(d=>d.status===s);
                          if(!group.length) return null;
                          return (
                            <optgroup key={s} label={s==="active"?"● Online":s==="idle"?"◑ Idle":"○ Offline"}>
                              {group.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
                            </optgroup>
                          );
                        })}
                      </select>
                      <button
                        onClick={()=>{const sel=document.getElementById(`assign-${r._id}`) as HTMLSelectElement; if(sel.value) handleAssign(r._id,sel.value);}}
                        disabled={assigningId===r._id}
                        className="px-4 lg:px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0">
                        {assigningId===r._id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <UserCheck className="w-3.5 h-3.5"/>}
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length===0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-20"/>
            <p className="font-semibold">No requests match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DriversPanel({ drivers, loading }: { drivers:Driver[]; loading:boolean }) {
  const SS = {
    active:  { color:"#16A34A", bg:"#F0FDF4", dot:"#22C55E", label:"Active" },
    idle:    { color:"#D97706", bg:"#FFFBEB", dot:"#F59E0B", label:"Idle" },
    offline: { color:"#6B7280", bg:"#F9FAFB", dot:"#9CA3AF", label:"Offline" },
  };
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-green-600"/></div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {drivers.map(d => {
        const ss = SS[d.status];
        const initials = d.name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();
        return (
          <div key={d._id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm flex-shrink-0">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate text-sm">{d.name}</p>
                <p className="text-xs text-gray-400 truncate">{d.email}</p>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ color:ss.color, backgroundColor:ss.bg }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor:ss.dot }}/>{ss.label}
              </span>
            </div>
            {d.activeJob && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Active Job</p>
                <p className="text-xs text-emerald-800 font-medium truncate">{d.activeJob}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {[{label:"Jobs",value:d.totalJobsCompleted},{label:"Kg",value:d.totalKgCollected?.toFixed(0)??"0"},{label:"Points",value:d.totalPoints}].map(({label,value})=>(
                <div key={label} className="bg-gray-50 rounded-xl py-3 text-center">
                  <p className="font-black text-gray-900 font-mono text-lg">{value}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {drivers.length===0 && (
        <div className="col-span-full text-center py-20 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20"/>
          <p className="font-semibold">No drivers registered yet</p>
        </div>
      )}
    </div>
  );
}

function TrucksPanel({ trucks, loading }: { trucks:TruckType[]; loading:boolean }) {
  const TS = {
    available:   { label:"Available",   color:"#166534", bg:"#F0FDF4", bar:"#22C55E" },
    on_route:    { label:"On Route",    color:"#1E40AF", bg:"#EFF6FF", bar:"#3B82F6" },
    maintenance: { label:"Maintenance", color:"#991B1B", bg:"#FEF2F2", bar:"#EF4444" },
  };
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-green-600"/></div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {trucks.map(t => {
        const ts = TS[t.status] ?? { label:t.status, color:"#374151", bg:"#F3F4F6", bar:"#9CA3AF" };
        const loadPct = t.currentLoadKg != null ? Math.min(100, Math.round(t.currentLoadKg/t.capacityKg*100)) : 0;
        return (
          <div key={t._id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-black text-gray-900 text-lg tracking-tight">{t.plate}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.model}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ color:ts.color, backgroundColor:ts.bg }}>{ts.label}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500">Load capacity</span>
                <span className="font-mono font-bold text-gray-800">{t.currentLoadKg??0}/{t.capacityKg} kg</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-500" style={{ width:`${loadPct}%`, backgroundColor:ts.bar }}/>
              </div>
              <p className="text-[11px] text-gray-400 text-right font-medium">{loadPct}% full</p>
            </div>
            <div className="space-y-1.5 pt-1">
              {t.driverName && <div className="flex items-center gap-2 text-xs text-gray-600 font-medium"><Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"/>{t.driverName}</div>}
              {t.lastLocation && <div className="flex items-center gap-2 text-xs text-gray-600 font-medium"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"/>{t.lastLocation}</div>}
            </div>
          </div>
        );
      })}
      {trucks.length===0 && (
        <div className="col-span-full text-center py-20 text-gray-400">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-20"/>
          <p className="font-semibold">No trucks registered yet</p>
        </div>
      )}
    </div>
  );
}

function ActivityPanel({ activity, loading }: { activity:any[]; loading:boolean }) {
  const meta=(type:string)=>{
    if(type==="field_issue")          return { Icon:AlertTriangle, color:"#EF4444", bg:"#FEF2F2" };
    if(type==="collection_completed") return { Icon:CheckCircle2,  color:"#10B981", bg:"#F0FDF9" };
    if(type==="assigned")             return { Icon:UserCheck,     color:"#3B82F6", bg:"#EFF6FF" };
    return                                   { Icon:Activity,      color:"#6366F1", bg:"#EEF2FF" };
  };
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-green-600"/></div>;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 lg:px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm">Live Activity Feed</h3>
        <p className="text-xs text-gray-400 mt-0.5">All system events in real time</p>
      </div>
      <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
        {activity.length===0 ? (
          <div className="text-center py-20 text-gray-400"><Activity className="w-10 h-10 mx-auto mb-3 opacity-20"/><p className="font-semibold">No activity yet</p></div>
        ) : activity.map((a,i)=>{
          const {Icon,color,bg}=meta(a.type);
          return (
            <div key={a._id??i} className="flex gap-4 px-4 lg:px-6 py-4 hover:bg-gray-50/60 transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor:bg }}><Icon className="w-4 h-4" style={{ color }}/></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium">{a.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleString("en-ZA",{dateStyle:"short",timeStyle:"short"})}</p>
              </div>
              {a.type==="field_issue" && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold self-start flex-shrink-0">Issue</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportsPanel({ stats, requests }: { stats:Stats; requests:Request[] }) {
  const COLORS=["#10B981","#3B82F6","#F59E0B","#EF4444"];
  const wasteBreakdown=["general","organic","recycling","hazardous"].map((type,i)=>({
    type, color:COLORS[i],
    count:requests.filter(r=>r.wasteType===type).length,
    pct:requests.length>0?Math.round(requests.filter(r=>r.wasteType===type).length/requests.length*100):0,
  }));
  const statusBreakdown=Object.keys(STATUS_META).map(status=>({status,count:requests.filter(r=>r.status===status).length})).filter(s=>s.count>0);

  const handleExport=async()=>{
    try {
      const res=await fetch("/api/admin/reports/export");
      if(!res.ok) throw new Error();
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download=`greenkidsa-${new Date().toISOString().split("T")[0]}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Export failed."); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-bold text-gray-900">Reports & Analytics</h3><p className="text-xs text-gray-400 mt-0.5">Based on all-time data</p></div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          <Download className="w-4 h-4"/> Export CSV
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
          <h4 className="font-bold text-gray-800 text-sm mb-5">Waste Type Distribution</h4>
          <div className="space-y-4">
            {wasteBreakdown.map(({type,count,pct,color})=>{
              const WIcon=WASTE_ICONS[type]??Package;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 capitalize"><WIcon className="w-4 h-4" style={{color}}/>{type}</span>
                    <span className="text-sm font-mono font-bold text-gray-900">{count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full transition-all duration-700" style={{width:`${pct}%`,backgroundColor:color}}/></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
          <h4 className="font-bold text-gray-800 text-sm mb-5">Status Distribution</h4>
          <div className="space-y-3">
            {statusBreakdown.map(({status,count})=>{
              const m=STATUS_META[status];
              const pct=requests.length>0?Math.round(count/requests.length*100):0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <StatusBadge status={status}/>
                  <div className="flex-1 bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full" style={{width:`${pct}%`,backgroundColor:m?.dot??"#6B7280"}}/></div>
                  <span className="text-sm font-mono font-black text-gray-700 w-7 text-right">{count}</span>
                </div>
              );
            })}
            {statusBreakdown.length===0 && <p className="text-gray-400 text-sm">No data yet</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm lg:col-span-2">
          <h4 className="font-bold text-gray-800 text-sm mb-5">All-Time Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
            {[{label:"Total Requests",value:stats.totalRequests,color:"#6366F1"},{label:"Completed",value:stats.completedToday,color:"#10B981"},{label:"Total Drivers",value:stats.totalDrivers,color:"#F59E0B"},{label:"Open Issues",value:stats.openIssues,color:"#EF4444"}].map(({label,value,color})=>(
              <div key={label} className="rounded-xl p-4 text-center border border-gray-100" style={{backgroundColor:color+"08"}}>
                <p className="text-2xl lg:text-3xl font-black font-mono" style={{color}}>{value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading:authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [dataLoading, setDataLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [requests, setRequests] = useState<Request[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({totalRequests:0,pendingRequests:0,assignedRequests:0,completedToday:0,totalDrivers:0,activeDrivers:0,totalTrucks:0,trucksOnRoute:0,kgCollectedToday:0,openIssues:0,requestsTrend:0,completionRate:0});

  const isAdmin = (user as any)?.role==="admin"||(user as any)?.role==="dispatcher";

  useEffect(()=>{ if(!authLoading&&!user) router.push("/"); if(!authLoading&&user&&!isAdmin) router.push("/"); },[user,authLoading,isAdmin,router]);

  const fetchAll = useCallback(async()=>{
    setDataLoading(true);
    try {
      const [r1,r2,r3,r4,r5]=await Promise.all([fetch("/api/admin/requests"),fetch("/api/admin/drivers"),fetch("/api/admin/trucks"),fetch("/api/admin/activity"),fetch("/api/admin/stats")]);
      if(r1.ok) setRequests((await r1.json()).requests??[]);
      if(r2.ok) setDrivers((await r2.json()).drivers??[]);
      if(r3.ok) setTrucks((await r3.json()).trucks??[]);
      if(r4.ok) setActivity((await r4.json()).activity??[]);
      if(r5.ok) setStats(await r5.json());
      setLastRefresh(new Date());
    } catch(e){console.error(e);}
    finally{setDataLoading(false);}
  },[]);

  useEffect(()=>{ if(isAdmin){fetchAll(); const i=setInterval(fetchAll,30000); return()=>clearInterval(i);} },[isAdmin,fetchAll]);

  const handleAssign=async(requestId:string,driverId:string,driverName:string)=>{
    const res=await fetch("/api/admin/assign",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId,driverId,driverName})});
    if(res.ok) setRequests(prev=>prev.map(r=>r._id===requestId?{...r,status:"assigned",collectorName:driverName}:r));
  };

  if(authLoading||(!user&&!authLoading)) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-green-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50/80 mt-20">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-13 py-3">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-800 to-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <Shield className="w-4 h-4 text-white"/>
              </div>
              <span className="font-black text-gray-900 text-sm hidden sm:block">Admin Dashboard</span>
              {stats.openIssues>0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3"/>{stats.openIssues}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden md:block font-medium">
                Updated {lastRefresh.toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"})}
              </span>
              <button onClick={fetchAll} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-700 font-bold transition-colors px-3 py-1.5 rounded-lg hover:bg-green-50">
                <RefreshCw className={`w-3.5 h-3.5 ${dataLoading?"animate-spin":""}`}/>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
          {/* Tab nav — scrollable on mobile */}
          <div className="flex -mb-px overflow-x-auto">
            {NAV_ITEMS.map(({id,label,Icon})=>(
              <button key={id} onClick={()=>setActiveTab(id)}
                className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab===id?"border-green-600 text-green-700 bg-green-50/50":"border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50/50"
                }`}>
                <Icon className="w-3.5 h-3.5"/>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.slice(0,3)}</span>
                {id==="requests"&&stats.pendingRequests>0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">{stats.pendingRequests}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Page content */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 lg:py-6">
        {activeTab==="overview" && <OverviewPanel stats={stats} requests={requests} loading={dataLoading}/>}
        {activeTab==="requests" && <RequestsPanel requests={requests} drivers={drivers} loading={dataLoading} onAssign={handleAssign} onRefresh={fetchAll}/>}
        {activeTab==="drivers"  && <DriversPanel  drivers={drivers}  loading={dataLoading}/>}
        {activeTab==="trucks"   && <TrucksPanel   trucks={trucks}    loading={dataLoading}/>}
        {activeTab==="activity" && <ActivityPanel activity={activity} loading={dataLoading}/>}
        {activeTab==="reports"  && <ReportsPanel  stats={stats} requests={requests}/>}
      </div>
    </div>
  );
}