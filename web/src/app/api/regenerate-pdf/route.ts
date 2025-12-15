import { NextRequest, NextResponse } from "next/server";

const LANGGRAPH_URL = "http://localhost:2024";

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();

    // Call the agent to regenerate PDF
    // First, create a thread if needed
    const threadRes = await fetch(`${LANGGRAPH_URL}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const threadData = await threadRes.json();
    const threadId = threadData.thread_id;

    // Call the agent with generate_pdf instruction
    const jobName = filename.replace("cv_", "");
    const res = await fetch(`${LANGGRAPH_URL}/threads/${threadId}/runs/wait`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assistant_id: "cv_agent",
        input: {
          messages: [
            {
              role: "user",
              content: `Regenerate the PDF for job "${jobName}". Just call generate_pdf("${jobName}") tool.`,
            },
          ],
        },
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    } else {
      const error = await res.text();
      return NextResponse.json({ success: false, error }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error regenerating PDF:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

