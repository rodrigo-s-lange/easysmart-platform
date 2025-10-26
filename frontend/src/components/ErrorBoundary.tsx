/**
 * ErrorBoundary Component
 *
 * Captura erros React e exibe UI de fallback
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Aqui você pode enviar para serviço de logging (Sentry, LogRocket, etc)
    // sendErrorToLoggingService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Se fallback customizado foi fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI padrão de erro
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-red-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            {/* Ícone de erro */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Oops! Algo deu errado
            </h1>

            {/* Mensagem */}
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
              Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
            </p>

            {/* Detalhes do erro (somente dev) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6">
                <details className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Detalhes técnicos (dev only)
                  </summary>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-red-600 dark:text-red-400">Erro:</span>
                      <pre className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div className="text-sm">
                        <span className="font-medium text-red-600 dark:text-red-400">Stack:</span>
                        <pre className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Voltar ao Início
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Se o problema persistir, entre em contato com o suporte.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
