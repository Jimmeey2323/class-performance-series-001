import React, { useState, useEffect } from 'react';
import { ProcessedData, ViewMode, FilterOption, SortOption } from '@/types/data';
import ViewSwitcherWrapper from './ViewSwitcherWrapper';
import { DataTable } from '@/components/DataTable';
import SimpleDataFilters from '@/components/SimpleDataFilters';
import MetricsPanel from '@/components/MetricsPanel';
import ChartPanel from '@/components/ChartPanel';
import TopBottomClasses from '@/components/TopBottomClasses';
import GridView from '@/components/views/GridView';
import KanbanView from '@/components/views/KanbanView';
import TimelineView from '@/components/views/TimelineView';
import PivotView from '@/components/views/PivotView';
import SearchBar from '@/components/SearchBar';
import TrainerComparisonView from '@/components/TrainerComparisonView';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { exportToCSV } from '@/utils/fileProcessing';
import { 
  Upload, 
  BarChart3, 
  Download, 
  RefreshCw, 
  Search,
  FileText,
  FileSpreadsheet,
  FileJson,
  Users,
  ChevronDown,
  ChevronUp,
  Filter,
  X
} from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { Card, CardContent } from '@/components/ui/card';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface DashboardProps {
  data: ProcessedData[];
  loading: boolean;
  progress: number;
  onReset: () => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  onLogout: () => void;
}

export const trainerAvatars: Record<string, string> = {
  "Siddhartha Kusuma": "https://i.imgur.com/XE0p6mW.jpg",
  "Shruti Suresh": "https://i.imgur.com/dBuz7oK.jpg",
  "Poojitha Bhaskar": "https://i.imgur.com/dvPLVXg.jpg",
  "Pushyank Nahar": "https://i.imgur.com/aHAJw6U.jpg",
  "Shruti Kulkarni": "https://i.imgur.com/CW2ZOUy.jpg",
  "Karan Bhatia": "https://i.imgur.com/y6d1H2z.jpg",
  "Pranjali Jain": "https://i.imgur.com/Hx8hTAk.jpg",
  "Anisha Shah": "https://i.imgur.com/7GM2oPn.jpg",
  "Saniya Jaiswal": "https://i.imgur.com/EP32RoZ.jpg",
  "Vivaran Dhasmana": "https://i.imgur.com/HGrGuq9.jpg",
  "Kajol Kanchan": "https://i.imgur.com/v9x0pFa.jpg"
};

