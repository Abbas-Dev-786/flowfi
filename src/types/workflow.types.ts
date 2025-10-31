// src/types/workflow.types.ts

export type WorkflowType =
  | "ONE_TIME_TRANSFER" // <-- ADD THIS
  | "SCHEDULED_TRANSFER"
  | "RECURRING_PAYMENT"
  | "BALANCE_MONITOR"
  | "NFT_AUTO_MINT"
  | "EVENT_TRIGGER";

export interface WorkflowDefinition {
  id: string;
  name: string;
  type: WorkflowType;
  trigger: TriggerConfig;
  action: ActionConfig;
  status: "active" | "paused" | "completed" | "failed";
  createdAt: number;
  nextExecution?: number;
  executionCount: number;
  creator: string; // Flow address
}

export interface TriggerConfig {
  type: "time" | "event" | "condition";

  // Time-based
  schedule?: "once" | "daily" | "weekly" | "monthly" | "immediate"; // <-- ADD 'immediate'
  executeAt?: string; // ISO timestamp or cron-like

  // Event-based
  eventName?: string;
  contractAddress?: string;

  // Condition-based
  condition?: {
    type: "balance" | "price" | "custom";
    operator: ">" | "<" | "==" | ">=" | "<=";
    threshold: string;
  };
}

export interface ActionConfig {
  type: "transfer" | "mint" | "swap" | "call";

  // Transfer specific
  token?: "FLOW" | "USDC" | string;
  amount?: string;
  recipient?: string;

  // NFT specific
  collectionAddress?: string;
  metadata?: Record<string, string>;

  // Custom contract call
  contractAddress?: string;
  methodName?: string;
  args?: (string | number | boolean)[];
}
