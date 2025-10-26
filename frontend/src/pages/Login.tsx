/**
 * Login Page - CORRIGIDO
 * 
 * Usa setAuth() do authStore
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/api/v1/auth/login', {
        email,
        password,
      });

      const { user, tokens } = response.data;

      // ✅ Usar setAuth do authStore
      setAuth({
        user,
        tokens,
        isAuthenticated: true,
      });

      console.log('[Login] Sucesso!', user.email);

      // Redirecionar
      navigate('/realtime');

    } catch (err: any) {
      console.error('[Login] Erro:', err);
      setError(err.response?.data?.error || 'Falha ao autenticar. Verifique email e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
      <form
        onSubmit={handleLogin}
        className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20"
      >
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-white/20 rounded-xl mb-3">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            EasySmart Platform
          </h1>
          <p className="text-white/70 text-sm">
            Monitoramento Industrial IoT
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Não tem conta?{' '}
            <a href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Registre-se
            </a>
          </p>
        </div>

        {/* Credenciais de teste */}
        <div className="mt-6 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-white/70 text-xs mb-2">
            <strong>Credenciais de teste:</strong>
          </p>
          <p className="text-white/60 text-xs font-mono">
            admin@easysmart.io / admin123456
          </p>
        </div>
      </form>
    </div>
  );
}
