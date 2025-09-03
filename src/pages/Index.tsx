
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '@/components/FileUploader';
import Dashboard from '@/components/Dashboard';
import { ProcessedData, ViewMode } from '@/types/data';
import { processZipFile } from '@/utils/fileProcessing';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const Index = () => {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load default zip file from public folder on mount
  React.useEffect(() => {
    if (!fileUploaded) {
      setLoading(true);
      setProgress(10);
      // Try to fetch the first zip file in public starting with the given prefix
      const zipPrefix = 'momence-teachers-payroll-report-summary';
      // Try a few possible extensions
      const possibleExtensions = ['.zip'];
      // Try a few possible files (if more than one, pick the first that exists)
      const possibleFiles = [
        `${zipPrefix}.zip`,
        `${zipPrefix} (1).zip`,
        `${zipPrefix} (2).zip`,
        `${zipPrefix} (3).zip`,
        `${zipPrefix} (4).zip`,
        `${zipPrefix} (5).zip`,
        `${zipPrefix} (6).zip`,
        `${zipPrefix} (7).zip`,
        `${zipPrefix} (8).zip`,
        `${zipPrefix} (9).zip`,
        `${zipPrefix} (10).zip`,
        `${zipPrefix} (11).zip`,
        `${zipPrefix} (12).zip`,
        `${zipPrefix} (13).zip`,
        `${zipPrefix} (14).zip`,
        `${zipPrefix} (15).zip`,
        `${zipPrefix} (16).zip`,
        `${zipPrefix} (17).zip`,
        `${zipPrefix} (18).zip`,
        `${zipPrefix} (19).zip`,
        `${zipPrefix} (20).zip`,
      ];
      (async () => {
        let found = false;
        for (const filename of possibleFiles) {
          try {
            const res = await fetch(`/${filename}`);
            if (res.ok) {
              found = true;
              const blob = await res.blob();
              const file = new File([blob], filename, { type: blob.type });
              setProgress(30);
              const processedData = await processZipFile(file);
              setProgress(70);
              if (processedData && processedData.length > 0) {
                setData(processedData);
                setFileUploaded(true);
                setProgress(100);
                toast({
                  title: 'Default file loaded',
                  description: `Loaded ${processedData.length} records from the default ZIP file (${filename}).`,
                  duration: 3000
                });
              } else {
                throw new Error('No data found or processed in default ZIP');
              }
              break;
            }
          } catch (error) {
            // Try next file
          }
        }
        if (!found) {
          toast({
            title: 'Error loading default ZIP',
            description: 'No ZIP file found in public folder with the expected prefix.',
            variant: 'destructive',
            duration: 5000
          });
        }
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      })();
    }
  }, [fileUploaded]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setProgress(10);
    try {
      setProgress(30);
      const processedData = await processZipFile(file);
      setProgress(70);
      if (processedData && processedData.length > 0) {
        setData(processedData);
        setFileUploaded(true);
        setProgress(100);
        toast({
          title: 'File processed successfully',
          description: `Processed ${processedData.length} records from the file.`,
          duration: 3000
        });
      } else {
        throw new Error('No data found or processed');
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error processing file',
        description: error.message || 'There was an error processing your file. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  const handleReset = () => {
    setData([]);
    setFileUploaded(false);
    setProgress(0);
  };

  const handleLogout = () => {
    navigate('/auth');
  };
  
  return (
    <div className="min-h-screen">
      <FileUploader onFileUpload={handleFileUpload} />
      {fileUploaded && (
        <div className="bg-slate-50 dark:bg-gray-900 min-h-screen">
          <Dashboard 
            data={data} 
            loading={loading} 
            progress={progress} 
            onReset={handleReset} 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            onLogout={handleLogout} 
          />
        </div>
      )}
    </div>
  );
};

export default Index;
