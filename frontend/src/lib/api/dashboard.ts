import { apiFetch } from "./client";
import type { DashboardMetrics } from "./types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>("/dashboard/metrics");
}