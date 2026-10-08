import React from 'react';
import { BitTrace } from '../types/quantum';
import { Check, X, ShieldCheck } from 'lucide-react';

interface Props {
  bits: BitTrace[];
  maxDisplay?: number;
}

export const BitTraceTable: React.FC<Props> = ({ bits, maxDisplay = 25 }) => {
  const displayBits = bits.slice(0, maxDisplay);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            BB84 Quantum Sifting & Verification Protocol Trace
          </h3>
          <p className="text-xs text-slate-500">
            Bit-by-bit transmission inspection showing Alice state preparation, Bob measurement, sifting, and error identification
          </p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
          Showing {displayBits.length} sample pulses
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
              <th className="py-2 px-2 text-left font-semibold">Pulse #</th>
              <th className="py-2 px-2 font-semibold">Alice Bit</th>
              <th className="py-2 px-2 font-semibold">Alice Basis</th>
              <th className="py-2 px-2 font-semibold">State |ψ⟩</th>
              <th className="py-2 px-2 font-semibold">Bob Basis</th>
              <th className="py-2 px-2 font-semibold">Bob Detected?</th>
              <th className="py-2 px-2 font-semibold">Bob Bit</th>
              <th className="py-2 px-2 font-semibold">Basis Match?</th>
              <th className="py-2 px-2 font-semibold">Sifted Key</th>
              <th className="py-2 px-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayBits.map((b) => {
              const stateSymbol =
                b.alice_basis === 'Z'
                  ? b.alice_bit === 0 ? '|0⟩' : '|1⟩'
                  : b.alice_bit === 0 ? '|+⟩' : '|−⟩';

              return (
                <tr key={b.index} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-1.5 px-2 text-left text-slate-400 font-mono text-[11px]">{b.index}</td>
                  
                  {/* Alice Bit */}
                  <td className="py-1.5 px-2">
                    <span className={`inline-block w-5 h-5 leading-5 rounded font-mono font-bold ${
                      b.alice_bit === 1 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {b.alice_bit}
                    </span>
                  </td>

                  {/* Alice Basis */}
                  <td className="py-1.5 px-2">
                    <span className="font-semibold text-slate-700">
                      {b.alice_basis === 'Z' ? 'Z (+)' : 'X (×)'}
                    </span>
                  </td>

                  {/* Quantum State */}
                  <td className="py-1.5 px-2 font-mono text-cyan-800 font-medium">
                    {stateSymbol}
                  </td>

                  {/* Bob Basis */}
                  <td className="py-1.5 px-2">
                    <span className="font-semibold text-slate-700">
                      {b.bob_basis === 'Z' ? 'Z (+)' : 'X (×)'}
                    </span>
                  </td>

                  {/* Detected */}
                  <td className="py-1.5 px-2">
                    {b.detected ? (
                      <span className="text-emerald-600 font-medium">Click</span>
                    ) : (
                      <span className="text-slate-400">Lost</span>
                    )}
                  </td>

                  {/* Bob Bit */}
                  <td className="py-1.5 px-2">
                    {b.bob_bit !== null ? (
                      <span className={`inline-block w-5 h-5 leading-5 rounded font-mono font-bold ${
                        b.bob_bit === 1 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {b.bob_bit}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Basis Match */}
                  <td className="py-1.5 px-2">
                    {b.basis_matched ? (
                      <Check className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400 inline" />
                    )}
                  </td>

                  {/* Sifted Key Outcome */}
                  <td className="py-1.5 px-2">
                    {b.detected && b.basis_matched ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                        {b.bob_bit}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[10px]">Discarded</span>
                    )}
                  </td>

                  {/* Error Flag */}
                  <td className="py-1.5 px-2">
                    {b.is_error ? (
                      <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        ERROR
                      </span>
                    ) : b.detected && b.basis_matched ? (
                      <span className="text-emerald-600 font-medium text-[10px]">Matched</span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Sifted bit preserved (Bases match + Click)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> QBER error bit (Noise click or optical flip)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Discarded (Basis mismatch or lost photon)
        </span>
      </div>
    </div>
  );
};
