"""
Custom tools for the CV Tailoring Agent.

Tools:
- read_template: Read CV structure template
- read_user_data: Read user's factual data
- read_cv: Read existing CV for a job
- write_cv: Write tailored CV markdown
- generate_pdf: Convert markdown to PDF
- extract_job_url: Extract job description from URL
"""

import os
import subprocess
from langchain_core.tools import tool
from langchain_tavily import TavilyExtract

# Directory paths relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
OUTPUT_DIR = os.path.join(DATA_DIR, "output")


@tool
def read_template() -> str:
    """Read the CV template that defines structure, formatting, and layout rules.
    
    This template MUST be followed exactly when creating CVs.
    It defines section order, formatting rules, and tailoring guidelines.
    """
    template_path = os.path.join(DATA_DIR, "template.md")
    try:
        with open(template_path, "r") as f:
            return f.read()
    except FileNotFoundError:
        return "Error: template.md not found"


@tool
def read_user_data() -> str:
    """Read the user's factual data (experience, skills, education).
    
    This is the ONLY source of truth for user information.
    NEVER invent or hallucinate any data not present in this file.
    """
    user_path = os.path.join(DATA_DIR, "user.md")
    try:
        with open(user_path, "r") as f:
            return f.read()
    except FileNotFoundError:
        return "Error: user.md not found. Please create data/user.md with your information."


@tool
def write_user_data(content: str) -> str:
    """Write/update the user's profile data (user.md).
    
    Args:
        content: The COMPLETE markdown content for the user profile.
                 Must include all sections: Personal Info, Summary, Experience, Education, Skills.
    
    Returns:
        Confirmation message on success.
    
    IMPORTANT: 
    - Always read the current profile first with read_user_data() before making changes.
    - You must write the COMPLETE file content, not just the changes.
    - Preserve all existing data unless the user explicitly asks to remove something.
    """
    user_path = os.path.join(DATA_DIR, "user.md")
    
    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    try:
        with open(user_path, "w") as f:
            f.write(content)
        return "✅ Profile updated successfully! The changes have been saved to user.md."
    except Exception as e:
        return f"Error writing profile: {str(e)}"


@tool
def update_user_data(content: str) -> str:
    """Update the user's profile data (user.md) with new content.
    
    Args:
        content: The complete updated markdown content for the user's profile
    
    Returns:
        Confirmation message with the update status.
    
    IMPORTANT: This replaces the entire user.md file. Make sure to include
    all existing information that should be preserved, plus any new updates.
    """
    user_path = os.path.join(DATA_DIR, "user.md")
    
    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    try:
        with open(user_path, "w") as f:
            f.write(content)
        return f"✅ Profile successfully updated at {user_path}"
    except Exception as e:
        return f"❌ Error updating profile: {str(e)}"


@tool
def read_cv(job_name: str) -> str:
    """Read an existing CV for a specific job if it exists.
    
    Args:
        job_name: The job identifier (e.g., 'google_pm', 'meta_engineer')
    
    Returns:
        The CV content if it exists, or a message indicating no CV exists.
    """
    # Sanitize job name for filename
    safe_name = job_name.lower().replace(" ", "_").replace("-", "_")
    cv_path = os.path.join(OUTPUT_DIR, f"cv_{safe_name}.md")
    
    if os.path.exists(cv_path):
        with open(cv_path, "r") as f:
            return f.read()
    return f"No CV exists for job '{job_name}' yet."


@tool
def write_cv(job_name: str, content: str) -> str:
    """Write the tailored CV markdown content for a specific job.
    
    Args:
        job_name: The job identifier (e.g., 'google_pm', 'meta_engineer')
        content: The full markdown content of the CV
    
    Returns:
        Confirmation message with the file path.
    
    IMPORTANT: After calling this, you MUST call generate_pdf with the same job_name.
    """
    # Sanitize job name for filename
    safe_name = job_name.lower().replace(" ", "_").replace("-", "_")
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    cv_path = os.path.join(OUTPUT_DIR, f"cv_{safe_name}.md")
    with open(cv_path, "w") as f:
        f.write(content)
    
    return f"CV written to {cv_path}. Now call generate_pdf('{job_name}') to create the PDF."


