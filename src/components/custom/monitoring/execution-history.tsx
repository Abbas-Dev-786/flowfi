"use client";

import { Card } from "@/components/ui/card";
import { useWorkflowHistory, WorkflowExecution } from "@/lib/flow/hooks";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExecutionHistoryProps {
  workflowId: string;
}

export function ExecutionHistory({ workflowId }: ExecutionHistoryProps) {
  const { executions, isLoading, error, refetch } =
    useWorkflowHistory(workflowId);

  const getStatusIcon = (status: WorkflowExecution["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: WorkflowExecution["status"]) => {
    switch (status) {
      case "success":
        return "Completed";
      case "failed":
        return "Failed";
      case "pending":
        return "Pending";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Execution History</h3>
          <Button onClick={refetch} variant="ghost" size="sm">
            Refresh
          </Button>
        </div>

        {executions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No executions yet</p>
            <p className="text-sm">This workflow hasn't been executed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {executions.map((execution, index) => (
              <div
                key={`${execution.txId}-${index}`}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(execution.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getStatusText(execution.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(execution.executionTime)}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600">
                          Transaction: {execution.txId.slice(0, 16)}...
                        </p>
                        {execution.gasUsed && (
                          <p className="text-sm text-gray-600">
                            Gas Used: {execution.gasUsed} FLOW
                          </p>
                        )}
                        {execution.error && (
                          <p className="text-sm text-red-600">
                            Error: {execution.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {execution.txId !== "simulated" && (
                    <a
                      href={`https://testnet.flowscan.org/transaction/${execution.txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
