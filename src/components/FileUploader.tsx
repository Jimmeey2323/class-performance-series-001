
import React, { useState, useCallback } from 'react';
import { Upload, FileType, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  progress: number;
}

const FileUploader = ({ onFilesSelected, isProcessing, progress }: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === "text/csv"
    );
    
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        file => file.type === "text/csv"
      );
      setSelectedFiles(prev => [...prev, ...files]);
      onFilesSelected(files);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300",
          "hover:border-primary hover:bg-primary/5"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="w-12 h-12 text-gray-400" />
          <div className="text-lg font-medium">
            Drag & drop CSV files here or
            <label className="mx-2 text-primary hover:underline cursor-pointer">
              browse
              <input
                type="file"
                multiple
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">
            Supported files: CSV
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Selected Files:</h3>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li key={index} className="text-sm text-gray-600">
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Loader2 className="animate-spin" />
            <span>Processing files...</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default FileUploader;
