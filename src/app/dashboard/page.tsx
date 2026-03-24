'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import FaceScanner from '@/components/FaceScanner';
import { Archive, Sparkles, MessageSquare, ShoppingBag, Stethoscope } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);

  const fetchScans = async () => {
    try {
      const scansRes = await api.get('/scans');
      setScans(scansRes.data);
    } catch (err) {} finally {
      setLoadingScans(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-12">
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-widest uppercase text-foreground">Aura Botanical</Link>
            <div className="flex items-center gap-8">
              <Link href="/products" className="text-sm tracking-widest uppercase text-foreground/70 hover:text-foreground flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Products
              </Link>
              <Link 
                href={user?.role === 'doctor' ? "/doctor/dashboard" : "/chat"} 
                className="text-sm tracking-widest uppercase text-foreground/70 hover:text-foreground flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> {user?.role === 'doctor' ? 'Consultations' : 'Consult'}
              </Link>
              {/* INTEGRATION POINT: Show Doctor Panel link for doctors only */}
              {user?.role === 'doctor' && (
                <Link href="/doctor/dashboard" className="text-sm tracking-widest uppercase text-primary hover:text-primary/80 flex items-center gap-2 font-medium">
                  <Stethoscope className="w-4 h-4" /> Doctor Panel
                </Link>
              )}
              <button onClick={logout} className="text-sm tracking-widest uppercase text-foreground/70 hover:text-foreground">
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 mt-12">
          <header className="mb-16">
            <h1 className="text-4xl font-serif text-foreground mb-2">Hello, {user?.name}</h1>
            <p className="text-foreground/50 font-light">Welcome to your personal digital atelier.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <div className="sticky top-28">
                <h2 className="text-lg font-serif mb-6 text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  New Diagnostic
                </h2>
                <FaceScanner onScanSaved={fetchScans} />
              </div>
            </div>

            <div className="lg:col-span-7">
              <h2 className="text-lg font-serif mb-6 text-foreground flex items-center gap-2">
                <Archive className="w-4 h-4 text-primary" />
                Skin Profile History
              </h2>
              
              <div className="space-y-6">
                {loadingScans ? (
                   <p className="text-sm font-light text-foreground/50">Loading records...</p>
                ) : scans.length === 0 ? (
                  <div className="glass-panel p-12 rounded-xl text-center border-dashed">
                    <p className="text-foreground/50 font-light">No records found. Begin a diagnostic to build your profile.</p>
                  </div>
                ) : (
                  scans.map((scan) => (
                    <div key={scan.id} className="glass-panel p-6 rounded-xl hover:border-border transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs tracking-widest uppercase text-foreground/40 font-medium">
                          {new Date(scan.created_at).toLocaleDateString(undefined, {
                            month: 'long', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs uppercase tracking-widest text-primary block mb-1">Condition</span>
                          <p className="text-foreground font-light">{scan.skin_condition}</p>
                        </div>
                        
                        {scan.treatment_recommendation && (
                          <div>
                            <span className="text-xs uppercase tracking-widest text-primary block mb-1">Prescribed</span>
                            <p className="text-foreground/70 text-sm font-light leading-relaxed">{scan.treatment_recommendation}</p>
                          </div>
                        )}

                        {scan.recommended_products && scan.recommended_products.length > 0 && (
                          <div className="pt-2">
                            <div className="flex gap-2 flex-wrap">
                              {JSON.parse(scan.recommended_products).map((p: string) => (
                                <span key={p} className="text-[10px] uppercase tracking-wider px-2 py-1 border border-border rounded text-foreground/60 bg-secondary/30">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
