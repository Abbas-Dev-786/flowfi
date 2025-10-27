// types/workflow.types.ts

export type WorkflowType =
  | "SCHEDULED_TRANSFER" // Priority 1
  | "RECURRING_PAYMENT" // Priority 2
  | "BALANCE_MONITOR" // Priority 3
  | "NFT_AUTO_MINT" // Priority 4
  | "EVENT_TRIGGER"; // Priority 5

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
  schedule?: "once" | "daily" | "weekly" | "monthly";
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
