import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Download, 
  X,
  HelpCircle
} from 'lucide-react';
import { parseGoogleAdsCSV } from '../utils/parser';
import { downloadSampleCSVFile } from '../utils/sampleData';

export default function FileUploader({ 
  isOpen, 
  onClose, 
  onDataParsed, 
  onLoadSample 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please select a valid .csv file exported from Google Ads.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setFileDetails({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });

    try {
      const parsedResult = await parseGoogleAdsCSV(file);
      setIsProcessing(false);
      onDataParsed(parsedResult.rows, file.name);
      onClose();
    } catch (err) {
      setIsProcessing(false);
      setError(err.message || 'Failed to parse Google Ads CSV file. Please check column headers.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Upload Google Ads Search Terms CSV</h2>
              <p className="text-xs text-slate-400">Powered by PapaParse • Automatic Header Detection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/50 hover:bg-slate-950/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,text/csv"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {isProcessing ? 'Analyzing and parsing CSV...' : 'Click to select CSV or drag and drop here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Google Ads Search Terms Report (.csv)
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-[11px] text-slate-400 border border-slate-700/50">
                <FileText className="w-3 h-3" />
                <span>Auto-maps: Search term, Clicks, Impressions, Cost, Conversions, CPA, ROAS</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Parse Error: </span>
                {error}
              </div>
            </div>
          )}

          {/* How to export info */}
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Where to find this report in Google Ads:</span>
            </div>
            <p>
              In Google Ads, go to <span className="text-slate-300">Campaigns → Insights and reports → Search terms</span>, select your date range, and click <span className="text-slate-300">Download → .csv</span>.
            </p>
          </div>

          {/* Quick Alternative Actions */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={downloadSampleCSVFile}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample CSV Template
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLoadSample();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Sample Demo Dataset
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
