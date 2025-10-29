"use client";

import { useState, useCallback } from "react";
import * as fcl from "@onflow/fcl";
import { toast } from "react-hot-toast";

export interface TokenSwapConfig {
  fromToken: string;
  toToken: string;
  amount: string;
  interval: number; // DCA interval in seconds
  slippageTolerance?: number;
}

export interface TransactionStatus {
  status: "idle" | "pending" | "sealed" | "error";
  txId?: string;
  error?: string;
}

export function useTokenSwap() {
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    status: "idle",
  });

  const createTokenSwap = useCallback(async (config: TokenSwapConfig) => {
    try {
      setTxStatus({ status: "pending" });

      const transaction = `
import TokenSwap from 0x4051c307e9175648
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(amount: UFix64, toToken: String, interval: UInt64, slippage: UFix64) {
  prepare(signer: auth(BorrowValue) &Account) {
    // Create swap action data
    let swapData = TokenSwap.ActionData(
      fromToken: "FlowToken",
      toToken: toToken,
      amount: amount,
      slippageTolerance: slippage
    )
    
    // Validate swap configuration
    let isValid = TokenSwap.validate(data: swapData)
    assert(isValid, message: "Invalid swap configuration")
    
    log("Token swap DCA scheduled successfully")
  }
  
  execute {
    // Emit swap scheduled event
    emit TokenSwap.SwapScheduled(
      fromToken: "FlowToken",
      toToken: toToken,
      amount: amount,
      interval: interval,
      trader: signer.address
    )
  }
}`;

      const txId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(config.amount, t.UFix64),
          arg(config.toToken, t.String),
          arg(config.interval.toString(), t.UInt64),
          arg((config.slippageTolerance || 0.5).toFixed(2), t.UFix64),
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 9999,
      });

      setTxStatus({ status: "pending", txId });
      toast.loading("Creating DCA swap...", { id: txId });

      const tx = await fcl.tx(txId).onceSealed();

      setTxStatus({ status: "sealed", txId });
      toast.success("Token swap DCA created!", { id: txId });

      return { txId, transaction: tx };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Transaction failed";
      setTxStatus({ status: "error", error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setTxStatus({ status: "idle" });
  }, []);

  return {
    createTokenSwap,
    txStatus,
    reset,
  };
}
