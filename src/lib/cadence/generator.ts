// src/lib/cadence/generator.ts
import {
  WorkflowDefinition,
  ActionConfig,
  TriggerConfig,
} from "@/types/workflow.types";

// --- CONTRACT ADDRESSES (TESTNET) ---
// (From your flow.json)
const FT_ADDRESS = "0x9a0766d93b6608b7";
const FLOW_TOKEN_ADDRESS = "0x7e60df042a9c0868";
const WORKFLOW_REGISTRY_ADDRESS = "0x4051c307e9175648";

export class CadenceGenerator {
  /**
   * Generate complete Cadence transaction for workflow
   */
  static generateWorkflowTransaction(workflow: WorkflowDefinition): string {
    const { type, trigger, action } = workflow;

    switch (type) {
      // NEW CASE
      case "ONE_TIME_TRANSFER":
        return this.generateOneTimeTransfer(action);

      case "SCHEDULED_TRANSFER":
      case "RECURRING_PAYMENT":
        return this.generateScheduledTransfer(trigger, action);

      case "BALANCE_MONITOR":
        return this.generateBalanceMonitor(trigger, action);

      case "NFT_AUTO_MINT":
        return this.generateNFTMint(action);

      case "EVENT_TRIGGER":
        return this.generateEventTrigger(trigger, action);

      default:
        throw new Error(`Unsupported workflow type: ${type}`);
    }
  }

  // --- NEW FUNCTION ---
  /**
   * Simple One-Time Transfer
   */
  private static generateOneTimeTransfer(action: ActionConfig): string {
    // This transaction is parameterized.
    // The frontend will supply 'amount' and 'recipient'
    return `
import FungibleToken from ${FT_ADDRESS}
import FlowToken from ${FLOW_TOKEN_ADDRESS}

transaction(amount: UFix64, recipient: Address) {

  let senderVault: &FlowToken.Vault

  prepare(signer: auth(Storage) &Account) {
    self.senderVault = signer.storage.borrow<&FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow FlowToken Vault reference")
  }

  execute {
    let recipientReceiver = getAccount(recipient)
      .capabilities.get<&{FungibleToken.Receiver}>(
        /public/flowTokenReceiver
      )
      .borrow()
      ?? panic("Could not borrow recipient's receiver")

    let tokens <- self.senderVault.withdraw(amount: amount)
    recipientReceiver.deposit(from: <-tokens)

    log("✅ One-time transfer successful.")
  }
}`;
  }

  /**
   * Helper: Convert schedule to interval in seconds
   */
  public static scheduleToSeconds(schedule: string): number {
    const scheduleMap: Record<string, number> = {
      daily: 86400,
      weekly: 604800,
      monthly: 2592000,
      hourly: 3600,
    };
    return scheduleMap[schedule] || 604800; // Default to 1 week
  }

  /**
   * Scheduled/Recurring Payment using Forte
   */
  private static generateScheduledTransfer(
    trigger: TriggerConfig,
    action: ActionConfig
  ): string {
    const intervalSeconds = this.scheduleToSeconds(
      trigger.schedule || "weekly"
    );

    return `
import FungibleToken from ${FT_ADDRESS}
import FlowToken from ${FLOW_TOKEN_ADDRESS}
import WorkflowRegistry from ${WORKFLOW_REGISTRY_ADDRESS}

transaction(
  amount: UFix64,
  recipient: Address,
  workflowId: String
) {

  let vaultRef: &FlowToken.Vault

  prepare(signer: auth(Storage) &Account) {
    self.vaultRef = signer.storage.borrow<&FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow FlowToken Vault reference")
  }

  execute {
    let tokens <- self.vaultRef.withdraw(amount: amount)
    
    let recipientVault = getAccount(recipient)
      .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      .borrow()
      ?? panic("Could not borrow recipient's vault receiver")

    recipientVault.deposit(from: <-tokens)

    let interval = UFix64(${intervalSeconds}.0)
    let nextRun = getCurrentBlock().timestamp + interval
    
    WorkflowRegistry.recordWorkflowExecution(id: workflowId, nextRun: nextRun)

    log("✅ Workflow executed: Transfer complete and next run scheduled.")
  }
}`;
  }

  // ... (rest of your generator file: generateBalanceMonitor, generateNFTMint, etc.)
  // ... (they remain unchanged)

  /**
   * Balance Monitor with Conditional Execution
   */
  private static generateBalanceMonitor(
    trigger: TriggerConfig,
    action: ActionConfig
  ): string {
    const { condition } = trigger;
    const operatorMap: Record<string, string> = {
      less_than: "<",
      greater_than: ">",
      equals: "==",
      "<": "<",
      ">": ">",
      "==": "==",
    };
    const operator = operatorMap[condition?.operator || "less_than"] || "<";
    const actionCode = this.generateActionCode(action);

    return `
import FungibleToken from ${FT_ADDRESS}
import FlowToken from ${FLOW_TOKEN_ADDRESS}

transaction(
  thresholdAmount: UFix64
) {

  prepare(signer: auth(Storage) &Account) {
    let vaultRef = signer.storage.borrow<&FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow vault")

    let currentBalance = vaultRef.balance

    if currentBalance ${operator} thresholdAmount {
      log("Balance threshold reached!")
      ${actionCode}
    } else {
      log("Balance is within normal range")
    }
  }

  execute {
    log("Balance check completed")
  }
}`;
  }

  /**
   * NFT Auto Mint on Event
   */
  private static generateNFTMint(action: ActionConfig): string {
    return `
import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x631e88ae7f1d7c20

transaction(
  recipient: Address,
  metadataURI: String
) {

  prepare(signer: auth(Storage) &Account) {
    log("NFT minting transaction prepared")
  }

  execute {
    log("NFT minting executed successfully")
  }
}`;
  }

  /**
   * Event Listener & Trigger
   */
  private static generateEventTrigger(
    trigger: TriggerConfig,
    action: ActionConfig
  ): string {
    return `
    // Event-triggered workflows require a more complex setup.
    // This feature is not fully implemented in this generator.
    `;
  }

  /**
   * Helper: Generate action execution code
   */
  private static generateActionCode(action: ActionConfig): string {
    switch (action.type) {
      case "transfer":
        return `log("Action: Executing transfer")`;
      case "mint":
        return `log("Action: Executing mint")`;
      case "swap":
        return `log("Action: Executing swap")`;
      case "call":
        return `log("Action: Executing call")`;
      default:
        return `log("Action: Executing custom action")`;
    }
  }
}
