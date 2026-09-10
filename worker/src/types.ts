// ============================================================
// MonitorFlare — 类型定义
// ============================================================

export type MonitorType = 'http' | 'dns' | 'port' | 'api';

export interface Monitor {
  id: number;
  name: string;
  url: string;
  display_url: string | null;
  type: MonitorType;
  config: string | null;
  method: string;
  request_headers: string | null;
  request_body: string | null;
  interval: number;
  status: 'UP' | 'DOWN' | 'RETRYING' | 'PAUSED' | 'DEGRADED';
  retry_count: number;
  last_check: string | null;
  keyword: string | null;
  user_agent: string | null;
  tags: string | null;
  domain_expiry: string | null;
  cert_expiry: string | null;
  check_info_status: string | null;
  paused: number;
  check_ssl: number;
  check_domain: number;
  alert_silence_uptime: number;
  alert_silence_ssl: number;
  alert_silence_domain: number;
  alert_error_rate: number;
  alert_after_failures: number;
  last_alert_uptime: string | null;
  last_alert_ssl: string | null;
  last_alert_domain: string | null;
  // 降级(DEGRADED)判定:可读到 2xx 但服务未完全健康。任一条件命中即降级。
  degraded_keyword: string | null;      // 响应体包含此关键字 → 降级
  degraded_latency_ms: number;          // 响应耗时 ≥ 此毫秒数 → 降级(0=关闭)
  degraded_status_codes: string | null; // 这些 HTTP 状态码(逗号分隔,如 "429,503")视为降级而非故障
  alert_silence_degraded: number;       // 降级告警静默小时数
  last_alert_degraded: string | null;
  sort_order: number;
  created_at: string;
}

export interface Log {
  id: number;
  monitor_id: number;
  status_code: number;
  latency: number;
  is_fail: number;
  degraded: number;
  reason: string | null;
  created_at: string;
}

export type ChannelType =
  | 'dingtalk' | 'wecom' | 'feishu' | 'telegram'
  | 'webhook' | 'email' | 'slack' | 'discord' | 'ntfy';

export type EmailProvider = 'resend' | 'sendgrid' | 'mailgun' | 'postmark' | 'ses';

export interface NotificationChannel {
  id: number;
  type: ChannelType;
  name: string;
  enabled: number;
  config: string;
  created_at: string;
}

export interface Incident {
  id: number;
  title: string;
  description: string | null;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'resolved';
  type: 'incident' | 'maintenance';
  scheduled_start: string | null;
  scheduled_end: string | null;
  affected_monitors: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Subscription {
  id: number;
  email: string;
  token: string;
  created_at: string;
}

export interface ApiKey {
  id: number;
  name: string;
  key_hash: string;
  created_at: string;
  last_used_at: string | null;
}

export type Bindings = {
  DB: D1Database;
  R2?: R2Bucket;
  DINGTALK_ACCESS_TOKEN: string;
  DINGTALK_SECRET: string;
  ADMIN_PASSWORD?: string;
  ADMIN_API_KEY?: string;
  MAGIC_LINK_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  CF_ACCESS_AUD?: string;
  ALLOWED_ORIGIN?: string;
  SESSION_TTL_HOURS?: string;
  BASE_URL?: string;
};

// 检查结果
export interface CheckResult {
  ok: boolean;
  degraded?: boolean;   // ok=true 但服务处于降级状态(仅 HTTP 监测会置位)
  statusCode: number;   // HTTP 状态码;DNS/Port 用 0/1 语义
  latency: number;      // 毫秒
  reason: string;       // 失败/降级原因(空串表示完全正常)
  detail?: string;      // 附加信息(如 DNS 记录值)
}
