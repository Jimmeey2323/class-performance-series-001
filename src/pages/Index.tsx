
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    toast({
      title: "Files selected",
      description: `${newFiles.length} files have been added.`,
    });
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProgress(0);

    // Simulate processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    setIsProcessing(false);
    toast({
      title: "Processing complete",
      description: "All files have been processed successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-8 px-4 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Studio Analytics Dashboard</h1>
          <p className="text-gray-600">Upload your CSV files to analyze studio performance metrics</p>
        </div>

        <Card className="p-6">
          <FileUploader
            onFilesSelected={handleFilesSelected}
            isProcessing={isProcessing}
            progress={progress}
          />
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={processFiles}
              disabled={files.length === 0 || isProcessing}
            >
              Process Files
            </Button>
          </div>
        </Card>

        {/* Placeholder for data tables and metrics */}
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Kwality House, Kemps Corner</h2>
            <DataTable
              data={[]}
              columns={[
                { header: "Teacher", accessorKey: "teacher" },
                { header: "Period", accessorKey: "period" },
                { header: "New Clients", accessorKey: "newClients" },
                { header: "Retention Rate", accessorKey: "retentionRate" },
              ]}
              location="Kwality House, Kemps Corner"
            />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
