import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, X } from 'lucide-react';
import { createChatSession, sendMessageToChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const ChatAssistant: React.FC = () => {
  const { user } = useAuth();

  // Use Firestore for chat history
  const { data: remoteMessages, add: addRemoteMessage, error: firestoreError } = useFirestoreCollection<ChatMessage>(
    'chat_messages',
    where('userId', '==', user?.uid || 'anonymous')
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(!!import.meta.env.VITE_GEMINI_API_KEY);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (remoteMessages && remoteMessages.length > 0) {
      // Sort locally to avoid needing a Firestore index
      const sorted = [...remoteMessages].sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });
      setMessages(sorted);
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: hasApiKey
            ? "Namaste! I'm your TrustServe Assistant. I can help you book services in English, Hindi or Hinglish. How can I help today?"
            : "⚠️ API Key Missing: Please add your VITE_GEMINI_API_KEY to the .env.local file to enable the AI assistant."
        }
      ]);
    }
  }, [remoteMessages, hasApiKey]);

  useEffect(() => {
    if (!chatSessionRef.current) {
      try {
        chatSessionRef.current = createChatSession();
      } catch (e) {
        console.error("Failed to init chat session:", e);
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText };

    // Optimistic Update: Show message immediately
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      console.log("GPT DEBUG: Step 1 - Pushing user message to Firestore...");
      await addRemoteMessage({
        ...userMsg,
        userId: user?.uid || 'anonymous',
        createdAt: serverTimestamp()
      });

      console.log("GPT DEBUG: Step 2 - Calling Gemini API...");
      if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession();
      }

      const responseText = await sendMessageToChat(chatSessionRef.current, userText, user?.uid);
      console.log("GPT DEBUG: Step 3 - AI Responded:", responseText.substring(0, 30) + "...");

      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };

      console.log("GPT DEBUG: Step 4 - Pushing AI reply to Firestore...");
      await addRemoteMessage({
        ...botMsg,
        userId: user?.uid || 'anonymous',
        createdAt: serverTimestamp()
      });

    } catch (error: any) {
      console.error("Chat Error Handled:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: error.message === "Firestore Timeout" || error.message === "Database Timeout"
          ? "Database connection timed out. Please check your internet."
          : "I'm having a bit of trouble right now. Please try again later.",
        isError: true
      };

      // If db fails, at least show error locally
      setMessages(prev => [...prev, errorMsg]);

      // Try to push error but don't hang on it
      addRemoteMessage({
        ...errorMsg,
        userId: user?.uid || 'anonymous',
        createdAt: serverTimestamp()
      }).catch(() => { });
    } finally {
      setIsLoading(false);
      console.log("GPT DEBUG: handleSend completed.");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      {/* Chat Window */}
      {isOpen && (
        <div className="flex flex-col w-[380px] sm:w-[420px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold block leading-none">TrustServe AI</span>
                <span className="text-[10px] text-indigo-100 uppercase tracking-widest font-medium">Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {firestoreError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-100 mb-4">
                Connection Error: {firestoreError}
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                    } ${msg.isError ? 'bg-red-50 text-red-600 border-red-100' : ''}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={hasApiKey ? "Search for cleaning, plumbing..." : "AI Assistant disabled (API Key missing)"}
                disabled={!hasApiKey || isLoading}
                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !hasApiKey}
                className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center items-center gap-4 mt-3">
              <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full tracking-wide">ENGLISH</span>
              <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full tracking-wide">HINDI (हिंदी)</span>
              <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full tracking-wide">HINGLISH</span>
              <button
                onClick={async () => {
                  alert("Testing API Connectivity...");
                  try {
                    if (!chatSessionRef.current) chatSessionRef.current = createChatSession();
                    const res = await sendMessageToChat(chatSessionRef.current, "Ping");
                    alert("API Success: " + res.substring(0, 50));
                  } catch (e: any) {
                    alert("API Fail: " + e.message);
                  }
                }}
                className="text-[10px] text-indigo-400 hover:text-indigo-600 underline font-medium"
              >
                Debug API
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <Bot className="w-7 h-7 text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatAssistant;
