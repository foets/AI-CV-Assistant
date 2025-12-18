"""
Custom tools for the CV Tailoring Agent.

Tools:
- read_template: Read CV structure template
- read_user_data: Read user's factual data
- read_cv: Read existing CV for a job
- write_cv: Write tailored CV markdown
- generate_pdf: Convert markdown to PDF
- extract_job_url: Extract job description from URL (using FireCrawl)
- clean_job_description: Clean raw HTML/markdown from extracted content
- translate_job_description: Translate non-English job descriptions
- analyze_job_requirements: Extract structured requirements from job description
"""

import os
import subprocess
from langchain_core.tools import tool
from langchain_community.document_loaders.firecrawl import FireCrawlLoader
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Load environment variables from .env file
_this_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_this_dir, ".env"))

# Directory paths relative to this file
BASE_DIR = os.path.dirname(_this_dir)
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
    
    # Fix markdown formatting: ensure two spaces at end of lines that need line breaks
    content = _fix_markdown_line_breaks(content)
    
    cv_path = os.path.join(OUTPUT_DIR, f"cv_{safe_name}.md")
    with open(cv_path, "w") as f:
        f.write(content)
    
    return f"CV written to {cv_path}. Now call generate_pdf('{job_name}') to create the PDF."


def _fix_markdown_line_breaks(content: str) -> str:
    """Automatically fix markdown line breaks by adding two spaces where needed.
    
    This ensures proper PDF rendering even if the LLM forgets to add trailing spaces.
    """
    lines = content.split('\n')
    fixed_lines = []
    
    in_header = False
    in_skills = False
    in_education = False
    
    for i, line in enumerate(lines):
        # Detect sections
        if line.startswith('# '):  # Name line
            in_header = True
            in_skills = False
            in_education = False
        elif line.startswith('## SKILLS'):
            in_skills = True
            in_header = False
            in_education = False
        elif line.startswith('## EDUCATION'):
            in_education = True
            in_skills = False
            in_header = False
        elif line.startswith('## '):  # Other section
            in_header = False
            in_skills = False
            in_education = False
        
        # Add two spaces to lines that need them
        next_line = lines[i + 1] if i + 1 < len(lines) else ''
        
        # Header section: name, title, contact lines (before first ----)
        if in_header and line.strip() and not line.startswith('---') and not line.startswith('##'):
            # LinkedIn/last header line should get spaces too if followed by blank line then ---
            next_next_line = lines[i + 2] if i + 2 < len(lines) else ''
            should_add_spaces = (
                (next_line.strip() and not next_line.startswith('---')) or  # Another header line follows
                (not next_line.strip() and next_next_line.startswith('---'))  # Blank line then separator
            )
            if should_add_spaces and not line.endswith('  '):
                line = line.rstrip() + '  '
        
        # Skills section: Competencies, Soft Skills, Tools, Languages lines
        elif in_skills and line.startswith('**') and ':' in line:
            # Add two spaces to all skill category lines except the last one
            next_is_skill_line = next_line.startswith('**') and ':' in next_line
            if next_is_skill_line and not line.endswith('  '):
                line = line.rstrip() + '  '
        
        # Education section: degree lines
        elif in_education and line.startswith('**'):
            if not line.endswith('  ') and next_line.startswith('**'):
                line = line.rstrip() + '  '
        
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)


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


@tool
def extract_job_url(url: str) -> str:
    """Extract job description content from a URL using FireCrawl.
    
    FireCrawl returns clean markdown with only main content (no navigation/footer).
    
    Args:
        url: The URL of the job posting to extract content from
    
    Returns:
        The extracted job description content in clean markdown format.
        
    Note: FireCrawl with onlyMainContent=True provides very clean output.
    You may still want to call clean_job_description() for additional cleanup.
    
    Use this when the user provides a job URL instead of a text description.
    """
    try:
        # FireCrawl API key from environment
        api_key = os.getenv("FIRECRAWL_API_KEY")
        if not api_key:
            return "Error: FIRECRAWL_API_KEY environment variable not set"
        
        # FireCrawl scrape parameters for optimal job description extraction
        scrape_params = {
            "onlyMainContent": True,  # Extract only main content, no nav/footer
            "formats": ["markdown"],  # Output in markdown format
            "maxAge": 172800000,       # Cache for 2 days (in milliseconds)
        }
        
        loader = FireCrawlLoader(
            api_key=api_key,
            url=url,
            mode="scrape",  # scrape single page
            params=scrape_params
        )
        docs = loader.load()
        
        if docs:
            # Return the page content from the first document
            return docs[0].page_content
        else:
            return "Error: No content extracted from URL"
    except Exception as e:
        return f"Error extracting job description from URL: {str(e)}"


