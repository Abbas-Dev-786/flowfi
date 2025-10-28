"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatInterface } from "@/components/custom/chat-interface";
import { WorkflowCard } from "@/components/custom/workflow-card";
import { Button } from "@/components/ui/button";
import { ParsedWorkflow } from "@/lib/groq/client";
import { WorkflowDefinition } from "@/types/workflow.types";
import { FlowWorkflowManager } from "@/lib/flow/workflow";
import { Loader2, MessageSquare } from "lucide-react";
import { useScheduledWorkflows } from "@/lib/flow/use-scheduled-workflows";
import { Connect, useFlowCurrentUser } from "@onflow/react-sdk";
import { toast } from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useFlowCurrentUser();

  const [viewMode, setViewMode] = useState<"chat" | "workflows">("chat");
  const {
    workflows,
    load: loadUserWorkflows,
    pause,
    resume,
    executeNow,
    status: workflowsStatus,
  } = useScheduledWorkflows(user?.addr ?? null, { pollMs: 20000 });

  const handleWorkflowDeploy = async (workflow: ParsedWorkflow) => {
    if (!user?.addr) return;

    try {
      // Convert parsed workflow to full workflow definition
      const workflowDefinition: WorkflowDefinition = {
        id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${workflow.workflowType} - ${new Date().toLocaleDateString()}`,
        type: workflow.workflowType,
        trigger: workflow.trigger,
        action: workflow.action,
        status: "active",
        createdAt: Date.now(),
        executionCount: 0,
        creator: user?.addr,
      };

      // Deploy to Flow testnet
      const result = await FlowWorkflowManager.deployWorkflow(
        workflowDefinition
      );

      // Success - reload workflows
      await loadUserWorkflows();

      // Show success message
      toast.success(`Workflow deployed!`);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Deployment error:", error);
        toast.error(`Deployment failed: ${error.message}`);
      } else {
        console.error("An unknown error occurred during deployment:", error);
        toast.error("An unknown error occurred during deployment.");
      }
    }
  };

  const flowscanTxUrl = (txId: string) =>
    `https://testnet.flowscan.org/transaction/${txId}`;

  const handlePauseWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      const txId = await pause(workflow.id);
      toast.success(`Paused • ${workflow.name}`);
    } catch (error) {
      console.error("Failed to pause workflow:", error);
      toast.error("Failed to pause workflow");
    }
  };

  const handleResumeWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      const txId = await resume(workflow.id);
      toast.success(`Resumed • ${workflow.name}`);
    } catch (error) {
      console.error("Failed to resume workflow:", error);
      toast.error("Failed to resume workflow");
    }
  };

  const handleExecuteWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      const txId = await executeNow(workflow);
      toast.success(`Execution sent • ${workflow.name}`);
    } catch (error) {
      console.error("Failed to execute workflow:", error);
      toast.error("Failed to execute workflow");
    }
  };

  if (!user?.loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-blue-50">
        <div className="text-center space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              FlowGPT
            </h1>
            <p className="text-gray-600 text-xl">
              The ChatGPT for Flow blockchain
            </p>
            <p className="text-gray-500 text-sm">
              Automate your crypto workflows through conversation
            </p>
          </div>
          <Connect />
          <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">💬</div>
              <div className="font-medium">Conversational</div>
              <div className="text-sm text-gray-500">
                Chat naturally with your blockchain
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🧠</div>
              <div className="font-medium">AI-Powered</div>
              <div className="text-sm text-gray-500">
                Context-aware and intelligent
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-medium">Flow Forte</div>
              <div className="text-sm text-gray-500">
                Native automation primitives
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              FlowGPT
            </h1>
            <nav className="hidden md:flex gap-2">
              <Button
                variant={viewMode === "chat" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chat")}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button
                variant={viewMode === "workflows" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("workflows")}
              >
                Workflows ({workflows.length})
              </Button>
            </nav>
          </div>
          <Connect />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {viewMode === "chat" ? (
          <div className="max-w-5xl mx-auto">
            <ChatInterface
              user={user}
              onWorkflowDeploy={handleWorkflowDeploy}
              isConnected={user?.loggedIn || false}
            />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">My Workflows</h2>
                  <p className="text-gray-600">
                    {workflows.length} active automation
                    {workflows.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadUserWorkflows}>
                  Refresh
                </Button>
              </div>

              {workflowsStatus === "loading" ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : workflows.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start chatting to create your first automation
                  </p>
                  <Button onClick={() => setViewMode("chat")}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Chatting
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflows.map((workflow) => (
                    <WorkflowCard
                      key={workflow.id}
                      workflow={workflow}
                      onPause={() => handlePauseWorkflow(workflow)}
                      onResume={() => handleResumeWorkflow(workflow)}
                      onExecute={() => handleExecuteWorkflow(workflow)}
                      onView={() => router.push(`/workflows/${workflow.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 mb-1">
                  Total Workflows
                </div>
                <div className="text-3xl font-bold text-black">
                  {workflows.length}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Active</div>
                <div className="text-3xl font-bold text-green-600">
                  {workflows.filter((w) => w.status === "active").length}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Gas Saved</div>
                <div className="text-3xl font-bold text-purple-600">
                  ~0.05 Ⓕ
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
