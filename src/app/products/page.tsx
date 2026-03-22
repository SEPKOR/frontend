'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { ShoppingBag, Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/dashboard" className="text-sm font-medium tracking-widest uppercase text-foreground/60 hover:text-foreground">← Dashboard</Link>
            <span className="text-xs uppercase tracking-widest text-foreground font-medium flex items-center gap-2">
               <ShoppingBag className="w-4 h-4" /> The Collection
            </span>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 mt-16">
          <header className="text-center mb-16 max-w-2xl mx-auto">
             <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Curated Botanicals</h1>
             <p className="text-foreground/50 font-light text-lg">Exquisite, highly-active formulations born from nature. Designed to replenish, restore, and radiate.</p>
          </header>

          {loading ? (
             <div className="flex justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.map(product => (
                   <div key={product.id} className="group cursor-pointer">
                      <div className="w-full aspect-[3/4] overflow-hidden rounded-xl bg-secondary mb-4 relative border border-border/50">
                         <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                         />
                         <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                      </div>
                      
                      <div className="space-y-2">
                         <div className="flex justify-between items-start">
                            <h3 className="font-serif text-lg text-foreground pr-4 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                            <span className="text-sm font-medium">${product.price}</span>
                         </div>
                         
                         <p className="text-xs font-medium tracking-widest uppercase text-foreground/40">{product.category}</p>
                         <p className="text-sm text-foreground/60 font-light line-clamp-2 leading-relaxed">{product.description}</p>
                         
                         <div className="pt-3 flex gap-2 flex-wrap">
                            {product.target_concerns.map((tc: string) => (
                              <span key={tc} className="text-[10px] uppercase tracking-widest text-foreground/40 bg-secondary px-2 py-1 rounded">
                                 {tc}
                              </span>
                            ))}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
