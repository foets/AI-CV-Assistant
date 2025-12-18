import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "..", "data", "output");

export async function GET() {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return NextResponse.json({ cvs: [] });
    }

    const files = fs.readdirSync(OUTPUT_DIR);
    const cvs = files
      .filter((f) => f.startsWith("cv_") && f.endsWith(".pdf"))
      .sort();

    return NextResponse.json({ cvs });
  } catch (error) {
    console.error("Error reading CVs:", error);
    return NextResponse.json({ cvs: [] });
  }
}


