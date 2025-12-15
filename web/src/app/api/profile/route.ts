import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const USER_MD_PATH = path.join(process.cwd(), "..", "data", "user.md");

export async function GET() {
  try {
    if (!fs.existsSync(USER_MD_PATH)) {
      return NextResponse.json({ content: "" });
    }
    const content = fs.readFileSync(USER_MD_PATH, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error reading profile:", error);
    return NextResponse.json({ content: "" });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { content } = await req.json();

    // Ensure directory exists
    const dir = path.dirname(USER_MD_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(USER_MD_PATH, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json({ success: false, error: "Failed to save" }, { status: 500 });
  }
}

