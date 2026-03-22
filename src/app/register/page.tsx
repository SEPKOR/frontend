'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/register', { name, email, password });
      await login(response.data.access_token, '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Link href="/" className="absolute top-8 left-8 text-sm font-medium tracking-widest uppercase text-foreground/60 hover:text-foreground">
        ← Return
      </Link>
      
      <div className="w-full max-w-sm glass-panel p-10 rounded-2xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-serif text-foreground mb-2">Join Our Atelier</h2>
          <p className="text-sm text-foreground/50 font-light">Create a profile for digital analysis</p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-100/50 border border-red-200 text-red-600/80 rounded-lg text-sm font-light text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-foreground/70 mb-2">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field" 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-foreground/70 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field" 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-foreground/70 mb-2">Password</label>
            <input 
              type="password" 
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary mt-2"
          >
            {loading ? 'Creating Profile...' : 'Register'}
          </button>
        </form>

        <p className="mt-10 text-center text-foreground/50 text-xs tracking-wide">
          Already a member?{' '}
          <Link href="/login" className="text-foreground font-medium underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
