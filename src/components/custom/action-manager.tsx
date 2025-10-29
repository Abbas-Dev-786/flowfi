"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Users, X, Sparkles } from "lucide-react";
import { RecurringPaymentForm } from "./actions/recurring-payment-form";
import { TokenSwapForm } from "./actions/token-swap-form";
import { BatchTransferForm } from "./actions/batch-transfer-form";

type ActionType = "recurring-payment" | "token-swap" | "batch-transfer" | null;

interface ActionManagerProps {
  onActionCreated?: (txId: string, actionType: string) => void;
}

export function ActionManager({ onActionCreated }: ActionManagerProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);

  const handleSuccess = (txId: string, actionType: string) => {
    if (onActionCreated) {
      onActionCreated(txId, actionType);
    }
    setSelectedAction(null);
  };

  const actionTypes = [
    {
      id: "recurring-payment" as ActionType,
      title: "Recurring Payment",
      description: "Set up automated scheduled payments",
      icon: Calendar,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      id: "token-swap" as ActionType,
      title: "DCA Token Swap",
      description: "Dollar-cost averaging for token purchases",
      icon: TrendingUp,
      color: "green",
      gradient: "from-green-500 to-green-600",
    },
    {
      id: "batch-transfer" as ActionType,
      title: "Batch Transfer",
      description: "Send to multiple recipients at once",
      icon: Users,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
    },
  ];

  if (selectedAction) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedAction(null)}
          className="mb-4"
        >
          <X className="w-4 h-4 mr-2" />
          Back to Actions
        </Button>

        {selectedAction === "recurring-payment" && (
          <RecurringPaymentForm
            onSuccess={(txId) => handleSuccess(txId, "recurring-payment")}
            onCancel={() => setSelectedAction(null)}
          />
        )}
        {selectedAction === "token-swap" && (
          <TokenSwapForm
            onSuccess={(txId) => handleSuccess(txId, "token-swap")}
            onCancel={() => setSelectedAction(null)}
          />
        )}
        {selectedAction === "batch-transfer" && (
          <BatchTransferForm
            onSuccess={(txId) => handleSuccess(txId, "batch-transfer")}
            onCancel={() => setSelectedAction(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-linear-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Create DeFi Action</h2>
            <p className="text-sm text-gray-600">
              Build automated workflows using Flow Forte primitives
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actionTypes.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300"
              onClick={() => setSelectedAction(action.id)}
            >
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg bg-linear-to-br ${action.gradient} inline-block`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                <Button className="w-full" variant="outline">
                  Create {action.title}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold mb-3">💡 What are DeFi Actions?</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            • <strong>FLIP-338 Actions</strong> are reusable onchain building
            blocks
          </p>
          <p>
            • <strong>Scheduled Transactions</strong> provide native time-based
            execution
          </p>
          <p>
            • <strong>No external keepers</strong> needed - all powered by Flow
            Forte
          </p>
        </div>
      </Card>
    </div>
  );
}
