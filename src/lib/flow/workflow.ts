// lib/flow/workflows.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fcl from "@onflow/fcl";
import { CadenceGenerator } from "./../cadence/generator";
import { WorkflowDefinition } from "@/types/workflow.types";

fcl.config({
  "app.detail.title": "FlowSync",
  "app.detail.icon": "https://flowsync.app/logo.png",
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "0xFungibleToken": "0x9a0766d93b6608b7",
  "0xFlowToken": "0x7e60df042a9c0868",
  "0xNonFungibleToken": "0x631e88ae7f1d7c20",
  "0xMetadataViews": "0x631e88ae7f1d7c20",
  "flow.network": "testnet",
  "0xWorkflowRegistry": process.env.NEXT_PUBLIC_WORKFLOW_REGISTRY_ADDRESS,
});

export class FlowWorkflowManager {
  /**
   * Deploy workflow to Flow testnet
   */
  static async deployWorkflow(
    workflow: WorkflowDefinition
  ): Promise<{ transactionId: string; contractAddress?: string }> {
    // Generate Cadence code
    const cadenceCode = CadenceGenerator.generateWorkflowTransaction(workflow);

    try {
      // Send transaction with proper argument formatting
      const transactionId = await fcl.mutate({
        cadence: cadenceCode,
        args: (arg, t) => this.buildTransactionArgsForFCL(workflow, arg, t),
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 9999,
      });

      console.log("Transaction sent:", transactionId);

      // Wait for transaction to be sealed
      const transaction = await fcl.tx(transactionId).onceSealed();

      console.log("Transaction sealed:", transaction);

      // Register workflow in registry
      await this.registerWorkflowOnchain(workflow);

      return {
        transactionId,
        contractAddress: transaction.events.find((e) =>
          e.type.includes("ContractDeployed")
        )?.data?.address,
      };
    } catch (error) {
      console.error("Deployment error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to deploy workflow: ${error.message}`);
      }
      throw new Error("Failed to deploy workflow");
    }
  }

  /**
   * Build Cadence transaction arguments for FCL
   */
  private static buildTransactionArgsForFCL(
    workflow: WorkflowDefinition,
    arg: (value: any, type: any) => any,
    t: any
  ) {
    const { type, action, trigger } = workflow;

    // Helper to format UFix64 values properly
    const formatUFix64 = (value: number | string | undefined): string => {
      if (!value) return "0.0";
      const num = typeof value === "string" ? parseFloat(value) : value;
      return num.toFixed(8); // UFix64 requires decimal format
    };

    // Helper to format UInt64 values properly
    const formatUInt64 = (value: number | string): string => {
      const num = typeof value === "string" ? parseInt(value) : value;
      return num.toString();
    };

    console.log("Building args for workflow type:", type);
    console.log("Action:", action);
    console.log("Trigger:", trigger);

    switch (type) {
      case "SCHEDULED_TRANSFER":
        const st_amount = formatUFix64(action.amount);
        const st_interval = formatUInt64(
          CadenceGenerator.scheduleToSeconds(trigger.schedule!)
        );
        return [
          arg(st_amount, t.UFix64),
          arg(action.recipient || "", t.Address),
          arg(st_interval, t.UInt64),
          arg(workflow.id, t.String), // Pass the workflow ID
        ];

      case "RECURRING_PAYMENT":
        const rp_amount = formatUFix64(action.amount);
        const rp_interval = formatUInt64(
          CadenceGenerator.scheduleToSeconds(trigger.schedule!)
        );
        console.log("RECURRING_PAYMENT args:", {
          amount: rp_amount,
          recipient: action.recipient,
          interval: rp_interval,
        });
        return [
          arg(rp_amount, t.UFix64),
          arg(action.recipient || "", t.Address),
          arg(rp_interval, t.UInt64),
        ];

      case "BALANCE_MONITOR":
        const bm_threshold = formatUFix64(trigger.condition?.threshold);
        console.log("BALANCE_MONITOR args:", { threshold: bm_threshold });
        return [
          arg(bm_threshold, t.UFix64),
          arg("3600", t.UInt64), // Check every hour
        ];

      case "NFT_AUTO_MINT":
        console.log("NFT_AUTO_MINT args:", {
          recipient: action.recipient || workflow.creator,
          uri: action.metadata?.uri,
        });
        return [
          arg(action.recipient || workflow.creator, t.Address),
          arg(action.metadata?.uri || "", t.String),
        ];

      case "EVENT_TRIGGER":
        console.log("EVENT_TRIGGER args:", {
          eventName: trigger.eventName,
          contractAddress: trigger.contractAddress,
        });
        return [
          arg(trigger.eventName || "", t.String),
          arg(trigger.contractAddress || "", t.Address),
        ];

      default:
        return [];
    }
  }

