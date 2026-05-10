"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export interface DriverJob {
  _id: string;
  address: string;
  location: string;
  wasteType: "general" | "organic" | "recycling" | "hazardous";
  amount: string;
  urgency: "low" | "normal" | "high";
  preferredDate: string;
  preferredTime: string;
  contactPhone: string;
  description: string;
  status: string;
  userName: string;
  distanceKm?: number;
  etaMin?: number;
}

export interface DriverSummary {
  completed: number;
  total: number;
  kgCollected: number;
  points: number;
  onTimeRate: number;
  allTimePoints: number;
  allTimeJobs: number;
}

// ─── Local-storage keys ───────────────────────────────────────────────────────
const LS_ACTIVE_JOB  = "driver_active_job";
const LS_CHECKS      = "driver_checklist";
const LS_TRIP_START  = "driver_trip_start_ts";   // epoch ms when trip started
const LS_TAB         = "driver_last_tab";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function lsDel(...keys: string[]) {
  try { keys.forEach(k => localStorage.removeItem(k)); } catch {}
}

const CHECKLIST_COUNT = 5; // must match CHECKLIST_ITEMS in the page component

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDriverJobs() {
  const [jobs, setJobs]       = useState<DriverJob[]>([]);
  const [summary, setSummary] = useState<DriverSummary>({
    completed: 0, total: 0, kgCollected: 0, points: 0,
    onTimeRate: 100, allTimePoints: 0, allTimeJobs: 0,
  });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Active-job state — all three pieces are kept in sync with localStorage
  const [activeJob, setActiveJobState]   = useState<DriverJob | null>(null);
  const [checks, setChecksState]         = useState<boolean[]>(Array(CHECKLIST_COUNT).fill(false));
  const [elapsed, setElapsed]            = useState(0);
  const [restoredTab, setRestoredTab]    = useState<string | null>(null);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const tripStartTs = useRef<number>(0);   // epoch ms

  // ── Persist helpers ───────────────────────────────────────────────────────
  const persistActiveJob = (job: DriverJob | null) => {
    if (job) lsSet(LS_ACTIVE_JOB, job);
    else     lsDel(LS_ACTIVE_JOB);
    setActiveJobState(job);
  };

  const persistChecks = useCallback((next: boolean[], jobId?: string) => {
    lsSet(LS_CHECKS, next);
    setChecksState(next);
    // Debounce backend save — fire and forget
    const id = jobId ?? lsGet<DriverJob>(LS_ACTIVE_JOB)?._id;
    if (id) {
      fetch("/api/driver/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id, checks: next }),
      }).catch(() => {});
    }
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = useCallback((fromEpochMs?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const start = fromEpochMs ?? Date.now();
    tripStartTs.current = start;
    lsSet(LS_TRIP_START, start);
    // Tick immediately, then every second
    setElapsed(Math.floor((Date.now() - start) / 1000));
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - tripStartTs.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    lsDel(LS_TRIP_START);
  }, []);

  // ── Fetch jobs + session on mount ─────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch jobs, summary, and current session in parallel
      const [jobsRes, summaryRes, sessionRes] = await Promise.all([
        fetch("/api/driver/jobs"),
        fetch("/api/driver/summary"),
        fetch("/api/driver/session"),
      ]);

      if (!jobsRes.ok) throw new Error("Failed to fetch jobs");
      const jobsData = await jobsRes.json();
      setJobs(jobsData.jobs ?? []);

      if (summaryRes.ok) {
        const sd = await summaryRes.json();
        setSummary(sd.summary);
      }

      // ── Session restore logic ──────────────────────────────────────────────
      if (sessionRes.ok) {
        const { activeJob: serverJob, elapsedSeconds } = await sessionRes.json();

        if (serverJob) {
          // Server has an in-progress job — it's the ground truth
          persistActiveJob(serverJob);
          lsSet(LS_ACTIVE_JOB, serverJob);

          // Restore checklist: prefer localStorage (more up-to-date), fall back to empty
          const savedChecks = lsGet<boolean[]>(LS_CHECKS);
          const restoredChecks =
            savedChecks && savedChecks.length === CHECKLIST_COUNT
              ? savedChecks
              : Array(CHECKLIST_COUNT).fill(false);
          setChecksState(restoredChecks);

          // Restore timer from server elapsed time (accurate even across devices)
          const startEpoch = Date.now() - elapsedSeconds * 1000;
          startTimer(startEpoch);

          // Restore the tab the driver was on
          const savedTab = lsGet<string>(LS_TAB);
          if (savedTab) setRestoredTab(savedTab);
          else if (serverJob.status === "collecting") setRestoredTab("proof");
          else if (serverJob.status === "en_route" || serverJob.status === "arrived")
            setRestoredTab("trip");

        } else {
          // No active job on server — clear any stale localStorage
          const staleJob = lsGet<DriverJob>(LS_ACTIVE_JOB);
          if (staleJob) {
            lsDel(LS_ACTIVE_JOB, LS_CHECKS, LS_TRIP_START);
            setActiveJobState(null);
            setChecksState(Array(CHECKLIST_COUNT).fill(false));
          }
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Unknown error");

      // Offline fallback — restore from localStorage so the driver isn't stuck
      const cachedJob = lsGet<DriverJob>(LS_ACTIVE_JOB);
      if (cachedJob) {
        setActiveJobState(cachedJob);
        const savedChecks = lsGet<boolean[]>(LS_CHECKS);
        setChecksState(
          savedChecks?.length === CHECKLIST_COUNT
            ? savedChecks
            : Array(CHECKLIST_COUNT).fill(false)
        );
        const savedStart = lsGet<number>(LS_TRIP_START);
        if (savedStart) startTimer(savedStart);

        const savedTab = lsGet<string>(LS_TAB);
        if (savedTab) setRestoredTab(savedTab);
      }
    } finally {
      setLoading(false);
    }
  }, [startTimer]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 60_000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchJobs]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const startTrip = useCallback(async (job: DriverJob) => {
    // Optimistically update local state first so the UI responds instantly
    persistActiveJob(job);
    lsSet(LS_CHECKS, Array(CHECKLIST_COUNT).fill(false));
    setChecksState(Array(CHECKLIST_COUNT).fill(false));
    startTimer();
    lsSet(LS_TAB, "trip");

    await fetch(`/api/driver/jobs/${job._id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "en_route" }),
    });
  }, [startTimer]);

  const markArrived = useCallback(async (jobId: string) => {
    lsSet(LS_TAB, "proof");
    await fetch(`/api/driver/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "collecting" }),
    });
    // Update the cached job's status
    setActiveJobState(prev => prev ? { ...prev, status: "collecting" } : prev);
    const cached = lsGet<DriverJob>(LS_ACTIVE_JOB);
    if (cached) lsSet(LS_ACTIVE_JOB, { ...cached, status: "collecting" });
  }, []);

  const completeJob = useCallback(async (
    jobId: string,
    data: { weight: number; notes: string; imageUrls: string[] }
  ) => {
    const res = await fetch(`/api/driver/jobs/${jobId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Completion failed");
    }
    const result = await res.json();

    // Clean up all persisted state for this job
    stopTimer();
    lsDel(LS_ACTIVE_JOB, LS_CHECKS, LS_TRIP_START, LS_TAB);
    setActiveJobState(null);
    setChecksState(Array(CHECKLIST_COUNT).fill(false));
    setElapsed(0);

    setJobs(prev => prev.filter(j => j._id !== jobId));
    setSummary(s => ({
      ...s,
      completed: s.completed + 1,
      kgCollected: +(s.kgCollected + data.weight).toFixed(1),
      points: s.points + (result.pointsEarned ?? 0),
    }));
    return result;
  }, [stopTimer]);

  const reportIssue = useCallback(async (jobId: string, issue: string) => {
    const res = await fetch(`/api/driver/jobs/${jobId}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issue }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Report failed");
    }
    return res.json();
  }, []);

  const toggleCheck = useCallback((index: number) => {
    setChecksState(prev => {
      const next = prev.map((v, i) => i === index ? !v : v);
      lsSet(LS_CHECKS, next);
      // Persist to backend too
      const jobId = lsGet<DriverJob>(LS_ACTIVE_JOB)?._id;
      if (jobId) {
        fetch("/api/driver/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, checks: next }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  const saveTab = useCallback((tab: string) => {
    lsSet(LS_TAB, tab);
  }, []);

  // ── Legacy compat (for the page component that calls updateJobStatus directly) ──
  const updateJobStatus = useCallback(async (jobId: string, status: string) => {
    const res = await fetch(`/api/driver/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Status update failed");
    }
    return res.json();
  }, []);

  return {
    // State
    jobs,
    summary,
    loading,
    error,
    activeJob,
    checks,
    elapsed,
    restoredTab,

    // Actions
    refetch:      fetchJobs,
    startTrip,
    markArrived,
    completeJob,
    reportIssue,
    toggleCheck,
    saveTab,

    // Timer control (for page-level needs)
    startTimer,
    stopTimer,

    // Legacy
    updateJobStatus,

    // Setters the page can use if needed
    setActiveJob: persistActiveJob,
    setChecks:    persistChecks,
  };
}