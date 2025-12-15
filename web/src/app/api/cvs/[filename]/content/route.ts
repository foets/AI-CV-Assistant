import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "..", "data", "output");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Ensure we're reading the .md file
    const mdFilename = filename.endsWith(".md") ? filename : filename.replace(".pdf", ".md");
    const filePath = path.join(OUTPUT_DIR, mdFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ content: "" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error reading CV content:", error);
    return NextResponse.json({ content: "" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const { content } = await req.json();

    // Ensure we're writing to the .md file
    const mdFilename = filename.endsWith(".md") ? filename : filename.replace(".pdf", ".md");
    const filePath = path.join(OUTPUT_DIR, mdFilename);

    fs.writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving CV content:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

