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

// ============================================================
// Pipelines & Stages
// ============================================================

export interface Stage {
  id: string;
  pipeline_id: string;
  name: string;
  order: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string | null;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string | null;
}

export interface PipelineWithStages extends Pipeline {
  stages: Stage[];
}

// ============================================================
// Deals
// ============================================================

export type DealStatus = "open" | "won" | "lost";

export interface Deal {
  id: string;
  lead_id: string;
  lead_name: string | null;
  pipeline_id: string;
  stage_id: string | null;
  value: string;
  credit_value: string | null;
  down_payment: string | null;
  installment: string | null;
  probability: number;
  expected_close_date: string | null;
  status: DealStatus;
  owner_id: string | null;
  custom_values: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

export interface DealListResponse {
  items: Deal[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================================
// Profile
// ============================================================

export type UserRole = "admin" | "gerente" | "vendedor";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================================
// Custom Fields
// ============================================================

export type CustomFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "checkbox"
  | "url";

export type CustomFieldTarget = "lead" | "deal";

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  target: CustomFieldTarget;
  options: unknown[] | null;
  is_required: boolean;
  is_unique: boolean;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================================
// Dashboard
// ============================================================

export interface StatusCount {
  status: string;
  count: number;
}

export interface LeadsMetrics {
  total: number;
  by_status: StatusCount[];
}

export interface DealsMetrics {
  total: number;
  open: number;
  won: number;
  lost: number;
  revenue_won: number;
  revenue_won_month: number;
  average_ticket: number;
}

export interface RecentLead {
  id: string;
  name: string;
  status: string;
  source: string | null;
  created_at: string | null;
}

export interface UpcomingDeal {
  id: string;
  lead_id: string;
  lead_name: string | null;
  value: number;
  probability: number;
  expected_close_date: string;
  stage_name: string | null;
}

export interface TopDeal {
  id: string;
  lead_id: string;
  lead_name: string | null;
  value: number;
  status: string;
  stage_name: string | null;
}

export interface DashboardMetrics {
  leads: LeadsMetrics;
  deals: DealsMetrics;
  recent_leads: RecentLead[];
  upcoming_deals: UpcomingDeal[];
  top_deals: TopDeal[];
}

// ============================================================
// API Keys
// ============================================================

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  owner_id: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApiKeyCreated extends ApiKey {
  /** Token completo — retornado APENAS na criação. */
  token: string;
}

// ============================================================
// Notes
// ============================================================

export type NoteRecordType = "lead" | "deal";

export interface Note {
  id: string;
  record_type: NoteRecordType;
  record_id: string;
  content: string;
  author_id: string | null;
  author_name: string | null;
  pinned: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================================
// Activities
// ============================================================

export type ActivityRecordType = "lead" | "deal";

export type ActivityType =
  | "call"
  | "meeting"
  | "email"
  | "whatsapp"
  | "task";

export interface Activity {
  id: string;
  record_type: ActivityRecordType;
  record_id: string;
  type: ActivityType;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  owner_id: string | null;
  owner_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================================
// Webhooks
// ============================================================

export type WebhookEvent =
  | "lead.created"
  | "lead.updated"
  | "deal.created"
  | "deal.updated"
  | "deal.status_changed"
  | "note.created";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  owner_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  attempts: number;
  error: string | null;
  created_at: string | null;
  completed_at: string | null;
}