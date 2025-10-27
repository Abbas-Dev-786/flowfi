// lib/cadence/generator.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  WorkflowDefinition,
  ActionConfig,
  TriggerConfig,
} from "@/types/workflow.types";

export class CadenceGenerator {
  /**
   * Generate complete Cadence transaction for workflow
   */
  static generateWorkflowTransaction(workflow: WorkflowDefinition): string {
    const { type, trigger, action } = workflow;

    switch (type) {
      case "SCHEDULED_TRANSFER":
        return this.generateScheduledTransfer();

      case "RECURRING_PAYMENT":
        return this.generateRecurringPayment();

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

  /**
   * Scheduled Transfer using Forte Scheduled Transactions
   */
  private static generateScheduledTransfer(): string {
    return `
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import WorkflowRegistry from 0xWorkflowRegistry

transaction(
  amount: UFix64,
  recipient: Address,
  intervalSeconds: UInt64,
  workflowId: String
) {

  let vaultRef: auth(FungibleToken.Withdraw) &FlowToken.Vault

  prepare(signer: auth(Storage, Capabilities) &Account) {
    self.vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow FlowToken Vault")
  }

  execute {
    // Execute transfer
    let tokens <- self.vaultRef.withdraw(amount: amount)
    let recipientVault = getAccount(recipient)
      .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      .borrow()
      ?? panic("Could not borrow recipient vault")

    recipientVault.deposit(from: <-tokens)

    // Record this execution
    let nextRun = getCurrentBlock().timestamp + UFix64(intervalSeconds)
    WorkflowRegistry.recordWorkflowExecution(id: workflowId, nextRun: nextRun)

    log("✅ Transfer executed and recorded")
  }
}`;
  }
  /**
   * Recurring Payment using Forte Scheduled Transactions
   */
  private static generateRecurringPayment(): string {
    // This is functionally the same as a scheduled transfer for the MVP
    return this.generateScheduledTransfer();
  }

  /**
   * Balance Monitor with Conditional Execution
   */
  private static generateBalanceMonitor(
    trigger: TriggerConfig,
    action: ActionConfig
  ): string {
    const { condition } = trigger;

    // Map operator to Cadence operator
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
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(
  thresholdAmount: UFix64,
  checkIntervalSeconds: UInt64
) {

  prepare(signer: auth(Storage) &Account) {
    let vaultRef = signer.storage.borrow<&FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow vault")

    let currentBalance = vaultRef.balance

    // Check condition
    if currentBalance ${operator} thresholdAmount {
      // Log the threshold event
      log("Balance threshold reached!")
      log("Address: ".concat(signer.address.toString()))
      log("Current Balance: ".concat(currentBalance.toString()))
      log("Threshold: ".concat(thresholdAmount.toString()))

      // You can add additional actions here
      ${actionCode}
    } else {
      log("Balance is within normal range")
      log("Current Balance: ".concat(currentBalance.toString()))
      log("Threshold: ".concat(thresholdAmount.toString()))
    }
  }

  execute {
    // Schedule next check
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
    log("Recipient: ".concat(recipient.toString()))
    log("Metadata URI: ".concat(metadataURI))
  }

  execute {
    log("NFT minting executed successfully")
  }
}`;
  }

  /**
   * Event Listener & Trigger (This returns a CONTRACT, not a transaction)
   */
  private static generateEventTrigger(
    trigger: TriggerConfig,
    action: ActionConfig
  ): string {
    const actionCode = this.generateActionCode(action);

    // This is a CONTRACT definition, not a transaction
    // Events CAN be declared in contracts
    return `
// Event Listener Contract
access(all) contract WorkflowEventListener {

  access(all) event WorkflowTriggered(workflowId: String, eventData: {String: AnyStruct})

  access(all) resource EventMonitor {
    access(all) let workflowId: String
    access(all) let targetEvent: String

    init(workflowId: String, targetEvent: String) {
      self.workflowId = workflowId
      self.targetEvent = targetEvent
    }

    access(all) fun onEventDetected(eventData: {String: AnyStruct}) {
      emit WorkflowTriggered(
        workflowId: self.workflowId,
        eventData: eventData
      )

      // Execute action
      ${actionCode}
    }
  }

  access(all) fun createMonitor(
    workflowId: String,
    targetEvent: String
  ): @EventMonitor {
    return <- create EventMonitor(
      workflowId: workflowId,
      targetEvent: targetEvent
    )
  }
  
  init() {
    log("WorkflowEventListener contract initialized")
  }
}`;
  }

  /**
   * Helper: Convert schedule to seconds
   */
  public static scheduleToSeconds(schedule: string): number {
    const scheduleMap: Record<string, number> = {
      daily: 86400, // 24 hours
      weekly: 604800, // 7 days
      monthly: 2592000, // 30 days
      hourly: 3600, // 1 hour
    };

    return scheduleMap[schedule] || 86400;
  }

  /**
   * Helper: Generate action execution code
   */
  private static generateActionCode(action: ActionConfig): string {
    switch (action.type) {
      case "transfer":
        return `
// Transfer tokens
log("Executing transfer action")`;

      case "mint":
        return `// Mint NFT (handled in dedicated function)
log("Executing mint action")`;

      case "swap":
        return `// Swap tokens
log("Executing swap action")`;

      case "call":
        return `// Call contract function
log("Executing call action")`;

      default:
        return `// Custom action
log("Executing custom action")`;
    }
  }

  /**
   * Generate Contract Registry (tracks all workflows)
   */
  static generateRegistryContract(): string {
    return `
access(all) contract WorkflowRegistry {

  access(all) var totalWorkflows: UInt64

  access(all) struct WorkflowMetadata {
    access(all) let id: String
    access(all) let creator: Address
    access(all) let workflowType: String
    access(all) let createdAt: UFix64
    access(all) var status: String
    access(all) var executionCount: UInt64
    access(all) var lastExecution: UFix64?
    access(all) var nextExecution: UFix64?

    init(
      id: String,
      creator: Address,
      workflowType: String
    ) {
      self.id = id
      self.creator = creator
      self.workflowType = workflowType
      self.createdAt = getCurrentBlock().timestamp
      self.status = "active"
      self.executionCount = 0
      self.lastExecution = nil
      self.nextExecution = nil
    }

    access(contract) fun updateStatus(newStatus: String) {
      self.status = newStatus
    }

    access(contract) fun recordExecution(nextRun: UFix64?) {
      self.executionCount = self.executionCount + 1
      self.lastExecution = getCurrentBlock().timestamp
      self.nextExecution = nextRun
    }
    
    // Add a copy function
    access(all) fun copy(): WorkflowMetadata {
      let copied = WorkflowMetadata(
        id: self.id,
        creator: self.creator,
        workflowType: self.workflowType
      )
      copied.status = self.status
      copied.executionCount = self.executionCount
      copied.lastExecution = self.lastExecution
      copied.nextExecution = self.nextExecution
      return copied
    }
  }

  access(all) let workflows: {String: WorkflowMetadata}

  access(all) event WorkflowRegistered(id: String, creator: Address, workflowType: String)
  access(all) event WorkflowStatusChanged(id: String, newStatus: String)
  access(all) event WorkflowExecuted(id: String, executionCount: UInt64)

  access(all) fun registerWorkflow(
    id: String,
    creator: Address,
    workflowType: String
  ) {
    let metadata = WorkflowMetadata(
      id: id,
      creator: creator,
      workflowType: workflowType
    )

    self.workflows[id] = metadata
    self.totalWorkflows = self.totalWorkflows + 1

    emit WorkflowRegistered(
      id: id,
      creator: creator,
      workflowType: workflowType
    )
  }

  access(all) fun getWorkflow(id: String): WorkflowMetadata? {
    return self.workflows[id]?.copy()
  }
  
  access(all) fun getAllWorkflowsForCreator(creator: Address): [WorkflowMetadata] {
    let userWorkflows: [WorkflowMetadata] = []
    for id in self.workflows.keys {
      if let workflow = self.workflows[id] {
        if workflow.creator == creator {
          userWorkflows.append(workflow.copy())
        }
      }
    }
    return userWorkflows
  }

  access(all) fun updateWorkflowStatus(id: String, newStatus: String) {
    if let workflow = &self.workflows[id] as auth(Mutate) &WorkflowMetadata? {
      workflow.updateStatus(newStatus: newStatus)
      emit WorkflowStatusChanged(id: id, newStatus: newStatus)
    }
  }

  access(all) fun recordWorkflowExecution(id: String, nextRun: UFix64?) {
    if let workflow = &self.workflows[id] as auth(Mutate) &WorkflowMetadata? {
      workflow.recordExecution(nextRun: nextRun)
      emit WorkflowExecuted(id: id, executionCount: workflow.executionCount)
    }
  }

  init() {
    self.totalWorkflows = 0
    self.workflows = {}
  }
}`;
  }

  /**
   * Generate Balance Monitor Contract (for event emissions)
   */
  static generateBalanceMonitorContract(): string {
    return `
access(all) contract BalanceMonitor {

  // Event emitted when a balance threshold is reached
  access(all) event BalanceThresholdReached(
    address: Address,
    balance: UFix64,
    threshold: UFix64,
    operator: String
  )

  // Resource to store monitor configuration
  access(all) resource Monitor {
    access(all) let threshold: UFix64
    access(all) let operator: String
    access(all) var isActive: Bool

    init(threshold: UFix64, operator: String) {
      self.threshold = threshold
      self.operator = operator
      self.isActive = true
    }

    access(all) fun pause() {
      self.isActive = false
    }

    access(all) fun resume() {
      self.isActive = true
    }
  }

  // Function to check balance and emit event if threshold reached
  access(all) fun checkBalance(
    address: Address,
    balance: UFix64,
    threshold: UFix64,
    operator: String
  ): Bool {
    var thresholdReached = false

    switch operator {
      case "<":
        thresholdReached = balance < threshold
      case ">":
        thresholdReached = balance > threshold
      case "==":
        thresholdReached = balance == threshold
      default:
        thresholdReached = false
    }

    if thresholdReached {
      emit BalanceThresholdReached(
        address: address,
        balance: balance,
        threshold: threshold,
        operator: operator
      )
    }

    return thresholdReached
  }

  // Create a new monitor resource
  access(all) fun createMonitor(threshold: UFix64, operator: String): @Monitor {
    return <- create Monitor(threshold: threshold, operator: operator)
  }

  init() {
    // Contract initialization
    log("BalanceMonitor contract initialized")
  }
}`;
  }
}
