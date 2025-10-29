"use client";

import { useState, useCallback } from "react";
import * as fcl from "@onflow/fcl";
import { toast } from "react-hot-toast";

export interface BatchRecipient {
  address: string;
  amount: string;
}

export interface BatchTransferConfig {
  recipients: BatchRecipient[];
  tokenType: string;
  scheduledTime?: number;
}

export interface TransactionStatus {
  status: "idle" | "pending" | "sealed" | "error";
  txId?: string;
  error?: string;
}

export function useBatchTransfer() {
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    status: "idle",
  });

  const createBatchTransfer = useCallback(
    async (config: BatchTransferConfig) => {
      try {
        setTxStatus({ status: "pending" });

        // Calculate total amount needed
        const totalAmount = config.recipients.reduce(
          (sum, r) => sum + parseFloat(r.amount),
          0
        );

        const transaction = `
import BatchTransfer from 0x4051c307e9175648
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(recipients: [Address], amounts: [UFix64]) {
  let vaultRef: auth(FungibleToken.Withdraw) &FlowToken.Vault
  
  prepare(signer: auth(BorrowValue) &Account) {
    // Validate recipients and amounts match
    assert(
      recipients.length == amounts.length,
      message: "Recipients and amounts length mismatch"
    )
    
    // Get FlowToken vault reference
    self.vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow FlowToken.Vault reference")
    
    // Create batch transfer action data
    let batchData = BatchTransfer.ActionData(
      recipients: recipients,
      amounts: amounts,
      tokenType: "FlowToken"
    )
    
    // Validate batch configuration
    let isValid = BatchTransfer.validate(data: batchData)
    assert(isValid, message: "Invalid batch transfer configuration")
  }
  
  execute {
    var i = 0
    while i < recipients.length {
      let recipient = recipients[i]
      let amount = amounts[i]
      
      // Get recipient capability
      let receiverCap = getAccount(recipient)
        .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
        .borrow()
        ?? panic("Could not borrow receiver reference for ".concat(recipient.toString()))
      
      // Withdraw and deposit
      let vault <- self.vaultRef.withdraw(amount: amount)
      receiverCap.deposit(from: <-vault)
      
      i = i + 1
    }
    
    // Emit batch transfer event
    emit BatchTransfer.BatchTransferExecuted(
      recipients: recipients,
      amounts: amounts,
      tokenType: "FlowToken",
      sender: signer.address,
      totalAmount: ${totalAmount.toFixed(8)}
    )
    
    log("Batch transfer completed successfully")
  }
}`;

        const txId = await fcl.mutate({
          cadence: transaction,
          args: (arg, t) => [
            arg(
              config.recipients.map((r) => r.address),
              t.Array(t.Address)
            ),
            arg(
              config.recipients.map((r) => r.amount),
              t.Array(t.UFix64)
            ),
          ],
          proposer: fcl.currentUser,
          payer: fcl.currentUser,
          authorizations: [fcl.currentUser],
          limit: 9999,
        });

        setTxStatus({ status: "pending", txId });
        toast.loading(`Sending to ${config.recipients.length} recipients...`, {
          id: txId,
        });

        const tx = await fcl.tx(txId).onceSealed();

        setTxStatus({ status: "sealed", txId });
        toast.success(
          `Batch transfer to ${config.recipients.length} recipients complete!`,
          { id: txId }
        );

        return { txId, transaction: tx };
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Transaction failed";
        setTxStatus({ status: "error", error: errorMsg });
        toast.error(errorMsg);
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setTxStatus({ status: "idle" });
  }, []);

  return {
    createBatchTransfer,
    txStatus,
    reset,
  };
}
