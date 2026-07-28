/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Upload, FileCode, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  errorMessage: string | null;
}

export function UploadZone({ onFileSelect, onFileRemove, selectedFile, errorMessage }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.kmz') || file.name.toLowerCase().endsWith('.kml')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div id="upload-zone-container" className="w-full">
      <input
        id="kmz-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".kmz"
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`w-full py-10 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 text-center flex flex-col items-center justify-center ${
              isDragging
                ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400 scale-[1.01]'
                : 'border-slate-700 hover:border-cyan-500/50 bg-slate-900/20 hover:bg-slate-900/40 text-slate-400'
            }`}
          >
            <div className={`p-4 rounded-full mb-4 transition-all duration-300 ring-8 ring-slate-950/60 ${isDragging ? 'bg-cyan-950 text-cyan-400 ring-cyan-950/40' : 'bg-slate-800 text-slate-400'}`}>
              <Upload className="w-6 h-6 animate-pulse" />
            </div>
            
            <p className="text-sm font-semibold text-slate-200 mb-1">
              {isDragging ? 'Drop your KMZ file here' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-slate-500">
              Only Google Earth KMZ files are supported
            </p>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-2.5 bg-red-950/40 rounded-lg text-xs font-medium text-red-400 border border-red-900/50"
                onClick={(e) => e.stopPropagation()} // Prevent triggering file picker
              >
                {errorMessage}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full p-5 bg-slate-900/50 border border-slate-800 rounded-xl shadow-inner flex items-center justify-between"
          >
            <div className="flex items-center space-x-4 min-w-0">
              <div className="p-3 bg-slate-800 text-cyan-400 rounded-lg shrink-0">
                <FileCode className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-xs text-slate-500">{formatSize(selectedFile.size)}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
                    <Check className="w-3 h-3 mr-0.5" /> Loaded
                  </span>
                </div>
              </div>
            </div>

            <button
              id="remove-file-button"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove();
              }}
              className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
