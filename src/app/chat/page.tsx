'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
  MessageSquare, ArrowRight, Loader2, Sparkles,
  UserCheck, Clock, CheckCircle2, XCircle, Send
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

type ViewState = 'selection' | 'ai-chat' | 'consultation';

type ChatSession = {
  id: number;
  status: 'waiting' | 'active' | 'closed';
  doctor: { id: number; name: string } | null;
  user: { id: number; name: string };
};

type Message = {
  id: number;
  sender_id: number;
  message: string;
  created_at: string;
  sender: { id: number; name: string; role: string };
};

export default function ChatConsultant() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewState>('selection');

  // ── AI Chat State ──
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // ── Real Consultation State ──
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [startingConsult, setStartingConsult] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check if user already has an active/waiting consultation on mount
  useEffect(() => {
    const checkExisting = async () => {
      // We try to fetch by starting (it returns existing if one exists)
      // We don't auto-start here — just check by calling start, which is idempotent
    };
    checkExisting();
  }, []);

  // Poll messages when in consultation view
  const fetchMessages = useCallback(async () => {
    if (!session) return;
    try {
      const res = await api.get(`/chat/${session.id}/messages`);
      setSession(res.data.chat);
      setMessages(res.data.messages);
    } catch {}
  }, [session]);

  useEffect(() => {
    if (view !== 'consultation' || !session) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [view, session, fetchMessages]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── AI Chat ──
  const startAiChat = () => {
    setAiMessages([{ role: 'ai', text: 'Hello. I am Aura, your virtual beauty consultant. How can I assist you with your skin today?' }]);
    setView('ai-chat');
  };

  const sendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const text = aiInput.trim();
    setAiMessages(prev => [...prev, { role: 'user', text }]);
    setAiInput('');
    setAiLoading(true);
    try {
      const res = await api.post('/chat', { message: text });
      setAiMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'ai', text: 'Apologies, I am currently unavailable.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Real Consultation ──
  const startConsultation = async () => {
    setStartingConsult(true);
    try {
      const res = await api.post('/chat/start');
      setSession(res.data.chat);
      setView('consultation');
    } catch (err) {
      console.error('Failed to start consultation', err);
    } finally {
      setStartingConsult(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !session) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await api.post(`/chat/${session.id}/send`, { message: text });
      await fetchMessages();
    } catch {}
    finally { setSending(false); }
  };

  const closeConsultation = async () => {
    if (!session) return;
    try {
      await api.post(`/chat/${session.id}/close`);
      setSession(prev => prev ? { ...prev, status: 'closed' } : prev);
    } catch {}
  };

  const statusColor = (s: string) =>
    s === 'active' ? 'text-green-500' : s === 'waiting' ? 'text-amber-500' : 'text-foreground/40';
  const statusLabel = (s: string) =>
    s === 'active' ? 'Connected with doctor' : s === 'waiting' ? 'Waiting for a doctor…' : 'Consultation closed';

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col pb-10">
        {/* Nav */}
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/dashboard" className="text-sm font-medium tracking-widest uppercase text-foreground/60 hover:text-foreground">
              ← Dashboard
            </Link>
            <span className="text-xs uppercase tracking-widest text-foreground font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Consultations
            </span>
          </div>
        </nav>

        <div className="flex-1 max-w-4xl mx-auto w-full px-6 pt-12 flex flex-col">
          
          {/* ── DOCTOR REDIRECT ── */}
          {user?.role === 'doctor' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
               <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-8">
                  <UserCheck className="w-10 h-10" />
               </div>
               <h1 className="text-3xl font-serif text-foreground mb-4">Doctor Access Detected</h1>
               <p className="text-foreground/60 font-light max-w-md mx-auto mb-10 leading-relaxed">
                 You are currently logged in with a doctor account. To manage and respond to patient consultations, please use your dedicated dashboard.
               </p>
               <Link 
                 href="/doctor/dashboard" 
                 className="px-10 py-4 bg-primary text-white font-medium tracking-widest uppercase text-xs rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-3"
               >
                 Go to Doctor Panel <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          )}

          {/* ── SELECTION VIEW (Only for Patients) ── */}
          {user?.role !== 'doctor' && view === 'selection' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-serif text-foreground mb-3">Choose Your Consultation</h1>
                <p className="text-foreground/50 font-light max-w-lg mx-auto">
                  Get instant AI-powered skincare advice, or connect with a real certified specialist.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* AI Card */}
                <button
                  onClick={startAiChat}
                  className="group glass-panel p-10 rounded-2xl text-left border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif text-foreground mb-2">Aura AI Consultant</h3>
                  <p className="text-foreground/60 font-light leading-relaxed mb-8">
                    Instant, data-driven skincare advice. Available 24/7.
                  </p>
                  <span className="text-xs font-medium tracking-widest uppercase text-primary flex items-center gap-2">
                    Start Chat <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* Doctor Consultation Card — INTEGRATION POINT: triggers real API */}
                <button
                  onClick={startConsultation}
                  disabled={startingConsult}
                  className="group glass-panel p-10 rounded-2xl text-left border border-border/50 hover:border-foreground/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-white/40 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground mb-6 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif text-foreground mb-2">Live Doctor Consultation</h3>
                  <p className="text-foreground/60 font-light leading-relaxed mb-8">
                    Connect with a certified dermatologist for personalized clinical advice.
                  </p>
                  <span className="text-xs font-medium tracking-widest uppercase text-foreground flex items-center gap-2">
                    {startingConsult ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Connecting…</>
                    ) : (
                      <>Start Consultation <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── AI CHAT VIEW (Only for Patients) ── */}
          {user?.role !== 'doctor' && view === 'ai-chat' && (
            <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-black/5 animate-in fade-in zoom-in-95 duration-500 border border-border/50" style={{ height: '600px' }}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-white/50 backdrop-blur-sm rounded-t-2xl">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('selection')} className="text-foreground/50 hover:text-foreground transition-colors">←</button>
                  <div>
                    <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
                      Aura Digital Consultant <Sparkles className="w-3 h-3 text-primary" />
                    </h2>
                    <p className="text-xs uppercase tracking-widest text-primary font-medium">AI Engine</p>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/50">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Online
                </span>
              </div>
              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white/20">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-5 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-foreground text-background rounded-tr-sm'
                        : 'bg-white text-foreground rounded-tl-sm border border-black/5 shadow-sm'
                    }`}>
                      <p className="text-sm leading-relaxed font-light">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-5 rounded-2xl rounded-tl-sm border border-black/5 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-foreground/40" />
                    </div>
                  </div>
                )}
              </div>
              {/* Input */}
              <div className="p-4 border-t border-border bg-white/60 backdrop-blur-md">
                <form onSubmit={sendAiMessage} className="flex gap-3">
                  <input
                    type="text" value={aiInput} onChange={e => setAiInput(e.target.value)}
                    placeholder="Type your concern…"
                    className="flex-1 bg-white border border-border/70 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm font-light"
                  />
                  <button
                    type="submit" disabled={aiLoading || !aiInput.trim()}
                    className="px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── REAL CONSULTATION VIEW (Only for Patients) ── */}
          {user?.role !== 'doctor' && view === 'consultation' && session && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4 flex-1">
              {/* Status Banner */}
              <div className="glass-panel rounded-xl p-5 flex items-center justify-between border border-border/50">
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${session.status === 'active' ? 'bg-green-400 animate-pulse' : session.status === 'waiting' ? 'bg-amber-400 animate-pulse' : 'bg-gray-300'}`} />
                  <div>
                    <p className={`text-sm font-medium ${statusColor(session.status)}`}>
                      {statusLabel(session.status)}
                    </p>
                    {session.doctor && (
                      <p className="text-xs text-foreground/50 font-light">Dr. {session.doctor.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('selection')} className="text-xs uppercase tracking-widest text-foreground/50 hover:text-foreground">
                    ← Back
                  </button>
                  {session.status !== 'closed' && (
                    <button
                      onClick={closeConsultation}
                      className="text-xs uppercase tracking-widest text-red-400 hover:text-red-600 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Close
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Panel */}
              <div className="glass-panel rounded-2xl flex flex-col overflow-hidden shadow-xl border border-border/50" style={{ height: '520px' }}>
                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white/20">
                  {messages.length === 0 && session.status === 'waiting' && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                      <Clock className="w-12 h-12 text-amber-300" />
                      <div>
                        <p className="font-serif text-foreground/70">Waiting for a doctor to join…</p>
                        <p className="text-sm text-foreground/40 font-light mt-1">A specialist will accept your request shortly.</p>
                      </div>
                    </div>
                  )}
                  {messages.length === 0 && session.status === 'active' && (
                    <div className="text-center py-8">
                      <p className="text-foreground/40 font-light text-sm">Consultation started. Say hello!</p>
                    </div>
                  )}
                  {messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className="flex flex-col gap-1 max-w-[75%]">
                          <span className={`text-[10px] uppercase tracking-widest text-foreground/40 ${isMe ? 'text-right' : ''}`}>
                            {isMe ? 'You' : `Dr. ${msg.sender?.name}`}
                          </span>
                          <div className={`px-5 py-4 rounded-2xl ${
                            isMe
                              ? 'bg-foreground text-background rounded-tr-sm'
                              : 'bg-white text-foreground rounded-tl-sm border border-black/5 shadow-sm'
                          }`}>
                            <p className="text-sm leading-relaxed font-light">{msg.message}</p>
                          </div>
                          <span className={`text-[10px] text-foreground/30 ${isMe ? 'text-right' : ''}`}>
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                {session.status === 'closed' ? (
                  <div className="p-4 border-t border-border bg-secondary/30 text-center">
                    <CheckCircle2 className="w-4 h-4 text-foreground/30 mx-auto mb-1" />
                    <p className="text-xs uppercase tracking-widest text-foreground/40">Consultation closed</p>
                  </div>
                ) : session.status === 'waiting' ? (
                  <div className="p-4 border-t border-border bg-amber-50/50 text-center">
                    <p className="text-xs text-amber-500 tracking-widest uppercase">Waiting for doctor to join before you can chat</p>
                  </div>
                ) : (
                  <div className="p-4 border-t border-border bg-white/60 backdrop-blur-md">
                    <form onSubmit={sendMessage} className="flex gap-3">
                      <input
                        type="text" value={input} onChange={e => setInput(e.target.value)}
                        placeholder="Type your message…"
                        disabled={sending}
                        className="flex-1 bg-white border border-border/70 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm font-light"
                      />
                      <button
                        type="submit" disabled={sending || !input.trim()}
                        className="px-5 py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-sm"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
