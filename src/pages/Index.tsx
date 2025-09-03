
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
      // Dynamically find the first .zip file in the public folder
      fetch('/public')
        .then((res) => res.text())
        .then((html) => {
          // Parse the HTML directory listing to find .zip files
          const matches = html.match(/href="([^"]+\.zip)"/gi);
          if (!matches || matches.length === 0) throw new Error('No ZIP file found in public folder');
          // Use the first zip file found
          const zipFileName = matches[0].replace(/href=|"/g, '');
          return fetch(`/${zipFileName}`);
        })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch ZIP file');
          return res.blob();
        })
        .then((blob) => {
          // Convert blob to File object
          const file = new File([blob], 'default.zip', { type: blob.type });
          setProgress(30);
          return processZipFile(file);
        })
        .then((processedData) => {
          setProgress(70);
          if (processedData && processedData.length > 0) {
            setData(processedData);
            setFileUploaded(true);
            setProgress(100);
            toast({
              title: 'Default file loaded',
              description: `Loaded ${processedData.length} records from the default ZIP file.`,
              duration: 3000
            });
          } else {
            throw new Error('No data found or processed in default ZIP');
          }
        })
        .catch((error) => {
          console.error('Error loading default ZIP:', error);
          toast({
            title: 'Error loading default ZIP',
            description: error.message || 'There was an error loading the default ZIP file.',
            variant: 'destructive',
            duration: 5000
          });
        })
        .finally(() => {
          setTimeout(() => {
            setLoading(false);
          }, 1000);
        });
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
