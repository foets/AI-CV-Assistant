"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, FileText, ChevronDown, Edit3, Eye, Save, X } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

function formatCvName(filename: string): string {
  return filename
    .replace(/^cv_/, "")
    .replace(/\.pdf$/, "")
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CVPage() {
  const [cvList, setCvList] = useState<string[]>([]);
  const [selectedCv, setSelectedCv] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"pdf" | "edit">("pdf");
  const [mdContent, setMdContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
      },
    },
  });

  const fetchCvList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cvs");
      const data = await res.json();
      setCvList(data.cvs || []);
      if (data.cvs?.length > 0 && !selectedCv) {
        setSelectedCv(data.cvs[data.cvs.length - 1]);
      }
    } catch (error) {
      console.error("Failed to fetch CVs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMdContent = useCallback(async () => {
    if (!selectedCv) return;
    const mdFile = selectedCv.replace(".pdf", ".md");
    try {
      const res = await fetch(`/api/cvs/${encodeURIComponent(mdFile)}/content`);
      if (res.ok) {
        const data = await res.json();
        setMdContent(data.content || "");
        if (editor) {
          editor.commands.setContent(markdownToHtml(data.content || ""));
        }
      }
    } catch (error) {
      console.error("Failed to fetch MD:", error);
    }
  }, [selectedCv, editor]);

  const markdownToHtml = (md: string): string => {
    if (!md) return "<p></p>";
    return md
      .split("\n")
      .map((line) => {
        if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
        if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
        if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
        if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
        if (line.startsWith("* ")) return `<li>${line.slice(2)}</li>`;
        if (line.startsWith("---")) return "<hr>";
        if (line.trim() === "") return "<p></p>";
        line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        line = line.replace(/\*(.+?)\*/g, "<em>$1</em>");
        return `<p>${line}</p>`;
      })
      .join("");
  };

  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<h1>(.*?)<\/h1>/g, "# $1\n")
      .replace(/<h2>(.*?)<\/h2>/g, "## $1\n")
      .replace(/<h3>(.*?)<\/h3>/g, "### $1\n")
      .replace(/<li>(.*?)<\/li>/g, "- $1\n")
      .replace(/<hr>/g, "---\n")
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<em>(.*?)<\/em>/g, "*$1*")
      .replace(/<p>(.*?)<\/p>/g, "$1\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n\n+/g, "\n\n")
      .trim();
  };

  useEffect(() => {
    fetchCvList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCv) {
      setPdfUrl(`/api/cvs/${encodeURIComponent(selectedCv)}`);
      if (viewMode === "edit") {
        fetchMdContent();
      }
    } else {
      setPdfUrl("");
    }
  }, [selectedCv, viewMode, fetchMdContent]);

  const handleDownload = () => {
    if (selectedCv) {
      window.open(`/api/cvs/${encodeURIComponent(selectedCv)}?download=true`, "_blank");
    }
  };

  const handleSave = async () => {
    if (!editor || !selectedCv) return;
    setIsSaving(true);

    try {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      const mdFile = selectedCv.replace(".pdf", ".md");

      const res = await fetch(`/api/cvs/${encodeURIComponent(mdFile)}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: markdown }),
      });

      if (res.ok) {
        setMdContent(markdown);
        // Regenerate PDF
        await fetch("/api/regenerate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: selectedCv.replace(".pdf", "") }),
        });
        // Refresh to show new PDF
        setPdfUrl("");
        setTimeout(() => {
          setPdfUrl(`/api/cvs/${encodeURIComponent(selectedCv)}?t=${Date.now()}`);
        }, 500);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const switchToEdit = () => {
    fetchMdContent();
    setViewMode("edit");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <select
              value={selectedCv}
              onChange={(e) => setSelectedCv(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer min-w-[280px] transition-all hover:bg-gray-100"
              disabled={cvList.length === 0}
            >
              {cvList.length === 0 ? (
                <option>No CVs available</option>
              ) : (
                cvList.map((cv) => (
                  <option key={cv} value={cv}>
                    {formatCvName(cv)}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-transform group-hover:text-gray-700" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode("pdf")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "pdf"
                  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              onClick={switchToEdit}
              disabled={!selectedCv}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "edit"
                  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700"
                } disabled:opacity-50`}
            >
              <Edit3 size={16} />
              Edit
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === "edit" && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary"
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save & Regenerate"}
              </button>
              <button
                onClick={() => setViewMode("pdf")}
                className="btn btn-ghost"
              >
                <X size={18} />
                Cancel
              </button>
            </>
          )}

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <button
            onClick={fetchCvList}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
            title="Refresh list"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            <span className="sr-only">Refresh</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!selectedCv}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-white text-indigo-600 border border-indigo-100 shadow-sm hover:bg-indigo-50 hover:border-indigo-200"
            title="Download PDF"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-auto p-8">
        {selectedCv && pdfUrl ? (
          viewMode === "pdf" ? (
            <div className="max-w-6xl mx-auto h-full flex flex-col">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 relative group transition-all hover:shadow-md">
                <iframe
                  src={pdfUrl + "#toolbar=0&navpanes=0&view=FitH"}
                  className="w-full h-full border-0"
                  title="CV Preview"
                />
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto h-full">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 min-h-full">
                <EditorContent
                  editor={editor}
                  className="prose prose-slate max-w-none focus:outline-none"
                />
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 max-w-lg transition-all hover:shadow-md">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <FileText size={48} className="text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">No CV Selected</h2>
              <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                Use the chat to create a tailored CV for any job position, or select an existing one from the dropdown.
              </p>
              <div className="bg-gray-50 rounded-xl p-6 text-left border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Try asking the agent:</p>
                <div className="flex items-center gap-3 text-indigo-600 font-medium bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-100">
                  <span className="text-xl">✨</span>
                  "Create a CV for Senior Product Manager at Google"
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
