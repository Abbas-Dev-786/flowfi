// components/workflow-card.tsx

/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkflowDefinition } from "@/types/workflow.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlowWorkflowManager } from "@/lib/flow/workflow";
import { Clock, Pause, Play, ExternalLink, MoreVertical } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkflowCardProps {
  workflow: WorkflowDefinition;
  onPause: () => void;
  onResume: () => void;
  onView: () => void;
  onExecute?: () => void;
}

export function WorkflowCard({
  workflow,
  onPause,
  onResume,
  onView,
  onExecute,
}: WorkflowCardProps) {
  const getStatusColor = () => {
    switch (workflow.status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleExecuteNow = async () => {
    try {
      if (onExecute) {
        await onExecute();
      } else {
        await FlowWorkflowManager.executeWorkflow(workflow);
      }
      toast.success("Workflow executed successfully!");
    } catch (error) {
      toast.error("Failed to execute workflow");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Live countdown to nextExecution
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    if (!workflow.nextExecution) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [workflow.nextExecution]);

  const remaining = useMemo(() => {
    if (!workflow.nextExecution) return null;
    const ms = workflow.nextExecution - now;
    return ms > 0 ? ms : 0;
  }, [workflow.nextExecution, now]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {workflow.name || `${workflow.type} Workflow`}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs text-black">
                {workflow.type.split("_").join(" ")}
              </Badge>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <span className="text-xs text-black capitalize">
                  {workflow.status}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <ExternalLink className="w-4 h-4 mr-2 text-black" />
                <span className="text-black">View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExecuteNow}>
                <Play className="w-4 h-4 mr-2 text-black" />
                <span className="text-black">Execute Now</span>
              </DropdownMenuItem>
              {workflow.status === "active" ? (
                <DropdownMenuItem onClick={onPause}>
                  <Pause className="w-4 h-4 mr-2 text-black" />
                  <span className="text-black">Pause</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onResume}>
                  <Play className="w-4 h-4 mr-2 text-black" />
                  <span className="text-black">Resume</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between text-gray-600">
          <span>Executions:</span>
          <span className="font-medium text-black">
            {workflow.executionCount}
          </span>
        </div>
        {/* {workflow.lastExecution && (
          <div className="flex items-center justify-between text-gray-600">
            <span>Last run:</span>
            <span className="font-medium text-black">
              {formatDate(workflow.lastExecution)}
            </span>
          </div>
        )} */}

        {workflow.nextExecution && (
          <div className="flex items-center justify-between text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-black" />
              <span>Next run:</span>
            </div>
            <span className="font-medium text-black">
              {formatDate(workflow.nextExecution)}
            </span>
          </div>
        )}

        {remaining !== null && (
          <div className="flex items-center justify-between text-gray-600">
            <span>Countdown:</span>
            <span className="font-medium text-black">
              {formatDuration(remaining)}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {workflow.status === "active" ? (
            <Button size="sm" variant="secondary" onClick={handleExecuteNow}>
              Schedule now
            </Button>
          ) : null}
        </div>

        <div className="pt-2 border-t text-xs text-gray-500">
          Created {formatDate(workflow.createdAt)}
        </div>
      </CardContent>
    </Card>
  );
}
