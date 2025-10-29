"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecurringPayment } from "@/lib/flow/hooks";
import { Loader2, Calendar, Wallet, DollarSign } from "lucide-react";
import { SchedulePicker } from "./schedule-picker";

interface RecurringPaymentFormProps {
  onSuccess?: (txId: string) => void;
  onCancel?: () => void;
}

export function RecurringPaymentForm({
  onSuccess,
  onCancel,
}: RecurringPaymentFormProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState(86400); // Default: daily
  const { createRecurringPayment, txStatus } = useRecurringPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createRecurringPayment({
        recipient,
        amount,
        tokenType: "FlowToken",
        interval,
      });

      if (onSuccess) {
        onSuccess(result.txId);
      }
    } catch (error) {
      console.error("Failed to create recurring payment:", error);
    }
  };

  const isLoading = txStatus.status === "pending";

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Recurring Payment</h3>
            <p className="text-sm text-gray-500">
              Set up automated scheduled payments
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Recipient Address
            </Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount (FLOW)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Schedule</Label>
            <SchedulePicker
              value={interval}
              onChange={setInterval}
              disabled={isLoading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>
                • Sending <strong>{amount || "0"} FLOW</strong> to{" "}
                {recipient || "recipient"}
              </p>
              <p>
                • Every <strong>{interval / 86400} day(s)</strong>
              </p>
              <p>
                • First payment will be executed immediately upon confirmation
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !recipient || !amount}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Recurring Payment"
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
