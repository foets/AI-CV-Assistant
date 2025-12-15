import { NextRequest, NextResponse } from "next/server";

const LANGGRAPH_URL = "http://localhost:2024";

// Store thread ID in memory (in production, use a proper store)
let threadId: string | null = null;

async function ensureThread() {
  if (!threadId) {
    const res = await fetch(`${LANGGRAPH_URL}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    threadId = data.thread_id;
  }
  return threadId;
}

async function sendToAgent(message: string, context: string) {
  const tid = await ensureThread();

  // Add context prefix to message so agent knows which mode to use
  let fullMessage = message;
  if (context === "profile") {
    fullMessage = `[PROFILE EDIT MODE]\n\n${message}`;
  } else {
    fullMessage = `[CV MODE]\n\n${message}`;
  }

  const res = await fetch(`${LANGGRAPH_URL}/threads/${tid}/runs/wait`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assistant_id: "cv_agent",
      input: {
        messages: [{ role: "user", content: fullMessage }],
      },
    }),
  });

  const data = await res.json();

  // Extract the last AI message from the response
  if (data.messages) {
    for (let i = data.messages.length - 1; i >= 0; i--) {
      const msg = data.messages[i];
      if (msg.type === "ai" || msg.role === "assistant") {
        const content = msg.content || "";
        // Skip empty messages or tool call messages
        if (content && typeof content === "string" && content.trim()) {
          return content;
        }
      }
    }
  }

  return "Done.";
}

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    const response = await sendToAgent(message, context || "cv");

    // Check if this was a successful profile update
    const isProfileUpdate = context === "profile" && response.includes("✅ Profile updated");

    return NextResponse.json({
      response,
      profileUpdated: isProfileUpdate
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { response: `❌ Error: ${error.message}`, profileUpdated: false },
      { status: 500 }
    );
  }
}