  static async executeWorkflow(workflow: WorkflowDefinition): Promise<string> {
    const cadenceCode = CadenceGenerator.generateWorkflowTransaction(workflow);

    const txId = await fcl.mutate({
      cadence: cadenceCode,
      args: (arg, t) => this.buildTransactionArgsForFCL(workflow, arg, t),
      proposer: fcl.currentUser,
      payer: fcl.currentUser,
      authorizations: [fcl.currentUser],
      limit: 9999,
    });

    await fcl.tx(txId).onceSealed();
    return txId;
  }

  /**
   * Register workflow in onchain registry
   */
  private static async registerWorkflowOnchain(
    workflow: WorkflowDefinition
  ): Promise<void> {
    const registerCadence = `
import WorkflowRegistry from 0xWorkflowRegistry

transaction(
  workflowId: String,
  creator: Address,
  workflowType: String
) {
  prepare(signer: &Account) {
    // Directly call the public function on the contract
    WorkflowRegistry.registerWorkflow(
      id: workflowId,
      creator: creator,
      workflowType: workflowType
    )
  }
}`;

    try {
      const txId = await fcl.mutate({
        cadence: registerCadence,
        args: (arg, t) => [
          arg(workflow.id, t.String),
          arg(workflow.creator, t.Address),
          arg(workflow.type, t.String),
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 100,
      });

      // Wait for the transaction to be sealed to confirm registration
      await fcl.tx(txId).onceSealed();

      console.log("Workflow registered successfully! TxID:", txId);
    } catch (error) {
      console.error("Critical: Registry registration failed:", error);

      // This is a critical error, so we should throw it to notify the caller
      if (error instanceof Error) {
        throw new Error(`Failed to register workflow: ${error.message}`);
      }
      throw new Error("Failed to register workflow");
    }
  }

  /**
   * Query workflow status from blockchain
   */
  static async getWorkflowStatus(
    workflowId: string
  ): Promise<WorkflowDefinition | null> {
    const script = `
import WorkflowRegistry from 0xWorkflowRegistry

access(all) fun main(workflowId: String): WorkflowRegistry.WorkflowMetadata? {
  return WorkflowRegistry.getWorkflow(id: workflowId)
}`;

    try {
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(workflowId, t.String)],
      });

