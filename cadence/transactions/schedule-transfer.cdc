import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import ScheduledCallback from 0xf8d6e0586b0a20c7

transaction(
  amount: UFix64,
  recipient: Address,
  intervalSeconds: UInt64
) {

  let vaultRef: &FlowToken.Vault
  let scheduledCallbackRef: &ScheduledCallback.ScheduledCallbackExecutor

  prepare(signer: auth(Storage) &Account) {
    // Get reference to signer's FLOW vault
    self.vaultRef = signer.storage.borrow<&FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow FlowToken Vault")

    // Setup scheduled callback executor
    if signer.storage.borrow<&ScheduledCallback.ScheduledCallbackExecutor>(
      from: /storage/scheduledCallbackExecutor
    ) == nil {
      signer.storage.save(
        <- ScheduledCallback.createExecutor(),
        to: /storage/scheduledCallbackExecutor
      )
    }

    self.scheduledCallbackRef = signer.storage.borrow<&ScheduledCallback.ScheduledCallbackExecutor>(
      from: /storage/scheduledCallbackExecutor
    )!
  }

  execute {
    // Execute initial transfer
    let tokens <- self.vaultRef.withdraw(amount: amount)
    let recipientVault = getAccount(recipient)
      .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      .borrow()
      ?? panic("Could not borrow recipient vault")

    recipientVault.deposit(from: <-tokens)

    // Schedule next execution using Forte
    self.scheduledCallbackRef.scheduleCallback(
      delay: intervalSeconds,
      functionCall: "executeRecurringTransfer",
      args: [amount, recipient, intervalSeconds]
    )
  }
}