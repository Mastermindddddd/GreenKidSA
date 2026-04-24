"use client";
import { useState, useEffect, useCallback } from "react";

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

export function useDriverJobs() {
  const [jobs, setJobs] = useState<DriverJob[]>([]);
  const [summary, setSummary] = useState<DriverSummary>({
    completed: 0,
    total: 0,
    kgCollected: 0,
    points: 0,
    onTimeRate: 100,
    allTimePoints: 0,
    allTimeJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, summaryRes] = await Promise.all([
        fetch("/api/driver/jobs"),
        fetch("/api/driver/summary"),
      ]);

      if (!jobsRes.ok) throw new Error("Failed to fetch jobs");
      const jobsData = await jobsRes.json();
      setJobs(jobsData.jobs ?? []);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);
      }
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    // Poll for new assignments every 60 seconds
    const interval = setInterval(fetchJobs, 60_000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const updateJobStatus = async (jobId: string, status: string) => {
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
  };

  const completeJob = async (
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
    // Remove completed job from local list and update summary
    setJobs((prev) => prev.filter((j) => j._id !== jobId));
    setSummary((s) => ({
      ...s,
      completed: s.completed + 1,
      kgCollected: +(s.kgCollected + data.weight).toFixed(1),
      points: s.points + (result.pointsEarned ?? 0),
    }));
    return result;
  };

  const reportIssue = async (jobId: string, issue: string) => {
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
  };

  return {
    jobs,
    summary,
    loading,
    error,
    refetch: fetchJobs,
    updateJobStatus,
    completeJob,
    reportIssue,
  };
}