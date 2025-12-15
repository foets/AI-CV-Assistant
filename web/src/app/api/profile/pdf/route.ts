import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const BASE_DIR = path.join(process.cwd(), "..");
const DATA_DIR = path.join(BASE_DIR, "data");
const STUDIO_DIR = path.join(BASE_DIR, "studio");
const USER_MD_PATH = path.join(DATA_DIR, "user.md");
const PROFILE_PDF_PATH = path.join(DATA_DIR, "profile_preview.pdf");
const GENERATE_SCRIPT = path.join(STUDIO_DIR, "generate_profile_pdf.py");

// Track when the PDF was last generated
let lastPdfMtime = 0;

async function generateProfilePdf(): Promise<boolean> {
  try {
    // Check if user.md exists
    if (!fs.existsSync(USER_MD_PATH)) {
      console.error("user.md not found at:", USER_MD_PATH);
      return false;
    }

    // Check if we need to regenerate (user.md changed)
    const userMdStat = fs.statSync(USER_MD_PATH);
    const userMdMtime = userMdStat.mtimeMs;

    if (fs.existsSync(PROFILE_PDF_PATH) && lastPdfMtime >= userMdMtime) {
      // PDF is up to date
      return true;
    }

    // Run the Python script to generate PDF
    console.log("Generating profile PDF...");
    const { stdout, stderr } = await execAsync(`python3 "${GENERATE_SCRIPT}"`, {
      timeout: 30000,
      cwd: BASE_DIR,
    });

    if (stderr) {
      console.error("PDF generation stderr:", stderr);
    }

    if (stdout && stdout.includes("success:")) {
      console.log("PDF generated successfully");
      lastPdfMtime = Date.now();
      return true;
    }

    return false;
  } catch (error: any) {
    console.error("Error generating profile PDF:", error.message);
    if (error.stderr) {
      console.error("stderr:", error.stderr);
    }
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Force regenerate if requested
    const forceRegenerate = req.nextUrl.searchParams.get("regenerate") === "true";

    if (forceRegenerate) {
      lastPdfMtime = 0;
    }

    const success = await generateProfilePdf();

    if (!success || !fs.existsSync(PROFILE_PDF_PATH)) {
      return NextResponse.json(
        { error: "Failed to generate profile PDF" },
        { status: 500 }
      );
    }

    const pdfBuffer = fs.readFileSync(PROFILE_PDF_PATH);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=profile.pdf",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error serving profile PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to serve PDF" },
      { status: 500 }
    );
  }
}
