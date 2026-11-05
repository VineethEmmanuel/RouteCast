"use client";

import React from "react";
import { X, ShieldAlert, Wind, Droplets, CloudSnow, Weight, Scale } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Fleet Weather Safety Rules & Risk Threshold Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Exact numerical non-overlapping boundaries and truck load weight adjustments
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs text-slate-300">
          {/* Weather Variable Tables */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wind Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Wind className="h-4 w-4 text-cyan-400" />
                <span>Wind Speed (mph)</span>
              </div>
              <table className="w-full text-left font-mono text-[11px]">
                <tbody className="divide-y divide-slate-800/80">
                  <tr>
                    <td className="py-1">&lt; 25 mph</td>
                    <td className="py-1 text-emerald-400 font-bold text-right">Low</td>
                  </tr>
                  <tr>
                    <td className="py-1">25–34 mph</td>
                    <td className="py-1 text-amber-400 font-bold text-right">Moderate</td>
                  </tr>
                  <tr>
                    <td className="py-1">35–44 mph</td>
                    <td className="py-1 text-orange-400 font-bold text-right">High</td>
                  </tr>
                  <tr>
                    <td className="py-1">45–54 mph</td>
                    <td className="py-1 text-red-400 font-bold text-right">Severe</td>
                  </tr>
                  <tr>
                    <td className="py-1">≥ 55 mph</td>
                    <td className="py-1 text-rose-500 font-bold text-right">No Travel</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rain Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Droplets className="h-4 w-4 text-blue-400" />
                <span>Rainfall (in/hr)</span>
              </div>
              <table className="w-full text-left font-mono text-[11px]">
                <tbody className="divide-y divide-slate-800/80">
                  <tr>
                    <td className="py-1">&lt; 0.10 in/hr</td>
                    <td className="py-1 text-emerald-400 font-bold text-right">Low</td>
                  </tr>
                  <tr>
                    <td className="py-1">0.10–0.25 in/hr</td>
                    <td className="py-1 text-amber-400 font-bold text-right">Moderate</td>
                  </tr>
                  <tr>
                    <td className="py-1">&gt; 0.25–0.50 in/hr</td>
                    <td className="py-1 text-orange-400 font-bold text-right">High</td>
                  </tr>
                  <tr>
                    <td className="py-1">&gt; 0.50–1.00 in/hr</td>
                    <td className="py-1 text-red-400 font-bold text-right">Severe</td>
                  </tr>
                  <tr>
                    <td className="py-1">&gt; 1.00 in/hr</td>
                    <td className="py-1 text-rose-500 font-bold text-right">No Travel</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Snow Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <CloudSnow className="h-4 w-4 text-sky-400" />
                <span>Snowfall (in/hr)</span>
              </div>
              <table className="w-full text-left font-mono text-[11px]">
                <tbody className="divide-y divide-slate-800/80">
                  <tr>
                    <td className="py-1">&lt; 0.5 in/hr</td>
                    <td className="py-1 text-emerald-400 font-bold text-right">Low</td>
                  </tr>
                  <tr>
                    <td className="py-1">0.5–1.0 in/hr</td>
                    <td className="py-1 text-amber-400 font-bold text-right">Moderate</td>
                  </tr>
                  <tr>
                    <td className="py-1">&gt; 1.0–2.0 in/hr</td>
                    <td className="py-1 text-orange-400 font-bold text-right">High</td>
                  </tr>
                  <tr>
                    <td className="py-1">&gt; 2.0–3.0 in/hr</td>
                    <td className="py-1 text-red-400 font-bold text-right">Severe</td>
                  </tr>
                  <tr>
                    <td className="py-1">&gt; 3.0 in/hr</td>
                    <td className="py-1 text-rose-500 font-bold text-right">No Travel</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Load Rules */}
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-red-300 text-sm">
              <Weight className="h-4 w-4" />
              <span>Truck Load Weight Adjustment Rules</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              <li>
                <strong>Rule 1:</strong> Wind speed ≥ 55 mph → <strong>No Travel</strong> for every load weight.
              </li>
              <li>
                <strong>Rule 2:</strong> Wind speed between 45 and 54 mph <em>AND</em> load weight &gt; 30,000 lb → <strong>No Travel</strong> (high rollover hazard).
              </li>
              <li>
                <strong>Rule 3:</strong> Wind speed between 35 and 44 mph <em>AND</em> load weight &gt; 40,000 lb → <strong>Upgrade checkpoint risk to Severe</strong>.
              </li>
              <li>
                <strong>Precedence:</strong> Highest severity always prevails across weather variables and load adjustments.
              </li>
            </ul>
          </div>

          {/* Lexicographical Priority */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-300 text-sm">
              <Scale className="h-4 w-4" />
              <span>Route Recommendation Lexicographical Priority</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center font-mono text-[11px]">
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                <div className="text-[10px] text-cyan-400 font-bold">Priority 1</div>
                <div className="font-semibold text-slate-200 mt-0.5">Fewest Severe Miles</div>
              </div>
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                <div className="text-[10px] text-cyan-400 font-bold">Priority 2</div>
                <div className="font-semibold text-slate-200 mt-0.5">Fewest High Miles</div>
              </div>
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                <div className="text-[10px] text-cyan-400 font-bold">Priority 3</div>
                <div className="font-semibold text-slate-200 mt-0.5">Lowest Average Risk</div>
              </div>
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                <div className="text-[10px] text-cyan-400 font-bold">Priority 4</div>
                <div className="font-semibold text-slate-200 mt-0.5">Shortest Travel Time</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * Any route containing No-Travel exposure is explicitly disqualified from safe recommendations when alternatives exist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
