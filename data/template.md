# CV Template Structure

This template defines the structure, formatting, and layout rules for generating tailored CVs.
The agent MUST follow this structure exactly.

---

## STRUCTURE (in order)

### 1. Header
```
# [Full Name]
**[Target Role Title]** 
[City, Country] | [email] | [phone]  
[LinkedIn URL]
```
- Use horizontal rule (---) after header

### 2. Professional Summary
```
## PROFESSIONAL SUMMARY
[2-3 sentences summarizing experience, key strengths, and value proposition tailored to the target role]
```
- Maximum 4 sentences
- Must be tailored to the specific job
- Use horizontal rule (---) after section

### 3. Professional Experience

**⚠️ CRITICAL FORMATTING RULES (AGENT MUST FOLLOW EXACTLY):**
- **ONE SENTENCE PER BULLET** - Never combine multiple sentences
- **MAXIMUM 4 BULLETS** per role - Never exceed this limit
- **ONE BULLET PER LINE** - Each `-` bullet on its own line
- **NEVER** merge multiple bullets into one line
- Start each bullet with ACTION VERB (Led, Managed, Delivered, Implemented, Drove, Built, etc.)
- Include quantified impact where possible (you can estimate numbers based on context)

```
## PROFESSIONAL EXPERIENCE 

### [Job Title] | [Company Name]
*[Start Date] – [End Date] | [Location]*

- [One sentence achievement with quantified impact]
- [One sentence achievement with quantified impact]
- [One sentence achievement with quantified impact]
- [One sentence achievement with quantified impact]
```

**⚠️ CRITICAL**: There MUST be a blank line between the date/location line and the first bullet point!
- List roles in reverse chronological order
- Use horizontal rule (---) after section

### 4. Education & Certifications

**⚠️ FORMATTING RULES:**
- **OMIT** years/dates if not provided in user data - do NOT write "N/A"
- Each degree/cert on its own line with **TWO SPACES** at end for line breaks
- Include field of study if available
- Add blank line after section header

```
## EDUCATION & CERTIFICATIONS

**[Degree] — [Field of Study]** | [Institution], [Country]  
**[Certification]** | [Issuing Body]
```
- Education first, then certifications
- Use horizontal rule (---) after section

### 5. Skills & Languages

**⚠️ FORMATTING RULES:**
- **ONE LINE PER CATEGORY** - Do not write paragraphs
- Keep each category on a single line with comma-separated values
- **ADD TWO SPACES** at the end of each line (except last) to create line breaks
- Add a blank line after the section header

**⚠️ TAILORING RULES (CRITICAL):**
- **ANALYZE JOB DESCRIPTION** for specific tools, technologies, and skills mentioned
- **PRIORITIZE** skills from user.md that match job requirements - list these FIRST
- **INCLUDE JOB KEYWORDS** - if job mentions specific tools/methods the user knows, use the job's exact terminology
- **REFRAME** user skills using language from the job description where appropriate
- **ADD RELEVANT SKILLS** - you CAN add tools/skills from job description if they are reasonably implied by user's experience (e.g., if user does AI automation, they likely know common AI/ML concepts)
- **OMIT** skills not relevant to the target role to keep it focused

```
## SKILLS & LANGUAGES

**Core:** [job-relevant skill], [job-relevant skill], [matching skill]  
**Tools:** [tools from job desc if user knows them], [other relevant tools]  
**Languages:** [language] ([proficiency]), [language] ([proficiency])
```

Note: The two spaces at end of lines create markdown line breaks (`<br>`)

---

## FORMATTING RULES

1. **Length**: Single page (approximately 400-500 words)
2. **Sections**: Use `##` for main sections, `###` for subsections
3. **Bullets**: Use `-` for bullet points
4. **Emphasis**: Use `**bold**` for labels, `*italic*` for dates/locations
5. **Separators**: Use `---` between major sections
6. **Quantification**: Include numbers, percentages, dollar amounts where available
7. **Action verbs**: Start bullets with Led, Managed, Delivered, Implemented, Drove, etc.

---

## TAILORING RULES

1. **Summary**: Customize to match job title and key requirements
2. **Skills**: Prioritize skills mentioned in job description
3. **Experience bullets**: Emphasize achievements relevant to target role
4. **Keywords**: Incorporate relevant keywords from job description naturally
5. **Order**: Within skills sections, list most relevant items first
