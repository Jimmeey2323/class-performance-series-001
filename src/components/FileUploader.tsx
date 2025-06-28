import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileUp, FilePlus, File, FileArchive, Check, X, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}
const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'ready' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  const handleFiles = (files: FileList) => {
    if (files.length > 0) {
      if (files[0].name.endsWith('.zip')) {
        setSelectedFile(files[0]);
        setUploadState('ready');
      } else {
        setSelectedFile(files[0]);
        setUploadState('error');
      }
    }
  };
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const uploadFile = () => {
    if (selectedFile && uploadState === 'ready' && onFileUpload) {
      onFileUpload(selectedFile);
    }
  };
  const resetSelection = () => {
    setSelectedFile(null);
    setUploadState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  return <div className="max-w-6xl mx-auto space-y-8">
      {/* Enhanced Hero Section */}
      <div className="text-center space-y-6 py-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-70">
          <motion.div className="absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full" animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }} transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
          <motion.div className="absolute top-20 right-20 w-16 h-16 bg-purple-400 rounded-full" animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.2, 0.4]
        }} transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }} />
          <motion.div className="absolute bottom-20 left-20 w-12 h-12 bg-green-400 rounded-full" animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2]
        }} transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }} />
        </div>

        <motion.div initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} className="relative z-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }} transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }} className="bg-blue-500/20 p-4 rounded-full backdrop-blur-sm">
              <TrendingUp className="h-12 w-12 text-blue-300" />
            </motion.div>
            <motion.div animate={{
            y: [0, -10, 0],
            opacity: [0.7, 1, 0.7]
          }} transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }} className="bg-purple-500/20 p-3 rounded-full backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-purple-300" />
            </motion.div>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Class Analytics
            </span>
            <br />
            <span className="text-white">Intelligence Platform</span>
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Transform your fitness studio data into actionable insights with our powerful analytics engine. 
            Upload your class data and unlock comprehensive performance metrics, trainer comparisons, and growth opportunities.
          </p>
          
          <div className="flex items-center justify-center gap-8 mt-8 text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Real-time Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Advanced Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Interactive Dashboards</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      <AnimatePresence mode="wait">
        {!selectedFile ? <motion.div className={`
              relative rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300 
              ${isDragging ? 'border-primary bg-primary/5 shadow-2xl scale-105' : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-primary/5 shadow-xl'}
              bg-gradient-to-br from-white via-slate-50 to-white
            `} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={triggerFileInput} initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} transition={{
        duration: 0.4
      }} whileHover={{
        scale: 1.02
      }} whileTap={{
        scale: 0.98
      }}>
            <div className="flex flex-col items-center justify-center space-y-8">
              <motion.div className="bg-gradient-to-br from-primary/20 to-primary/10 p-8 rounded-full shadow-lg" whileHover={{
            scale: 1.1,
            rotate: 5
          }} transition={{
            type: "spring",
            stiffness: 300
          }}>
                <motion.div animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.05, 1]
            }} transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut"
            }}>
                  <FileArchive className="h-20 w-20 text-primary" />
                </motion.div>
              </motion.div>
              
              <div className="flex flex-col space-y-4 text-center max-w-2xl">
                <h3 className="text-2xl font-bold text-slate-800">Upload Your Class Data</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Drop your ZIP file here or click to browse. We'll automatically detect and process your class analytics data.
                </p>
                <div className="bg-slate-100 rounded-lg p-4 mt-4">
                  <p className="text-sm text-slate-600 font-medium">
                    📊 Supported format: ZIP files containing CSV data with pattern 
                    <span className="font-mono bg-white px-2 py-1 rounded text-primary">
                      "momence-teachers-payroll-report-aggregate-combined"
                    </span>
                  </p>
                </div>
              </div>
              
              <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
                <Button type="button" size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg">
                  <FileUp className="mr-3 h-5 w-5" />
                  Select ZIP File
                </Button>
              </motion.div>
            </div>
            
            <input ref={fileInputRef} type="file" className="hidden" accept=".zip" onChange={handleFileInput} />
          </motion.div> : <motion.div className="border-0 rounded-2xl p-10 bg-white shadow-2xl" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} transition={{
        duration: 0.4
      }}>
            <div className="flex flex-col items-center space-y-8">
              <motion.div className={`
                  p-8 rounded-full shadow-lg
                  ${uploadState === 'ready' ? 'bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20' : 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20'}
                `} initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} transition={{
            type: "spring",
            stiffness: 200,
            delay: 0.2
          }}>
                {uploadState === 'ready' ? <motion.div animate={{
              rotate: [0, 360]
            }} transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}>
                    <FileArchive className="h-16 w-16 text-green-600 dark:text-green-400" />
                  </motion.div> : <X className="h-16 w-16 text-red-600 dark:text-red-400" />}
              </motion.div>
              
              <div className="space-y-6 w-full max-w-md">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-slate-800">File Selected</h3>
                    <motion.div initial={{
                  scale: 0
                }} animate={{
                  scale: 1
                }} transition={{
                  delay: 0.3
                }}>
                      {uploadState === 'ready' ? <span className="text-sm bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-3 py-1 rounded-full flex items-center font-medium">
                          <Check className="mr-1 h-4 w-4" />
                          Ready to Process
                        </span> : <span className="text-sm bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-3 py-1 rounded-full flex items-center font-medium">
                          <X className="mr-1 h-4 w-4" />
                          Invalid Format
                        </span>}
                    </motion.div>
                  </div>
                  
                  <motion.div className="flex items-center border-2 border-slate-200 rounded-xl p-4 bg-gradient-to-r from-slate-50 to-white shadow-sm" initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: 0.4
              }}>
                    <div className="bg-primary/10 p-3 rounded-lg mr-4">
                      <File className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold truncate text-slate-800">{selectedFile.name}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </motion.div>
                  
                  {uploadState === 'error' && <motion.div initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700 font-medium">
                        ⚠️ Please select a valid ZIP file containing your class analytics data.
                      </p>
                    </motion.div>}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <motion.div whileHover={{
                scale: 1.02
              }} whileTap={{
                scale: 0.98
              }} className="flex-1">
                    <Button variant="outline" onClick={resetSelection} className="w-full py-3 bg-white hover:bg-slate-50 shadow-md border-slate-200">
                      Select Different File
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{
                scale: uploadState === 'ready' ? 1.02 : 1
              }} whileTap={{
                scale: uploadState === 'ready' ? 0.98 : 1
              }} className="flex-1">
                    <Button onClick={uploadFile} disabled={uploadState !== 'ready'} className="w-full py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 disabled:from-slate-300 disabled:to-slate-400 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Upload className="mr-2 h-5 w-5" />
                      Process Data
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};
export default FileUploader;