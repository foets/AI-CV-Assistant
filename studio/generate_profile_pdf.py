#!/usr/bin/env python3
"""
Generate PDF from user.md profile file.
Uses the same styling as CV generation.
"""

import os
import sys
import subprocess

# Directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

USER_MD_PATH = os.path.join(DATA_DIR, "user.md")
PROFILE_PDF_PATH = os.path.join(DATA_DIR, "profile_preview.pdf")
CSS_PATH = os.path.join(ASSETS_DIR, "cv_style.css")


def get_pdf_engine():
    """Check which PDF engine is available."""
    engines = ['weasyprint', 'pdflatex', 'xelatex', 'wkhtmltopdf']
    
    for engine in engines:
        try:
            result = subprocess.run(
                ['which', engine],
                capture_output=True,
                check=True
            )
            if result.returncode == 0:
                return engine
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue
    
    return None


def generate_pdf():
    """Generate PDF from user.md."""
    import pypandoc
    
    if not os.path.exists(USER_MD_PATH):
        print(f"Error: {USER_MD_PATH} not found", file=sys.stderr)
        sys.exit(1)
    
    if not os.path.exists(CSS_PATH):
        print(f"Error: {CSS_PATH} not found", file=sys.stderr)
        sys.exit(1)
    
    engine = get_pdf_engine()
    if engine is None:
        print("Error: No PDF engine available", file=sys.stderr)
        sys.exit(1)
    
    extra_args = ['--standalone', f'--pdf-engine={engine}']
    
    if engine in ['pdflatex', 'xelatex']:
        extra_args.extend([
            '-V', 'geometry:margin=0.6in',
            '-V', 'fontfamily=mathptmx',
            '-V', 'fontsize=10pt',
            '-V', 'linestretch=0.95'
        ])
    else:
        # For weasyprint
        extra_args.extend(['--css', CSS_PATH])
    
    try:
        pypandoc.convert_file(
            USER_MD_PATH,
            'pdf',
            outputfile=PROFILE_PDF_PATH,
            extra_args=extra_args
        )
        print(f"success:{PROFILE_PDF_PATH}")
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    generate_pdf()
