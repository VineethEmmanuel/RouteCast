"use client";

import React from "react";
import { X, ShieldAlert, Wind, Droplets, CloudSnow, Weight, Scale } from "lucide-react";

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-lg border border-[#E7EBEF] bg-white p-5 shadow-modal max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded p-1 text-[#687582] hover:bg-[#F4F5F7] hover:text-[#17212B] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#E7EBEF]">
          <div className="h-8 w-8 rounded-md bg-[#E6F3F5] text-[#087E8B] flex items-center justify-center">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#17212B]">
              Weather Safety Rules & Numerical Threshold Matrix
            </h3>
            <p className="text-xs text-[#687582]">
              Standardized non-overlapping risk boundaries and commercial load rules
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-[#17212B]">
          {/* Weather Variable Tables */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Wind Table */}
            <div className="rounded-md border border-[#E7EBEF] bg-[#F7F8FA] p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#17212B]">
                <Wind className="h-3.5 w-3.5 text-[#087E8B]" />
                <span>Wind Speed</span>
              </div>
              <table className="w-full text-left font-mono tabular-nums text-[11px]">
                <tbody className="divide-y divide-[#E7EBEF]">
                  <tr>
                    <td className="py-1 text-[#687582]">&lt; 25 mph</td>
                    <td className="py-1 text-[#16865D] font-semibold text-right">Low</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">25–34 mph</td>
                    <td className="py-1 text-[#A07010] font-semibold text-right">Moderate</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">35–44 mph</td>
                    <td className="py-1 text-[#C25814] font-semibold text-right">High</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">45–54 mph</td>
                    <td className="py-1 text-[#B82E2E] font-semibold text-right">Severe</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">≥ 55 mph</td>
                    <td className="py-1 text-[#861F2D] font-semibold text-right">No Travel</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rain Table */}
            <div className="rounded-md border border-[#E7EBEF] bg-[#F7F8FA] p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#17212B]">
                <Droplets className="h-3.5 w-3.5 text-blue-500" />
                <span>Rainfall Intensity</span>
              </div>
              <table className="w-full text-left font-mono tabular-nums text-[11px]">
                <tbody className="divide-y divide-[#E7EBEF]">
                  <tr>
                    <td className="py-1 text-[#687582]">&lt; 0.10 in/hr</td>
                    <td className="py-1 text-[#16865D] font-semibold text-right">Low</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">0.10–0.25 in/hr</td>
                    <td className="py-1 text-[#A07010] font-semibold text-right">Moderate</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">&gt; 0.25–0.50 in/hr</td>
                    <td className="py-1 text-[#C25814] font-semibold text-right">High</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">&gt; 0.50–1.00 in/hr</td>
                    <td className="py-1 text-[#B82E2E] font-semibold text-right">Severe</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">&gt; 1.00 in/hr</td>
                    <td className="py-1 text-[#861F2D] font-semibold text-right">No Travel</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Snow Table */}
            <div className="rounded-md border border-[#E7EBEF] bg-[#F7F8FA] p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#17212B]">
                <CloudSnow className="h-3.5 w-3.5 text-sky-500" />
                <span>Snowfall Intensity</span>
              </div>
              <table className="w-full text-left font-mono tabular-nums text-[11px]">
                <tbody className="divide-y divide-[#E7EBEF]">
                  <tr>
                    <td className="py-1 text-[#687582]">&lt; 0.5 in/hr</td>
                    <td className="py-1 text-[#16865D] font-semibold text-right">Low</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">0.5–1.0 in/hr</td>
                    <td className="py-1 text-[#A07010] font-semibold text-right">Moderate</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">&gt; 1.0–2.0 in/hr</td>
                    <td className="py-1 text-[#C25814] font-semibold text-right">High</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">&gt; 2.0–3.0 in/hr</td>
                    <td className="py-1 text-[#B82E2E] font-semibold text-right">Severe</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#687582]">&gt; 3.0 in/hr</td>
                    <td className="py-1 text-[#861F2D] font-semibold text-right">No Travel</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Load Rules */}
          <div className="rounded-md border border-[#E5B5BC] bg-[#F8E9EB] p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#861F2D] text-xs">
              <Weight className="h-3.5 w-3.5" />
              <span>Truck Cargo Weight Rules</span>
            </div>
            <ul className="space-y-1 text-xs text-[#861F2D] list-disc list-inside">
              <li>
                <strong>Rule 1:</strong> Wind speed ≥ 55 mph → <strong>No Travel</strong> for every load weight.
              </li>
              <li>
                <strong>Rule 2:</strong> Wind speed 45–54 mph AND load weight &gt; 30,000 lb → <strong>No Travel</strong> (high rollover hazard).
              </li>
              <li>
                <strong>Rule 3:</strong> Wind speed 35–44 mph AND load weight &gt; 40,000 lb → <strong>Upgrade to Severe</strong>.
              </li>
            </ul>
          </div>

          {/* Lexicographical Priority */}
          <div className="rounded-md border border-[#E7EBEF] bg-[#F7F8FA] p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#17212B] text-xs">
              <Scale className="h-3.5 w-3.5 text-[#087E8B]" />
              <span>Lexicographical Route Recommendation Priority</span>
            </div>
            <p className="text-xs text-[#687582] leading-relaxed">
              1. <strong>No-Travel Disqualification</strong> → 2. <strong>Fewest Severe Miles</strong> → 3. <strong>Fewest High Miles</strong> → 4. <strong>Lowest Average Risk</strong> → 5. <strong>Shortest Travel Time</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
