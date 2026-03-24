'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import DoctorProtectedRoute from '@/components/DoctorProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
  Stethoscope, Clock, CheckCircle2, XCircle, MessageSquare,
  RefreshCw, UserCheck, Loader2, LogOut
} from 'lucide-react';

type Chat = {
  id: number;
  user_id: number;
  doctor_id: number | null;
  status: 'waiting' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
  user: { id: number; name: string; email: string };
};

type ChatsState = {
  waiting: Chat[];
  active: Chat[];
  closed: Chat[];
};

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatsState>({ waiting: [], active: [], closed: [] });
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get('/doctor/chats');
      setChats(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch chats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 5-second polling
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  const acceptChat = async (chatId: number) => {
    setAccepting(chatId);
    try {
      await api.post(`/chat/${chatId}/accept`);
      await fetchChats();
      router.push(`/doctor/chat/${chatId}`);
    } catch (err) {
      console.error('Failed to accept chat', err);
    } finally {
      setAccepting(null);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <DoctorProtectedRoute>
      <div className="min-h-screen pb-16">
        {/* Navbar */}
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg font-semibold tracking-widest uppercase text-foreground">
                Doctor Panel
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-foreground/60 font-light">
                Dr. {user?.name}
              </span>
              <Link href="/dashboard" className="text-xs tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors">
                Patient View
              </Link>
              <button
                onClick={logout}
                className="text-xs tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 mt-10">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <h1 className="text-4xl font-serif text-foreground mb-1">Consultation Queue</h1>
              <p className="text-foreground/50 font-light">
                {lastUpdated
                  ? `Last refreshed at ${lastUpdated.toLocaleTimeString()}`
                  : 'Loading...'}
              </p>
            </div>
            <button
              onClick={fetchChats}
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ── Waiting Column ── */}
              <div>
                <h2 className="text-xs font-semibold tracking-widest uppercase text-foreground/40 mb-5 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Waiting ({chats.waiting.length})
                </h2>
                <div className="space-y-4">
                  {chats.waiting.length === 0 ? (
                    <div className="glass-panel p-6 rounded-xl text-center border-dashed">
                      <p className="text-sm text-foreground/40 font-light">No waiting patients</p>
                    </div>
                  ) : (
                    chats.waiting.map((chat) => (
                      <div key={chat.id} className="glass-panel p-5 rounded-xl border border-amber-100 bg-amber-50/30">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-foreground text-sm">{chat.user.name}</p>
                            <p className="text-xs text-foreground/40 font-light">{chat.user.email}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Waiting
                          </span>
                        </div>
                        <p className="text-xs text-foreground/40 mb-4">{timeAgo(chat.created_at)}</p>
                        <button
                          onClick={() => acceptChat(chat.id)}
                          disabled={accepting === chat.id}
                          className="w-full py-2.5 btn-primary text-xs rounded-lg flex items-center justify-center gap-2"
                        >
                          {accepting === chat.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          Accept Consultation
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── Active Column ── */}
              <div>
                <h2 className="text-xs font-semibold tracking-widest uppercase text-foreground/40 mb-5 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Active ({chats.active.length})
                </h2>
                <div className="space-y-4">
                  {chats.active.length === 0 ? (
                    <div className="glass-panel p-6 rounded-xl text-center border-dashed">
                      <p className="text-sm text-foreground/40 font-light">No active sessions</p>
                    </div>
                  ) : (
                    chats.active.map((chat) => (
                      <div key={chat.id} className="glass-panel p-5 rounded-xl border border-green-100 bg-green-50/20">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-foreground text-sm">{chat.user.name}</p>
                            <p className="text-xs text-foreground/40 font-light">{chat.user.email}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-widest text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-foreground/40 mb-4">Since {timeAgo(chat.updated_at)}</p>
                        <Link
                          href={`/doctor/chat/${chat.id}`}
                          className="w-full py-2.5 bg-foreground text-background text-xs font-medium tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 hover:bg-foreground/80 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Open Chat
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── Closed Column ── */}
              <div>
                <h2 className="text-xs font-semibold tracking-widest uppercase text-foreground/40 mb-5 flex items-center gap-2">
                  <XCircle className="w-3 h-3" />
                  Recently Closed ({chats.closed.length})
                </h2>
                <div className="space-y-4">
                  {chats.closed.length === 0 ? (
                    <div className="glass-panel p-6 rounded-xl text-center border-dashed">
                      <p className="text-sm text-foreground/40 font-light">No closed sessions yet</p>
                    </div>
                  ) : (
                    chats.closed.map((chat) => (
                      <div key={chat.id} className="glass-panel p-5 rounded-xl opacity-70">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-foreground text-sm">{chat.user.name}</p>
                            <p className="text-xs text-foreground/40 font-light">{chat.user.email}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-widest text-foreground/40 px-2 py-0.5 border border-border rounded-full">
                            Closed
                          </span>
                        </div>
                        <p className="text-xs text-foreground/40">{timeAgo(chat.updated_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </DoctorProtectedRoute>
  );
}
