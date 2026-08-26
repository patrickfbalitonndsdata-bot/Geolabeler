/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Filter, 
  Video, 
  CheckSquare, 
  Square, 
  Edit3, 
  Check, 
  X, 
  RotateCcw,
  CheckCheck,
  Ban
} from 'lucide-react';
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
  onTogglePinAction: (id: string) => void;
  onBatchSetPinAction: (ids: string[], action: 'rename' | 'skip') => void;
  onSetCustomPinName: (id: string, customName: string) => void;
  onResetPinOverrides: () => void;
}

export function PinList({ 
  pins, 
  projectId, 
  selectedPinId, 
  onSelectPin,
  onTogglePinAction,
  onBatchSetPinAction,
  onSetCustomPinName,
  onResetPinOverrides
}: PinListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'matched' | 'unmatched' | 'camera'>('all');
  const [selectedPinIds, setSelectedPinIds] = useState<Set<string>>(new Set());
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [editInputVal, setEditInputVal] = useState<string>('');

  // Counts
  const matchedCount = useMemo(() => pins.filter(p => p.isMatch).length, [pins]);
  const unmatchedCount = useMemo(() => pins.filter(p => !p.isMatch).length, [pins]);
  const cameraCount = useMemo(() => pins.filter(p => p.isCamera).length, [pins]);
  const hasManualOverrides = useMemo(() => pins.some(p => p.userOverride !== undefined || p.customPreviewName !== undefined), [pins]);

  // Filter pins based on search and selected filter mode
  const filteredPins = useMemo(() => {
    return pins.filter(pin => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        pin.name.toLowerCase().includes(q) ||
        pin.previewName.toLowerCase().includes(q) ||
        pin.styleUrl.toLowerCase().includes(q) ||
        (pin.folderName && pin.folderName.toLowerCase().includes(q));
        
      if (!matchesSearch) return false;
      
      if (filterMode === 'matched') return pin.isMatch;
      if (filterMode === 'unmatched') return !pin.isMatch;
      if (filterMode === 'camera') return pin.isCamera;
      return true;
    });
  }, [pins, searchQuery, filterMode]);

  // Selection helpers
  const allFilteredSelected = filteredPins.length > 0 && filteredPins.every(p => selectedPinIds.has(p.id));
  const someFilteredSelected = filteredPins.some(p => selectedPinIds.has(p.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Unselect all filtered
      const next = new Set(selectedPinIds);
      filteredPins.forEach(p => next.delete(p.id));
      setSelectedPinIds(next);
    } else {
      // Select all filtered
      const next = new Set(selectedPinIds);
      filteredPins.forEach(p => next.add(p.id));
      setSelectedPinIds(next);
    }
  };

  const handleTogglePinSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedPinIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPinIds(next);
  };

  // Batch action executions
  const handleBatchRenameSelected = () => {
    const ids = Array.from<string>(selectedPinIds);
    if (ids.length > 0) {
      onBatchSetPinAction(ids, 'rename');
      setSelectedPinIds(new Set());
    }
  };

  const handleBatchSkipSelected = () => {
    const ids = Array.from<string>(selectedPinIds);
    if (ids.length > 0) {
      onBatchSetPinAction(ids, 'skip');
      setSelectedPinIds(new Set());
    }
  };

  // Inline edit handlers
  const handleStartEdit = (pin: PlacemarkPin, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPinId(pin.id);
    setEditInputVal(pin.customPreviewName || pin.previewName || pin.name);
  };

  const handleSaveEdit = (pinId: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    if (editInputVal.trim()) {
      onSetCustomPinName(pinId, editInputVal.trim());
    }
    setEditingPinId(null);
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPinId(null);
  };

  return (
    <div id="pins-list-container" className="bg-slate-950/40 border border-slate-800 rounded-xl shadow-inner flex flex-col h-[540px] backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-800 space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span>Placemarks Directory</span>
              {hasManualOverrides && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Custom Overrides Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredPins.length} of {pins.length} pins ({matchedCount} to rename, {unmatchedCount} skipped)
            </p>
          </div>
          
          {/* Quick filters */}
          <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg text-[11px] font-medium border border-slate-800 shrink-0 self-start sm:self-auto">
            <button
              id="filter-all"
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2 py-1 rounded-md transition-all ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-slate-200 shadow-inner font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              All ({pins.length})
            </button>
            <button
              id="filter-matched"
              type="button"
              onClick={() => setFilterMode('matched')}
              className={`px-2 py-1 rounded-md transition-all ${
                filterMode === 'matched'
                  ? 'bg-cyan-950/40 text-cyan-400 shadow-inner font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Matched ({matchedCount})
            </button>
            <button
              id="filter-unmatched"
              type="button"
              onClick={() => setFilterMode('unmatched')}
              className={`px-2 py-1 rounded-md transition-all ${
                filterMode === 'unmatched'
                  ? 'bg-slate-800 text-slate-300 shadow-inner'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Unmatched ({unmatchedCount})
            </button>
            {cameraCount > 0 && (
              <button
                id="filter-camera"
                type="button"
                onClick={() => setFilterMode('camera')}
                className={`px-2 py-1 rounded-md transition-all ${
                  filterMode === 'camera'
                    ? 'bg-emerald-950/40 text-emerald-400 shadow-inner font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Cameras ({cameraCount})
              </button>
            )}
          </div>
        </div>

        {/* Search Input & Batch Action Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              id="pin-search"
              type="text"
              placeholder="Search pins by label, preview, folder, or style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick All-action toggle buttons */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              id="quick-rename-all-btn"
              type="button"
              title="Set all filtered pins to Rename"
              onClick={() => onBatchSetPinAction(filteredPins.map(p => p.id), 'rename')}
              className="px-2 py-2 text-xs bg-slate-900 hover:bg-cyan-950/40 text-slate-400 hover:text-cyan-400 border border-slate-800 hover:border-cyan-800/50 rounded-lg transition-all flex items-center gap-1 font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rename All</span>
            </button>
            <button
              id="quick-skip-all-btn"
              type="button"
              title="Set all filtered pins to Skip"
              onClick={() => onBatchSetPinAction(filteredPins.map(p => p.id), 'skip')}
              className="px-2 py-2 text-xs bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-300 border border-slate-800 rounded-lg transition-all flex items-center gap-1 font-medium"
            >
              <Ban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Skip All</span>
            </button>
            {hasManualOverrides && (
              <button
                id="quick-reset-overrides-btn"
                type="button"
                title="Reset manual overrides to default detection"
                onClick={onResetPinOverrides}
                className="px-2 py-2 text-xs bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 rounded-lg transition-all flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Batch Selection Banner (when pins are selected) */}
        {selectedPinIds.size > 0 && (
          <div className="flex items-center justify-between bg-cyan-950/30 border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-cyan-300 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="font-bold">{selectedPinIds.size}</span>
              <span>pin{selectedPinIds.size > 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleBatchRenameSelected}
                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-[11px] shadow-sm flex items-center gap-1 transition-all"
              >
                <Check className="w-3 h-3" />
                Set to Rename
              </button>
              <button
                type="button"
                onClick={handleBatchSkipSelected}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-700 rounded text-[11px] flex items-center gap-1 transition-all"
              >
                <X className="w-3 h-3" />
                Set to Skip
              </button>
              <button
                type="button"
                onClick={() => setSelectedPinIds(new Set())}
                className="text-slate-400 hover:text-slate-200 text-[11px] underline ml-1"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pins Directory List Header Bar */}
      <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-semibold text-slate-400 shrink-0">
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center space-x-1.5 hover:text-slate-200 text-slate-400 transition-colors cursor-pointer"
            title={allFilteredSelected ? 'Deselect all filtered pins' : 'Select all filtered pins'}
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            ) : someFilteredSelected ? (
              <div className="w-3.5 h-3.5 rounded bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-sm"></div>
              </div>
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>Select All</span>
          </button>
        </div>
        <span className="text-slate-500 uppercase tracking-wider">Click button to toggle Rename / Skip</span>
      </div>

      {/* Pins Directory List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-950/10">
        {filteredPins.length > 0 ? (
          filteredPins.map((pin) => {
            const isSelected = pin.id === selectedPinId;
            const isChecked = selectedPinIds.has(pin.id);
            const isEditing = editingPinId === pin.id;

            return (
              <div
                key={pin.id}
                onClick={() => onSelectPin(pin.id)}
                className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer select-none group ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)] scale-[1.008]'
                    : isChecked
                      ? 'bg-slate-900/70 border-cyan-500/40 shadow-sm'
                      : pin.isMatch
                        ? 'bg-slate-900/40 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-slate-900/60 shadow-sm'
                        : pin.isCamera
                          ? 'bg-slate-900/15 border-slate-800 hover:border-emerald-800/40 hover:bg-slate-900/30'
                          : 'bg-slate-900/20 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => handleTogglePinSelect(pin.id, e)}
                    className="shrink-0 text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                    title={isChecked ? 'Unselect pin' : 'Select pin'}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                    )}
                  </button>

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

                  {/* Name and preview details */}
                  <div className="min-w-0 flex-1 pr-3">
                    {isEditing ? (
                      <form 
                        onSubmit={(e) => handleSaveEdit(pin.id, e)}
                        className="flex items-center space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editInputVal}
                          onChange={(e) => setEditInputVal(e.target.value)}
                          autoFocus
                          className="px-2 py-0.5 text-xs bg-slate-900 border border-cyan-500 rounded text-slate-100 focus:outline-none w-full max-w-xs font-semibold"
                          placeholder="Enter custom renamed label..."
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveEdit(pin.id, e)}
                          className="p-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded transition-colors"
                          title="Save custom name"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center space-x-2 flex-wrap">
                        {pin.isMatch && pin.previewName !== pin.name ? (
                          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 truncate">
                            <span className="text-slate-500 line-through truncate max-w-[80px] md:max-w-[130px] inline-block" title={`Original: ${pin.name}`}>
                              {pin.name}
                            </span>
                            <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30 truncate font-semibold">
                              {pin.previewName}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-xs font-semibold truncate ${pin.isCamera ? 'text-emerald-300/90' : 'text-slate-200'}`}>
                            {pin.name}
                          </span>
                        )}

                        {/* Edit Button for manual custom rename */}
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(pin, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-cyan-400 p-0.5 transition-all"
                          title="Edit custom label for this pin"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        {/* Manual override badge */}
                        {pin.userOverride && (
                          <span className="text-[8px] uppercase tracking-wider font-extrabold px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                            Manual
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Metadata Badges */}
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

                {/* Interactive Action Toggle Button */}
                <div className="shrink-0 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinAction(pin.id);
                    }}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm ${
                      pin.isMatch
                        ? 'bg-cyan-950/80 hover:bg-rose-950/60 text-cyan-300 hover:text-rose-300 border border-cyan-500/40 hover:border-rose-500/40'
                        : pin.isCamera
                          ? 'bg-slate-900/80 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40'
                          : 'bg-slate-900/80 hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40'
                    }`}
                    title={pin.isMatch ? 'Click to Skip this pin' : 'Click to Rename this pin'}
                  >
                    {pin.isMatch ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                        <span>Rename</span>
                      </>
                    ) : pin.isCamera ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        <span>Skip Camera</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        <span>Skip</span>
                      </>
                    )}
                  </button>
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
        <div className="flex items-center space-x-4 font-semibold">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 mr-1.5 inline-block shadow-[0_0_6px_#06b6d4]"></span>
            Will Rename ({matchedCount})
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-slate-600 mr-1.5 inline-block"></span>
            Keep original ({unmatchedCount})
          </span>
        </div>
      </div>
    </div>
  );
}
