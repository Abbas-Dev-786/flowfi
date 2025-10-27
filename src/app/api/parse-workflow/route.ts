// app/api/parse-workflow/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseWorkflowPrompt, ParsedWorkflow } from "@/lib/groq/client";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Prompt too short. Please describe your workflow." },
        { status: 400 }
      );
    }

    const parsed = await parseWorkflowPrompt(prompt);

    // Check confidence threshold
    if (parsed.confidence < 0.7) {
      return NextResponse.json({
        success: false,
        message: "I'm not confident about this workflow. Can you clarify?",
        parsed,
        suggestions: generateSuggestions(parsed),
      });
    }

    return NextResponse.json({
      success: true,
      workflow: parsed,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred." },
      { status: 500 }
    );
  }
}

function generateSuggestions(parsed: ParsedWorkflow): string[] {
  const suggestions: string[] = [];

  if (!parsed.action.recipient) {
    suggestions.push("Please specify a recipient wallet address (0x...)");
  }

  if (!parsed.trigger.schedule) {
    suggestions.push("When should this run? (daily, weekly, monthly?)");
  }

  return suggestions;
}
