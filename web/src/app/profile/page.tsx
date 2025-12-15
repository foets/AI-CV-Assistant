"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Save, RotateCcw, Download, Upload, Edit3, UserCircle, Check, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing your profile information...",
      }),
    ],
    content: "",
    editable: isEditing,
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

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setContent(data.content || "");
      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Check if profile needs refresh from previous updates
    const needsRefresh = sessionStorage.getItem('profileNeedsRefresh') === 'true';
    if (needsRefresh) {
      sessionStorage.removeItem('profileNeedsRefresh');
      // Small delay to ensure any pending updates are complete
      setTimeout(() => fetchProfile(), 100);
    } else {
      fetchProfile();
    }
  }, [fetchProfile]);

  // Listen for real-time profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      // Refresh profile data immediately when updated via chat
      fetchProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchProfile]);

  // Listen for profile update events from chat
  useEffect(() => {
    const handleProfileUpdate = () => {
      // Refresh profile data when chat updates it
      fetchProfile();
    };

    // Check if profile was updated while we were away (on page focus/visibility)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const lastUpdated = localStorage.getItem('profileLastUpdated');
        if (lastUpdated) {
          const lastUpdateTime = parseInt(lastUpdated);
          const now = Date.now();
          // If updated in the last 10 seconds, refresh
          if (now - lastUpdateTime < 10000) {
            fetchProfile();
            // Clear the timestamp to avoid repeated refreshes
            localStorage.removeItem('profileLastUpdated');
          }
        }
      }
    };

    // Listen for real-time updates
    window.addEventListener('profileUpdated', handleProfileUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile]);

  useEffect(() => {
    if (editor && isLoaded && content) {
      editor.commands.setContent(markdownToHtml(content));
    }
  }, [editor, isLoaded, content, markdownToHtml]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

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
        setLastSaved(new Date());
        setIsEditing(false);
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
      setLastSaved(new Date());
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
              <UserCircle size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight leading-tight">My Profile</h1>
              <p className="text-xs text-gray-500 font-medium">Manage your personal data</p>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${isEditing ? "bg-amber-50 text-amber-700 ring-amber-600/20" : "bg-gray-50 text-gray-600 ring-gray-500/10"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? "bg-amber-500" : "bg-gray-400"}`} />
              {isEditing ? "Editing Mode" : "View Mode"}
            </span>
            {lastSaved && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Check size={12} />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
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
                onClick={() => {
                  setIsEditing(false);
                  if (editor) {
                    editor.commands.setContent(markdownToHtml(content));
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
              >
                <RotateCcw size={18} />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Edit3 size={18} />
              Edit Profile
            </button>
          )}

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 cursor-pointer" title="Upload markdown file">
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
            title="Download as markdown"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 overflow-auto p-8">
        <div className={`max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-12 min-h-full transition-all duration-300 ${isEditing ? "ring-2 ring-indigo-500/10 shadow-md" : ""}`}>
          {!isLoaded ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
              <Loader2 size={32} className="animate-spin text-indigo-200" />
              <p className="text-sm font-medium">Loading profile data...</p>
            </div>
          ) : (
            <EditorContent
              editor={editor}
              className="prose prose-slate max-w-none focus:outline-none"
            />
          )}
        </div>
      </main>
    </div>
  );
}


