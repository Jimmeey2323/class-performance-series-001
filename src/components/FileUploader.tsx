import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileUp, FilePlus, File, FileArchive, Check, X, Sparkles, TrendingUp, UploadCloud, Trash2, Loader, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, animate } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

// Utility function for combining class names
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = motion(Component as any);

  const dynamicSpread = React.useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text',
        'text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]',
        '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]',
        'dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]',
        className
      )}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}

interface MousePosition {
  x: number;
  y: number;
}

function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return mousePosition;
}

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace('#', '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const hexInt = parseInt(hex, 16);
  const red = (hexInt >> 16) & 255;
  const green = (hexInt >> 8) & 255;
  const blue = hexInt & 255;
  return [red, green, blue];
}

const Particles: React.FC<ParticlesProps> = ({
  className = '',
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = '#ffffff',
  vx = 0,
  vy = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mousePosition = useMousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext('2d');
    }
    initCanvas();
    animate();
    window.addEventListener('resize', initCanvas);

    return () => {
      window.removeEventListener('resize', initCanvas);
    };
  }, [color]);

  useEffect(() => {
    onMouseMove();
  }, [mousePosition.x, mousePosition.y]);

  useEffect(() => {
    initCanvas();
  }, [refresh]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const onMouseMove = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = mousePosition.x - rect.left - w / 2;
      const y = mousePosition.y - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
      if (inside) {
        mouse.current.x = x;
        mouse.current.y = y;
      }
    }
  };

  type Circle = {
    x: number;
    y: number;
    translateX: number;
    translateY: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    dx: number;
    dy: number;
    magnetism: number;
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0;
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const pSize = Math.floor(Math.random() * 2) + size;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.1;
    const dy = (Math.random() - 0.5) * 0.1;
    const magnetism = 0.1 + Math.random() * 4;
    return {
      x,
      y,
      translateX,
      translateY,
      size: pSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism,
    };
  };

  const rgb = hexToRgb(color);

  const drawCircle = (circle: Circle, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.current.translate(translateX, translateY);
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = `rgba(${rgb.join(', ')}, ${alpha})`;
      context.current.fill();
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!update) {
        circles.current.push(circle);
      }
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h,
      );
    }
  };

  const drawParticles = () => {
    clearContext();
    const particleCount = quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  };

  const remapValue = (
    value: number,
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ): number => {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const animate = () => {
    clearContext();
    circles.current.forEach((circle: Circle, i: number) => {
      const edge = [
        circle.x + circle.translateX - circle.size,
        canvasSize.current.w - circle.x - circle.translateX - circle.size,
        circle.y + circle.translateY - circle.size, 
        canvasSize.current.h - circle.y - circle.translateY - circle.size,
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(
        remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
      );
      if (remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha) {
          circle.alpha = circle.targetAlpha;
        }
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;
      circle.translateX +=
        (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) /
        ease;
      circle.translateY +=
        (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) /
        ease;

      drawCircle(circle, true);

      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        circles.current.splice(i, 1);
        const newCircle = circleParams();
        drawCircle(newCircle);
      }
    });
    window.requestAnimationFrame(animate);
  };

  return (
    <div
      className={cn('pointer-events-none', className)}
      ref={canvasContainerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

interface FileWithPreview {
  id: string;
  preview: string;
  progress: number;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  file?: File;
}

const COLORS_TOP = ['#13FFAA', '#1E67C6', '#CE84CF', '#DD335C'];

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'ready' | 'error'>('idle');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: 'easeInOut',
      duration: 10,
      repeat: Infinity,
      repeatType: 'mirror',
    });
  }, []);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #020617 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

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

  const handleFiles = (fileList: FileList) => {
    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setUploadState('ready');
        
        const newFiles = Array.from(fileList).map((f) => ({
          id: `${URL.createObjectURL(f)}-${Date.now()}`,
          preview: URL.createObjectURL(f),
          progress: 0,
          name: f.name,
          size: f.size,
          type: f.type,
          lastModified: f.lastModified,
          file: f,
        }));
        
        setFiles(newFiles);
        newFiles.forEach((f) => simulateUpload(f.id));
      } else {
        setSelectedFile(file);
        setUploadState('error');
      }
    }
  };

  const simulateUpload = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: Math.min(progress, 100) } : f,
        ),
      );
      if (progress >= 100) {
        clearInterval(interval);
        if (navigator.vibrate) navigator.vibrate(100);
      }
    }, 300);
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
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 w-full">
      {/* Combined Hero and Upload Section */}
      <motion.section
        style={{
          backgroundImage,
        }}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-12 text-gray-200"
      >
        <Particles
          className="absolute inset-0"
          quantity={150}
          ease={80}
          color="#ffffff"
          refresh
        />

        <div className="absolute inset-0 z-0">
          <Canvas>
            <Stars radius={50} count={2500} factor={4} fade speed={2} />
          </Canvas>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center w-full px-4 max-w-6xl">
          {/* Hero Content */}
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-block rounded-full bg-gray-600/50 px-4 py-2 text-sm font-medium"
          >
            Real-time Processing • Advanced Analytics • Interactive Dashboards
          </motion.span>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <TextShimmer
              as="h1"
              className="max-w-4xl bg-gradient-to-br from-white to-gray-400 bg-clip-text text-center text-3xl font-bold leading-tight text-transparent sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight"
              duration={3}
            >
              Attendance Analytics & Class Performance Index
            </TextShimmer>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12 max-w-3xl text-center text-lg leading-relaxed text-gray-300 md:text-xl md:leading-relaxed"
          >
            Transform your fitness studio data into actionable insights with our powerful analytics engine. 
            Upload your class data and unlock comprehensive performance metrics, trainer comparisons, and growth opportunities.
          </motion.p>

          {/* File Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="w-full max-w-4xl"
          >
            {!selectedFile ? (
              <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                initial={false}
                animate={{
                  borderColor: isDragging ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  scale: isDragging ? 1.02 : 1,
                }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'relative rounded-2xl p-12 text-center cursor-pointer bg-white/5 border border-white/10 shadow-lg hover:shadow-xl backdrop-blur-sm',
                  isDragging && 'ring-4 ring-blue-400/30 border-blue-500',
                )}
              >
                <div className="flex flex-col items-center gap-6">
                  <motion.div
                    animate={{ y: isDragging ? [-5, 0, -5] : 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: isDragging ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                    className="relative"
                  >
                    <motion.div
                      animate={{
                        opacity: isDragging ? [0.5, 1, 0.5] : 1,
                        scale: isDragging ? [0.95, 1.05, 0.95] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: isDragging ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                      className="absolute -inset-4 bg-blue-400/10 rounded-full blur-md"
                      style={{ display: isDragging ? 'block' : 'none' }}
                    />
                    <UploadCloud
                      className={cn(
                        'w-20 h-20 drop-shadow-sm',
                        isDragging
                          ? 'text-blue-400'
                          : 'text-gray-300 group-hover:text-blue-400 transition-colors duration-300',
                      )}
                    />
                  </motion.div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold text-white">
                      {isDragging
                        ? 'Drop ZIP files here'
                        : files.length
                        ? 'Add more ZIP files'
                        : 'Upload your ZIP files'}
                    </h3>
                    <p className="text-gray-300 text-lg max-w-md mx-auto">
                      {isDragging ? (
                        <span className="font-medium text-blue-400">
                          Release to upload
                        </span>
                      ) : (
                        <>
                          Drag & drop ZIP files here, or{' '}
                          <span className="text-blue-400 font-medium">browse</span>
                        </>
                      )}
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports ZIP files containing CSV data with pattern 
                      <span className="font-mono bg-white/10 px-2 py-1 rounded text-blue-400 ml-1">
                        "momence-teachers-payroll-report-aggregate-combined"
                      </span>
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".zip"
                    onChange={handleFileInput}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="border-0 rounded-2xl p-10 bg-white/5 shadow-2xl backdrop-blur-sm" 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-col items-center space-y-8">
                  <motion.div 
                    className={`p-8 rounded-full shadow-lg ${
                      uploadState === 'ready' 
                        ? 'bg-gradient-to-br from-green-400/20 to-green-600/20' 
                        : 'bg-gradient-to-br from-red-400/20 to-red-600/20'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    {uploadState === 'ready' ? (
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <FileArchive className="h-16 w-16 text-green-400" />
                      </motion.div>
                    ) : (
                      <X className="h-16 w-16 text-red-400" />
                    )}
                  </motion.div>
                  
                  <div className="space-y-6 w-full max-w-md">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white">File Selected</h3>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {uploadState === 'ready' ? (
                            <span className="text-sm bg-green-400/20 text-green-300 px-3 py-1 rounded-full flex items-center font-medium">
                              <Check className="mr-1 h-4 w-4" />
                              Ready to Process
                            </span>
                          ) : (
                            <span className="text-sm bg-red-400/20 text-red-300 px-3 py-1 rounded-full flex items-center font-medium">
                              <X className="mr-1 h-4 w-4" />
                              Invalid Format
                            </span>
                          )}
                        </motion.div>
                      </div>
                      
                      <motion.div 
                        className="flex items-center border-2 border-white/10 rounded-xl p-4 bg-gradient-to-r from-white/5 to-white/10 shadow-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="bg-blue-400/20 p-3 rounded-lg mr-4">
                          <File className="h-8 w-8 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold truncate text-white">{selectedFile.name}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </motion.div>
                      
                      {uploadState === 'error' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-400/10 border border-red-400/20 rounded-lg p-4"
                        >
                          <p className="text-sm text-red-300 font-medium">
                            ⚠️ Please select a valid ZIP file containing your class analytics data.
                          </p>
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1"
                      >
                        <Button 
                          variant="outline" 
                          onClick={resetSelection} 
                          className="w-full py-3 bg-white/10 hover:bg-white/20 shadow-md border-white/20 text-white"
                        >
                          Select Different File
                        </Button>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: uploadState === 'ready' ? 1.02 : 1 }}
                        whileTap={{ scale: uploadState === 'ready' ? 0.98 : 1 }}
                        className="flex-1"
                      >
                        <Button 
                          onClick={uploadFile} 
                          disabled={uploadState !== 'ready'} 
                          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Upload className="mr-2 h-5 w-5" />
                          Process Data
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* File List */}
            <div className="mt-8 max-w-4xl mx-auto">
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-between items-center mb-4 px-2"
                  >
                    <h3 className="font-semibold text-xl text-white">
                      Uploaded files ({files.length})
                    </h3>
                    {files.length > 1 && (
                      <button
                        onClick={() => setFiles([])}
                        className="text-sm font-medium px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-gray-300 hover:text-red-400 transition-colors duration-200"
                      >
                        Clear all
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-96">
                <AnimatePresence>
                  {files.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                      className="px-4 py-4 flex items-start gap-4 rounded-xl bg-white/5 shadow hover:shadow-md transition-all duration-200"
                    >
                      <div className="relative flex-shrink-0">
                        <File className="w-16 h-16 text-blue-400" />
                        {file.progress === 100 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -right-2 -bottom-2 bg-gray-800 rounded-full shadow-sm"
                          >
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          </motion.div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center gap-2 min-w-0">
                            <File className="w-5 h-5 flex-shrink-0 text-blue-400" />
                            <h4
                              className="font-medium text-lg truncate text-white"
                              title={file.name}
                            >
                              {file.name}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between gap-3 text-sm text-gray-400">
                            <span className="text-sm">
                              {formatFileSize(file.size)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="font-medium">
                                {Math.round(file.progress)}%
                              </span>
                              {file.progress < 100 ? (
                                <Loader className="w-4 h-4 animate-spin text-blue-400" />
                              ) : (
                                <Trash2
                                  className="w-4 h-4 cursor-pointer text-gray-400 hover:text-red-400 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFiles((prev) =>
                                      prev.filter((f) => f.id !== file.id),
                                    );
                                  }}
                                  aria-label="Remove file"
                                />
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{
                              duration: 0.4,
                              type: 'spring',
                              stiffness: 100,
                              ease: 'easeOut',
                            }}
                            className={cn(
                              'h-full rounded-full shadow-inner',
                              file.progress < 100 ? 'bg-blue-500' : 'bg-emerald-500',
                            )}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer Signature */}
      <footer className="relative py-8 bg-gray-950 w-full">
        <div className="text-center">
          <p className="text-gray-400 text-lg" style={{ fontFamily: 'Brush Script MT, cursive' }}>
            Project by Jimmeey
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FileUploader;
