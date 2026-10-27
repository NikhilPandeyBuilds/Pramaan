import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  action?: {
    label: string;
    path: string;
  };
}

export const HelpAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello! I am your Pramaan Portal Assistant. How can I help you navigate the approval portal today?',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickTopics = [
    {
      title: 'How to submit an Application',
      query: 'How do I submit an application?',
      answer: 'To submit an application, go to "Applications" -> "New Application". Fill in your college details, select your approval category (EoA), enter intake numbers, attach required documents, and click "Create & Submit".',
      action: { label: 'Open New Application', path: '/applications/new' },
    },
    {
      title: 'Mandatory Documents Needed',
      query: 'What documents do I need to upload?',
      answer: 'Standard submissions require: 1) Previous Year AICTE Approval Letter (EoA), 2) Land & Fire Safety NOC from municipal authority, 3) NBA Accreditation Certificate (if claiming accredited intake benefits), and 4) Sanctioned Faculty List.',
      action: { label: 'View All Applications', path: '/applications' },
    },
    {
      title: 'Why is an Issue Flagged?',
      query: 'Why is my application flagged with an issue?',
      answer: 'Pramaan checks uploaded documents for expired validity dates, mismatched college codes, and registry records. If an issue is flagged, open the application, view the "Issues & Findings" tab, and upload a corrected document.',
      action: { label: 'Check Applications', path: '/applications' },
    },
    {
      title: 'External Board Verification',
      query: 'How does External Board verification work?',
      answer: 'Pramaan connects directly with official registries like the National Board of Accreditation (NBA) and State Technical Directorates to verify reference numbers in real time without manual paperwork.',
      action: { label: 'View Verification Hub', path: '/verification' },
    },
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || query).trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery('');

    // Generate intelligent response
    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = "I'm here to help. You can browse applications, upload supporting documents, or check approval guidelines using the top navigation.";
      let action: { label: string; path: string } | undefined = undefined;

      if (lower.includes('new') || lower.includes('create') || lower.includes('apply')) {
        reply = 'You can start a new institutional application anytime through the New Application wizard.';
        action = { label: 'Create New Application', path: '/applications/new' };
      } else if (lower.includes('document') || lower.includes('upload') || lower.includes('pdf')) {
        reply = 'You can upload documents in PDF, PNG, or JPG format (up to 25MB) directly inside any application dossier under the "Documents" tab.';
        action = { label: 'View Applications', path: '/applications' };
      } else if (lower.includes('rule') || lower.includes('handbook') || lower.includes('aph') || lower.includes('guideline')) {
        reply = 'Official approval criteria are mapped directly to the AICTE Approval Process Handbook (APH 2026-27). You can inspect all active rules in the Approval Rules section.';
        action = { label: 'View Approval Rules', path: '/admin/rules' };
      } else if (lower.includes('verify') || lower.includes('nba') || lower.includes('board') || lower.includes('external')) {
        reply = 'External board checks verify NBA accreditation status and state approvals against official databases in real time.';
        action = { label: 'Go to External Verification', path: '/verification' };
      } else if (lower.includes('audit') || lower.includes('history') || lower.includes('report') || lower.includes('download')) {
        reply = 'Every verification, upload, and review action is logged chronologically. You can download official PDF reports from the Activity Log & Reports page.';
        action = { label: 'View Activity Log & Reports', path: '/audit' };
      } else if (lower.includes('status') || lower.includes('pending') || lower.includes('review')) {
        reply = 'Applications with "Pending Review" status are awaiting officer inspection. You can view all cases from the Applications directory.';
        action = { label: 'View Applications', path: '/applications' };
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: reply,
        action,
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  const handleQuickSelect = (item: typeof quickTopics[0]) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: item.query,
    };
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: item.answer,
      action: item.action,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 hover:from-blue-950 hover:to-slate-900 text-white rounded-full shadow-xl shadow-slate-950/30 border border-amber-400/30 transition-all transform hover:scale-105 cursor-pointer font-sans"
        aria-label="Open Assistant"
      >
        <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        </div>
        <span className="text-xs font-bold tracking-wide">Pramaan Assistant</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
      </button>

      {/* Slide-in Assistant Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-900 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Pramaan Assistant</h3>
                  <p className="text-[11px] text-slate-300">AICTE Navigation & Regulatory Guide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Topic Buttons */}
            <div className="p-3 bg-slate-100/70 border-b border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Frequently Asked Questions:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {quickTopics.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickSelect(item)}
                    className="p-2 text-left bg-white hover:bg-blue-50/70 border border-slate-200 rounded-lg text-[11px] text-slate-700 hover:text-blue-700 transition leading-snug cursor-pointer font-medium"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.action && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(m.action!.path);
                        setIsOpen(false);
                      }}
                      className="mt-1.5 inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition cursor-pointer"
                    >
                      <span>{m.action.label}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about approvals, rules, documents..."
                  className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs cursor-pointer shrink-0"
                  title="Send Question"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Pramaan Assistant • AICTE Approval Process AY 2026-27
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
