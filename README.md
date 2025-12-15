# AI CV Assistant

An AI-powered tool for creating tailored, job-specific CVs. Built with LangGraph for the AI agent and Next.js for the modern web interface.

![CV Agent](https://img.shields.io/badge/AI-CV%20Assistant-blue)
![LangGraph](https://img.shields.io/badge/LangGraph-Agent-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)

## Features

- **🤖 AI-Powered CV Tailoring**: Uses GPT to create job-specific CVs based on your actual experience
- **🔗 URL Extraction**: Paste a job URL and the agent automatically extracts requirements via Tavily
- **🚫 Anti-Hallucination**: All content is strictly grounded in your profile data - no invented skills or experience
- **📝 Profile Management**: Edit your professional data directly through the chat interface
- **📄 PDF Export**: Automatic markdown to PDF conversion with professional styling
- **🎨 Modern UI**: Clean, responsive Next.js interface with real-time chat

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Sidebar   │  │  CV Preview  │  │    Profile    │  │
│  │    Chat     │  │   (PDF/Edit) │  │    Editor     │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                          │                              │
│                    API Routes                           │
└──────────────────────────┼──────────────────────────────┘
                           │
                   HTTP (localhost:2024)
                           │
┌──────────────────────────┼──────────────────────────────┐
│                  LangGraph Agent                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │                   cv_agent                        │   │
│  │  ┌────────────┐    ┌────────────┐               │   │
│  │  │ read_user  │    │ write_cv   │               │   │
│  │  │ write_user │    │ read_cv    │               │   │
│  │  │ read_templ │    │ gen_pdf    │               │   │
│  │  │ extract_url│    │            │               │   │
│  │  └────────────┘    └────────────┘               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key
- Tavily API key (for URL extraction)

### 1. Clone the Repository

```bash
git clone https://github.com/foets/AI-CV-Assistant.git
cd AI-CV-Assistant
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

For PDF generation, also install weasyprint:
```bash
pip install weasyprint
# Or on macOS:
brew install weasyprint
```

### 3. Install Node.js Dependencies

```bash
cd web
npm install
cd ..
```

### 4. Configure API Keys

Copy the example env file and add your keys:

```bash
cp env_example.txt studio/.env
```

Edit `studio/.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
LANGSMITH_API_KEY=your_langsmith_api_key_here  # Optional, for tracing
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=cv-agent
```

### 5. Add Your Profile Data

Edit `data/user.md` with your actual:
- Personal information
- Work experience
- Skills
- Education
- Certifications

### 6. Run the Application

You need to run both the LangGraph agent and the Next.js frontend:

**Terminal 1 - Start the AI Agent:**
```bash
cd studio
langgraph dev
```

**Terminal 2 - Start the Web UI:**
```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a CV

1. Go to the **CV** tab
2. In the chat sidebar, type your request:
   - Paste a job URL: `Create a CV for: https://careers.google.com/jobs/...`
   - Or describe the role: `Create a CV for a Senior Product Manager focusing on AI products`
3. The agent will:
   - Extract job requirements (if URL provided)
   - Read your profile data
   - Generate a tailored CV
   - Create a PDF automatically
4. Preview, edit, or download your CV

### Editing Your Profile

1. Go to the **Profile** tab
2. Use the chat to make changes:
   - `Add Python and TensorFlow to my skills`
   - `Update my current job title to Senior Engineer`
   - `Add my new certification: AWS Solutions Architect`
3. Or click **Edit Profile** to manually edit the markdown

### Refining a CV

Select a CV from the dropdown, then ask:
- `Emphasize my leadership experience more`
- `Add more technical details`
- `Make the summary more concise`

## Project Structure

```
AI-CV-Assistant/
├── studio/                   # LangGraph Agent
│   ├── agent.py              # Main agent with system prompts
│   ├── tools.py              # Custom tools (read/write CV, profile, PDF)
│   ├── langgraph.json        # LangGraph configuration
│   ├── requirements.txt      # Agent dependencies
│   └── __init__.py
│
├── web/                      # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx      # CV preview page
│   │   │   ├── profile/      # Profile editor page
│   │   │   ├── api/          # API routes
│   │   │   └── globals.css   # Tailwind styles
│   │   └── components/
│   │       └── Sidebar.tsx   # Chat sidebar component
│   ├── package.json
│   └── ...
│
├── data/
│   ├── template.md           # CV structure template
│   ├── user.md               # Your profile data
│   └── output/               # Generated CVs (gitignored)
│
├── assets/
│   └── cv_style.css          # PDF styling
│
├── requirements.txt          # Full Python dependencies
├── env_example.txt           # Example environment variables
└── README.md
```

## How It Works

1. **User Input**: Job URL or description via chat
2. **URL Extraction**: Tavily API extracts job requirements (if URL)
3. **Data Loading**: Agent reads `template.md` (structure) and `user.md` (your data)
4. **CV Generation**: LLM creates tailored CV following template structure
5. **PDF Export**: pypandoc + weasyprint converts markdown to PDF

## Agent Rules

The agent follows strict rules to prevent hallucination:

### ✅ Allowed
- Reorder skills to prioritize job-relevant ones
- Adjust professional summary for target role
- Emphasize relevant experience
- Incorporate keywords naturally

### ❌ Not Allowed
- Invent skills you don't have
- Create fake achievements or metrics
- Add experience you didn't have
- Make up certifications

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message to agent |
| `/api/cvs` | GET | List all CVs |
| `/api/cvs/[filename]` | GET | Get specific CV |
| `/api/profile` | GET/PUT | Read/update profile |
| `/api/regenerate-pdf` | POST | Regenerate PDF from markdown |

## Troubleshooting

### "langgraph-cli not found"
```bash
pip install "langgraph-cli[inmem]"
```

### "PDF engine not available"
```bash
pip install weasyprint
# Or on macOS:
brew install weasyprint
```

### "Cannot connect to agent"
Make sure `langgraph dev` is running in the `studio/` directory on port 2024.

### "Port 3000 already in use"
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

## Tech Stack

- **AI Agent**: LangGraph, LangChain, OpenAI GPT
- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **PDF Generation**: pypandoc, weasyprint
- **URL Extraction**: Tavily API
- **Observability**: LangSmith (optional)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
