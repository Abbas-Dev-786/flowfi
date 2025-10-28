import FungibleToken from 0x9a0766d93b6608b7 // Testnet FT Standard
import FlowToken from 0x7e60df042a9c0868       // Testnet FlowToken

// Transaction to send FlowToken to multiple recipients
transaction(recipients: [Address], amounts: [UFix64]) {

  // Reference to the signer's FlowToken Vault Provider (Correct Cadence 1.0 syntax)
  let senderVaultRef: &FlowToken.Vault{FungibleToken.Provider} // <-- Corrected type declaration

  prepare(signer: AuthAccount) {
    pre {
      recipients.length == amounts.length : "Mismatched recipients and amounts array lengths"
    }

    // Borrow a Provider reference from the signer's vault. (Correct Cadence 1.0 syntax)
    self.senderVaultRef = signer.borrow<&FlowToken.Vault{FungibleToken.Provider}>(from: /storage/flowTokenVault) // <-- Corrected borrow type
      ?? panic("Could not borrow reference to the sender's FlowToken Vault")

    // Optional: Check sender's balance (sum of amounts)
    var totalAmount: UFix64 = 0.0
    for amount in amounts {
      if amount <= 0.0 {
        panic("Transfer amount must be positive")
      }
      totalAmount = totalAmount + amount
    }
    if self.senderVaultRef.balance < totalAmount {
        panic("Signer does not have sufficient balance for the total transfer amount")
    }
  }

  execute {
    var i = 0
    while i < recipients.length {
      let recipientAddress = recipients[i]
      let amount = amounts[i]

      // Get the recipient's public account object
      let recipientAccount = getAccount(recipientAddress)

      // Get the recipient's public Receiver capability restricted by the interface
      let receiverCapability = recipientAccount.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver) // <-- Correct syntax for interface-only restriction

      // Borrow the Receiver reference from the capability
      let receiverRef = receiverCapability.borrow()
            ?? panic("Could not borrow receiver capability for recipient: ".concat(recipientAddress.toString()))

      // Withdraw the specified amount from the sender's vault
      let temporaryVault <- self.senderVaultRef.withdraw(amount: amount)

      // Deposit the withdrawn tokens into the recipient's vault
      receiverRef.deposit(from: <- temporaryVault)

      i = i + 1
    }
    log("Batch transfer completed successfully.")
  }
}