      return result;
    } catch (error) {
      console.error("Failed to query workflow:", error);
      return null;
    }
  }

  /**
   * Pause workflow execution
   */
  static async pauseWorkflow(workflowId: string): Promise<string> {
    const pauseCadence = `
import WorkflowRegistry from 0xWorkflowRegistry

transaction(workflowId: String) {
  prepare(signer: &Account) {
    // Call the contract function directly
    WorkflowRegistry.updateWorkflowStatus(
      id: workflowId,
      newStatus: "paused"
    )
  }
}`;

    const txId = await fcl.mutate({
      cadence: pauseCadence,
      args: (arg, t) => [arg(workflowId, t.String)],
      proposer: fcl.currentUser,
      payer: fcl.currentUser,
      authorizations: [fcl.currentUser],
      limit: 100,
    });

    await fcl.tx(txId).onceSealed();
    return txId;
  }

  /**
   * Resume workflow execution
   */
  static async resumeWorkflow(workflowId: string): Promise<string> {
    const resumeCadence = `
import WorkflowRegistry from 0xWorkflowRegistry

transaction(workflowId: String) {
  prepare(signer: &Account) {
    // Call the contract function directly
    WorkflowRegistry.updateWorkflowStatus(
      id: workflowId,
      newStatus: "active"
    )
  }
}`;

    const txId = await fcl.mutate({
      cadence: resumeCadence,
      args: (arg, t) => [arg(workflowId, t.String)],
      proposer: fcl.currentUser,
      payer: fcl.currentUser,
      authorizations: [fcl.currentUser],
      limit: 100,
    });

    await fcl.tx(txId).onceSealed();
    return txId;
  }

  /**
   * Get user's workflows
   */
  static async getUserWorkflows(
    address: string
  ): Promise<WorkflowDefinition[]> {
    const script = `
import WorkflowRegistry from 0xWorkflowRegistry

access(all) fun main(creator: Address): [{String: AnyStruct}] {
  let userWorkflows: [{String: AnyStruct}] = []
  
  for id in WorkflowRegistry.workflows.keys {
    if let workflow = WorkflowRegistry.workflows[id] {
      if workflow.creator == creator {
        userWorkflows.append({
          "id": workflow.id,
          "creator": workflow.creator,
          "workflowType": workflow.workflowType,
          "createdAt": workflow.createdAt,
          "status": workflow.status,
          "executionCount": workflow.executionCount,
          "lastExecution": workflow.lastExecution,
          "nextExecution": workflow.nextExecution
        })
      }
    }
  }
  
  return userWorkflows
}`;

    try {
      const results = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });

      // ADD DEBUGGING HERE
      console.log("📊 Raw blockchain data:", results);

      // Define an interface for the raw workflow data from the blockchain
      interface RawWorkflow {
        id: string;
        creator: string;
        workflowType: string;
        createdAt: string;
        status: string;
        executionCount: string;
        lastExecution?: string;
        nextExecution?: string;
      }

      // Transform blockchain data to WorkflowDefinition type
      const transformed = results.map((w: RawWorkflow) => {
        console.log("🔄 Transforming workflow:", w);
        console.log(
          "   executionCount raw:",
          w.executionCount,
          typeof w.executionCount
        );

        return {
          id: w.id,
          name: w.workflowType
            .split("_")
            .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(" "),
          type: w.workflowType,
          creator: w.creator,
          status: w.status,
          createdAt: parseFloat(w.createdAt) * 1000,
          executionCount: parseInt(w.executionCount) || 0, // Add fallback
          lastExecution: w.lastExecution
            ? parseFloat(w.lastExecution) * 1000
            : undefined,
          nextExecution: w.nextExecution
            ? parseFloat(w.nextExecution) * 1000
            : undefined,
          trigger: {
            type: "schedule",
            schedule: "daily",
          },
          action: {
            type: "transfer",
            amount: 0,
          },
        };
      });

      console.log("✅ Transformed workflows:", transformed);
      return transformed;
    } catch (error) {
      console.error("Failed to fetch user workflows:", error);
      return [];
    }
  }

  /**
   * Estimate gas fees for workflow deployment
   */
  static async estimateGasFees(workflow: WorkflowDefinition): Promise<string> {
    // Simplified estimation - in production, you'd simulate the transaction
    const baseGas = 0.001; // Base transaction fee
    const complexityMultiplier: Record<WorkflowDefinition["type"], number> = {
      SCHEDULED_TRANSFER: 1,
      RECURRING_PAYMENT: 1.2,
      BALANCE_MONITOR: 1.5,
      NFT_AUTO_MINT: 2,
      EVENT_TRIGGER: 2.5,
    };

    const multiplier = complexityMultiplier[workflow.type] || 1;
    const estimatedFee = baseGas * multiplier;

    return estimatedFee.toFixed(4);
  }
}
