import WorkflowRegistry from 0x3fe32988f9457b01

transaction(workflowId: String) {
    prepare(signer: &Account) {
        let registry = getAccount(0x3fe32988f9457b01)
            .capabilities.get<&WorkflowRegistry.WorkflowRegistry>(/public/WorkflowRegistry)
            .borrow()
            ?? panic("Could not borrow the registry")
        registry.updateWorkflowStatus(id: workflowId, newStatus: "cancelled")
    }
}