@tool
def clean_job_description(raw_content: str) -> str:
    """Extract only the actual job description from scraped content.
    
    FireCrawl output includes the job posting but also:
    - Company navigation links
    - "Similar vacancies" sections  
    - "Hot vacancies" sections
    - Social share buttons
    - Login/registration forms
    
    This tool removes all that and keeps ONLY the job posting itself.
    
    Args:
        raw_content: Markdown content from FireCrawl (may include footer junk)
    
    Returns:
        Just the job description: title, company info, responsibilities, 
        requirements, benefits - nothing else.
    
    IMPORTANT: Call this AFTER extract_job_url and BEFORE translate_job_description.
    """
    llm = ChatOpenAI(model="gpt-5.2")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Extract ONLY the job posting content. Remove everything else.

**REMOVE these sections completely:**
- Navigation links at the top (company links, "all vacancies" links)
- "Hot vacancies" / "Similar vacancies" / "Related jobs" sections
- Social share buttons (Facebook, Twitter, LinkedIn)
- "Apply now" / "Respond to vacancy" buttons
- Login/registration forms
- Footer content, cookie notices
- Other job listings

**KEEP the actual job description:**
- Job title
- Company name and description
- Salary range (if shown)
- Responsibilities / Tasks
- Requirements / Skills (hard skills, soft skills)
- Benefits / What we offer
- Any other direct job-related content

**Output**: Just the job posting text. Preserve the original structure (headers, bullets).
Do NOT add any commentary. Do NOT summarize. Just extract the job posting."""),
        ("human", "{raw_content}")
    ])
    
    try:
        chain = prompt | llm
        response = chain.invoke({"raw_content": raw_content})
        return response.content
    except Exception as e:
        return f"Error cleaning job description: {str(e)}"


@tool
def translate_job_description(clean_job_description: str) -> str:
    """Detect and translate non-English job descriptions to English.
    
    This tool:
    - Detects the language of the job description (Ukrainian, Russian, English, etc.)
    - If not in English, translates it accurately while PRESERVING ALL CONTENT
    - If already in English, returns the original text
    
    Args:
        clean_job_description: The CLEANED job description text in any language
    
    Returns:
        The job description in English with ALL content preserved.
        Also includes a note about the original language detected.
    
    CRITICAL: This should receive CLEANED content (after clean_job_description).
    Core goal: MAINTAIN ALL CONTENTS - don't lose any requirements, responsibilities, or details.
    """
    llm = ChatOpenAI(model="gpt-5.2")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a professional translator specializing in job descriptions and technical content.

**CRITICAL GOAL**: MAINTAIN ALL CONTENTS. Do not summarize, shorten, or skip any details. Translate the text to English while preserving all content.

Your task:
1. Detect the language of the input text
2. If it's already in English, return it as-is with a note: "Language: English (no translation needed)"
3. If it's in another language (Ukrainian, Russian, etc.), translate it to English while:
   
   **MUST PRESERVE**:
   - Every single responsibility listed
   - Every requirement (required and preferred)
   - All skills, qualifications, experience requirements
   - Technical terms, tool names, acronyms (Jira, Python, n8n, etc.) - keep as-is
   - All benefits, salary info, work arrangements
   - Section structure and formatting (bullets, headers)
   - Company-specific terminology
   
   **Translation quality**:
   - Use professional, natural English
   - For technical terms, keep original (e.g., "Jira" stays "Jira", not translated)
   - For soft skills, use standard English equivalents

Output format:
---
Language: [detected language]
---
[COMPLETE translated text with ALL content preserved]
---

Remember: Your primary goal is COMPLETENESS. Every detail matters for CV matching."""),
        ("human", "{job_description}")
    ])
    
    try:
        chain = prompt | llm
        response = chain.invoke({"job_description": clean_job_description})
        return response.content
    except Exception as e:
        return f"Error translating job description: {str(e)}"


@tool
def analyze_job_requirements(job_description: str) -> str:
    """Analyze a job description and extract structured requirements for CV tailoring.
    
    This tool uses AI to identify and categorize:
    - Core technical skills mentioned
    - Specific tools and technologies required
    - Soft skills emphasized
    - Key responsibilities and action verbs
    - Required languages
    
    Args:
        job_description: The full text of the job description (should be in English)
    
    Returns:
        Structured JSON-formatted requirements that should be used to tailor the CV.
        This output should guide which skills to emphasize and what terminology to use.
    
    IMPORTANT: If job description is not in English, call translate_job_description first!
    """
    llm = ChatOpenAI(model="gpt-5.2")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a job requirements analyzer. Extract and categorize key requirements from job descriptions.

