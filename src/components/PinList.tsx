/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, MapPin, ArrowRight, CheckCircle, Info, Filter, Video } from 'lucide-react';
import { PlacemarkPin } from '../types';

function getPinColorClasses(color: string, isMatch: boolean) {
  if (!isMatch) {
    return {
      bg: 'bg-slate-900/40 text-slate-500 border border-slate-800/40',
      text: 'text-slate-500',
    };
  }
  
  switch (color) {
    case 'yellow':
      return { bg: 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/30', text: 'text-yellow-400' };
    case 'cyan':
      return { bg: 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/30', text: 'text-cyan-400' };
    case 'blue':
      return { bg: 'bg-blue-950/40 text-blue-400 border border-blue-500/30', text: 'text-blue-400' };
    case 'green':
      return { bg: 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30', text: 'text-emerald-400' };
    case 'pink':
      return { bg: 'bg-pink-950/40 text-pink-400 border border-pink-500/30', text: 'text-pink-400' };
    case 'purple':
      return { bg: 'bg-purple-950/40 text-purple-400 border border-purple-500/30', text: 'text-purple-400' };
    case 'red':
      return { bg: 'bg-red-950/40 text-red-400 border border-red-500/30', text: 'text-red-400' };
    case 'white':
      return { bg: 'bg-slate-900 text-slate-200 border border-slate-700', text: 'text-slate-200' };
    default:
      return { bg: 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/30', text: 'text-cyan-400' };
  }
}

interface PinListProps {
  pins: PlacemarkPin[];
  projectId: string;
  selectedPinId: string | null;
  onSelectPin: (id: string | null) => void;
}

export function PinList({ pins, projectId, selectedPinId, onSelectPin }: PinListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'matched' | 'unmatched'>('all');

  // Filter pins based on search and selected filter mode
  const filteredPins = pins.filter(pin => {
    const matchesSearch =
      pin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.styleUrl.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (filterMode === 'matched') return pin.isMatch;
    if (filterMode === 'unmatched') return !pin.isMatch;
    return true;
  });

  return (
    <div id="pins-list-container" className="bg-slate-950/40 border border-slate-800 rounded-xl shadow-inner flex flex-col h-[520px] backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-800 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Placemarks Directory</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredPins.length} of {pins.length} pins
            </p>
          </div>
          
          {/* Quick filters */}
          <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg text-[11px] font-medium border border-slate-800">
            <button
              id="filter-all"
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-slate-200 shadow-inner font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              id="filter-matched"
              type="button"
              onClick={() => setFilterMode('matched')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterMode === 'matched'
                  ? 'bg-cyan-950/40 text-cyan-400 shadow-inner font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Matched
            </button>
            <button
              id="filter-unmatched"
              type="button"
              onClick={() => setFilterMode('unmatched')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterMode === 'unmatched'
                  ? 'bg-slate-800 text-slate-300 shadow-inner'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Unmatched
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            id="pin-search"
            type="text"
            placeholder="Search pins by label or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Pins Directory List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-950/10">
        {filteredPins.length > 0 ? (
          filteredPins.map((pin) => {
            const isSelected = pin.id === selectedPinId;
            return (
              <div
                key={pin.id}
                onClick={() => onSelectPin(pin.id)}
                className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer select-none ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)] scale-[1.01]'
                    : pin.isCamera
                      ? 'bg-slate-900/10 border-emerald-900/30 hover:border-emerald-800/50 hover:bg-slate-900/30'
                      : pin.isMatch
                        ? 'bg-slate-900/40 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-slate-900/60 shadow-sm'
                        : 'bg-slate-900/20 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 shadow-sm'
                }`}
              >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Custom icon indicating color/type and match */}
                {pin.isCamera ? (
                  <div className="p-2 rounded-lg shrink-0 bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                    <Video className="w-4 h-4" />
                  </div>
                ) : (
                  <div className={`p-2 rounded-lg shrink-0 ${
                    pin.isMatch 
                      ? getPinColorClasses(pin.detectedColor, true).bg 
                      : getPinColorClasses(pin.detectedColor, false).bg
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                )}

                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center space-x-2">
                    {pin.isMatch && pin.previewName !== pin.name ? (
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 truncate">
                        <span className="text-slate-500 line-through truncate max-w-[80px] md:max-w-[120px] inline-block">{pin.name}</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="text-cyan-400 bg-cyan-950/40 px-1 rounded truncate">{pin.previewName}</span>
                      </div>
                    ) : (
                      <span className={`text-xs font-semibold truncate ${pin.isCamera ? 'text-emerald-300/90' : 'text-slate-200'}`}>
                        {pin.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                    {pin.folderName && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 flex items-center shrink-0">
                        <span className="w-1 h-1 rounded-full bg-cyan-400/80 mr-1.5 inline-block"></span>
                        {pin.folderName}
                      </span>
                    )}
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded truncate max-w-[140px]" title={`Style: ${pin.styleUrl}`}>
                      {pin.styleUrl || '(Inline Style)'}
                    </span>
                    {pin.isCamera ? (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                        Camera / Movie
                      </span>
                    ) : pin.detectedColor && pin.detectedColor !== 'unknown' ? (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                        pin.detectedColor === 'yellow' ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-500/20' :
                        pin.detectedColor === 'blue' ? 'bg-blue-950/60 text-blue-400 border border-blue-500/20' :
                        pin.detectedColor === 'green' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' :
                        pin.detectedColor === 'cyan' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20' :
                        pin.detectedColor === 'pink' ? 'bg-pink-950/60 text-pink-400 border border-pink-500/20' :
                        pin.detectedColor === 'purple' ? 'bg-purple-950/60 text-purple-400 border border-purple-500/20' :
                        pin.detectedColor === 'red' ? 'bg-red-950/60 text-red-400 border border-red-500/20' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {pin.detectedColor} pin
                      </span>
                    ) : null}
                    {pin.coordinates && (
                      <span className="text-[9px] text-slate-500 truncate">
                        Coord: {pin.coordinates.split(',').slice(0, 2).join(',')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match/Action Status Badge */}
              <div className="shrink-0 text-right">
                {pin.isMatch ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Rename
                  </span>
                ) : pin.isCamera ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-500 border border-emerald-900/40">
                    Skip Camera
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/50 text-slate-500 border border-slate-800">
                    Skip Style
                  </span>
                )}
              </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2 h-full">
            <Info className="w-6 h-6 text-slate-600" />
            <p className="text-xs font-medium">No pins found matching search/filter</p>
          </div>
        )}
      </div>

      {/* Legend / Info Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[10px] text-slate-500 flex items-center justify-between shrink-0 rounded-b-xl">
        <span className="flex items-center">
          <Filter className="w-3.5 h-3.5 mr-1 text-slate-500" />
          Legend:
        </span>
        <div className="flex items-center space-x-3 font-semibold">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 mr-1 inline-block shadow-[0_0_6px_#06b6d4]"></span>
            Will Rename
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-slate-600 mr-1 inline-block"></span>
            Keep original
          </span>
        </div>
      </div>
    </div>
  );
}
