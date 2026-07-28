/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  SlidersHorizontal, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Globe, 
  HelpCircle, 
  Info, 
  FileEdit,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { KMZData } from './types';
import { UploadZone } from './components/UploadZone';
import { FileStats } from './components/FileStats';
import { PinList } from './components/PinList';
import { parseKMZFile, updatePinPreviews, processAndGenerateKMZ } from './utils/kmzParser';

export default function App() {
  // Application States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState('');
  const [targetStyle, setTargetStyle] = useState('PointStyleMap20');
  const [renameCameras, setRenameCameras] = useState(false);
  const [cameraPrefix, setCameraPrefix] = useState('CAM');
  
  const [kmzData, setKmzData] = useState<KMZData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  // Parse file whenever a new one is selected
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    setProcessedBlob(null);
    setIsSuccess(false);
    setSelectedPinId(null);

    try {
      const data = await parseKMZFile(file, targetStyle, projectId, renameCameras, cameraPrefix);
      setKmzData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse KMZ file.');
      setSelectedFile(null);
      setKmzData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setKmzData(null);
    setProcessedBlob(null);
    setIsSuccess(false);
    setError(null);
    setSelectedPinId(null);
  };

  // Re-calculate previews whenever Project ID, Target Style, renameCameras, or cameraPrefix changes
  useEffect(() => {
    if (kmzData) {
      const updatedPins = updatePinPreviews(kmzData.pins, projectId, targetStyle, renameCameras, cameraPrefix);
      setKmzData({
        ...kmzData,
        pins: updatedPins,
      });
    }
  }, [projectId, targetStyle, renameCameras, cameraPrefix]);

  // Execute processing & rename
  const handleProcessFile = async () => {
    if (!kmzData) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const blob = await processAndGenerateKMZ(
        kmzData.zip,
        kmzData.xmlDoc,
        kmzData.kmlFileName,
        projectId,
        targetStyle,
        renameCameras,
        cameraPrefix
      );
      setProcessedBlob(blob);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download final processed file
  const handleDownload = () => {
    if (!processedBlob || !selectedFile) return;

    // Create download link
    const cleanId = projectId.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    const originalNameWithoutExt = selectedFile.name.replace(/\.kmz$/i, '');
    const outputFilename = `${cleanId}_${originalNameWithoutExt}.kmz`;

    const url = URL.createObjectURL(processedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = outputFilename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle preset clicks for project ID format helper
  const applyPresetId = (id: string) => {
    setProjectId(id);
  };

  // Handle clicking a style in style distribution table to target it
  const handleStyleClick = (styleUrl: string) => {
    // Extract style id by removing leading # if present
    const cleanStyle = styleUrl.startsWith('#') ? styleUrl.substring(1) : styleUrl;
    setTargetStyle(cleanStyle);
    setShowAdvanced(true);
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#020617] text-slate-200 flex flex-col antialiased relative overflow-x-hidden">
      {/* Atmospheric Background Glows */}
      <div className="fixed top-[-100px] right-[-100px] w-[400px] h-[400px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Upper Navigation Bar */}
      <header id="app-header" className="bg-slate-950/50 border-b border-slate-800 backdrop-blur-md shrink-0 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-cyan-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] text-slate-900 shrink-0">
              <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Globe/Geospatial mesh lines */}
                <circle cx="16" cy="16" r="11" stroke="#0f172a" stroke-width="1.8" />
                <ellipse cx="16" cy="16" rx="11" ry="4" stroke="#0f172a" stroke-width="1.2" />
                <line x1="16" y1="5" x2="16" y2="27" stroke="#0f172a" stroke-width="1.2" />
                <line x1="5" y1="16" x2="27" y2="16" stroke="#0f172a" stroke-width="1.2" />
                
                {/* Pencil drawing/labeling tool overlay */}
                <g transform="translate(3, -3)">
                  <path d="M12,24 L24,12 L26,14 L14,26 Z" fill="#1e293b" opacity="0.3" />
                  <path d="M11,25 L23,13 L26,16 L14,28 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.2" />
                  <path d="M11,25 L8,28 L14,28 Z" fill="#eab308" stroke="#0f172a" stroke-width="1.2" />
                  <path d="M9.5,26.5 L8,28 L11,26.5 Z" fill="#0f172a" />
                  <path d="M23,13 L24.5,11.5 C25,11 25.8,11 26.3,11.5 C26.8,12 26.8,12.8 26.3,13.3 L25,14.8 Z" fill="#f43f5e" stroke="#0f172a" stroke-width="1.2" />
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                GEO-ID <span className="text-cyan-400 font-normal">RENAMER</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">KMZ file Pushpin Project Naming Application</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="text-slate-500 font-mono">v4.2.0 Stable</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:grid md:grid-cols-12 gap-6 min-h-0 relative z-10">
        {/* Left Side: Processing controls & config (5 Cols) */}
        <div className="md:col-span-5 flex flex-col space-y-5">
          
          {/* Card 1: Configuration panel */}
          <section id="config-panel" className="bg-slate-950/30 border border-slate-800 rounded-xl p-5 shadow-inner space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold flex items-center">
                <FileEdit className="w-4 h-4 mr-2 text-cyan-400" />
                Project Configuration
              </h2>
            </div>

            {/* Input 1: Project number ID */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="project-id-input" className="text-xs text-slate-400 ml-1">
                  Project Number ID
                </label>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-900/30 px-1.5 py-0.5 rounded-full">
                  Required
                </span>
              </div>
              <input
                id="project-id-input"
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. 26-999999"
                className="w-full bg-slate-900 border border-slate-750 rounded-lg py-2.5 px-4 text-cyan-400 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none shadow-inner text-xs"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Suffix prepended to matched pins.</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-medium text-slate-600">Preset:</span>
                  <button
                    id="preset-id-btn"
                    type="button"
                    onClick={() => applyPresetId('26-999999')}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono"
                  >
                    26-999999
                  </button>
                </div>
              </div>
            </div>

            {/* Input 1b: Camera Pins Renaming option */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-300">Rename Camera Pins</span>
                  <span className="text-[10px] text-slate-500">Optionally prepend a custom prefix to camera/movie icons</span>
                </div>
                <label htmlFor="rename-cameras-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="rename-cameras-toggle"
                    type="checkbox"
                    checked={renameCameras}
                    onChange={(e) => setRenameCameras(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950 peer-checked:after:border-transparent"></div>
                </label>
              </div>

              <AnimatePresence>
                {renameCameras && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden space-y-1.5 pt-1"
                  >
                    <label htmlFor="camera-prefix-input" className="text-[10px] font-semibold text-slate-400 block ml-1">
                      Camera Pins Prefix
                    </label>
                    <input
                      id="camera-prefix-input"
                      type="text"
                      value={cameraPrefix}
                      onChange={(e) => setCameraPrefix(e.target.value)}
                      placeholder="e.g. CAM"
                      className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 px-3 text-emerald-400 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none text-xs"
                    />
                    <p className="text-[9px] text-slate-500">
                      Prefix prepended to camera labels. E.g. <span className="font-mono text-emerald-400">CAM-CAM 7099</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input 2: Upload Zone */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 ml-1 block">
                Upload KMZ File
              </label>
              <UploadZone
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                errorMessage={error}
              />
            </div>

            {/* Logic explanation card */}
            <div className="p-4 rounded-lg bg-cyan-950/10 border border-cyan-900/20">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 mb-1">Logic Rules</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {targetStyle.toLowerCase() === 'pointstylemap20' ? (
                  <>Detects and targets all standard Google Earth pushpin icons (e.g. yellow, blue, green, cyan, pink, purple, red, white). Matched pins will be prepended with the Project ID prefix.</>
                ) : (
                  <>Matches pins with styleUrl or icon href containing <code className="text-cyan-300 font-mono font-bold bg-cyan-950/40 px-1 rounded">{targetStyle}</code>. Matched pins will be prepended with the Project ID prefix.</>
                )}
              </p>
            </div>

            {/* Advanced Options accordion (Target Style) */}
            <div className="border-t border-slate-800 pt-3">
              <button
                id="toggle-advanced-button"
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
              >
                <span className="flex items-center">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                  Advanced Target Selector
                </span>
                <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-full text-slate-400 font-mono">
                  {targetStyle}
                </span>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-3 space-y-2.5 bg-slate-900/30 p-3 rounded-lg border border-slate-800"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="target-style-input" className="text-[11px] font-semibold text-slate-400">
                          Target Pin Style Match Key
                        </label>
                        <span className="text-[9px] text-slate-500">Case-insensitive</span>
                      </div>
                      <input
                        id="target-style-input"
                        type="text"
                        value={targetStyle}
                        onChange={(e) => setTargetStyle(e.target.value)}
                        placeholder="PointStyleMap20"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-750 rounded-md text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Scans for placemarks referencing styleUrls containing this key. Usually <strong>PointStyleMap20</strong> refers to standard blue placemark pin assets.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Execute processing buttons */}
            <div className="pt-2">
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.button
                    id="process-kmz-button"
                    key="btn-process"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    type="button"
                    onClick={handleProcessFile}
                    disabled={!kmzData || isProcessing || (!projectId.trim() && (!renameCameras || !cameraPrefix.trim()))}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      !kmzData || (!projectId.trim() && (!renameCameras || !cameraPrefix.trim()))
                        ? 'bg-slate-900/50 text-slate-500 border border-slate-800 cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                        PROCESSING ARCHIVE...
                      </>
                    ) : (
                      <>
                        <span>PROCESS KMZ FILE</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.div
                    key="btn-success-download"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-2.5"
                  >
                    <div className="flex items-start space-x-2 p-3 bg-emerald-950/20 text-emerald-300 rounded-lg text-xs border border-emerald-900/30 font-medium">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
                      <span>
                        Successfully processed KMZ file! Matched pins renamed with prefix <strong>"{projectId}"</strong>.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="reset-process-button"
                        type="button"
                        onClick={() => {
                          setProcessedBlob(null);
                          setIsSuccess(false);
                        }}
                        className="w-full py-2.5 px-3 border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Reset / Edit ID
                      </button>
                      <button
                        id="download-kmz-button"
                        type="button"
                        onClick={handleDownload}
                        className="w-full py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.01] text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD KMZ</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Card 2: Stats breakdown */}
          <FileStats 
            data={kmzData} 
            targetStyle={targetStyle} 
            onStyleClick={handleStyleClick} 
          />
        </div>

        {/* Right Side: Pin list viewer with live preview (7 Cols) */}
        <div className="md:col-span-7 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-950/30 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center h-full min-h-[400px] space-y-4"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-200">Reading KMZ Archive</p>
                  <p className="text-xs text-slate-500 mt-1">Extracting styles, styleUrls and placemark name tags...</p>
                </div>
              </motion.div>
            ) : kmzData ? (
              <motion.div
                key="pins-directory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 min-h-0"
              >
                <PinList 
                  pins={kmzData.pins} 
                  projectId={projectId} 
                  selectedPinId={selectedPinId}
                  onSelectPin={setSelectedPinId}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-950/20 border border-slate-800 border-dashed rounded-xl p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center"
              >
                <div className="p-4 bg-slate-900 text-cyan-400 rounded-full mb-4 ring-8 ring-slate-950/50">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-1">No KMZ file loaded</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-normal">
                  Upload a Google Earth `.kmz` file to visualize its pins, analyze style structures, and preview the target rename rules.
                </p>
                
                <div className="mt-6 p-4 bg-slate-950/40 border border-slate-800 rounded-lg max-w-md text-left text-xs text-slate-400 space-y-2">
                  <span className="font-semibold text-slate-300 flex items-center">
                    <Info className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                    How does the automated rename work?
                  </span>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400">
                    <li>We unzip the archive client-side and parse the XML document containing the placemark data.</li>
                    <li>Standard pushpins and paddles (such as yellow, blue, green, cyan, pink, purple, red, and white) are automatically detected and target-matched.</li>
                    <li>The system prepends your entered <strong>Project ID</strong> (e.g. <code>26-999999-</code>) to the beginning of their labels (name tags).</li>
                    <li>All other pins, maps, imagery, and files remain completely unchanged.</li>
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Info block */}
      <footer id="app-footer" className="bg-slate-950 border-t border-slate-800 py-4 shrink-0 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p>© 2026 GEO-ID RENAMER. Powered by React, Vite and Tailwind. All unzipping and processing happens securely inside your browser.</p>
            <p className="text-[11px] text-slate-600 mt-1">Developed by <span className="text-cyan-500/90 font-semibold">Patrick Franz O.B.</span></p>
          </div>
          <div className="flex gap-6 uppercase font-bold text-[10px]">
            <span className="text-slate-600">Terms</span>
            <span className="text-slate-600">Privacy</span>
            <span className="text-cyan-900/80">Geospatial Engine v4.2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
