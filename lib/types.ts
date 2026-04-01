// Health response from GET /api/health
export interface HealthStatus {
  status: 'healthy' | 'degraded';
  uptime_seconds: number;
  components: Record<string, string>;
  memory_mb: number;
}

// Agent from POST /api/agent-registry { action: "list" }
export interface Agent {
  id: string;
  name: string;
  role: string;
  system_prompt: string;
  tools_allowed: string[];
  goals_assigned: string[];
  heartbeat_interval_ms: number;
  budget_monthly_tokens: number;
  tokens_used_this_month: number;
  status: string; // "active", etc.
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  context_mode: string;
}

// Heartbeat status from POST /api/heartbeat { action: "status" }
export interface HeartbeatAgent {
  agentId: string;
  nextWakeMs: number;
  intervalMs: number;
}

export interface HeartbeatStatus {
  running: boolean;
  agents: HeartbeatAgent[];
}

// Metrics from GET /api/metrics
export interface Metrics {
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost_usd: number;
  cost_by_model: Record<string, { tokens: number; count: number }>;
  tool_frequency: Record<string, number>;
  sample_size: number;
}

// Task from POST /api/ai-tasks { action: "list" }
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: string;
  dueDate?: string;
  subtasks?: { id: string; title: string; done: boolean }[];
  createdAt: string;
  updatedAt: string;
}

// Memory types
export interface MemoryFact {
  id: string;
  key: string;
  value: string;
  category?: string;
  createdAt: string;
}

export interface PendingFact {
  id: string;
  key: string;
  value: string;
  source: string;
  createdAt: string;
}

export interface BehaviorRule {
  id: string;
  rule: string;
  active: boolean;
  createdAt: string;
}
