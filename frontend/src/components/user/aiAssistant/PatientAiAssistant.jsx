import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  FileText,
  ExternalLink,
  Bot,
  User,
  HeartPulse,
} from "lucide-react";
import { recordsApi } from "../../../api/recordsApi";
import { aiApi } from "../../../api/aiApi";
import ReportDetailModal from "../userReports/ReportDetailModal";

const PATIENT_QUICK_PROMPTS = [
  "Explain any abnormal or flagged values in my reports.",
  "Summarize my latest blood test results & hemoglobin.",
  "What was my cholesterol level and is it high?",
  "Compare my latest test results with previous reports.",
];

/**
 * Safely renders clinical markdown (bold **text**, bullet points, numbered lists)
 */
const renderFormattedClinicalText = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pIdx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
      return (
        <div key={lIdx} className="flex items-start gap-2 my-1 ml-1 text-slate-800">
          <span className="text-blue-600 font-bold leading-5">•</span>
          <span className="leading-relaxed flex-1">
            {trimmed.slice(2).split(/(\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
              if (sub.startsWith("**") && sub.endsWith("**")) {
                return (
                  <strong key={sIdx} className="font-semibold text-slate-900">
                    {sub.slice(2, -2)}
                  </strong>
                );
              }
              return sub;
            })}
          </span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+\.)\s*(.*)$/);
      return (
        <div key={lIdx} className="flex items-start gap-2 my-1 ml-1 text-slate-800">
          <span className="text-blue-600 font-bold leading-5 shrink-0">{numMatch?.[1]}</span>
          <span className="leading-relaxed flex-1">
            {numMatch?.[2].split(/(\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
              if (sub.startsWith("**") && sub.endsWith("**")) {
                return (
                  <strong key={sIdx} className="font-semibold text-slate-900">
                    {sub.slice(2, -2)}
                  </strong>
                );
              }
              return sub;
            })}
          </span>
        </div>
      );
    }

    if (trimmed === "") {
      return <div key={lIdx} className="h-2" />;
    }

    return (
      <p key={lIdx} className="my-1 leading-relaxed">
        {formattedLine}
      </p>
    );
  });
};

const PatientAiAssistant = () => {
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  // Q&A Conversation History for this session
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your MediVault AI Assistant. I analyze your uploaded medical reports to answer questions in simple terms, explain clinical biomarkers, and help you understand your health trends.",
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Modal for report preview from citations
  const [previewReport, setPreviewReport] = useState(null);

  useEffect(() => {
    fetchPatientReports();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchPatientReports = async () => {
    setLoadingReports(true);
    try {
      const data = await recordsApi.getPatientRecords();
      setReports(data?.records || []);
    } catch (err) {
      console.warn("Could not fetch reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleAsk = async (textToSend) => {
    const userText = (textToSend || query).trim();
    if (!userText || loading) return;

    setQuery("");
    setError("");

    const newMsg = {
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const payload = {
        question: userText,
        topK: 6,
      };

      const res = await aiApi.patientAsk(payload);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.answer,
          status: res.status,
          sources: res.sources || [],
          disclaimer: res.disclaimer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setError(err.message || "Failed to process inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: "ai",
        text: `Conversation reset. I am ready to answer questions across all ${reports.length} of your medical reports.`,
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setError("");
  };

  const handleOpenSourceReport = (source) => {
    const matching = reports.find(
      (r) =>
        (r._id && r._id.toString() === source.recordId?.toString()) ||
        r.title?.toLowerCase() === source.reportTitle?.toLowerCase()
    );

    if (matching) {
      setPreviewReport(matching);
    } else {
      setPreviewReport({
        _id: source.recordId,
        title: source.reportTitle || "Medical Report",
        reportDate: source.reportDate || "Recent",
        fileUrl: "",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-130px)] min-h-[560px]">
      {/* Clean Minimal Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-3 shadow-xs shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <HeartPulse size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                AI Health Assistant
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <ShieldCheck size={12} />
                Private & Secure
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {loadingReports ? (
                "Connecting to health vault..."
              ) : (
                <>
                  Covering <strong className="text-slate-700 font-semibold">{reports.length}</strong> medical {reports.length === 1 ? "report" : "reports"} in your vault
                </>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
          title="Reset conversation"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col flex-1 overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Bot size={17} />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {isUser ? "You" : "MediVault AI"}
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? "bg-blue-600 text-white rounded-tr-xs shadow-xs"
                        : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs shadow-2xs"
                    }`}
                  >
                    {isUser ? msg.text : renderFormattedClinicalText(msg.text)}

                    {/* Clinical Guidance Disclaimer */}
                    {!isUser && msg.disclaimer && (
                      <div className="mt-3 pt-2 text-[11px] text-slate-400 italic border-t border-slate-200/40">
                        {msg.disclaimer}
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking / Streaming Indicator */}
          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Reviewing your medical reports & preparing answer...
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills (Shown when conversation is short) */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
              Suggested Questions:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PATIENT_QUICK_PROMPTS.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleAsk(prompt)}
                  disabled={loading}
                  className="text-left text-xs text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unified Bottom Chat Input */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your reports, test results, or medical values..."
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-medium text-sm transition flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Answers cite exact report names and page numbers. Consult your physician for medical advice.
          </p>
        </div>
      </div>

      {/* PDF Report Preview Modal */}
      {previewReport && (
        <ReportDetailModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onRefresh={fetchPatientReports}
        />
      )}
    </div>
  );
};

export default PatientAiAssistant;
