'use client';

import Link from 'next/link';
import { Sparkles, ScanFace, Droplets, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col pt-24 pb-12 px-6">
      <nav className="absolute top-0 left-0 w-full px-6 py-8 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold tracking-widest uppercase text-foreground/80">Aura Botanical</h1>
        <div className="flex gap-8 items-center">
          <Link href="/dashboard" className="text-xs font-medium tracking-widest text-foreground/60 hover:text-foreground transition-colors uppercase hidden sm:block">Diagnostic</Link>
          <Link 
            href={user?.role === 'doctor' ? "/doctor/dashboard" : "/chat"} 
            className="text-xs font-medium tracking-widest text-foreground/60 hover:text-foreground transition-colors uppercase hidden sm:block"
          >
            {user?.role === 'doctor' ? 'Consultations' : 'Consultant'}
          </Link>
          <Link href="/products" className="text-xs font-medium tracking-widest text-foreground/60 hover:text-foreground transition-colors uppercase hidden sm:block">Collection</Link>
          
          <div className="w-px h-4 bg-border hidden sm:block"></div>

          {!loading && user ? (
            <Link href="/dashboard" className="text-xs font-medium tracking-widest text-foreground hover:text-primary transition-colors uppercase flex items-center gap-2">
              Dashboard <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <Link href="/login" className="text-xs font-medium tracking-widest text-foreground hover:text-primary transition-colors uppercase">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center pt-12">
        <div className="text-center max-w-2xl space-y-10 relative z-10 px-4">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-white/40 backdrop-blur-md mb-4 text-primary text-sm tracking-wider font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Discover Your True Radiance</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-normal leading-tight text-foreground">
            The Digital <br/> <span className="italic opacity-80 font-serif">Skin Atelier</span>
          </h2>
          
          <p className="text-lg md:text-xl text-foreground/60 leading-relaxed font-light mx-auto max-w-lg">
            Experience our proprietary digital consultant. Receive tailored botanical treatments and actionable clinical insights just by scanning your face.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            {!loading && user ? (
              <Link href="/dashboard" className="w-full sm:w-auto px-10 py-4 bg-foreground text-background font-medium tracking-widest uppercase text-sm rounded-none hover:bg-foreground/80 transition-all flex items-center justify-center gap-2">
                Continue to Diagnostic <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link href="/register" className="w-full sm:w-auto px-10 py-4 bg-foreground text-background font-medium tracking-widest uppercase text-sm rounded-none hover:bg-foreground/80 transition-all">
                Begin Consultation
              </Link>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-4xl w-full text-center px-6 border-t border-border pt-16">
           <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-primary">
                 <ScanFace className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif">Instant Analysis</h3>
              <p className="text-foreground/60 text-sm font-light leading-relaxed">Advanced imaging detects fine lines, hydration levels, and texture instantly.</p>
           </div>
           <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-primary">
                 <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif">Botanical Focus</h3>
              <p className="text-foreground/60 text-sm font-light leading-relaxed">Curated regimens focusing on clean, plant-based luxury ingredients.</p>
           </div>
           <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-primary">
                 <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif">Expert Curation</h3>
              <p className="text-foreground/60 text-sm font-light leading-relaxed">Connect with virtual dermatologists for deeper, clinical insights.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
