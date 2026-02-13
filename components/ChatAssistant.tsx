import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { createChatSession, sendMessageToChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useRealtimeDatabase } from '../hooks/useRealtimeDatabase';
import { useAuth } from '../contexts/AuthContext';

const ChatAssistant: React.FC = () => {
  const { user } = useAuth();
  const chatPath = user ? `chats/${user.uid}/messages` : `chats/anonymous/messages`;
  const { data: remoteMessages, pushData } = useRealtimeDatabase<Record<string, ChatMessage>>(chatPath);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (remoteMessages) {
      const msgs = Object.values(remoteMessages);
      setMessages(msgs);
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: "Namaste! I'm your TrustServe Assistant. I can help you book services in English, Hindi or Hinglish. How can I help you today?"
        }
      ]);
    }
  }, [remoteMessages]);

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

    setInput('');
    setIsLoading(true);

    try {
      // Step 1: Push user message
      await pushData(userMsg);

      // Step 2: Get AI response
      if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession();
      }

      const responseText = await sendMessageToChat(chatSessionRef.current, userText);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };

      // Step 3: Push bot message
      await pushData(botMsg);

    } catch (error) {
      console.error("Chat Error Handled:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having a bit of trouble right now. Please try again or book directly from the Services page.",
        isError: true
      };
      await pushData(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all hover:shadow-2xl">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold block leading-none">TrustServe AI</span>
            <span className="text-[10px] text-indigo-100 uppercase tracking-widest font-medium">Multi-lingual Assistant</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-xs font-medium text-indigo-100">Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
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
            placeholder="Search for cleaning, plumbing..."
            className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-center gap-4 mt-3">
          <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full tracking-wide">ENGLISH</span>
          <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full tracking-wide">HINDI (हिंदी)</span>
          <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full tracking-wide">HINGLISH</span>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
