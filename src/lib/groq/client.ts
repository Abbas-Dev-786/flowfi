// src/lib/groq/client.ts
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
  requiresInput?: string[]; // Fields the user still needs to provide
}

// THIS IS THE CRITICAL FIX
// We provide the literal TypeScript types to the AI
// and instruct it to ONLY return JSON.
const systemPrompt = `
You are an expert Flow blockchain workflow parser. Your sole task is to convert a user's natural language prompt into a SINGLE, precise JSON object. You MUST NOT add any explanations or conversational text.

**JSON Schema Definition (from workflow.types.ts):**

export type WorkflowType =
  | "ONE_TIME_TRANSFER" // <-- ADDED
  | "SCHEDULED_TRANSFER"
  | "RECURRING_PAYMENT"
  | "BALANCE_MONITOR"
  | "NFT_AUTO_MINT"
  | "EVENT_TRIGGER";

export interface TriggerConfig {
  type: "time" | "event" | "condition";
  schedule?: "once" | "daily" | "weekly" | "monthly" | "immediate"; // <-- ADDED 'immediate'
  // ... other fields
}

export interface ActionConfig {
  type: "transfer" | "mint" | "swap" | "call";
  token?: "FLOW" | "USDC" | string;
  amount?: string;
  recipient?: string;
  // ... other fields
}

**SUPPORTED WORKFLOW TYPES:**
1.  ONE_TIME_TRANSFER: Send tokens once, immediately.
    Example: "Send 2 FLOW to 0x123 now"
2.  RECURRING_PAYMENT: Regular payments.
    Example: "Pay 100 FLOW monthly to 0xABC"

**Output Format (JSON only):**
{
  "workflowType": "ONE_TIME_TRANSFER",
  "trigger": {
    "type": "time",
    "schedule": "immediate"
  },
  "action": {
    "type": "transfer",
    "token": "FLOW",
    "amount": "2.0",
    "recipient": "0x0000000000000002a3ee1E266a8378C0"
  },
  "confidence": 0.99,
  "requiresInput": []
}

**RULES:**
1.  **ONLY JSON:** Your entire response MUST be a single, valid JSON object. Do not include "\`\`\`json" or any other text.
2.  **Parse Details:** Extract addresses (0x...), amounts (as strings), and times.
3.  **Handle "Immediate":** If the user says "now", "immediately", or "right away", set 'workflowType' to "ONE_TIME_TRANSFER" and 'trigger.schedule' to "immediate".
4.  **Handle Missing Info:** If critical info (like 'recipient' or 'amount') is missing, set its value to \`null\` and add the missing field name to the "requiresInput" array.
5.  **Defaults:** Default to "FLOW" token if not specified.
`;

export async function parseWorkflowPrompt(
  prompt: string
): Promise<ParsedWorkflow> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: "llama-3.1-70b-versatile", // Using a powerful model for complex JSON
      temperature: 0.0, // We want deterministic output
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    const parsed = JSON.parse(content);

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
    throw new Error(
      `Failed to parse workflow. Please try rephrasing. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
