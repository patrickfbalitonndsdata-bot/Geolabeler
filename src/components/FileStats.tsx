/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSpreadsheet, MapPin, Layers, Settings } from 'lucide-react';
import { KMZData } from '../types';

interface FileStatsProps {
  data: KMZData | null;
  targetStyle: string;
  onStyleClick?: (styleUrl: string) => void;
}

export function FileStats({ data, targetStyle, onStyleClick }: FileStatsProps) {
  if (!data) return null;

  const matchingPinsCount = data.pins.filter(p => p.isMatch).length;
  const nonMatchingPinsCount = data.pins.length - matchingPinsCount;

  return (
    <div id="file-stats-panel" className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 shadow-inner space-y-6 backdrop-blur-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight mb-3 flex items-center">
          <FileSpreadsheet className="w-4 h-4 mr-2 text-cyan-400" />
          KMZ File Structure
        </h3>
        <dl className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <dt className="text-slate-500 font-medium mb-1">Source KML</dt>
            <dd className="font-mono text-cyan-400 font-semibold truncate" title={data.kmlFileName}>
              {data.kmlFileName}
            </dd>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <dt className="text-slate-500 font-medium mb-1">Total Placemarks</dt>
            <dd className="text-lg font-bold text-white flex items-center font-mono">
              <MapPin className="w-4 h-4 mr-1 text-slate-400" />
              {data.pins.length}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight mb-3 flex items-center">
          <Layers className="w-4 h-4 mr-2 text-cyan-400" />
          Style Distribution ({data.styles.length})
        </h3>
        <p className="text-xs text-slate-400 mb-2">
          Click any style below to quickly set it as the renaming target.
        </p>
        
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {data.styles.map(({ styleUrl, count }) => {
            const isCurrentTarget = styleUrl.toLowerCase().includes(targetStyle.toLowerCase()) && targetStyle.trim() !== '';
            
            return (
              <button
                key={styleUrl}
                onClick={() => onStyleClick?.(styleUrl)}
                className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between border transition-all ${
                  isCurrentTarget
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-mono truncate mr-2" title={styleUrl}>
                  {styleUrl.startsWith('#') ? styleUrl : `#${styleUrl}`}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                  isCurrentTarget
                    ? 'bg-cyan-900/50 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {count} {count === 1 ? 'pin' : 'pins'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 mr-1.5 inline-block shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            {targetStyle.toLowerCase() === 'pointstylemap20' ? 'Standard Pushpins (Auto):' : `Matched style (${targetStyle}):`}
          </span>
          <span className="font-bold text-slate-200 font-mono">{matchingPinsCount} pins</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 mr-1.5 inline-block"></span>
            Other styles (unmodified):
          </span>
          <span className="font-bold text-slate-200 font-mono">{nonMatchingPinsCount} pins</span>
        </div>
      </div>
    </div>
  );
}
