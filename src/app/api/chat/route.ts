// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { parseWorkflowPrompt, ParsedWorkflow } from "@/lib/groq/client";
import { CadenceGenerator } from "@/lib/cadence/generator"; // <-- IMPORT THE GENERATOR
import { WorkflowDefinition } from "@/types/workflow.types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  conversationHistory: ChatMessage[];
  userContext: {
    address?: string;
    balance?: string;
  };
}

// This prompt is for the CHATBOT persona
const systemPrompt = `You are FlowGPT, an AI assistant for the Flow blockchain. You help users create and manage automated workflows through natural conversation.

Your personality:
- Conversational and friendly.
- Proactive in asking clarifying questions.
- Context-aware of user's wallet and balance.
- Guide users step-by-step.

Your goal is to gather all necessary information to define a workflow.
- For payments: "What amount?", "Who is the recipient (address)?", "How often (daily, weekly, monthly)?"
- Acknowledge the user's context: "I see you're connected with address {{USER_ADDRESS}}."
- When you have all details, confirm with the user. Example: "Great! I'm ready to set up a weekly payment of 100 FLOW to 0x123. Does that look correct?"

IMPORTANT:
- DO NOT output JSON.
- DO NOT generate Cadence code.
- Your goal is to have a natural conversation to gather requirements.
- The final confirmation message from you should summarize the user's request clearly.

User context at runtime:
- Address: {{USER_ADDRESS}}
- Balance: {{USER_BALANCE}} FLOW`;

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { message, conversationHistory, userContext } = body;

    const contextualSystemPrompt = systemPrompt
      .replace("{{USER_ADDRESS}}", userContext.address || "Not connected")
      .replace("{{USER_BALANCE}}", userContext.balance || "Unknown");

    const messages: any[] = [
      { role: "system", content: contextualSystemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    // 1. Get the conversational response from the AI
    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.1-8b-instant", // Use a fast model for chat
      temperature: 0.7,
      max_tokens: 1500,
    });

    const assistantMessage = completion.choices[0].message.content || "";

    // 2. Check if the AI's response or user's message contains intent to create
    const lowerMessage =
      assistantMessage.toLowerCase() + " " + message.toLowerCase();
    const hasWorkflowKeywords =
      lowerMessage.includes("deploy") ||
      lowerMessage.includes("set up") ||
      lowerMessage.includes("create") ||
      lowerMessage.includes("schedule") ||
      lowerMessage.includes("confirm") ||
      lowerMessage.includes("looks correct");

    let parsedWorkflow: ParsedWorkflow | null = null;
    let transactionCadence: string | null = null;
    let generationError: string | null = null;

    if (hasWorkflowKeywords && userContext.address) {
      try {
        // 3. If intent exists, call the PARSER AI
        const combinedText = [
          ...conversationHistory.slice(-4), // Look at recent history
          { role: "user" as const, content: message },
        ]
          .map((m) => m.content)
          .join(" \n ");

        parsedWorkflow = await parseWorkflowPrompt(combinedText);

        // 4. If parsing is successful, GENERATE CADENCE
        if (parsedWorkflow && !parsedWorkflow.requiresInput?.length) {
          try {
            // This cast is necessary because ParsedWorkflow and WorkflowDefinition
            // are structurally similar but not identical.
            transactionCadence = CadenceGenerator.generateWorkflowTransaction(
              parsedWorkflow as any
            );
          } catch (genError) {
            console.error("Cadence generation error:", genError);
            generationError =
              genError instanceof Error
                ? genError.message
                : "Failed to generate Cadence";
          }
        }
      } catch (error) {
        console.error("Failed to parse or generate workflow:", error);
      }
    }

    // 5. Return everything to the frontend
    return NextResponse.json({
      message: assistantMessage,
      workflow: parsedWorkflow,
      cadence: transactionCadence,
      error: generationError,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process message. Please try again.",
      },
      { status: 500 }
    );
  }
}
