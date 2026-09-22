import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      // Auth state change will be caught by App.tsx listener
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#191919] flex flex-col items-center justify-center p-4 font-sans text-[#d4d4d4]">
      
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-6xl mb-4">💼</div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-[#9b9b9b] mt-2">Sign in to your task manager</p>
        </div>

        {/* Card */}
        <div className="bg-[#202020] border border-[#2f2f2f] rounded-xl shadow-2xl overflow-hidden p-8">
          
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-900/50 text-red-200 text-sm p-3 rounded flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9b9b9b] uppercase tracking-wider ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a5a] group-focus-within:text-[#d4d4d4] transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#2c2c2c] border border-[#3f3f3f] text-[#d4d4d4] rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-[#5a5a5a]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9b9b9b] uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a5a] group-focus-within:text-[#d4d4d4] transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#2c2c2c] border border-[#3f3f3f] text-[#d4d4d4] rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-[#5a5a5a]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[#5a5a5a]">
          Protected by Supabase Authentication
        </div>
      </div>
    </div>
  );
};