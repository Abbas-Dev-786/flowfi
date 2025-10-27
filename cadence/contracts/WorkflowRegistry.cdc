// cadence/contracts/WorkflowRegistry.cdc
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
}