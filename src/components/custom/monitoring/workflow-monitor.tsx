"use client";

import { Card } from "@/components/ui/card";
import { WorkflowDefinition } from "@/types/workflow.types";
import {
  Activity,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface WorkflowMonitorProps {
  workflow: WorkflowDefinition;
}

export function WorkflowMonitor({ workflow }: WorkflowMonitorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "paused":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  const getNextExecutionTime = () => {
    if (!workflow.nextExecution) return "Not scheduled";
    const now = Date.now();
    const diff = workflow.nextExecution - now;

    if (diff < 0) return "Overdue";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `In ${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? "s" : ""}`;
    return "Soon";
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Workflow Status</h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              workflow.status
            )}`}
          >
            {workflow.status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Executions</p>
                <p className="text-xl font-bold">
                  {workflow.executionCount || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              {/* <div>
                <p className="text-sm text-gray-500">Last Execution</p>
                <p className="text-sm font-medium">
                  {formatDate(workflow.lastExecution)}
                </p>
              </div> */}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Execution</p>
                <p className="text-sm font-medium">{getNextExecutionTime()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm font-medium">
                  {formatDate(workflow.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Workflow Details */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Workflow Details</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-gray-500">Workflow ID</span>
            <span className="text-sm font-mono">{workflow.id}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-gray-500">Type</span>
            <span className="text-sm font-medium">
              {workflow.type.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-gray-500">Trigger</span>
            {/* <span className="text-sm">
              {workflow.trigger.type === "schedule"
                ? `Every ${workflow.trigger.schedule}`
                : workflow.trigger.type}
            </span> */}
          </div>
          {workflow.action.amount && (
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="text-sm font-medium">
                {workflow.action.amount} FLOW
              </span>
            </div>
          )}
          {workflow.action.recipient && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Recipient</span>
              <span className="text-sm font-mono">
                {workflow.action.recipient.slice(0, 8)}...
                {workflow.action.recipient.slice(-6)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Health Status */}
      {workflow.status === "active" && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">
                Workflow is Healthy
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Your workflow is running smoothly. Next execution is scheduled
                for {getNextExecutionTime().toLowerCase()}.
              </p>
            </div>
          </div>
        </Card>
      )}

      {workflow.status === "paused" && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">
                Workflow is Paused
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Resume the workflow to continue scheduled executions.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
