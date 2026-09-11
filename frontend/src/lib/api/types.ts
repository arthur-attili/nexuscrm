// ============================================================
// Leads
// ============================================================

export interface Lead {
  id: string;
  name: string;
  contact_info: Record<string, unknown>;
  source: string | null;
  status: string;
  pipeline_id: string | null;
  stage_id: string | null;
  owner_id: string | null;
  custom_values: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  page_size: number;
}