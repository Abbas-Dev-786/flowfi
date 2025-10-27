// components/workflow-preview.tsx
"use client";

import { ParsedWorkflow } from "@/lib/groq/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Send,
  AlertCircle,
  Calendar,
  CheckCircle,
  Zap,
  Loader2,
} from "lucide-react";

interface WorkflowPreviewProps {
  workflow: ParsedWorkflow;
  onDeploy: () => void;
  onEdit: () => void;
  deploying?: boolean;
}

export function WorkflowPreview({
  workflow,
  onDeploy,
  onEdit,
  deploying = false,
}: WorkflowPreviewProps) {
  const getWorkflowIcon = () => {
    switch (workflow.workflowType) {
      case "SCHEDULED_TRANSFER":
      case "RECURRING_PAYMENT":
        return <Send className="w-5 h-5" />;
      case "BALANCE_MONITOR":
        return <AlertCircle className="w-5 h-5" />;
      case "NFT_AUTO_MINT":
        return <Zap className="w-5 h-5" />;
      case "EVENT_TRIGGER":
        return <Zap className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getConfidenceColor = () => {
    if (workflow.confidence >= 0.9) return "bg-green-500";
    if (workflow.confidence >= 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full border-2 border-purple-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              {getWorkflowIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">
                {workflow.workflowType
                  .split("_")
                  .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                  .join(" ")}
              </CardTitle>
              <CardDescription className="mt-1">
                AI-generated workflow ready to deploy
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getConfidenceColor()}`} />
            <span className="text-xs text-gray-500">
              {(workflow.confidence * 100).toFixed(0)}% confident
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trigger Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-sm">Trigger</span>
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            {workflow.trigger.type === "time" && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Schedule: <strong>{workflow.trigger.schedule}</strong>
                  </span>
                </div>
                {workflow.trigger.executeAt && (
                  <div className="text-xs text-gray-500">
                    Executes: {workflow.trigger.executeAt}
                  </div>
                )}
              </>
            )}
            {workflow.trigger.type === "event" && (
              <div>
                Event: <strong>{workflow.trigger.eventName}</strong>
              </div>
            )}
            {workflow.trigger.type === "condition" && (
              <div>
                When balance {workflow.trigger.condition?.operator}{" "}
                <strong>{workflow.trigger.condition?.threshold}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm">Action</span>
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            {workflow.action.type === "transfer" && (
              <>
                <div>
                  Transfer:{" "}
                  <strong>
                    {workflow.action.amount} {workflow.action.token || "FLOW"}
                  </strong>
                </div>
                <div className="text-xs text-gray-500 font-mono break-all">
                  To: {workflow.action.recipient}
                </div>
              </>
            )}
            {workflow.action.type === "mint" && (
              <div>
                Mint NFT to{" "}
                <strong>
                  {workflow.action.recipient || "trigger recipient"}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Estimated gas fee:</span>
          <span className="font-medium">~0.001 FLOW</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onDeploy} disabled={deploying} className="flex-1">
            {deploying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Deploy to Testnet
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onEdit} disabled={deploying}>
            Edit
          </Button>
        </div>

        {/* Warning for low confidence */}
        {workflow.confidence < 0.7 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Low confidence - please review the workflow details carefully
          </div>
        )}
      </CardContent>
    </Card>
  );
}
