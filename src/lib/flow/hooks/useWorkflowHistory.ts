"use client";

import { useState, useEffect, useCallback } from "react";
import * as fcl from "@onflow/fcl";

export interface WorkflowExecution {
  workflowId: string;
  executionTime: number;
  status: "success" | "failed" | "pending";
  txId: string;
  gasUsed?: string;
  error?: string;
}

export function useWorkflowHistory(workflowId?: string) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!workflowId) return;

    setIsLoading(true);
    setError(null);

    try {
      const script = `
import WorkflowRegistry from 0x4051c307e9175648

access(all) fun main(workflowId: String): {String: AnyStruct}? {
  if let workflow = WorkflowRegistry.getWorkflow(id: workflowId) {
    return {
      "id": workflow.id,
      "executionCount": workflow.executionCount,
      "lastExecution": workflow.lastExecution,
      "nextExecution": workflow.nextExecution,
      "status": workflow.status
    }
  }
  return nil
}`;

      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(workflowId, t.String)],
      });

      if (result) {
        // For now, create a single execution entry from workflow data
        // In a full implementation, you'd query actual execution events
        const execution: WorkflowExecution = {
          workflowId: result.id,
          executionTime: result.lastExecution
            ? parseFloat(result.lastExecution) * 1000
            : Date.now(),
          status: result.status === "active" ? "success" : "pending",
          txId: "simulated", // Would come from events in production
          gasUsed: "0.001",
        };
        setExecutions([execution]);
      }
    } catch (err) {
      console.error("Failed to fetch workflow history:", err);
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    executions,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
