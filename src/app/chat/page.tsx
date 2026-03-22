'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { MessageSquare, ArrowRight, Loader2, Sparkles, UserCheck, Clock, CheckCircle2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

type ViewState = 'selection' | 'ai-chat' | 'doctor-list' | 'doctor-chat';

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  description: string;
  status: 'Available' | 'In Consultation';
  image: string;
};

const DOCTORS: Doctor[] = [
  {
    id: 'dr-evelyn',
    name: 'Dr. Evelyn Thorne',
    specialty: 'Board Certified Dermatologist',
    description: 'Expert in clinical dermatology and advanced anti-aging treatments.',
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'dr-james',
    name: 'Dr. James Sterling',
    specialty: 'Holistic Skincare Specialist',
    description: 'Focuses on integrative medicine, gut health, and natural barrier repair.',
    status: 'In Consultation',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'dr-aria',
    name: 'Dr. Aria Vance',
    specialty: 'Aesthetic Physician',
    description: 'Specializes in non-invasive facial rejuvenation and custom botanical regimens.',
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1594824432166-e0504ddebdc5?auto=format&fit=crop&q=80&w=300&h=300'
  }
];

export default function ChatConsultant() {
  const [view, setView] = useState<ViewState>('selection');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<{role: 'user'|'doctor', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Reusable Chat Header
  const ChatHeader = ({ title, subtitle, isAi = false, onBack }: { title: string, subtitle: string, isAi?: boolean, onBack: () => void }) => (
    <div className="flex items-center justify-between p-6 border-b border-border bg-white/50 backdrop-blur-sm rounded-t-2xl">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-foreground/50 hover:text-foreground transition-colors p-2 -ml-2">
          ←
        </button>
        <div>
           <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
             {title} {isAi && <Sparkles className="w-3 h-3 text-primary" />}
           </h2>
           <p className="text-xs uppercase tracking-widest text-primary font-medium">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
         <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
         <span className="text-xs uppercase tracking-widest text-foreground/50 hidden sm:inline">Online</span>
      </div>
    </div>
  );

  // Initialize AI Chat
  const startAiChat = () => {
    setMessages([{ role: 'doctor', text: 'Hello. I am Aura, your virtual beauty consultant. How can I assist you with your skin concerns today?' }]);
    setView('ai-chat');
  };

  // Initialize Real Doctor Chat
  const startDoctorChat = (doc: Doctor) => {
    if (doc.status === 'In Consultation') return;
    setSelectedDoctor(doc);
    setMessages([{ role: 'doctor', text: `Hello, I'm ${doc.name}. I've reviewed your profile. How can I assist you with your skin journey today?` }]);
    setView('doctor-chat');
  };

  // Chat Submission Handler (Used by both AI and Real Doctor mocks)
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    if (view === 'ai-chat') {
      try {
        const res = await api.post('/chat', { message: userMsg });
        setMessages(prev => [...prev, { role: 'doctor', text: res.data.reply }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'doctor', text: 'Apologies, I am currently unavailable. Please try again later.' }]);
      } finally {
        setLoading(false);
      }
    } else {
      // Mock Real Doctor Reply
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'doctor', text: `Thank you for sharing that. Given your concern about "${userMsg}", I'd recommend we focus on barrier repair and gentle botanical actives over the next few weeks.` }]);
        setLoading(false);
      }, 1500);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col pb-10">
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/dashboard" className="text-sm font-medium tracking-widest uppercase text-foreground/60 hover:text-foreground">← Dashboard</Link>
            <span className="text-xs uppercase tracking-widest text-foreground font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Consultations
            </span>
          </div>
        </nav>

        <div className="flex-1 max-w-4xl mx-auto w-full px-6 pt-12 flex flex-col">
          
          {/* SELECTION VIEW */}
          {view === 'selection' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-12">
                 <h1 className="text-4xl font-serif text-foreground mb-3">Choose Your Consultation</h1>
                 <p className="text-foreground/50 font-light max-w-lg mx-auto">Select advanced digital analysis for instant regimens, or connect with a vetted clinical professional for tailored advice.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* AI Card */}
                <button 
                  onClick={startAiChat}
                  className="group relative overflow-hidden glass-panel p-10 rounded-2xl text-left border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                     <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif text-foreground mb-2">Aura AI Consultant</h3>
                  <p className="text-foreground/60 font-light leading-relaxed mb-8">Instant, data-driven skincare advice based on our proprietary algorithms.</p>
                  <span className="text-xs font-medium tracking-widest uppercase text-primary flex items-center gap-2">
                    Start Chat <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* Real Doctor Card */}
                <button 
                  onClick={() => setView('doctor-list')}
                  className="group relative overflow-hidden glass-panel p-10 rounded-2xl text-left border border-border/50 hover:border-foreground/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-white/40"
                >
                  <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground mb-6 group-hover:scale-110 transition-transform">
                     <UserCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif text-foreground mb-2">Certified Specialists</h3>
                  <p className="text-foreground/60 font-light leading-relaxed mb-8">Connect with real medical and holistic experts for personalized diagnostic care.</p>
                  <span className="text-xs font-medium tracking-widest uppercase text-foreground flex items-center gap-2">
                    View Directory <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* DOCTOR LIST VIEW */}
          {view === 'doctor-list' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
               <button onClick={() => setView('selection')} className="text-xs font-medium tracking-widest uppercase text-foreground/50 hover:text-foreground mb-8 flex items-center gap-2">
                 ← Back to Selection
               </button>
               
               <header className="mb-10">
                 <h2 className="text-3xl font-serif text-foreground">Specialist Directory</h2>
                 <p className="text-foreground/50 font-light mt-2">Select an expert to begin your private consultation.</p>
               </header>

               <div className="space-y-4">
                  {DOCTORS.map(doc => (
                    <div key={doc.id} className="glass-panel p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row gap-6 items-start md:items-center transition-all hover:border-foreground/20">
                      <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border border-border">
                         <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1">
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-1">
                           <h3 className="text-xl font-serif text-foreground">{doc.name}</h3>
                           {doc.status === 'Available' ? (
                             <span className="text-[10px] uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1 w-max">
                               <CheckCircle2 className="w-3 h-3" /> Available
                             </span>
                           ) : (
                             <span className="text-[10px] uppercase tracking-widest text-foreground/50 bg-secondary px-3 py-1 rounded-full border border-border flex items-center gap-1 w-max">
                               <Clock className="w-3 h-3" /> In Consultation
                             </span>
                           )}
                         </div>
                         <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">{doc.specialty}</p>
                         <p className="text-sm font-light text-foreground/60 leading-relaxed mb-4 md:mb-0 max-w-xl">{doc.description}</p>
                      </div>

                      <button 
                        onClick={() => startDoctorChat(doc)}
                        disabled={doc.status !== 'Available'}
                        className="w-full md:w-auto px-6 py-3 bg-foreground text-background text-xs font-medium tracking-widest uppercase rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/80 transition-colors"
                      >
                        Start Chat
                      </button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* CHAT INTERFACE (AI or Real Doctor) */}
          {(view === 'ai-chat' || view === 'doctor-chat') && (
            <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-black/5 animate-in fade-in zoom-in-95 duration-500 h-[600px] border border-border/50">
              <ChatHeader 
                title={view === 'ai-chat' ? 'Aura Digital Consultant' : selectedDoctor?.name || ''} 
                subtitle={view === 'ai-chat' ? 'Proprietary AI Engine' : selectedDoctor?.specialty || ''}
                isAi={view === 'ai-chat'}
                onBack={() => setView('selection')} 
              />
              
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white/20">
                 {messages.map((msg, idx) => (
                   <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] p-5 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-foreground text-background rounded-tr-sm'
                          : 'bg-white text-foreground rounded-tl-sm border border-black/5 shadow-sm'
                      }`}>
                        <p className="text-sm leading-relaxed font-light">{msg.text}</p>
                      </div>
                   </div>
                 ))}
                 {loading && (
                   <div className="flex justify-start">
                      <div className="bg-white p-5 rounded-2xl rounded-tl-sm border border-black/5 shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-foreground/40" />
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="p-4 border-t border-border bg-white/60 backdrop-blur-md">
                <form onSubmit={sendMessage} className="flex gap-3 max-w-3xl mx-auto">
                  <input 
                     type="text" 
                     value={input}
                     onChange={(e)=>setInput(e.target.value)}
                     placeholder="Type your concern..."
                     className="flex-1 bg-white border border-border/70 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm font-light transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:bg-foreground/20 disabled:text-foreground/50 transition-colors shadow-sm"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