@tool
def generate_pdf(job_name: str) -> str:
    """Convert a CV markdown file to PDF.
    
    Args:
        job_name: The job identifier (must match a previously written CV)
    
    Returns:
        Confirmation message with the PDF path, or error message.
    
    This should be called after write_cv to generate the final PDF.
    """
    import pypandoc
    
    # Sanitize job name for filename
    safe_name = job_name.lower().replace(" ", "_").replace("-", "_")
    
    md_path = os.path.join(OUTPUT_DIR, f"cv_{safe_name}.md")
    pdf_path = os.path.join(OUTPUT_DIR, f"cv_{safe_name}.pdf")
    css_path = os.path.join(ASSETS_DIR, "cv_style.css")
    
    if not os.path.exists(md_path):
        return f"Error: No markdown file found at {md_path}. Call write_cv first."
    
    if not os.path.exists(css_path):
        return f"Error: CSS file not found at {css_path}"
    
    try:
        # Check available PDF engines
        pdf_engine = _get_pdf_engine()
        
        if pdf_engine is None:
            # Fallback to HTML
            html_path = os.path.join(OUTPUT_DIR, f"cv_{safe_name}.html")
            pypandoc.convert_file(
                md_path,
                'html',
                outputfile=html_path,
                extra_args=[
                    '--standalone',
                    '--css', css_path,
                    '--metadata', 'title=CV'
                ]
            )
            return f"PDF engine not available. HTML created at {html_path}. Open in browser and print to PDF."
        
        # Build extra args based on engine
        extra_args = ['--standalone', f'--pdf-engine={pdf_engine}']
        
        if pdf_engine in ['pdflatex', 'xelatex']:
            # LaTeX-specific settings for proper list rendering
            # Create a header file to ensure proper list formatting
            latex_header = os.path.join(ASSETS_DIR, "cv_header.tex")
            _ensure_latex_header(latex_header)
            
            extra_args.extend([
                '-V', 'geometry:margin=0.6in',
                '-V', 'fontsize=10pt',
                '-V', 'linestretch=1.05',
                '-H', latex_header,  # Include custom header for list styling
            ])
        elif pdf_engine == 'wkhtmltopdf':
            # wkhtmltopdf uses CSS
            extra_args.extend(['--css', css_path])
        else:
            # For weasyprint - best option for CSS support
            extra_args.extend(['--css', css_path])
        
        pypandoc.convert_file(
            md_path,
            'pdf',
            outputfile=pdf_path,
            extra_args=extra_args
        )
        
        return f"PDF generated successfully at {pdf_path}"
        
    except Exception as e:
        return f"Error generating PDF: {str(e)}"


def _ensure_latex_header(header_path: str) -> None:
    """Create LaTeX header file for proper CV formatting."""
    header_content = r"""% CV LaTeX Header - Ensures proper list rendering
\usepackage{enumitem}
\usepackage{parskip}

% Configure lists to not be compact/tight
\setlist[itemize]{
    topsep=2pt,
    partopsep=0pt,
    parsep=2pt,
    itemsep=3pt,
    leftmargin=18pt
}

% Ensure each list item is on its own line
\providecommand{\tightlist}{%
  \setlength{\itemsep}{3pt}\setlength{\parskip}{0pt}}

% Better paragraph spacing
\setlength{\parskip}{4pt}
"""
    # Only write if doesn't exist or needs update
    os.makedirs(os.path.dirname(header_path), exist_ok=True)
    with open(header_path, 'w') as f:
        f.write(header_content)


def _get_pdf_engine() -> str | None:
    """Check which PDF engine is available.
    
    Priority order:
    1. weasyprint - Best CSS support, proper list rendering
    2. wkhtmltopdf - Good CSS support
    3. xelatex - Better font support than pdflatex
    4. pdflatex - Fallback
    """
    # Prefer weasyprint for best CSS support and list rendering
    engines = ['weasyprint', 'wkhtmltopdf', 'xelatex', 'pdflatex']
    
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


# Initialize Tavily Extract tool
_tavily_extract = TavilyExtract()


@tool
def extract_job_url(url: str) -> str:
    """Extract job description content from a URL using Tavily Extract API.
    
    Args:
        url: The URL of the job posting to extract content from
    
    Returns:
        The extracted job description content including:
        - Role title
        - Key responsibilities
        - Required/preferred skills
        - Relevant keywords
    
    Use this when the user provides a job URL instead of a text description.
    """
    try:
        result = _tavily_extract.invoke({"urls": [url]})
        return str(result)
    except Exception as e:
        return f"Error extracting job description from URL: {str(e)}"


# Export all tools
__all__ = [
    'read_template',
    'read_user_data',
    'write_user_data',
    'read_cv',
    'write_cv',
    'generate_pdf',
    'extract_job_url'
]
