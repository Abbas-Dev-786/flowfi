// lib/groq/client.ts
import Groq from "groq-sdk";
import {
  ActionConfig,
  TriggerConfig,
  WorkflowType,
} from "@/types/workflow.types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export interface ParsedWorkflow {
  workflowType: WorkflowType;
  trigger: TriggerConfig;
  action: ActionConfig;
  confidence: number; // AI confidence score
  rawPrompt: string;
}

const systemPrompt = `You are an expert Flow blockchain workflow generator.
Convert natural language descriptions into structured workflow configurations.

SUPPORTED WORKFLOW TYPES:
1. SCHEDULED_TRANSFER: Transfer tokens on a schedule
   Example: "Send 10 FLOW to 0x123 every Monday"

2. RECURRING_PAYMENT: Regular payments (payroll, subscriptions)
   Example: "Pay 100 FLOW monthly to team wallet 0xABC"

3. BALANCE_MONITOR: Execute action when balance condition met
   Example: "When my balance goes below 500000 FLOW, notify me"

4. NFT_AUTO_MINT: Mint NFTs based on triggers
   Example: "Mint achievement NFT when user completes quest"

5. EVENT_TRIGGER: React to onchain events
   Example: "When NFT is sold, send 10% to charity wallet"

RESPONSE FORMAT (JSON only):
{
  "workflowType": "SCHEDULED_TRANSFER",
  "trigger": {
    "type": "time",
    "schedule": "weekly",
    "executeAt": "Monday 10:00",
    "timezone": "UTC"
  },
  "action": {
    "type": "transfer",
    "token": "FLOW",
    "amount": "1.0",
    "recipient": "0x..."
  },
  "confidence": 0.95
}

IMPORTANT RULES:
- Extract EXACT wallet addresses (0x... format)
- Parse time expressions naturally (tomorrow, every week, etc.)
- Default to FLOW token if not specified
- If ambiguous, use confidence < 0.7 and add "suggestedClarification"
- ALWAYS return valid JSON`;

export async function parseWorkflowPrompt(
  prompt: string
): Promise<ParsedWorkflow> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");

    // Validation
    if (!parsed.workflowType || !parsed.trigger || !parsed.action) {
      throw new Error("Invalid workflow structure from AI");
    }

    return {
      ...parsed,
      rawPrompt: prompt,
    };
  } catch (error) {
    console.error("Groq parsing error:", error);
    throw new Error("Failed to parse workflow. Please try rephrasing.");
  }
}

// Enhanced parsing with examples (few-shot learning)
export async function parseWorkflowWithExamples(
  prompt: string
): Promise<ParsedWorkflow> {
  const examples = `
EXAMPLE 1:
User: "Send 5 FLOW to 0x1234567890abcdef every Friday at 3pm"
Output: {
  "workflowType": "SCHEDULED_TRANSFER",
  "trigger": {
    "type": "time",
    "schedule": "weekly",
    "executeAt": "Friday 15:00"
  },
  "action": {
    "type": "transfer",
    "token": "FLOW",
    "amount": "5.0",
    "recipient": "0x1234567890abcdef"
  },
  "confidence": 0.98
}

EXAMPLE 2:
User: "Pay my team 1000 FLOW on the 1st of each month"
Output: {
  "workflowType": "RECURRING_PAYMENT",
  "trigger": {
    "type": "time",
    "schedule": "monthly",
    "executeAt": "1st 00:00"
  },
  "action": {
    "type": "transfer",
    "token": "FLOW",
    "amount": "1000.0",
    "recipient": null
  },
  "confidence": 0.85,
  "requiresInput": ["recipient"]
}

EXAMPLE 3:
User: "Mint an NFT when someone buys from my store"
Output: {
  "workflowType": "EVENT_TRIGGER",
  "trigger": {
    "type": "event",
    "eventName": "Purchase.Completed",
    "contractAddress": null
  },
  "action": {
    "type": "mint",
    "collectionAddress": null
  },
  "confidence": 0.70,
  "requiresInput": ["contractAddress", "collectionAddress"]
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt + "\\n\\n" + examples },
      { role: "user", content: prompt },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content!);
}
