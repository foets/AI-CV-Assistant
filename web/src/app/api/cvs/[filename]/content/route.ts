import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "..", "data", "output");

/**
 * Fix markdown line breaks by adding two trailing spaces where needed.
 * This ensures proper rendering in PDF.
 */
function fixMarkdownLineBreaks(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const nextLine = lines[i + 1] || "";

    // Header section (# NAME through contact info)
    const isHeaderLine =
      line.startsWith("# ") ||
      line.startsWith("**") ||
      line.includes("Email:") ||
      line.includes("Phone:") ||
      line.includes("Telegram:") ||
      line.includes("LinkedIn:");

    // Skills section lines
    const isSkillsLine =
      line.startsWith("**Core") ||
      line.startsWith("**Soft") ||
      line.startsWith("**Tools") ||
      line.startsWith("**Languages");

    // Education lines
    const isEducationLine =
      (line.startsWith("**") && (line.includes("Degree") || line.includes("Bachelor") || line.includes("Master") || line.includes("Certification")));

    // If this line needs a line break and doesn't already have trailing spaces
    if ((isHeaderLine || isSkillsLine || isEducationLine) && 
        !line.endsWith("  ") && 
        nextLine.trim() !== "" && 
        !nextLine.startsWith("#") && 
        !nextLine.startsWith("---")) {
      line = line.trimEnd() + "  ";
    }

    result.push(line);
  }

  return result.join("\n");
}

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
    let { content } = await req.json();

    // Ensure we're writing to the .md file
    const mdFilename = filename.endsWith(".md") ? filename : filename.replace(".pdf", ".md");
    const filePath = path.join(OUTPUT_DIR, mdFilename);

    // Fix markdown line breaks before saving
    content = fixMarkdownLineBreaks(content);

    fs.writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving CV content:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}



