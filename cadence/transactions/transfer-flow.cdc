import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(amount: UFix64, to: Address) {
  let vault: &FlowToken.Vault &{FungibleToken.Provider}

  prepare(signer: AuthAccount) {
    self.vault = signer
      .borrow<&FlowToken.Vault &{FungibleToken.Provider}>(from: /storage/flowTokenVault)
      ?? panic("Missing FlowToken Vault or Provider interface")
  }

  execute {
    let receiver = getAccount(to)
      .getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      .borrow()
      ?? panic("Missing receiver capability")

    let withdrawn <- self.vault.withdraw(amount: amount)
    receiver.deposit(from: <- withdrawn)
  }
}


