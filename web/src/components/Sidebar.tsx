"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, User, Send, Trash2, Loader2, Zap, MessageSquare } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch("http://localhost:2024/info")
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false));
  }, []);

  const currentContext = pathname === "/profile" ? "profile" : "cv";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: currentContext,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "Done." },
      ]);

      // If profile was updated, store flag and emit event
      if (data.profileUpdated) {
        console.log('Profile updated detected, emitting event...');
        sessionStorage.setItem('profileNeedsRefresh', 'true');
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      }

      setIsConnected(true);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Failed to connect to agent. Make sure LangGraph is running on port 2024." },
      ]);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <aside className="w-[360px] bg-white flex flex-col h-screen border-r border-gray-200 shadow-[2px_0_24px_-12px_rgba(0,0,0,0.05)] z-10">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-md">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 tracking-tight">CV Agent</h1>
            <p className="text-xs text-gray-500 font-medium">AI-Powered CV Builder</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex bg-gray-100/50 p-1 rounded-xl">
          <Link
            href="/"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${pathname === "/"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
          >
            <FileText size={16} />
            <span>CV</span>
          </Link>
          <Link
            href="/profile"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${pathname === "/profile"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
          >
            <User size={16} />
            <span>Profile</span>
          </Link>
        </nav>
      </div>

      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <MessageSquare size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-sm">Assistant Chat</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>
          <button
            onClick={clearChat}
            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
            title="Clear chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30">
        {messages.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Send size={20} className="text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-2">Start a conversation</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Ask me to help you create or tailor your CV.
              <br />
              <span className="text-xs mt-2 block bg-white px-3 py-2 rounded-lg border border-gray-100 text-indigo-600 font-mono">
                "Create a CV for PM at Google"
              </span>
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
                : "bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-tl-sm"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 text-gray-400 rounded-tl-sm shadow-sm">
              <Loader2 size={16} className="animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg text-white transition-all shadow-sm"
          >
            <Send size={16} />
          </button>
        </form>
        <div className="mt-2 text-center">
          <span className="text-[10px] text-gray-400 font-medium">
            {currentContext === "profile" ? "Using Profile Context" : "Using CV Context"}
          </span>
        </div>
      </div>
    </aside>
  );
}

