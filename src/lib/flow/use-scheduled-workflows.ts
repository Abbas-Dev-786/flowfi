"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowWorkflowManager } from "@/lib/flow/workflow";
import { WorkflowDefinition } from "@/types/workflow.types";

type Status = "idle" | "loading" | "error" | "success";

export function useScheduledWorkflows(
  userAddress?: string | null,
  options?: { pollMs?: number }
) {
  const pollMs = options?.pollMs ?? 15000;
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!userAddress) return;
    setStatus("loading");
    setError(null);
    try {
      const list = await FlowWorkflowManager.getUserWorkflows(userAddress);
      setWorkflows(list);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to load workflows");
    }
  }, [userAddress]);

  const pause = useCallback(
    async (workflowId: string) => {
      const txId = await FlowWorkflowManager.pauseWorkflow(workflowId);
      await load();
      return txId;
    },
    [load]
  );

  const resume = useCallback(
    async (workflowId: string) => {
      const txId = await FlowWorkflowManager.resumeWorkflow(workflowId);
      await load();
      return txId;
    },
    [load]
  );

  const executeNow = useCallback(
    async (workflow: WorkflowDefinition) => {
      const txId = await FlowWorkflowManager.executeWorkflow(workflow);
      await load();
      return txId;
    },
    [load]
  );

  useEffect(() => {
    if (!userAddress) return;
    // initial load
    load();
    // polling
    timerRef.current = window.setInterval(load, pollMs) as unknown as number;
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [userAddress, load, pollMs]);

  const meta = useMemo(() => ({ status, error }), [status, error]);

  return { workflows, load, pause, resume, executeNow, ...meta };
}
