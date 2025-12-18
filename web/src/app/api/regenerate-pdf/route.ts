import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const OUTPUT_DIR = path.join(process.cwd(), "..", "data", "output");
const ASSETS_DIR = path.join(process.cwd(), "..", "assets");

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();

    // Build paths - filename comes as "cv_jobname" (without extension)
    const safeName = filename.startsWith("cv_") ? filename : `cv_${filename}`;
    const mdPath = path.join(OUTPUT_DIR, `${safeName}.md`);
    const pdfPath = path.join(OUTPUT_DIR, `${safeName}.pdf`);
    const cssPath = path.join(ASSETS_DIR, "cv_style.css");

    // Check if markdown exists
    if (!fs.existsSync(mdPath)) {
      return NextResponse.json(
        { success: false, error: `Markdown file not found: ${mdPath}` },
        { status: 404 }
      );
    }

    // Try weasyprint first, then pdflatex
    let pdfEngine = "weasyprint";
    try {
      await execAsync("which weasyprint");
    } catch {
      try {
        await execAsync("which pdflatex");
        pdfEngine = "pdflatex";
      } catch {
        return NextResponse.json(
          { success: false, error: "No PDF engine available (need weasyprint or pdflatex)" },
          { status: 500 }
        );
      }
    }

    // Generate PDF using pandoc
    const extraArgs = pdfEngine === "weasyprint" 
      ? `--pdf-engine=weasyprint --css="${cssPath}"`
      : `--pdf-engine=pdflatex -V geometry:margin=0.75in -V fontsize=10pt`;

    const cmd = `pandoc "${mdPath}" -o "${pdfPath}" --standalone ${extraArgs}`;
    
    await execAsync(cmd);

    return NextResponse.json({ success: true, path: pdfPath });
  } catch (error: unknown) {
    console.error("Error regenerating PDF:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}