const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  loading, 
  progress, 
  onReset,
  viewMode,
  setViewMode,
  onLogout
}) => {
  const [filteredData, setFilteredData] = useState<ProcessedData[]>([]);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrainerComparison, setShowTrainerComparison] = useState(false);

  useEffect(() => {
    if (!data.length) return;

    const today = new Date();
    let result = data.filter(item => {
      if (item.period) {
        const [month, year] = item.period.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = months.indexOf(month);
        const fullYear = 2000 + parseInt(year);
        const periodDate = new Date(fullYear, monthIndex);
        return periodDate <= today;
      }
      return true;
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        )
      );
    }

    if (filters.length > 0) {
      result = result.filter(item => {
        return filters.every(filter => {
          if (filter.field === 'period' && filter.operator === 'in') {
            const selectedPeriods = filter.value.split(',');
            return selectedPeriods.some(period => item.period === period);
          }
          
          const fieldValue = String(item[filter.field]);
          
          switch (filter.operator) {
            case 'contains':
              return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
            case 'equals':
              return fieldValue.toLowerCase() === filter.value.toLowerCase();
            case 'starts':
              return fieldValue.toLowerCase().startsWith(filter.value.toLowerCase());
            case 'ends':
              return fieldValue.toLowerCase().endsWith(filter.value.toLowerCase());
            case 'greater':
              return Number(fieldValue) > Number(filter.value);
            case 'less':
              return Number(fieldValue) < Number(filter.value);
            case 'after':
              if (filter.field === 'date') {
                const itemDate = new Date(fieldValue.split(',')[0]);
                const filterDate = new Date(filter.value);
                return itemDate >= filterDate;
              }
              return true;
            case 'before':
              if (filter.field === 'date') {
                const itemDate = new Date(fieldValue.split(',')[0]);
                const filterDate = new Date(filter.value);
                return itemDate <= filterDate;
              }
              return true;
            default:
              return true;
          }
        });
      });
    }

    if (sortOptions.length > 0) {
      result.sort((a, b) => {
        for (const sort of sortOptions) {
          const valueA = a[sort.field];
          const valueB = b[sort.field];
          
          const isNumeric = !isNaN(Number(valueA)) && !isNaN(Number(valueB));
          
          let comparison = 0;
          if (sort.field === 'date') {
            // Special date handling
            const dateA = new Date(String(valueA).split(',')[0]);
            const dateB = new Date(String(valueB).split(',')[0]);
            comparison = dateA.getTime() - dateB.getTime();
          } else if (isNumeric) {
            comparison = Number(valueA) - Number(valueB);
          } else {
            comparison = String(valueA).localeCompare(String(valueB));
          }
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        
        return 0;
      });
    }
    
    setFilteredData(result);
  }, [data, filters, sortOptions, searchQuery]);

  const handleFilterChange = (newFilters: FilterOption[]) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSortOptions: SortOption[]) => {
    setSortOptions(newSortOptions);
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    if (format === 'csv') {
      exportToCSV(filteredData);
    } else if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "class_data.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } else if (format === 'excel') {
      exportToCSV(filteredData);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-12 min-h-[60vh]">
        <motion.h2 
          className="text-2xl font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Processing Data
        </motion.h2>
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <ProgressBar progress={progress} />
        </motion.div>
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-lg font-medium mb-2">Analyzed 
            <span className="text-primary mx-1 font-bold">
              <CountUp 
                end={data.length} 
                duration={2}
              />
            </span> 
            records so far
          </p>
          <p className="text-sm text-muted-foreground">Please wait while we process your file...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border-b shadow-md sticky top-0 z-50 backdrop-blur-md bg-white/95">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center">
            <motion.img 
              src="https://i.imgur.com/9mOm7gP.png" 
              alt="Logo" 
              className="h-10 w-auto mr-3"
              initial={{ rotate: 0, scale: 0.9 }}
              animate={{ rotate: 360, scale: 1 }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.5, ease: "easeOut" }
              }}
            />
            <div>
              <motion.h1 
                className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-slate-200 dark:to-slate-400"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Class Analytics Dashboard
              </motion.h1>
              <motion.p 
                className="text-xs text-slate-500 dark:text-slate-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {filteredData.length} Classes | {filters.length} Active Filters
              </motion.p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              className="bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Upload New
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md transition-all duration-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-lg shadow-xl border-none rounded-lg">
                <DropdownMenuItem onClick={() => handleExport('csv')} className="hover:bg-primary/10">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')} className="hover:bg-primary/10">
                  <FileText className="mr-2 h-4 w-4" />
                  Export for Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')} className="hover:bg-primary/10">
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowTrainerComparison(!showTrainerComparison)}
              className={`hidden sm:flex items-center gap-1.5 transition-all duration-300 ${
                showTrainerComparison 
                ? 'bg-primary/20 border-primary/30 text-primary' 
                : 'bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md'
              }`}
            >
              <Users className="mr-1 h-4 w-4" />
              Trainer View {showTrainerComparison ? 'On' : 'Off'}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onLogout}
              className="hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-4">
          <SearchBar onSearch={handleSearchChange} data={data} />
        </div>

        <SimpleDataFilters 
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          data={data}
          filtersCount={filters.length}
        />

        <MetricsPanel data={filteredData} />
        
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="lg:col-span-3 bg-white/90 backdrop-blur-sm shadow-lg border-none rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <TopBottomClasses data={filteredData} trainerAvatars={trainerAvatars} />
            </CardContent>
          </Card>
        </motion.div>
        
        <AnimatePresence>
          {showTrainerComparison && (
            <motion.div 
              className="grid grid-cols-1 gap-6 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-none rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <TrainerComparisonView data={filteredData} trainerAvatars={trainerAvatars} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <ViewSwitcherWrapper viewMode={viewMode} setViewMode={setViewMode} />

        <motion.div 
          className="bg-white/90 backdrop-blur-sm border-none rounded-xl shadow-lg mb-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {viewMode === 'table' && <DataTable data={filteredData} trainerAvatars={trainerAvatars} />}
          {viewMode === 'grid' && <GridView data={filteredData} trainerAvatars={trainerAvatars} />}
          {viewMode === 'kanban' && <KanbanView data={filteredData} trainerAvatars={trainerAvatars} />}
          {viewMode === 'timeline' && <TimelineView data={filteredData} trainerAvatars={trainerAvatars} />}
          {viewMode === 'pivot' && <PivotView data={filteredData} trainerAvatars={trainerAvatars} />}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ChartPanel data={filteredData} />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
