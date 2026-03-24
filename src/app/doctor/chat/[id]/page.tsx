'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import DoctorProtectedRoute from '@/components/DoctorProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, Loader2, XCircle, Stethoscope, UserCheck, Clock } from 'lucide-react';

type Message = {
  id: number;
  chat_id: number;
  sender_id: number;
  message: string;
  created_at: string;
  sender: { id: number; name: string; role: string };
};

type Chat = {
  id: number;
  status: 'waiting' | 'active' | 'closed';
  user: { id: number; name: string };
  doctor: { id: number; name: string } | null;
};

export default function DoctorChatRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/chat/${id}/messages`);
      setChat(res.data.chat);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load + 3-second polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await api.post(`/chat/${id}/send`, { message: text });
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };
  
  const acceptConsultation = async () => {
    setAccepting(true);
    try {
      await api.post(`/chat/${id}/accept`);
      await fetchMessages();
    } catch (err) {
      console.error('Failed to accept chat', err);
    } finally {
      setAccepting(false);
    }
  };

  const closeConsultation = async () => {
    setClosing(true);
    try {
      await api.post(`/chat/${id}/close`);
      router.push('/doctor/dashboard');
    } catch (err) {
      console.error('Failed to close chat', err);
      setClosing(false);
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <DoctorProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Navbar */}
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/doctor/dashboard"
                className="p-2 -ml-2 text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  <span className="font-serif text-foreground">
                    {loading ? 'Loading…' : `Consultation with ${chat?.user?.name ?? 'Patient'}`}
                  </span>
                </div>
                {chat && (
                  <span className={`text-[10px] uppercase tracking-widest font-medium ${
                    chat.status === 'active' ? 'text-green-500' :
                    chat.status === 'waiting' ? 'text-amber-500' : 'text-foreground/40'
                  }`}>
                    {chat.status}
                  </span>
                )}
              </div>
            </div>

            {chat?.status === 'waiting' && (
              <button
                onClick={acceptConsultation}
                disabled={accepting}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary hover:text-primary/80 transition-colors font-medium border border-primary/20 px-4 py-2 rounded-lg bg-primary/5"
              >
                {accepting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Stethoscope className="w-3 h-3" />}
                Accept Consultation
              </button>
            )}

            {chat?.status === 'active' && (
              <button
                onClick={closeConsultation}
                disabled={closing}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
              >
                {closing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                Close Consultation
              </button>
            )}
          </div>
        </nav>

        {/* Chat body */}
        <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="glass-panel rounded-2xl flex flex-col overflow-hidden shadow-xl shadow-black/5 border border-border/50 flex-1">
              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white/20 min-h-0 max-h-[calc(100vh-280px)]">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-foreground/40 font-light text-sm">
                      No messages yet. Say hello to your patient!
                    </p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isDoctor = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex flex-col gap-1 max-w-[75%]">
                        <span className={`text-[10px] uppercase tracking-widest text-foreground/40 ${isDoctor ? 'text-right' : ''}`}>
                          {isDoctor ? 'You (Doctor)' : msg.sender?.name ?? 'Patient'}
                        </span>
                        <div className={`px-5 py-4 rounded-2xl ${
                          isDoctor
                            ? 'bg-primary text-white rounded-tr-sm'
                            : 'bg-white text-foreground rounded-tl-sm border border-black/5 shadow-sm'
                        }`}>
                          <p className="text-sm leading-relaxed font-light">{msg.message}</p>
                        </div>
                        <span className={`text-[10px] text-foreground/30 ${isDoctor ? 'text-right' : ''}`}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              
              {/* Doctor Joining Promo */}
              {chat?.status === 'waiting' && (
                <div className="p-8 border-t border-amber-100 bg-amber-50/30 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
                   <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-4">
                      <Clock className="w-6 h-6" />
                   </div>
                   <h3 className="text-lg font-serif text-foreground mb-2">Joining Queue</h3>
                   <p className="text-sm text-foreground/50 font-light max-w-sm mx-auto mb-6">
                      This patient is currently waiting for a specialist. Accept the request to start the live consultation.
                   </p>
                   <button
                     onClick={acceptConsultation}
                     disabled={accepting}
                     className="px-8 py-3 bg-primary text-white text-xs font-medium tracking-widest uppercase rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mx-auto"
                   >
                     {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                     Accept Patient & Connect
                   </button>
                </div>
              )}

              {/* Input */}
              {chat?.status === 'closed' ? (
                <div className="p-4 border-t border-border bg-secondary/30 text-center">
                  <p className="text-xs uppercase tracking-widest text-foreground/40">Consultation closed</p>
                </div>
              ) : (
                <div className="p-4 border-t border-border bg-white/60 backdrop-blur-md">
                  <form onSubmit={sendMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      disabled={sending}
                      className="flex-1 bg-white border border-border/70 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm font-light transition-all"
                    />
                    <button
                      type="submit"
                      disabled={sending || !input.trim()}
                      className="px-5 py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-sm flex items-center gap-2"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DoctorProtectedRoute>
  );
}
