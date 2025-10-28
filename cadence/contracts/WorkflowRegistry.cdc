access(all) contract WorkflowRegistry {

  // --- Action Type Constants (Declared) ---
  access(all) let RECURRING_PAYMENT: String
  access(all) let SCHEDULED_TRANSFER: String
  access(all) let TOKEN_SWAP: String
  access(all) let BATCH_TRANSFER: String
  access(all) let STAKING_CLAIM: String
  access(all) let GOVERNANCE_VOTE: String

  // --- Workflow Metadata Struct ---
  // Define the struct *before* it is used in field declarations
  access(all) struct WorkflowMetadata {
    access(all) let id: String
    access(all) let creator: Address
    access(all) let workflowType: String
    access(all) let actionContract: String
    access(all) let createdAt: UFix64
    access(all) var status: String
    access(all) var executionCount: UInt64
    access(all) var lastExecution: UFix64?
    access(all) var nextExecution: UFix64?
    access(all) var metadata: {String: String}

    init(
      id: String,
      creator: Address,
      workflowType: String,
      actionContract: String,
      metadata: {String: String}
    ) {
      self.id = id
      self.creator = creator
      self.workflowType = workflowType
      self.actionContract = actionContract
      self.metadata = metadata
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

    access(contract) fun updateMetadata(key: String, value: String) {
      self.metadata[key] = value
    }

    access(all) fun copy(): WorkflowMetadata {
       let copied = WorkflowMetadata(
        id: self.id,
        creator: self.creator,
        workflowType: self.workflowType,
        actionContract: self.actionContract,
        metadata: self.metadata // Dictionaries are structs, copied by value
      )
      copied.status = self.status
      copied.executionCount = self.executionCount
      copied.lastExecution = self.lastExecution
      copied.nextExecution = self.nextExecution
      return copied
    }
  }

  // --- Contract Fields (Declared) ---
  access(all) var totalWorkflows: UInt64
  access(all) let workflows: {String: WorkflowMetadata}

  // --- Events ---
  access(all) event WorkflowRegistered(id: String, creator: Address, workflowType: String, actionContract: String)
  access(all) event WorkflowStatusChanged(id: String, newStatus: String)
  access(all) event WorkflowExecuted(id: String, executionCount: UInt64)

  // --- Functions ---
  access(all) fun registerWorkflow(
    id: String,
    creator: Address,
    workflowType: String,
    actionContract: String,
    metadata: {String: String}
  ) {
    pre {
      !self.workflows.containsKey(id): "Workflow with this ID already registered"
      // Optional: Add validation to check if workflowType is one of the allowed constants
    }
    let workflowMeta = WorkflowMetadata(
      id: id,
      creator: creator,
      workflowType: workflowType,
      actionContract: actionContract,
      metadata: metadata
    )

    self.workflows[id] = workflowMeta
    self.totalWorkflows = self.totalWorkflows + 1

    emit WorkflowRegistered(
      id: id,
      creator: creator,
      workflowType: workflowType,
      actionContract: actionContract
    )
  }

  access(all) fun getWorkflow(id: String): WorkflowMetadata? {
    return self.workflows[id]?.copy()
  }

  access(all) fun getAllWorkflowsForCreator(creator: Address): [WorkflowMetadata] {
    let userWorkflows: [WorkflowMetadata] = []
    for key in self.workflows.keys {
      let workflow = self.workflows[key]! // Force unwrap safe
      if workflow.creator == creator {
        userWorkflows.append(workflow.copy())
      }
    }
    return userWorkflows
  }

 access(all) fun updateWorkflowStatus(id: String, newStatus: String) {
    // Borrow a mutable reference directly
    if let workflowRef = &self.workflows[id] as &WorkflowMetadata? {
        workflowRef.updateStatus(newStatus: newStatus)
        emit WorkflowStatusChanged(id: id, newStatus: newStatus)
    } else {
        log("Workflow not found for status update: ".concat(id))
    }
  }

 access(all) fun recordWorkflowExecution(id: String, nextRun: UFix64?) {
    // Borrow a mutable reference
    if let workflowRef = &self.workflows[id] as &WorkflowMetadata? {
        workflowRef.recordExecution(nextRun: nextRun)
        emit WorkflowExecuted(id: id, executionCount: workflowRef.executionCount)
    } else {
        log("Workflow not found for execution record: ".concat(id))
    }
 }

  // --- Initializer ---
  init() {
    // Initialize ALL contract fields and constants here
    self.RECURRING_PAYMENT = "RECURRING_PAYMENT"
    self.SCHEDULED_TRANSFER = "SCHEDULED_TRANSFER"
    self.TOKEN_SWAP = "TOKEN_SWAP"
    self.BATCH_TRANSFER = "BATCH_TRANSFER"
    self.STAKING_CLAIM = "STAKING_CLAIM"
    self.GOVERNANCE_VOTE = "GOVERNANCE_VOTE"

    self.totalWorkflows = 0
    self.workflows = {}
  }
}