"use client";

import React, { useState, useEffect } from "react";
import { Key, Check, ExternalLink, X } from "lucide-react";
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
    }, 700);
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("routecast_mapbox_token");
    }
    setTokenInput("");
    onTokenSaved("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-lg border border-[#E7EBEF] bg-white p-5 shadow-modal">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded p-1 text-[#687582] hover:bg-[#F4F5F7] hover:text-[#17212B] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-md bg-[#E6F3F5] text-[#087E8B] flex items-center justify-center">
            <Key className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#17212B]">
              Mapbox Access Token
            </h3>
            <p className="text-xs text-[#687582]">
              Configures Mapbox GL JS vector rendering
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="rounded-md border border-[#E7EBEF] bg-[#F7F8FA] p-3 text-xs text-[#687582] leading-relaxed space-y-1.5">
            <p>
              RouteCast uses <strong className="text-[#17212B]">Mapbox GL</strong> for maps and
              <strong className="text-[#17212B]"> Open-Meteo</strong> for real-time weather forecasting.
            </p>
            <p>
              You can get a free token from your Mapbox account. When running locally, set{" "}
              <code className="text-[#087E8B] bg-white px-1 py-0.5 rounded border border-[#E7EBEF]">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in{" "}
              <code className="text-[#087E8B] bg-white px-1 py-0.5 rounded border border-[#E7EBEF]">.env.local</code>.
            </p>
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#087E8B] font-medium hover:underline pt-0.5"
            >
              Get Free Mapbox Token <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#17212B] mb-1">
              Public Mapbox Token (<code className="text-[#687582]">pk.eyJ...</code>)
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSI..."
              className="w-full h-9 rounded-md border border-[#E7EBEF] bg-white px-3 text-xs text-[#17212B] font-mono placeholder:text-[#9DA7B2] focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] focus:outline-none transition-colors"
            />
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 rounded-md bg-[#EBF6F1] border border-[#CBE9DC] p-2 text-xs text-[#16865D] font-medium">
              <Check className="h-3.5 w-3.5" />
              Token saved successfully!
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-[#687582] hover:text-[#D94B4B]"
            >
              Clear
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
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
