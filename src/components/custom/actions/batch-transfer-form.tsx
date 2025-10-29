"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBatchTransfer, BatchRecipient } from "@/lib/flow/hooks";
import { Loader2, Users, Plus, X, Upload } from "lucide-react";

interface BatchTransferFormProps {
  onSuccess?: (txId: string) => void;
  onCancel?: () => void;
}

export function BatchTransferForm({
  onSuccess,
  onCancel,
}: BatchTransferFormProps) {
  const [recipients, setRecipients] = useState<BatchRecipient[]>([
    { address: "", amount: "" },
  ]);
  const { createBatchTransfer, txStatus } = useBatchTransfer();

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "" }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (
    index: number,
    field: "address" | "amount",
    value: string
  ) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const parsed: BatchRecipient[] = [];

      lines.forEach((line, i) => {
        if (i === 0) return; // Skip header
        const [address, amount] = line.split(",").map((s) => s.trim());
        if (address && amount) {
          parsed.push({ address, amount });
        }
      });

      if (parsed.length > 0) {
        setRecipients(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createBatchTransfer({
        recipients: recipients.filter((r) => r.address && r.amount),
        tokenType: "FlowToken",
      });

      if (onSuccess) {
        onSuccess(result.txId);
      }
    } catch (error) {
      console.error("Failed to create batch transfer:", error);
    }
  };

  const isLoading = txStatus.status === "pending";
  const totalAmount = recipients.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Batch Transfer</h3>
              <p className="text-sm text-gray-500">
                Send tokens to multiple recipients at once
              </p>
            </div>
          </div>
          <div>
            <Label
              htmlFor="csv-upload"
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Recipient address (0x...)"
                    value={recipient.address}
                    onChange={(e) =>
                      updateRecipient(index, "address", e.target.value)
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    step="0.00000001"
                    placeholder="Amount"
                    value={recipient.amount}
                    onChange={(e) =>
                      updateRecipient(index, "amount", e.target.value)
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
                {recipients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRecipient(index)}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addRecipient}
            disabled={isLoading}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Recipient
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              Batch Transfer Summary
            </h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>
                • Total recipients: <strong>{recipients.length}</strong>
              </p>
              <p>
                • Total amount: <strong>{totalAmount.toFixed(8)} FLOW</strong>
              </p>
              <p className="text-xs mt-2 text-blue-600">
                ⚡ All transfers will be executed in a single transaction
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={
                isLoading || recipients.some((r) => !r.address || !r.amount)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send to ${recipients.length} Recipient${
                  recipients.length > 1 ? "s" : ""
                }`
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
