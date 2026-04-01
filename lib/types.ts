// Health response from GET /api/health
export interface HealthStatus {
  status: 'healthy' | 'degraded';
  uptime_seconds: number;
  components: Record<string, string>; // { db: "healthy", telegram: "healthy", providers: "healthy" }
  memory_mb: number;
}

// Agent from POST /api/agent-registry { action: "list" }
export interface Agent {
  name: string;
  role: string;
  model: string;
  status: 'running' | 'paused' | 'error' | 'idle';
  lastHeartbeat: string;
  tokenBudget?: { used: number; limit: number };
  config?: Record<string, unknown>;
}

// Heartbeat status from POST /api/heartbeat { action: "status" }
export interface HeartbeatStatus {
  agents: Record<string, {
    status: 'running' | 'paused' | 'error' | 'idle';
    lastRun: string;
    nextRun: string;
    consecutiveErrors: number;
  }>;
}

// Metrics from GET /api/metrics
export interface Metrics {
  tokenUsage: { today: number; total: number };
  costs: Record<string, number>;
  toolFrequency: Record<string, number>;
}

// Task from POST /api/ai-tasks { action: "list" }
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
  subtasks?: { id: string; title: string; done: boolean }[];
  createdAt: string;
  updatedAt: string;
}

// API response envelope
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
