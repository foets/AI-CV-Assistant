"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Save, X, Download, Upload, Edit3, Eye, UserCircle, Loader2, RefreshCw } from "lucide-react";

export default function ProfilePage() {
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing your profile information...",
      }),
    ],
    content: "",
    editable: true,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
      },
    },
  });

  const markdownToHtml = useCallback((md: string): string => {
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
        line = line.replace(/_(.+?)_/g, "<em>$1</em>");
        return `<p>${line}</p>`;
      })
      .join("");
  }, []);

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

  // Refresh PDF preview with cache busting
  const refreshPdf = useCallback(() => {
    setPdfLoading(true);
    setPdfUrl(`/api/profile/pdf?regenerate=true&t=${Date.now()}`);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      const newContent = data.content || "";
      setContent(newContent);
      setIsLoaded(true);
      // Refresh PDF when content is fetched
      refreshPdf();
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setIsLoaded(true);
    }
  }, [refreshPdf]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Listen for profile refresh events from chat
  useEffect(() => {
    const handleRefresh = () => {
      fetchProfile();
    };

    window.addEventListener('profileRefresh', handleRefresh);

    return () => {
      window.removeEventListener('profileRefresh', handleRefresh);
    };
  }, [fetchProfile]);

  // Update editor content when switching to edit mode or when content changes
  useEffect(() => {
    if (editor && viewMode === "edit" && content) {
      editor.commands.setContent(markdownToHtml(content));
    }
  }, [editor, viewMode, content, markdownToHtml]);

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);

    try {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: markdown }),
      });

      if (res.ok) {
        setContent(markdown);
        setViewMode("preview");
        // Refresh PDF after saving
        setTimeout(() => refreshPdf(), 100);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setContent(text);
      if (editor) {
        editor.commands.setContent(markdownToHtml(text));
      }
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      // Refresh PDF after upload
      setTimeout(() => refreshPdf(), 100);
    };
    reader.readAsText(file);
  };

  const switchToEdit = () => {
    if (editor) {
      editor.commands.setContent(markdownToHtml(content));
    }
    setViewMode("edit");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Top Bar - Matching CV page structure */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          {/* Profile Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
              <UserCircle size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight leading-tight">My Profile</h1>
              <p className="text-xs text-gray-500 font-medium">Your professional data</p>
            </div>
          </div>

          {/* View Mode Toggle - Same as CV page */}
          <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "preview"
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              onClick={switchToEdit}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "edit"
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Edit3 size={16} />
              Edit
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Edit mode actions */}
          {viewMode === "edit" && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={18} />
                Cancel
              </button>
            </>
          )}

          <div className="h-6 w-px bg-gray-200 mx-2" />

          {/* Refresh button */}
          <button
            onClick={refreshPdf}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
            title="Refresh preview"
          >
            <RefreshCw size={18} className={pdfLoading ? "animate-spin" : ""} />
            <span className="sr-only">Refresh</span>
          </button>

          {/* Import/Export buttons */}
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 cursor-pointer" title="Upload markdown file">
            <input
              type="file"
              accept=".md,.txt"
              onChange={handleUpload}
              className="hidden"
            />
            <Upload size={18} />
            <span className="hidden sm:inline">Import</span>
          </label>

          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
            title="Download as markdown"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-auto p-8">
        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-200" />
            <p className="text-sm font-medium">Loading profile data...</p>
          </div>
        ) : viewMode === "preview" ? (
          /* Preview Mode - PDF iframe like CV page */
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 relative group transition-all hover:shadow-md">
              {pdfLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                  <Loader2 size={32} className="animate-spin text-indigo-400" />
                  <p className="text-sm text-gray-500 mt-3">Generating preview...</p>
                </div>
              )}
              <iframe
                src={pdfUrl + "#toolbar=0&navpanes=0&view=FitH"}
                className="w-full h-full border-0"
                title="Profile Preview"
                onLoad={() => setPdfLoading(false)}
              />
            </div>
          </div>
        ) : (
          /* Edit Mode - TipTap editor */
          <div className="max-w-4xl mx-auto h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 min-h-full ring-2 ring-indigo-500/10 shadow-md">
              <EditorContent
                editor={editor}
                className="prose prose-slate max-w-none focus:outline-none"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


