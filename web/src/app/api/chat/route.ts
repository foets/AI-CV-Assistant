import { NextRequest, NextResponse } from "next/server";

const LANGGRAPH_URL = "http://localhost:2024";

// Thread management - tracks threads by session
const threadStore = new Map<string, string>();

async function createNewThread(): Promise<string> {
    const res = await fetch(`${LANGGRAPH_URL}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
  return data.thread_id;
}

async function getOrCreateThread(sessionId: string): Promise<string> {
  let threadId = threadStore.get(sessionId);
  if (!threadId) {
    threadId = await createNewThread();
    threadStore.set(sessionId, threadId);
  }
  return threadId;
}

async function sendToAgent(message: string, context: string, sessionId: string) {
  const threadId = await getOrCreateThread(sessionId);

  // Add context prefix to message so agent knows which mode to use
  let fullMessage = message;
  if (context === "profile") {
    fullMessage = `[PROFILE EDIT MODE]\n\n${message}`;
  } else {
    fullMessage = `[CV MODE]\n\n${message}`;
  }

  const res = await fetch(`${LANGGRAPH_URL}/threads/${threadId}/runs/wait`, {
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
    const { message, context, sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { response: "❌ Error: No session ID provided" },
        { status: 400 }
      );
    }

    const response = await sendToAgent(message, context || "cv", sessionId);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { response: `❌ Error: ${message}` },
      { status: 500 }
    );
  }
}

// DELETE endpoint to reset/clear a session's thread
export async function DELETE(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (sessionId) {
      threadStore.delete(sessionId);
      return NextResponse.json({ success: true, message: "Thread reset" });
    }

    return NextResponse.json(
      { success: false, message: "No session ID provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Reset error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
