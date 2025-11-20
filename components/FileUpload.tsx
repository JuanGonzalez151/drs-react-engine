import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileUpload: (fileContent: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setError("INVALID FORMAT. CSV REQUIRED.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileUpload(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-mono mb-4 border border-red-500/20">
            <span>READY FOR INGESTION</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white mb-4 uppercase">
            Telemetry Ingestion
          </h1>
          <p className="text-lg text-slate-400 max-w-lg mx-auto">
            Upload raw csv stream. The DRS Engine will perform auto-grounding, strategy calculation, and visualization.
          </p>
        </div>

        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative group cursor-pointer overflow-hidden rounded-none border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? 'border-red-500 bg-red-900/10'
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-900'
          }`}
        >
          <input
            type="file"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-20"
            onChange={handleInputChange}
            accept=".csv"
          />
          
          {/* Tech/Grid Background */}
          <div className="absolute inset-0 opacity-10 z-0" 
               style={{ 
                 backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
               }}>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 p-12">
            <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border transition-all duration-500 ${
                isDragging ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-slate-600 bg-slate-800 text-slate-400 group-hover:border-slate-400 group-hover:text-white'
            }`}>
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {/* Rotating ring effect */}
              <div className={`absolute inset-0 rounded-full border border-dashed border-current opacity-30 ${isDragging ? 'animate-spin' : ''}`}></div>
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-xl font-bold text-white tracking-wide">
                DROP DATA STREAM
              </p>
              <p className="font-mono text-xs text-slate-500 uppercase">
                Target Format: .CSV (Max 10MB)
              </p>
            </div>
          </div>
          
          {/* Corner Markers */}
          <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-slate-500"></div>
          <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-slate-500"></div>
          <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-slate-500"></div>
          <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-slate-500"></div>
        </div>
        
        {error && (
          <div className="mt-4 flex items-center gap-3 rounded-none border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};