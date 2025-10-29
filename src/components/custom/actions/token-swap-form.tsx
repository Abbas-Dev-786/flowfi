"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTokenSwap } from "@/lib/flow/hooks";
import { Loader2, TrendingUp, ArrowRightLeft } from "lucide-react";
import { SchedulePicker } from "./schedule-picker";

interface TokenSwapFormProps {
  onSuccess?: (txId: string) => void;
  onCancel?: () => void;
}

export function TokenSwapForm({ onSuccess, onCancel }: TokenSwapFormProps) {
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState(604800); // Default: weekly
  const [slippage, setSlippage] = useState("0.5");
  const { createTokenSwap, txStatus } = useTokenSwap();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createTokenSwap({
        fromToken: "FLOW",
        toToken,
        amount,
        interval,
        slippageTolerance: parseFloat(slippage),
      });

      if (onSuccess) {
        onSuccess(result.txId);
      }
    } catch (error) {
      console.error("Failed to create token swap:", error);
    }
  };

  const isLoading = txStatus.status === "pending";

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Dollar-Cost Averaging (DCA)</h3>
            <p className="text-sm text-gray-500">
              Automatically buy tokens at regular intervals
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount per Purchase (FLOW)</Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toToken" className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Target Token
            </Label>
            <Input
              id="toToken"
              placeholder="USDC"
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Enter the token symbol you want to buy
            </p>
          </div>

          <div className="space-y-2">
            <Label>Purchase Frequency</Label>
            <SchedulePicker
              value={interval}
              onChange={setInterval}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
            <Input
              id="slippage"
              type="number"
              step="0.1"
              placeholder="0.5"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Maximum price change you're willing to accept
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">DCA Summary</h4>
            <div className="space-y-1 text-sm text-green-700">
              <p>
                • Buying <strong>{toToken}</strong> with{" "}
                <strong>{amount || "0"} FLOW</strong>
              </p>
              <p>
                • Every <strong>{interval / 86400} day(s)</strong>
              </p>
              <p>
                • Slippage tolerance: <strong>{slippage}%</strong>
              </p>
              <p className="text-xs mt-2 text-green-600">
                💡 DCA reduces risk by spreading purchases over time
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading || !amount || !toToken}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating DCA...
                </>
              ) : (
                "Start DCA Strategy"
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
}
