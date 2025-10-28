// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { parseWorkflowPrompt, ParsedWorkflow } from "@/lib/groq/client";

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

const systemPrompt = `You are FlowGPT, an AI assistant for the Flow blockchain. You help users create and manage automated workflows through natural conversation.

Your personality:
- Conversational and friendly like ChatGPT
- Proactive in asking clarifying questions
- Context-aware of user's wallet and balance
- Suggest optimizations and warn about risks
- Guide users step-by-step to create workflows

Your capabilities:
1. Understand natural language workflow requests
2. Ask clarifying questions when details are missing
3. Parse workflow requirements into structured data
4. Check user's balance and warn if insufficient
5. Suggest optimizations (gas savings, timing, etc.)
6. Deploy workflows to Flow blockchain

Example workflow types:
- Recurring payments: "Pay 100 FLOW monthly to team"
- Scheduled transfers: "Send 50 FLOW every Friday at 3pm"
- DCA: "Buy 20 FLOW worth of tokens weekly"
- Staking: "Claim and compound rewards monthly"
- Batch NFT distribution: "Send 100 NFTs to addresses on Dec 1st"
- Governance voting: "Vote YES on proposal #42 in 24 hours"

IMPORTANT:
- Always be conversational and helpful
- Ask follow-up questions when information is missing
- Warn users about insufficient balance before deploying
- Suggest best practices and optimizations
- Remember conversation context
- When ready to deploy, call the deployWorkflow function with structured data

User context:
- Address: ${process.env.USER_ADDRESS || "Not connected"}
- Balance: ${process.env.USER_BALANCE || "Unknown"} FLOW`;

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { message, conversationHistory, userContext } = body;

    // Add user context to system prompt
    const contextualSystemPrompt = systemPrompt.replace(
      /\$\{([^}]+)\}/g,
      (match, key) => {
        if (key === "USER_ADDRESS")
          return userContext.address || "Not connected";
        if (key === "USER_BALANCE") return userContext.balance || "Unknown";
        return match;
      }
    );

    // Build messages array with system prompt
    const messages: any[] = [
      { role: "system", content: contextualSystemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1500,
    });

    const assistantMessage = completion.choices[0].message.content || "";

    // Check if the assistant suggests deploying a workflow
    // Look for keywords that indicate workflow deployment intent
    const lowerMessage = assistantMessage.toLowerCase();
    const hasWorkflowKeywords =
      lowerMessage.includes("deploy") ||
      lowerMessage.includes("set up") ||
      lowerMessage.includes("create") ||
      lowerMessage.includes("schedule");

    // If the message suggests deployment and user provided details, try to parse workflow
    let parsedWorkflow: ParsedWorkflow | null = null;

    if (
      hasWorkflowKeywords &&
      userContext.address &&
      userContext.address !== "Not connected"
    ) {
      try {
        // Extract workflow details from conversation
        const lastMessages = [
          ...conversationHistory,
          { role: "user" as const, content: message },
        ];
        const combinedText = lastMessages.map((m) => m.content).join(" ");

        // Try to parse the workflow
        parsedWorkflow = await parseWorkflowPrompt(combinedText);
        console.log("Parsed workflow:", parsedWorkflow);
      } catch (error) {
        console.error("Failed to parse workflow:", error);
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      workflow: parsedWorkflow,
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

// Parse workflow intent from AI response
function parseWorkflowIntent(message: string) {
  // This is a simple parser - you might want to make the AI return structured data
  // or use a more sophisticated parsing approach
  return null;
}
