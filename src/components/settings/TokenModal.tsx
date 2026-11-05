"use client";

import React, { useState, useEffect } from "react";
import { Key, Check, AlertCircle, ExternalLink, X } from "lucide-react";
import { Button } from "../ui/Button";

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSaved: (token: string) => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  onTokenSaved,
}) => {
  const [tokenInput, setTokenInput] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("routecast_mapbox_token") || "";
      setTokenInput(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("routecast_mapbox_token", tokenInput.trim());
    }
    onTokenSaved(tokenInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("routecast_mapbox_token");
    }
    setTokenInput("");
    onTokenSaved("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Mapbox Access Token Setup
            </h3>
            <p className="text-xs text-slate-400">
              Required for Mapbox GL JS map rendering and turn-by-turn routing
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-300 leading-relaxed space-y-2">
            <p>
              RouteCast uses <strong className="text-cyan-400">Mapbox GL JS</strong> for vector maps and
              <strong className="text-teal-400"> Open-Meteo</strong> for real-time weather sampling.
            </p>
            <p className="text-slate-400">
              You can obtain a free public token from your Mapbox account. When running locally or on Vercel, you can also set{" "}
              <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in{" "}
              <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">.env.local</code>.
            </p>
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium underline"
            >
              Get Free Mapbox Token <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Public Mapbox Token (<code className="text-slate-400">pk.eyJ...</code>)
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSI..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs"
            />
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400 font-medium">
              <Check className="h-4 w-4" />
              Token saved successfully! Updating map...
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-red-400"
            >
              Clear Token
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleSave}>
                Save Token
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