Your task is to identify:
1. **Core Skills and Requirements**: Specific skills and requirements mentioned in the job description.
2. **Tools & Technologies**: Specific tools, instruments, software,platforms, frameworks mentioned (e.g., "Jira", "Python", "AWS", "n8n")
3. **Soft Skills**: People/communication skills emphasized in the job description.
4. **Action Verbs**: Key verbs describing responsibilities.
5. **Languages**: Any language requirements mentioned
6. **Experience Level**: Seniority signals in the job description.

Preserve all the details and requirements from the job description without editing, summarizing, ignoring or messing up with the original text.

Output in this exact JSON format:
{{
  "core_skills_and_requirements": ["skill1", "skill2", "skill3"],
  "tools_and_technologies": ["tool1", "tool2", "tool3"],
  "soft_skills": ["soft skill1", "soft skill2", "soft skill3"],
  "key_action_verbs": ["verb1", "verb2", "verb3"],
  "languages": ["language1", "language2"],
  "experience_level": "junior/mid/senior"
}}

Be specific and extract exact terms from the job description. Don't generalize."""),
        ("human", "Analyze this job description and extract the key requirements:\n\n{job_description}")
    ])
    
    try:
        chain = prompt | llm
        response = chain.invoke({"job_description": job_description})
        return response.content
    except Exception as e:
        return f"Error analyzing job requirements: {str(e)}"


@tool
def polish_cv(cv_markdown: str, job_description: str) -> str:
    """
    Final polish step for a generated CV. Reviews and fixes unprofessional or inappropriate wording.
    
    This tool checks the CV against the job description and:
    - Removes copied job posting language (e.g., "you quickly master...", "you propose solutions, not problems")
    - Normalizes soft skills to professional 2-3 word terms
    - Ensures professional, standardized wording throughout
    - Fixes any sentences that sound like job requirements rather than achievements
    
    Args:
        cv_markdown: The generated CV in markdown format
        job_description: The cleaned/translated job description for reference
    
    Returns:
        Polished CV markdown with professional, standardized language
    
    IMPORTANT: Call this AFTER write_cv and BEFORE generate_pdf
    """
    llm = ChatOpenAI(model="gpt-5.2")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a CV editor ensuring professional, standardized language.

Your task is to review a CV and fix any unprofessional or inappropriate wording.

**PROBLEMS TO FIX:**
1. Job posting language copied verbatim:
   - BAD: "you quickly master new tools and technologies"
   - GOOD: "Learning agility" or "Quick technology adoption"
   
2. Requirement-style phrases (sounds like job ad, not CV):
   - BAD: "Problem-solving mindset: you propose solutions, not problems"
   - GOOD: "Proactive problem-solving"
   
3. Second-person language ("you", "your"):
   - BAD: "You communicate effectively with stakeholders"
   - GOOD: "Stakeholder communication"
   
4. Long phrases that should be concise terms:
   - BAD: "Structured communication with stakeholders"
   - GOOD: "Stakeholder communication"

5. Generic/vague tools when specific ones exist:
   - BAD: "ChatGPT" (too generic)
   - GOOD: "LLM-assisted workflows" or specific tools like "LangChain, LangGraph"

**RULES:**
- Keep all factual content intact (achievements, metrics, dates, companies)
- Only fix language/wording issues
- Soft skills should be 2-3 word professional terms
- Maintain exact markdown formatting (headers, bullets, spacing, two trailing spaces for line breaks)
- Do NOT add or remove sections
- Do NOT change metrics or achievements

Output the complete polished CV markdown, preserving all formatting."""),
        ("human", """Review this CV and fix any unprofessional wording:

**CV TO POLISH:**
{cv_markdown}

**JOB DESCRIPTION (for context - do NOT copy from this):**
{job_description}

Output the polished CV markdown:""")
    ])
    
    try:
        chain = prompt | llm
        response = chain.invoke({
            "cv_markdown": cv_markdown,
            "job_description": job_description
        })
        return response.content
    except Exception as e:
        return f"Error polishing CV: {str(e)}"


# Export all tools
__all__ = [
    'read_template',
    'read_user_data',
    'write_user_data',
    'read_cv',
    'write_cv',
    'generate_pdf',
    'extract_job_url',
    'clean_job_description',
    'translate_job_description',
    'analyze_job_requirements',
    'polish_cv'
]
