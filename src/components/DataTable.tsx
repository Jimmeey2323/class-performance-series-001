import React, { useState, useEffect, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Settings, Eye, EyeOff, Layers, Type, Palette, Bookmark, BookmarkX, Filter, MapPin, Calendar, BarChart3, Clock, ListFilter, User, ListChecks, IndianRupee, LayoutGrid, LayoutList, Kanban, LineChart, Download, SlidersHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trainerAvatars } from './Dashboard';
import { formatIndianCurrency } from './MetricsPanel';
import { motion, AnimatePresence } from 'framer-motion';
interface DataTableProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

// Define column type for better type safety
interface ColumnDefinition {
  key: string;
  label: string;
  numeric: boolean;
  currency: boolean;
  iconComponent?: React.ReactNode;
  visible?: boolean;
}
interface GroupedDataItem {
  key: string;
  teacherName: string;
  teacherEmail: string;
  cleanedClass: string;
  dayOfWeek: string;
  classTime: string;
  location: string;
  period: string;
  date: string;
  children: ProcessedData[];
  totalCheckins: number;
  totalRevenue: number;
  totalOccurrences: number;
  totalCancelled: number;
  totalEmpty: number;
  totalNonEmpty: number;
  totalNonPaid: number;
  totalPayout: number;
  totalTips: number;
  classAverageIncludingEmpty: number | string;
  classAverageExcludingEmpty: number | string;
  isChild?: boolean;
}
export function DataTable({
  data,
  trainerAvatars
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    teacherName: true,
    location: true,
    cleanedClass: true,
    dayOfWeek: true,
    period: true,
    date: true,
    classTime: true,
    totalCheckins: true,
    totalRevenue: true,
    totalOccurrences: true,
    classAverageIncludingEmpty: true,
    classAverageExcludingEmpty: true,
    totalCancelled: true
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [viewMode, setViewMode] = useState("default");
  const [groupBy, setGroupBy] = useState("class-day-time-location");
  const [tableView, setTableView] = useState("grouped");
  const [rowHeight, setRowHeight] = useState(35);
  const [expandAllGroups, setExpandAllGroups] = useState(false);
  useEffect(() => {
    if (tableView === "grouped") {
      const newExpandedState: Record<string, boolean> = {};
      const currentKeys = groupedData.map((group: GroupedDataItem) => group.key);
      currentKeys.forEach((key: string) => {
        newExpandedState[key] = expandAllGroups;
      });
      setExpandedRows(newExpandedState);
    }
  }, [expandAllGroups, tableView]);

  // Filter out "Hosted" classes
  const filteredData = useMemo(() => {
    return data.filter(item => !item.cleanedClass?.toLowerCase().includes('hosted'));
  }, [data]);

  // Group data by selected grouping option - memoized for performance
  const groupedData = useMemo((): GroupedDataItem[] => {
    // If flat mode is activated, return data as individual items
    if (tableView === "flat") {
      return filteredData.map((item, index) => ({
        key: `flat-${item.uniqueID || index}`,
        teacherName: item.teacherName || '',
        teacherEmail: item.teacherEmail || '',
        cleanedClass: item.cleanedClass || '',
        dayOfWeek: item.dayOfWeek || '',
        classTime: item.classTime || '',
        location: item.location || '',
        period: item.period || '',
        date: item.date || '',
        totalRevenue: typeof item.totalRevenue === 'string' ? parseFloat(item.totalRevenue) || 0 : item.totalRevenue || 0,
        totalCheckins: Number(item.totalCheckins || 0),
        totalOccurrences: 1,
        totalCancelled: Number(item.totalCancelled || 0),
        totalEmpty: item.totalCheckins === 0 ? 1 : 0,
        totalNonEmpty: item.totalCheckins > 0 ? 1 : 0,
        totalNonPaid: Number(item.totalNonPaid || 0),
        totalPayout: Number(item.totalPayout || 0),
        totalTips: Number(item.totalTips || 0),
        classAverageIncludingEmpty: Number(item.classAverageIncludingEmpty || 0),
        classAverageExcludingEmpty: item.classAverageExcludingEmpty || 0,
        isChild: true,
        children: []
      }));
    }
    const getGroupKey = (item: ProcessedData): string => {
      switch (groupBy) {
        case "class-day-time-location-trainer":
          return `${item.cleanedClass}|${item.dayOfWeek}|${item.classTime}|${item.location}|${item.teacherName}`;
        case "class-day-time-location":
          return `${item.cleanedClass}|${item.dayOfWeek}|${item.classTime}|${item.location}`;
        case "class-day-time":
          return `${item.cleanedClass}|${item.dayOfWeek}|${item.classTime}`;
        case "class-time":
          return `${item.cleanedClass}|${item.classTime}`;
        case "class-day":
          return `${item.cleanedClass}|${item.dayOfWeek}`;
        case "class-location":
          return `${item.cleanedClass}|${item.location}`;
        case "day-time":
          return `${item.dayOfWeek}|${item.classTime}`;
        case "location":
          return `${item.location}`;
        case "trainer":
          return `${item.teacherName}`;
        case "month":
          {
            const dateStr = item.date;
            if (dateStr) {
              try {
                const date = new Date(dateStr.split(',')[0]);
                return date.toLocaleString('default', {
                  month: 'long',
                  year: 'numeric'
                });
              } catch {
                return "Unknown";
              }
            }
            return "Unknown";
          }
        case "none":
        default:
          return `row-${filteredData.indexOf(item)}`;
      }
    };
    const groups: Record<string, GroupedDataItem> = {};
    filteredData.forEach(item => {
      const groupKey = getGroupKey(item);
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          teacherName: item.teacherName || '',
          teacherEmail: item.teacherEmail || '',
          cleanedClass: item.cleanedClass || '',
          dayOfWeek: item.dayOfWeek || '',
          classTime: item.classTime || '',
          location: item.location || '',
          period: item.period || '',
          date: item.date || '',
          children: [],
          totalCheckins: 0,
          totalRevenue: 0,
          totalOccurrences: 0,
          totalCancelled: 0,
          totalEmpty: 0,
          totalNonEmpty: 0,
          totalNonPaid: 0,
          totalPayout: 0,
          totalTips: 0,
          classAverageIncludingEmpty: 0,
          classAverageExcludingEmpty: 0
        };
      }

      // Add to children array
      groups[groupKey].children.push({
        ...item
      });

      // Update metrics for group aggregation
      groups[groupKey].totalCheckins += Number(item.totalCheckins || 0);
      const revenue = typeof item.totalRevenue === 'string' ? parseFloat(item.totalRevenue) || 0 : item.totalRevenue || 0;
      groups[groupKey].totalRevenue += revenue;
      groups[groupKey].totalOccurrences += 1;
      groups[groupKey].totalCancelled += Number(item.totalCancelled || 0);
      groups[groupKey].totalEmpty += Number(item.totalCheckins || 0) === 0 ? 1 : 0;
      groups[groupKey].totalNonEmpty += Number(item.totalCheckins || 0) > 0 ? 1 : 0;
      groups[groupKey].totalNonPaid += Number(item.totalNonPaid || 0);
      groups[groupKey].totalPayout += Number(item.totalPayout || 0);
      groups[groupKey].totalTips += Number(item.totalTips || 0);
    });

    // Calculate averages for each group
    Object.values(groups).forEach((group: GroupedDataItem) => {
      group.classAverageIncludingEmpty = group.totalOccurrences > 0 ? Number((group.totalCheckins / group.totalOccurrences).toFixed(1)) : 0;
      group.classAverageExcludingEmpty = group.totalNonEmpty > 0 ? Number((group.totalCheckins / group.totalNonEmpty).toFixed(1)) : 'N/A';
    });
    return Object.values(groups);
  }, [filteredData, groupBy, tableView]);
  const groupingOptions = [{
    id: "class-day-time-location-trainer",
    label: "Class + Day + Time + Location + Trainer"
  }, {
    id: "class-day-time-location",
    label: "Class + Day + Time + Location"
  }, {
    id: "class-day-time",
    label: "Class + Day + Time"
  }, {
    id: "class-time",
    label: "Class + Time"
  }, {
    id: "class-day",
    label: "Class + Day"
  }, {
    id: "class-location",
    label: "Class + Location"
  }, {
    id: "day-time",
    label: "Day + Time"
  }, {
    id: "location",
    label: "Location"
  }, {
    id: "trainer",
    label: "Trainer"
  }, {
    id: "month",
    label: "Month"
  }, {
    id: "none",
    label: "No Grouping"
  }];
  const viewModes = [{
    id: "default",
    label: "Default View"
  }, {
    id: "compact",
    label: "Compact View"
  }, {
    id: "detailed",
    label: "Detailed View"
  }, {
    id: "financials",
    label: "Financial Focus"
  }, {
    id: "attendance",
    label: "Attendance Focus"
  }, {
    id: "trainer",
    label: "Trainer Focus"
  }, {
    id: "analytics",
    label: "Analytics View"
  }, {
    id: "all",
    label: "All Columns"
  }];
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedData;
    const searchLower = searchTerm.toLowerCase();
    return groupedData.filter((group: GroupedDataItem) => {
      if (tableView === "flat") {
        return Object.values(group).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower));
      }
      const parentMatch = [group.teacherName, group.cleanedClass, group.dayOfWeek, group.location, group.classTime, group.period].some(field => field && String(field).toLowerCase().includes(searchLower));
      if (parentMatch) return true;
      if (group.children && group.children.length > 0) {
        return group.children.some((child: ProcessedData) => Object.values(child).some(val => val !== null && val !== undefined && typeof val === 'string' && val.toLowerCase().includes(searchLower)));
      }
      return false;
    });
  }, [groupedData, searchTerm, tableView]);
  const sortedGroups = useMemo(() => {
    if (!sortConfig) return filteredGroups;
    return [...filteredGroups].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof GroupedDataItem];
      const bValue = b[sortConfig.key as keyof GroupedDataItem];
      const isNumeric = !isNaN(Number(aValue)) && !isNaN(Number(bValue));
      if (isNumeric) {
        return sortConfig.direction === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
      }
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      if (aStr < bStr) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredGroups, sortConfig]);
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedGroups.slice(startIndex, startIndex + pageSize);
  }, [sortedGroups, currentPage, pageSize]);
  const getColumns = (): ColumnDefinition[] => {
    const baseColumns: ColumnDefinition[] = [{
      key: "cleanedClass",
      label: "Class Type",
      iconComponent: <ListChecks className="h-4 w-4 text-gray-300" />,
      numeric: false,
      currency: false,
      visible: true
    }, {
      key: "dayOfWeek",
      label: "Day",
      iconComponent: <Calendar className="h-4 w-4 text-gray-300" />,
      numeric: false,
      currency: false,
      visible: true
    }, {
      key: "classTime",
      label: "Time",
      iconComponent: <Clock className="h-4 w-4 text-gray-300" />,
      numeric: false,
      currency: false,
      visible: true
    }, {
      key: "location",
      label: "Location",
      iconComponent: <MapPin className="h-4 w-4 text-gray-300" />,
      numeric: false,
      currency: false,
      visible: true
    }];
    const attendanceColumns: ColumnDefinition[] = [{
      key: "totalOccurrences",
      label: "Classes",
      numeric: true,
      currency: false,
      iconComponent: <ListFilter className="h-4 w-4 text-gray-300" />,
      visible: true
    }, {
      key: "totalEmpty",
      label: "Empty",
      numeric: true,
      currency: false,
      iconComponent: <ListFilter className="h-4 w-4 text-gray-300" />,
      visible: true
    }, {
      key: "totalNonEmpty",
      label: "Non-empty",
      numeric: true,
      currency: false,
      iconComponent: <ListFilter className="h-4 w-4 text-gray-300" />,
      visible: true
    }, {
      key: "totalCheckins",
      label: "Checked In",
      numeric: true,
      currency: false,
      iconComponent: <ListChecks className="h-4 w-4 text-gray-300" />,
      visible: true
    }, {
      key: "classAverageIncludingEmpty",
      label: "Avg. (All)",
      numeric: true,
      currency: false,
      iconComponent: <BarChart3 className="h-4 w-4" />,
      visible: true
    }, {
      key: "classAverageExcludingEmpty",
      label: "Avg. (Non-empty)",
      numeric: true,
      currency: false,
      iconComponent: <BarChart3 className="h-4 w-4" />,
      visible: true
    }];
    const financialColumns: ColumnDefinition[] = [{
      key: "totalRevenue",
      label: "Revenue",
      numeric: true,
      currency: true,
      iconComponent: <IndianRupee className="h-4 w-4 text-gray-300" />,
      visible: true
    }, {
      key: "totalCancelled",
      label: "Late Cancels",
      numeric: true,
      currency: false,
      iconComponent: <Calendar className="h-4 w-4" />,
      visible: true
    }, {
      key: "totalPayout",
      label: "Payout",
      numeric: true,
      currency: true,
      iconComponent: <IndianRupee className="h-4 w-4" />,
      visible: true
    }, {
      key: "totalTips",
      label: "Tips",
      numeric: true,
      currency: true,
      iconComponent: <IndianRupee className="h-4 w-4" />,
      visible: true
    }];
    const detailedColumns: ColumnDefinition[] = [{
      key: "teacherName",
      label: "Trainer",
      iconComponent: <User className="h-4 w-4" />,
      numeric: false,
      currency: false,
      visible: true
    }, {
      key: "period",
      label: "Period",
      iconComponent: <Calendar className="h-4 w-4" />,
      numeric: false,
      currency: false,
      visible: true
    }, {
      key: "date",
      label: "Date",
      iconComponent: <Calendar className="h-4 w-4" />,
      numeric: false,
      currency: false,
      visible: true
    }];
    switch (viewMode) {
      case "compact":
        return [...baseColumns.slice(0, 2), {
          key: "classTime",
          label: "Time",
          iconComponent: <Clock className="h-4 w-4" />,
          numeric: false,
          currency: false,
          visible: true
        }, {
          key: "totalOccurrences",
          label: "Classes",
          numeric: true,
          currency: false,
          iconComponent: <ListFilter className="h-4 w-4" />,
          visible: true
        }, {
          key: "totalCheckins",
          label: "Checked In",
          numeric: true,
          currency: false,
          iconComponent: <ListChecks className="h-4 w-4" />,
          visible: true
        }, {
          key: "classAverageIncludingEmpty",
          label: "Avg. (All)",
          numeric: true,
          currency: false,
          iconComponent: <BarChart3 className="h-4 w-4" />,
          visible: true
        }, financialColumns[0]];
      case "detailed":
        return [...baseColumns, ...attendanceColumns, ...financialColumns, ...detailedColumns];
      case "financials":
        return [...baseColumns.slice(0, 3), financialColumns[0], financialColumns[2], financialColumns[3]];
      case "attendance":
        return [...baseColumns.slice(0, 3), ...attendanceColumns, financialColumns[1]];
      case "trainer":
        return [detailedColumns[0], ...baseColumns.slice(0, 3), attendanceColumns[3], financialColumns[0]];
      case "analytics":
        return [...baseColumns.slice(0, 3), attendanceColumns[4], attendanceColumns[5], financialColumns[0]];
      case "all":
        return [...detailedColumns, ...baseColumns, ...attendanceColumns, ...financialColumns];
      default:
        return [...baseColumns, ...attendanceColumns.slice(0, 4), financialColumns[0]];
    }
  };
  const columns = getColumns();
  const visibleColumns = columns.filter(col => columnVisibility[col.key] !== false);
  const toggleRowExpansion = (key: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const toggleColumnVisibility = (column: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({
      key,
      direction
    });
  };
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const totalPages = Math.ceil(sortedGroups.length / pageSize);
  const resetColumnVisibility = () => {
    setColumnVisibility({
      teacherName: true,
      location: true,
      cleanedClass: true,
      dayOfWeek: true,
      period: true,
      date: true,
      classTime: true,
      totalCheckins: true,
      totalRevenue: true,
      totalOccurrences: true,
      classAverageIncludingEmpty: true,
      classAverageExcludingEmpty: true,
      totalCancelled: true
    });
  };
  const exportCSV = () => {
    const headers = Object.keys(filteredData[0] || {}).filter(key => key !== 'children' && key !== 'key');
    const csvRows = [headers.join(',')];
    filteredData.forEach(row => {
      const values = headers.map(header => {
        const val = row[header as keyof ProcessedData];
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'class_data_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const formatCellValue = (key: string, value: any) => {
    if (value === undefined || value === null) return "-";
    const column = columns.find(col => col.key === key);
    if (!column) return String(value);
    if (column.currency && typeof value === 'number') {
      return formatIndianCurrency(value);
    }
    if (column.numeric) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return numValue.toLocaleString();
      }
    }
    return String(value);
  };
  return <div className="p-6 bg-gradient-to-br from-slate-50 to-white min-h-screen">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 mb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div animate={{
            rotate: 360
          }} transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }} className="bg-white/10 p-3 rounded-full">
              <BarChart3 className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Class Analytics Dashboard
              </h1>
              <p className="text-slate-300 text-lg">
                Comprehensive view of your class performance data
              </p>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-2xl font-bold">{filteredData.length}</p>
            <p className="text-slate-300">Total Records</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between mb-2 gap-4 bg-white/80 backdrop-blur-sm p-4 shadow-lg rounded-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchTerm} onChange={handleSearchChange} placeholder="Search classes, trainers, locations..." className="shadow-md border-0 focus:ring-2 focus:ring-primary/20" />
        </div>
        
        <div className="flex flex-wrap gap-10">
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[200px] bg-white shadow-md border-0">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Group By" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-xl">
              <SelectGroup>
                <SelectLabel>Grouping Options</SelectLabel>
                {groupingOptions.map(option => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[160px] bg-white shadow-md border-0">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <SelectValue placeholder="View Mode" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-xl">
              <SelectGroup>
                <SelectLabel>View Mode</SelectLabel>
                {viewModes.map(mode => <SelectItem key={mode.id} value={mode.id}>{mode.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Tabs value={tableView} onValueChange={setTableView} className="w-[180px]">
            <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
              <TabsTrigger value="grouped" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Grouped</TabsTrigger>
              <TabsTrigger value="flat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Flat</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {tableView === "grouped" && <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-md">
              <Switch id="expand-all" checked={expandAllGroups} onCheckedChange={setExpandAllGroups} className="data-[state=checked]:bg-primary" />
              <Label htmlFor="expand-all">Expand All</Label>
            </div>}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white shadow-md border-0 hover:bg-gray-50">
                <Settings className="h-4 w-4" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-xl max-w-2xl shadow-2xl border-0">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Table Customization
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-lg">Visible Columns</h4>
                  <Button variant="outline" size="sm" onClick={resetColumnVisibility} className="text-xs hover:bg-primary/10">
                    Reset
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {columns.map(col => <div key={col.key} className="flex items-center space-x-2 bg-white/70 p-3 rounded-lg shadow-sm hover:shadow-md transition-all">
                      <Checkbox id={`column-${col.key}`} checked={columnVisibility[col.key] !== false} onCheckedChange={() => toggleColumnVisibility(col.key)} className="data-[state=checked]:bg-primary" />
                      <Label htmlFor={`column-${col.key}`} className="flex items-center gap-2 cursor-pointer">
                        {col.iconComponent}
                        {col.label}
                      </Label>
                    </div>)}
                </div>
                
                <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium mb-2">Row Height: {rowHeight}px</h4>
                  <Slider value={[rowHeight]} min={32} max={60} step={2} onValueChange={values => setRowHeight(values[0])} className="py-4" />
                </div>
                
                <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium mb-4">Items per page</h4>
                  <RadioGroup value={pageSize.toString()} onValueChange={value => setPageSize(Number(value))}>
                    <div className="flex items-center space-x-6">
                      {[5, 10, 25, 50, 100].map(size => <div key={size} className="flex items-center space-x-2">
                          <RadioGroupItem value={size.toString()} id={`page-${size}`} className="text-primary" />
                          <Label htmlFor={`page-${size}`}>{size}</Label>
                        </div>)}
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={exportCSV} className="bg-white shadow-md border-0 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="border-0 rounded-xl overflow-hidden bg-white shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0 z-10">
              <TableRow className="bg-gradient-to-br from-blue-900 via-indigo-800 to-indigo-900 text-white whitespace-nowrap uppercase text-sm border-b-4 border-indigo-700 px-4 py-2">
                {tableView === "grouped" && groupBy !== "none" && <TableHead className="bg-gradient-to-br from-blue-900 via-indigo-800 to-indigo-900 text-white whitespace-nowrap uppercase text-sm border-b-4 border-indigo-700 px-4 py-2"></TableHead>}
                {visibleColumns.map(column => <TableHead key={column.key} onClick={() => requestSort(column.key)} className="bg-gradient-to-br from-blue-900 via-indigo-800 to-indigo-900 text-white whitespace-nowrap uppercase text-sm border-b-4 border-indigo-700 px-4 py-2">
                    <div className={cn("flex items-center gap-2 font-medium", column.numeric ? "justify-center" : "justify-start")}>
                      {!column.numeric && column.iconComponent && <span className="text-primary/70">{column.iconComponent}</span>}
                      <span className="text-sm font-semibold tracking-wide">{column.label}</span>
                      {column.numeric && column.iconComponent && <span className="text-primary/70">{column.iconComponent}</span>}
                      {getSortIndicator(column.key)}
                    </div>
                  </TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroups.length > 0 ? paginatedGroups.map((group: GroupedDataItem) => <React.Fragment key={group.key}>
                    {(tableView === "flat" || tableView === "grouped" && !group.isChild) && <TableRow key={`parent-${group.key}`} className={cn("border-b border-slate-100 transition-all duration-200", tableView === "flat" ? "hover:bg-slate-50/80" : "cursor-pointer hover:bg-primary/5", tableView === "grouped" && expandedRows[group.key] && "bg-primary/10")} onClick={tableView === "grouped" ? () => toggleRowExpansion(group.key) : undefined} style={{
                height: `${rowHeight}px`
              }}>
                        {tableView === "grouped" && groupBy !== "none" && <TableCell className="py-3 text-center px-4 font-extrabold">
                            <motion.div initial={{
                    rotate: 0
                  }} animate={{
                    rotate: expandedRows[group.key] ? 90 : 0
                  }} transition={{
                    duration: 0.2
                  }}>
                              <ChevronRight className="h-4 w-4 text-primary mx-auto font-extrabold" />
                            </motion.div>
                          </TableCell>}
                        
                        {visibleColumns.map(column => {
                  if (column.key === 'teacherName') {
                    return <TableCell key={column.key} className="py-3 px-6 text-left">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 ring-2 ring-primary/20 shadow-sm">
                                    <AvatarImage src={trainerAvatars[group.teacherName]} />
                                    <AvatarFallback className="bg-primary/20 text-primary font-medium">
                                      {group.teacherName?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-slate-700">{group.teacherName}</span>
                                </div>
                              </TableCell>;
                  }
                  if (column.key === 'cleanedClass' && tableView === 'grouped') {
                    return <TableCell key={column.key} className="py-3 px-6 text-left">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary font-medium px-2 py-1">
                                    {group.children?.length || 0}
                                  </Badge>
                                  <span className="font-semibold text-slate-800 min-w-52 text-left text-indigo-600">{group.cleanedClass}</span>
                                </div>
                              </TableCell>;
                  }
                  const value = group[column.key as keyof GroupedDataItem];
                  return <TableCell key={column.key} className={cn("py-3 px-6 font-medium text-slate-700 whitespace-nowrap", column.numeric ? "text-center" : "text-left")}>
                              {formatCellValue(column.key, value)}
                            </TableCell>;
                })}
                      </TableRow>}
                    
                    <AnimatePresence>
                      {tableView === "grouped" && expandedRows[group.key] && group.children && <>
                          {group.children.map((child: ProcessedData, index: number) => <motion.tr key={`child-${group.key}-${index}`} initial={{
                    opacity: 0,
                    height: 0
                  }} animate={{
                    opacity: 1,
                    height: `${rowHeight}px`
                  }} exit={{
                    opacity: 0,
                    height: 0
                  }} transition={{
                    duration: 0.2,
                    delay: index * 0.02
                  }} className="bg-slate-50/50 border-b border-slate-100/50 hover:bg-slate-100/50">
                              <TableCell className="py-2 text-center">
                                <div className="w-2 h-2 bg-indigo-600/100 rounded-full mx-auto"></div>
                              </TableCell>
                              
                              {visibleColumns.map(column => {
                      if (column.key === 'teacherName') {
                        return <TableCell key={column.key} className="py-2 px-6 text-left">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={trainerAvatars[child.teacherName || '']} />
                                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {(child.teacherName || '?').charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-slate-600">{child.teacherName}</span>
                                      </div>
                                    </TableCell>;
                      }
                      const childValue = child[column.key as keyof ProcessedData];
                      return <TableCell key={column.key} className={cn("py-2 px-6 text-sm text-slate-600 whitespace-nowrap", column.numeric ? "text-center" : "text-left")}>
                                    {formatCellValue(column.key, childValue)}
                                  </TableCell>;
                    })}
                            </motion.tr>)}
                        </>}
                    </AnimatePresence>
                  </React.Fragment>) : <TableRow>
                  <TableCell colSpan={visibleColumns.length + (tableView === "grouped" ? 1 : 0)} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Search className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-lg font-medium">No results found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  </TableCell>
                </TableRow>}
            </TableBody>
          </Table>
        </div>
        
        {sortedGroups.length > pageSize && <div className="py-6 bg-gradient-to-r from-slate-50 to-white border-t border-slate-100">
            <div className="flex items-center justify-between px-6">
              <p className="text-sm text-slate-600">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedGroups.length)} of {sortedGroups.length} results
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => goToPage(currentPage - 1)} className={cn("cursor-pointer hover:bg-primary/10", currentPage === 1 && "opacity-50 cursor-not-allowed")} />
                  </PaginationItem>
                  
                  {Array.from({
                length: Math.min(5, totalPages)
              }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return <PaginationItem key={i}>
                        <PaginationLink onClick={() => goToPage(pageNum)} isActive={currentPage === pageNum} className="cursor-pointer hover:bg-primary/10">
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>;
              })}
                  
                  <PaginationItem>
                    <PaginationNext onClick={() => goToPage(currentPage + 1)} className={cn("cursor-pointer hover:bg-primary/10", currentPage === totalPages && "opacity-50 cursor-not-allowed")} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>}
      </div>
    </div>;
}