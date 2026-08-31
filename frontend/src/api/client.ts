import { ReportItem, PrecursorChain, ExecutiveOverviewData, SiteDensityItem, ActivityDensityItem, BarrierFailureItem, AnomalyAlert } from "../types";

const API_BASE = "/api";

export async function fetchReports(): Promise<ReportItem[]> {
  try {
    const res = await fetch(`${API_BASE}/reports`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API not reachable, using embedded client database", err);
  }
  return [];
}

export async function fetchExecutiveOverview(): Promise<ExecutiveOverviewData | null> {
  try {
    const res = await fetch(`${API_BASE}/dashboard/executive-overview`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API not reachable for executive overview", err);
  }
  return null;
}

export async function fetchPriorityQueue(): Promise<ReportItem[]> {
  try {
    const res = await fetch(`${API_BASE}/dashboard/priority-queue`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API not reachable for priority queue", err);
  }
  return [];
}

export async function fetchReportById(reportId: string): Promise<ReportItem | null> {
  try {
    const res = await fetch(`${API_BASE}/reports/${reportId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Backend API not reachable for report ${reportId}`, err);
  }
  return null;
}

export async function fetchReportChain(reportId: string): Promise<PrecursorChain | null> {
  try {
    const res = await fetch(`${API_BASE}/reports/${reportId}/chain`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Backend API not reachable for chain ${reportId}`, err);
  }
  return null;
}

export async function submitReportReview(reportId: string, reviewerId: string, decision: string, reason?: string, correctedLabel?: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/reports/${reportId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewer_id: reviewerId,
        decision,
        reason,
        corrected_label: correctedLabel
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Backend API review submission error for ${reportId}`, err);
  }
  return null;
}

export async function createReport(data: any): Promise<ReportItem | null> {
  try {
    const res = await fetch(`${API_BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API report creation error", err);
  }
  return null;
}

export async function uploadDocumentFile(file: File, site?: string, activity?: string): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (site) formData.append("site", site);
    if (activity) formData.append("activity", activity);

    const res = await fetch(`${API_BASE}/upload/file`, {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API file upload error", err);
  }
  return null;
}

export async function uploadBatchCSV(file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/upload/batch-csv`, {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API batch CSV upload error", err);
  }
  return null;
}

// SIF Telemetry Engine API Endpoints
export async function fetchSiteTelemetry(siteName: string, activity?: string): Promise<any> {
  try {
    const params = new URLSearchParams();
    if (activity) params.append("activity", activity);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/telemetry/site/${encodeURIComponent(siteName)}${query}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Telemetry site API error, using fallback computation:", err);
  }
  return null;
}

export async function fetchTelemetrySitesSummary(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/telemetry/sites-summary`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Telemetry sites summary API error:", err);
  }
  return null;
}

export async function fetchSyntheticDemoTelemetry(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/telemetry/synthetic-demo`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Telemetry synthetic demo API error:", err);
  }
  return null;
}
