import React from "react";

export default function UnderConstruction() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-4xl font-bold text-neutral-50 tracking-tight">
          EasySmart Platform
        </h1>
        <p className="text-neutral-400 text-lg">
          Esta área está em construção. Em breve você poderá visualizar seus dispositivos IIoT em tempo real!
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-neutral-500">
          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-neutral-400"></div>
          <span>Preparando o futuro da automação industrial ⚙️</span>
        </div>

        <div className="pt-8 text-neutral-500 text-xs">
          © {new Date().getFullYear()} EasySmart Platform • v0.3.0
        </div>
      </div>
    </div>
  );
}
