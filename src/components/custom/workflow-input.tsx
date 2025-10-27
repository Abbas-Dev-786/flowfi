// components/workflow-input.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { ParsedWorkflow } from "@/lib/groq/client";

interface WorkflowInputProps {
  onWorkflowParsed: (workflow: ParsedWorkflow) => void;
}

export function WorkflowInput({ onWorkflowParsed }: WorkflowInputProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examples = [
    "Send 10 FLOW to 0x1234...5678 every Monday at 10am",
    "Pay 100 FLOW monthly to my team wallet 0xabcd...efgh",
    "When my balance goes below 500000 FLOW, send me an alert",
    "Mint a reward NFT when someone completes a purchase",
  ];

  const handleParse = async () => {
    if (!prompt.trim()) {
      setError("Please enter a workflow description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/parse-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse workflow");
      }

      if (!data.success) {
        setError(data.message || "Could not understand workflow");
        return;
      }

      onWorkflowParsed(data.workflow);
      setPrompt(""); // Clear input
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Something went wrong");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Describe Your Workflow
        </CardTitle>
        <CardDescription>
          Use natural language to create onchain automations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="E.g., Send 5 FLOW to 0x123...abc every Friday"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={loading}
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>

        <Button
          onClick={handleParse}
          disabled={loading || !prompt.trim()}
          className="w-full"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {loading ? "Parsing..." : "Generate Workflow"}
        </Button>

        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Examples:</p>
          <div className="space-y-2">
            {examples.map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                className="text-sm text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded block w-full transition-colors"
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
