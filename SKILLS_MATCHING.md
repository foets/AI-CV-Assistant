# Skills Matching System

## How It Works

The CV agent now uses a **structured job analysis** approach to ensure accurate skill matching between job requirements and your CV.

### Workflow

```
Job URL
    ↓
extract_job_url (FireCrawl API - returns clean markdown)
    ↓
Markdown content (may have some nav/footer elements)
    ↓
clean_job_description (removes remaining junk, keeps full job content)
    ↓
Clean job description
    ↓
translate_job_description (if Ukrainian/Russian/etc.)
    ↓
Clean job description in English
    ↓
analyze_job_requirements (extracts structured data)
    ↓
{
  "core_technical_skills": ["project management", "process optimization"],
  "tools_and_technologies": ["Jira", "n8n", "Make"],
  "soft_skills": ["leadership", "stakeholder management", "communication"],
  "key_action_verbs": ["lead", "manage", "implement"],
  ...
}
    ↓
Agent matches to user.md
    ↓
CV with exact terminology from job
```

### What Gets Extracted

1. **Competencies**: Technical competencies mentioned (e.g., "data analysis", "project management")
2. **Tools & Technologies**: Specific software/platforms (e.g., "Python", "Jira", "AWS")
3. **Soft Skills**: People skills emphasized (e.g., "cross-functional collaboration", "stakeholder management")
4. **Action Verbs**: Key responsibility verbs (e.g., "lead", "implement", "optimize")
5. **Languages**: Language requirements
6. **Seniority Level**: Experience level signals

### Benefits

✅ **Exact terminology matching** - Uses the job's exact phrases  
✅ **No missing soft skills** - Always includes soft skills from job description  
✅ **Prioritized skills** - Lists most relevant skills first  
✅ **ATS-friendly** - Keywords match what recruiters search for  

### Example

**Job says**: "Strong cross-functional collaboration skills"  
**CV will say**: "Cross-functional collaboration" (exact match)

**Job says**: "Experience with n8n, Make, or Zapier"  
**CV will list**: "n8n, Make, Zapier" (if you have them)

## Multi-Language Support

The agent now supports job descriptions in **Ukrainian, Russian, English, and other languages**:

1. **Auto-detection**: Automatically detects the language of the job description
2. **Accurate translation**: Translates to English while preserving:
   - Technical terms (Jira, API, AI/ML, etc.)
   - Tool names (n8n, Make, Zapier)
   - Company-specific terminology
3. **No translation needed**: If already in English, proceeds directly to analysis

## For Users

When the agent creates your CV from a job URL:
1. **Extracts** the job page using FireCrawl (returns clean markdown)
2. **Cleans** it - removes any remaining navigation, footers, keeps full job content
3. **Translates** if needed (Ukrainian/Russian → English) while preserving ALL details
4. **Analyzes** to extract structured requirements (skills, tools, soft skills)
5. **Matches** requirements to your profile
6. **Generates** CV using exact terminology from the job

**Core principle**: Every requirement, responsibility, and skill from the job is preserved through the pipeline.

**You don't need to do anything different** - just provide the job URL in any language!

