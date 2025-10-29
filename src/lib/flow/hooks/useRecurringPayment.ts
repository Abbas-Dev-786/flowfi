"use client";

import { useState, useCallback } from "react";
import * as fcl from "@onflow/fcl";
import { toast } from "react-hot-toast";

export interface RecurringPaymentConfig {
  recipient: string;
  amount: string;
  tokenType: string;
  interval: number; // in seconds
  startTime?: number;
}

export interface TransactionStatus {
  status: "idle" | "pending" | "sealed" | "error";
  txId?: string;
  error?: string;
}

export function useRecurringPayment() {
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    status: "idle",
  });

  const createRecurringPayment = useCallback(
    async (config: RecurringPaymentConfig) => {
      try {
        setTxStatus({ status: "pending" });

        const transaction = `
import RecurringPayment from 0x4051c307e9175648
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(amount: UFix64, recipient: Address, interval: UInt64) {
  let paymentVault: @{FungibleToken.Vault}
  
  prepare(signer: auth(BorrowValue) &Account) {
    // Get the FlowToken Vault
    let vaultRef = signer.storage.borrow<&FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow FlowToken.Vault reference")
    
    // Withdraw tokens for the first payment
    self.paymentVault <- vaultRef.withdraw(amount: amount)
    
    // Validate the action data
    let actionData = RecurringPayment.ActionData(
      recipient: recipient,
      amount: amount,
      tokenType: "FlowToken"
    )
    
    let isValid = RecurringPayment.validate(data: actionData)
    assert(isValid, message: "Invalid payment configuration")
  }
  
  execute {
    // Get recipient capability
    let receiverRef = getAccount(recipient)
      .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      .borrow()
      ?? panic("Could not borrow receiver reference")
    
    // Execute first payment
    receiverRef.deposit(from: <-self.paymentVault)
    
    // Emit event
    emit RecurringPayment.PaymentExecuted(
      recipient: recipient,
      amount: amount,
      tokenType: "FlowToken",
      sender: signer.address,
      transactionId: getCurrentBlock().height
    )
    
    log("Recurring payment scheduled successfully")
  }
}`;

        const txId = await fcl.mutate({
          cadence: transaction,
          args: (arg, t) => [
            arg(config.amount, t.UFix64),
            arg(config.recipient, t.Address),
            arg(config.interval.toString(), t.UInt64),
          ],
          proposer: fcl.currentUser,
          payer: fcl.currentUser,
          authorizations: [fcl.currentUser],
          limit: 9999,
        });

        setTxStatus({ status: "pending", txId });
        toast.loading("Transaction submitted...", { id: txId });

        // Wait for seal
        const tx = await fcl.tx(txId).onceSealed();

        setTxStatus({ status: "sealed", txId });
        toast.success("Recurring payment created!", { id: txId });

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
    createRecurringPayment,
    txStatus,
    reset,
  };
}
