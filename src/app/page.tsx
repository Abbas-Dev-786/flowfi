"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as fcl from "@onflow/fcl";
import { WorkflowInput } from "@/components/custom/workflow-input";
import { WorkflowPreview } from "@/components/custom/workflow-preview";
import { WorkflowCard } from "@/components/custom/workflow-card";
// import { WalletConnect } from "@/components/wallet-connect";
import { Button } from "@/components/ui/button";
import { ParsedWorkflow } from "@/lib/groq/client";
import { WorkflowDefinition } from "@/types/workflow.types";
import { FlowWorkflowManager } from "@/lib/flow/workflow";
import { Plus, Loader2 } from "lucide-react";
import { Connect, useFlowCurrentUser } from "@onflow/react-sdk";

export default function DashboardPage() {
  const router = useRouter();
  const { user, authenticate, unauthenticate } = useFlowCurrentUser();

  const [parsedWorkflow, setParsedWorkflow] = useState<ParsedWorkflow | null>(
    null
  );
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  const loadUserWorkflows = useCallback(async () => {
    if (!user?.addr) return;

    setLoadingWorkflows(true);
    try {
      const userWorkflows = await FlowWorkflowManager.getUserWorkflows(
        user.addr
      );
      setWorkflows(userWorkflows);
    } catch (error) {
      console.error("Failed to load workflows:", error);
    } finally {
      setLoadingWorkflows(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.addr) {
      loadUserWorkflows();
    }
  }, [user, loadUserWorkflows]);

  const handleWorkflowParsed = (workflow: ParsedWorkflow) => {
    setParsedWorkflow(workflow);
  };

  const handleDeploy = async () => {
    if (!parsedWorkflow || !user?.addr) return;

    setDeploying(true);
    try {
      // Convert parsed workflow to full workflow definition
      const workflowDefinition: WorkflowDefinition = {
        id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${
          parsedWorkflow.workflowType
        } - ${new Date().toLocaleDateString()}`,
        type: parsedWorkflow.workflowType,
        trigger: parsedWorkflow.trigger,
        action: parsedWorkflow.action,
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
      setParsedWorkflow(null);

      // Show success message (you can add a toast here)
      alert(
        `Workflow deployed successfully! Transaction: ${result.transactionId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error("Deployment error:", error);
        alert(`Deployment failed: ${error.message}`);
      } else {
        console.error("An unknown error occurred during deployment:", error);
        alert("An unknown error occurred during deployment.");
      }
    } finally {
      setDeploying(false);
    }
  };

  const handlePauseWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      await FlowWorkflowManager.pauseWorkflow(workflow.id);
      await loadUserWorkflows();
    } catch (error) {
      console.error("Failed to pause workflow:", error);
    }
  };

  const handleResumeWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      await FlowWorkflowManager.resumeWorkflow(workflow.id);
      await loadUserWorkflows();
    } catch (error) {
      console.error("Failed to resume workflow:", error);
    }
  };

  if (!user?.loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-blue-50">
        <div className="text-center space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              FlowSync
            </h1>
            <p className="text-gray-600 text-lg">
              Zapier for Web3 - Build onchain automations with AI
            </p>
          </div>
          <Connect />
          <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-medium">AI-Powered</div>
              <div className="text-sm text-gray-500">
                Natural language workflow creation
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-medium">Flow Forte</div>
              <div className="text-sm text-gray-500">
                Actions & scheduled transactions
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-medium">Automated</div>
              <div className="text-sm text-gray-500">Set it and forget it</div>
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
              FlowSync
            </h1>
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" passHref>
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/templates" passHref>
                <Button variant="ghost" size="sm">
                  Templates
                </Button>
              </Link>
              <Link href="/docs" passHref>
                <Button variant="ghost" size="sm">
                  Docs
                </Button>
              </Link>
            </nav>
          </div>
          <Connect />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Create Workflow Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Create Workflow</h2>
              <p className="text-gray-600">
                Describe your automation in plain English
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkflowInput onWorkflowParsed={handleWorkflowParsed} />

            {parsedWorkflow && (
              <WorkflowPreview
                workflow={parsedWorkflow}
                onDeploy={handleDeploy}
                onEdit={() => setParsedWorkflow(null)}
                deploying={deploying}
              />
            )}
          </div>
        </div>

        {/* My Workflows Section */}
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
              <span className="text-white">Refresh</span>
            </Button>
          </div>

          {loadingWorkflows ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first automation to get started
              </p>
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
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
                  onView={() => router.push(`/workflows/${workflow.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total Workflows</div>
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
          {/* <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total Executions</div>
            <div className="text-3xl font-bold text-black">
              {workflows.reduce((sum, w) => sum + w.executionCount, 0)}
            </div>
          </div> */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Gas Saved</div>
            <div className="text-3xl font-bold text-purple-600">~0.05 Ⓕ</div>
          </div>
        </div>
      </main>
    </div>
  );
}
