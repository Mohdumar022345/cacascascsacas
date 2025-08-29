import { NextRequest, NextResponse } from "next/server";
import { ChatMessage } from "@/types/types";
import { generateResponse } from "@/lib/ai-models/aiService";

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Extract latest user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.sender !== "user") {
      return NextResponse.json(
        { error: "Last message must be from the user" },
        { status: 400 }
      );
    }

    // Format conversation history
    const conversationHistory = messages.slice(0, -1).map((msg) => ({
      sender: msg.sender,
      content: msg.content,
    }));

    let aiResponse = "";
    for await (const chunk of generateResponse(
      lastUserMessage.content,
      conversationHistory
    )) {
      aiResponse += chunk;
    }

    return NextResponse.json({ content: aiResponse });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
