import React, { useState, useEffect, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { 
  Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  Settings, Eye, EyeOff, Layers, Type, Palette, Bookmark,
  BookmarkX, Filter, MapPin, Calendar, BarChart3, Clock,
  ListFilter, User, ListChecks, IndianRupee, LayoutGrid,
  LayoutList, Kanban, LineChart, Download, SlidersHorizontal
} from 'lucide-react';
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
  teacherEmail: string; // Made required
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
  totalPayout?: number;
  totalTips?: number;
  classAverageIncludingEmpty: number | string;
  classAverageExcludingEmpty: number | string;
  isChild?: boolean;
}

export function DataTable({ data, trainerAvatars }: DataTableProps) {
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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [viewMode, setViewMode] = useState("default");
  const [groupBy, setGroupBy] = useState("class-day-time-location");
  const [tableView, setTableView] = useState("grouped");
  const [rowHeight, setRowHeight] = useState(35);
  const [expandAllGroups, setExpandAllGroups] = useState(false);

  // Auto expand/collapse all rows when toggle is changed
  useEffect(() => {
    if (tableView === "grouped") {
      const newExpandedState: Record<string, boolean> = {};
      // Get current grouped data keys to set expansion state
      const currentKeys = groupedData.map((group: GroupedDataItem) => group.key);
      currentKeys.forEach((key: string) => {
        newExpandedState[key] = expandAllGroups;
      });
      setExpandedRows(newExpandedState);
    }
  }, [expandAllGroups, tableView]);

  // Group data by selected grouping option - memoized for performance
  const groupedData = useMemo((): GroupedDataItem[] => {
    // If flat mode is activated, return data as individual items
    if (tableView === "flat") {
      return data.map((item, index) => ({
        ...item,
        key: `flat-${item.uniqueID || index}`,
        teacherEmail: item.teacherEmail || '', // Ensure teacherEmail is always a string
        isChild: true,
        children: [],
        totalEmpty: item.totalCheckins === 0 ? 1 : 0,
        totalNonEmpty: item.totalCheckins > 0 ? 1 : 0,
        totalNonPaid: item.totalNonPaid || 0,
      }));
    }
    
    const getGroupKey = (item: ProcessedData): string => {
      switch(groupBy) {
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
        case "month": {
          const dateStr = item.date;
          if (dateStr) {
            try {
              const date = new Date(dateStr.split(',')[0]);
              return date.toLocaleString('default', { month: 'long', year: 'numeric' });
            } catch {
              return "Unknown";
            }
          }
          return "Unknown";
        }
        case "none":
        default:
          return `row-${data.indexOf(item)}`;
      }
    };
    
    const groups: Record<string, GroupedDataItem> = {};
    
    data.forEach(item => {
      const groupKey = getGroupKey(item);
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          teacherName: item.teacherName || '',
          teacherEmail: item.teacherEmail || '', // Ensure it's always a string
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
      groups[groupKey].children.push({...item});
      
      // Update metrics for group aggregation
      groups[groupKey].totalCheckins += Number(item.totalCheckins || 0);
      groups[groupKey].totalRevenue += Number(item.totalRevenue || 0);
      groups[groupKey].totalOccurrences += 1;
      groups[groupKey].totalCancelled += Number(item.totalCancelled || 0);
      groups[groupKey].totalEmpty += (Number(item.totalCheckins || 0) === 0 ? 1 : 0);
      groups[groupKey].totalNonEmpty += (Number(item.totalCheckins || 0) > 0 ? 1 : 0);
      groups[groupKey].totalNonPaid += Number(item.totalNonPaid || 0);
      if (item.totalPayout) groups[groupKey].totalPayout! += Number(item.totalPayout);
      if (item.totalTips) groups[groupKey].totalTips! += Number(item.totalTips);
    });
    
    // Calculate averages for each group
    Object.values(groups).forEach((group: GroupedDataItem) => {
      group.classAverageIncludingEmpty = group.totalOccurrences > 0 
        ? Number((group.totalCheckins / group.totalOccurrences).toFixed(1))
        : 0;
        
      group.classAverageExcludingEmpty = group.totalNonEmpty > 0 
        ? Number((group.totalCheckins / group.totalNonEmpty).toFixed(1))
        : 'N/A';
    });
    
    return Object.values(groups);
  }, [data, groupBy, tableView]);
  
  // Define grouping options
  const groupingOptions = [
    { id: "class-day-time-location-trainer", label: "Class + Day + Time + Location + Trainer" },
    { id: "class-day-time-location", label: "Class + Day + Time + Location" },
    { id: "class-day-time", label: "Class + Day + Time" },
    { id: "class-time", label: "Class + Time" },
    { id: "class-day", label: "Class + Day" },
    { id: "class-location", label: "Class + Location" },
    { id: "day-time", label: "Day + Time" },
    { id: "location", label: "Location" },
    { id: "trainer", label: "Trainer" },
    { id: "month", label: "Month" },
    { id: "none", label: "No Grouping" }
  ];
  
  // Define view modes
  const viewModes = [
    { id: "default", label: "Default View" },
    { id: "compact", label: "Compact View" },
    { id: "detailed", label: "Detailed View" },
    { id: "financials", label: "Financial Focus" },
    { id: "attendance", label: "Attendance Focus" },
    { id: "trainer", label: "Trainer Focus" },
    { id: "analytics", label: "Analytics View" },
    { id: "all", label: "All Columns" }
  ];

  // Filter the grouped data based on search term - memoized for performance
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedData;
    
    const searchLower = searchTerm.toLowerCase();
    
    return groupedData.filter((group: GroupedDataItem) => {
      // For flat view, search in all properties
      if (tableView === "flat") {
        return Object.values(group).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
        );
      }
      
      // For grouped view, search in parent row and children
      const parentMatch = [
        group.teacherName,
        group.cleanedClass,
        group.dayOfWeek,
        group.location,
        group.classTime,
        group.period,
      ].some(field => field && String(field).toLowerCase().includes(searchLower));
      
      if (parentMatch) return true;
      
      // Search in child rows
      if (group.children && group.children.length > 0) {
        return group.children.some((child: ProcessedData) => 
          Object.values(child).some(val => 
            val !== null && val !== undefined && typeof val === 'string' && val.toLowerCase().includes(searchLower)
          )
        );
      }
      
      return false;
    });
  }, [groupedData, searchTerm, tableView]);
  
  // Apply sorting - memoized for performance
  const sortedGroups = useMemo(() => {
    if (!sortConfig) return filteredGroups;
    
    return [...filteredGroups].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof GroupedDataItem];
      const bValue = b[sortConfig.key as keyof GroupedDataItem];
      
      const isNumeric = !isNaN(Number(aValue)) && !isNaN(Number(bValue));
      
      if (isNumeric) {
        return sortConfig.direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
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

  // Pagination - memoized for performance
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedGroups.slice(startIndex, startIndex + pageSize);
  }, [sortedGroups, currentPage, pageSize]);
  
  // Get columns based on view mode
  const getColumns = (): ColumnDefinition[] => {
    const baseColumns: ColumnDefinition[] = [
      { key: "cleanedClass", label: "Class Type", iconComponent: <ListChecks className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "dayOfWeek", label: "Day", iconComponent: <Calendar className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "classTime", label: "Time", iconComponent: <Clock className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "location", label: "Location", iconComponent: <MapPin className="h-4 w-4" />, numeric: false, currency: false, visible: true },
    ];
    
    const attendanceColumns: ColumnDefinition[] = [
      { key: "totalOccurrences", label: "Classes", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
      { key: "totalEmpty", label: "Empty", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
      { key: "totalNonEmpty", label: "Non-empty", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
      { key: "totalCheckins", label: "Checked In", numeric: true, currency: false, iconComponent: <ListChecks className="h-4 w-4" />, visible: true },
      { key: "classAverageIncludingEmpty", label: "Avg. (All)", numeric: true, currency: false, iconComponent: <BarChart3 className="h-4 w-4" />, visible: true },
      { key: "classAverageExcludingEmpty", label: "Avg. (Non-empty)", numeric: true, currency: false, iconComponent: <BarChart3 className="h-4 w-4" />, visible: true }
    ];
    
    const financialColumns: ColumnDefinition[] = [
      { key: "totalRevenue", label: "Revenue", numeric: true, currency: true, iconComponent: <IndianRupee className="h-4 w-4" />, visible: true },
      { key: "totalCancelled", label: "Late Cancels", numeric: true, currency: false, iconComponent: <Calendar className="h-4 w-4" />, visible: true },
      { key: "totalPayout", label: "Payout", numeric: true, currency: true, iconComponent: <IndianRupee className="h-4 w-4" />, visible: true },
      { key: "totalTips", label: "Tips", numeric: true, currency: true, iconComponent: <IndianRupee className="h-4 w-4" />, visible: true }
    ];
    
    const detailedColumns: ColumnDefinition[] = [
      { key: "teacherName", label: "Trainer", iconComponent: <User className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "period", label: "Period", iconComponent: <Calendar className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "date", label: "Date", iconComponent: <Calendar className="h-4 w-4" />, numeric: false, currency: false, visible: true },
    ];

    switch(viewMode) {
      case "compact":
        return [...baseColumns.slice(0, 2), 
                { key: "classTime", label: "Time", iconComponent: <Clock className="h-4 w-4" />, numeric: false, currency: false, visible: true },
                { key: "totalOccurrences", label: "Classes", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
                { key: "totalCheckins", label: "Checked In", numeric: true, currency: false, iconComponent: <ListChecks className="h-4 w-4" />, visible: true },
                { key: "classAverageIncludingEmpty", label: "Avg. (All)", numeric: true, currency: false, iconComponent: <BarChart3 className="h-4 w-4" />, visible: true },
                financialColumns[0]];
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
        return [
          ...detailedColumns,
          ...baseColumns, 
          ...attendanceColumns,
          ...financialColumns
        ];
      default:
        return [...baseColumns, ...attendanceColumns.slice(0, 4), financialColumns[0]];
    }
  };

  const columns = getColumns();
  
  // Filter columns based on visibility settings
  const visibleColumns = columns.filter(col => 
    columnVisibility[col.key] !== false
  );
  
  // Toggle row expansion
  const toggleRowExpansion = (key: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle sort request
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator for column headers
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };
  
  // Navigate to specific page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedGroups.length / pageSize);
  
  // Reset column visibility
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

  // Export data as CSV
  const exportCSV = () => {
    const headers = Object.keys(data[0] || {}).filter(key => key !== 'children' && key !== 'key');
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header as keyof ProcessedData];
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'class_data_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Format cell values
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

  // Render individual row - extracted for performance
  const renderTableRow = (group: GroupedDataItem, isChild: boolean = false) => (
    <TableRow 
      key={`row-${group.key}`}
      className={cn(
        isChild ? "hover:bg-gray-50/50 border-t border-gray-100/50 bg-gray-50/20" : 
        "cursor-pointer hover:bg-primary/5 transition-colors duration-200",
        !isChild && expandedRows[group.key] && "bg-primary/10"
      )}
      onClick={!isChild ? () => toggleRowExpansion(group.key) : undefined}
      style={{ height: `${rowHeight}px` }}
    >
      {tableView === "grouped" && groupBy !== "none" && !isChild && (
        <TableCell className="py-2 relative">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: expandedRows[group.key] ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <ChevronRight className="h-4 w-4 text-primary" />
          </motion.div>
        </TableCell>
      )}
      
      {isChild && tableView === "grouped" && groupBy !== "none" && (
        <TableCell className="py-1">
          <div className="w-4"></div>
        </TableCell>
      )}
      
      {visibleColumns.map(column => {
        if (column.key === 'teacherName') {
          return (
            <TableCell key={column.key} className={cn(
              isChild ? "py-1" : "py-2", 
              "text-left"
            )}>
              <div className="flex items-center gap-2">
                <Avatar className={isChild ? "h-5 w-5" : "h-6 w-6 ring-2 ring-primary/20"}>
                  <AvatarImage src={trainerAvatars[group.teacherName]} />
                  <AvatarFallback className={cn(
                    isChild ? "bg-primary/10 text-primary text-xs" : "bg-primary/20 text-primary"
                  )}>
                    {group.teacherName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className={isChild ? "text-sm" : ""}>{group.teacherName}</span>
              </div>
            </TableCell>
          );
        }
        
        if (column.key === 'cleanedClass' && tableView === 'grouped' && !isChild) {
          return (
            <TableCell key={column.key} className="py-2 text-left">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-normal">
                  {group.children?.length || 0}
                </Badge>
                <span className="font-medium">{group.cleanedClass}</span>
              </div>
            </TableCell>
          );
        }
        
        if (column.key === 'classAverageIncludingEmpty' || column.key === 'classAverageExcludingEmpty') {
          const value = group[column.key as keyof GroupedDataItem];
          return (
            <TableCell key={column.key} className={cn(
              isChild ? "py-1" : "py-2", 
              "text-right"
            )}>
              {typeof value === 'number' ? value.toFixed(1) : String(value)}
            </TableCell>
          );
        }
        
        return (
          <TableCell key={column.key} className={cn(
            isChild ? "py-1" : "py-2", 
            column.numeric ? "text-right" : "text-left"
          )}>
            {formatCellValue(column.key, group[column.key as keyof GroupedDataItem])}
          </TableCell>
        );
      })}
    </TableRow>
  );
  
  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search in table..."
            className="pl-9 w-full max-w-sm bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300 focus:ring-2 focus:ring-primary/30"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Grouping Options */}
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[180px] bg-white/80 backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Group By" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-lg border-none shadow-lg">
              <SelectGroup>
                <SelectLabel>Grouping Options</SelectLabel>
                {groupingOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {/* View Mode */}
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[160px] bg-white/80 backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <SelectValue placeholder="View Mode" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-lg border-none shadow-lg">
              <SelectGroup>
                <SelectLabel>View Mode</SelectLabel>
                {viewModes.map(mode => (
                  <SelectItem key={mode.id} value={mode.id}>{mode.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {/* Table View */}
          <Tabs value={tableView} onValueChange={setTableView} className="w-[180px]">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 shadow-lg">
              <TabsTrigger value="grouped" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Grouped</TabsTrigger>
              <TabsTrigger value="flat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Flat</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {tableView === "grouped" && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="expand-all" 
                checked={expandAllGroups}
                onCheckedChange={setExpandAllGroups}
                className="data-[state=checked]:bg-primary" 
              />
              <Label htmlFor="expand-all">Expand All</Label>
            </div>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Customize Table</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-xl max-w-2xl shadow-2xl border-none">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Table Customization</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-lg">Visible Columns</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetColumnVisibility}
                    className="text-xs hover:bg-primary/10"
                  >
                    Reset
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {columns.map(col => (
                    <div key={col.key} className="flex items-center space-x-2 bg-white/70 p-2 rounded-lg shadow-sm hover:shadow-md hover:bg-white/90 transition-all duration-300">
                      <Checkbox 
                        id={`column-${col.key}`} 
                        checked={columnVisibility[col.key] !== false} 
                        onCheckedChange={() => toggleColumnVisibility(col.key)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <Label htmlFor={`column-${col.key}`} className="flex items-center gap-1.5 cursor-pointer">
                        {col.iconComponent && (
                          <span className="text-primary/70">{col.iconComponent}</span>
                        )}
                        {col.label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium mb-2">Row Height: {rowHeight}px</h4>
                  <Slider
                    value={[rowHeight]}
                    min={25}
                    max={50}
                    step={1}
                    onValueChange={values => setRowHeight(values[0])}
                    className="py-4"
                  />
                </div>
                
                <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium mb-4">Items per page</h4>
                  <RadioGroup value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                    <div className="flex items-center space-x-6">
                      {[5, 10, 25, 50].map(size => (
                        <div key={size} className="flex items-center space-x-2">
                          <RadioGroupItem value={size.toString()} id={`page-${size}`} className="text-primary" />
                          <Label htmlFor={`page-${size}`}>{size}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportCSV}
            className="bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-white/90 backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/70 backdrop-blur-md sticky top-0 z-10">
              <TableRow className="border-b-2 border-primary/20">
                {tableView === "grouped" && groupBy !== "none" && (
                  <TableHead className="w-[30px] bg-gradient-to-r from-gray-50/70 to-transparent"></TableHead>
                )}
                {visibleColumns.map(column => (
                  <TableHead 
                    key={column.key}
                    className={cn(
                      "py-3 px-4 bg-gradient-to-r from-gray-50/70 to-transparent transition-colors hover:bg-gray-100/70",
                      column.numeric ? "text-right" : "text-left"
                    )}
                    onClick={() => requestSort(column.key)}
                  >
                    <div className={cn(
                      "flex items-center gap-1.5 cursor-pointer",
                      column.numeric ? "justify-end" : "justify-start"
                    )}>
                      {!column.numeric && column.iconComponent && (
                        <span className="text-primary/70">{column.iconComponent}</span>
                      )}
                      <span>{column.label}</span>
                      {column.numeric && column.iconComponent && (
                        <span className="text-primary/70">{column.iconComponent}</span>
                      )}
                      {getSortIndicator(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroups.length > 0 ? (
                paginatedGroups.map((group: GroupedDataItem) => (
                  <React.Fragment key={group.key}>
                    {/* Parent rows for grouped mode, or all rows for flat mode */}
                    {(tableView === "flat" || (tableView === "grouped" && !group.isChild)) && (
                      <motion.tr 
                        key={`parent-${group.key}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          tableView === "flat" ? "hover:bg-gray-50/50" : "cursor-pointer hover:bg-primary/5 transition-colors duration-200",
                          tableView === "grouped" && expandedRows[group.key] && "bg-primary/10"
                        )}
                        onClick={tableView === "grouped" ? () => toggleRowExpansion(group.key) : undefined}
                        style={{ height: `${rowHeight}px` }}
                      >
                        {tableView === "grouped" && groupBy !== "none" && (
                          <TableCell className="py-2 relative">
                            <motion.div
                              initial={{ rotate: 0 }}
                              animate={{ rotate: expandedRows[group.key] ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            >
                              <ChevronRight className="h-4 w-4 text-primary" />
                            </motion.div>
                          </TableCell>
                        )}
                        
                        {visibleColumns.map(column => {
                          if (column.key === 'teacherName') {
                            return (
                              <TableCell key={column.key} className="py-2 text-left">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 ring-2 ring-primary/20">
                                    <AvatarImage src={trainerAvatars[group.teacherName]} />
                                    <AvatarFallback className="bg-primary/20 text-primary">{group.teacherName?.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                  {group.teacherName}
                                </div>
                              </TableCell>
                            );
                          }
                          
                          if (column.key === 'cleanedClass' && tableView === 'grouped') {
                            return (
                              <TableCell key={column.key} className="py-2 text-left">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-normal">
                                    {group.children?.length || 0}
                                  </Badge>
                                  <span className="font-medium">{group.cleanedClass}</span>
                                </div>
                              </TableCell>
                            );
                          }
                          
                          if (column.key === 'classAverageIncludingEmpty' || column.key === 'classAverageExcludingEmpty') {
                            const value = group[column.key as keyof GroupedDataItem];
                            return (
                              <TableCell key={column.key} className="py-2 text-right">
                                {typeof value === 'number' ? value.toFixed(1) : String(value)}
                              </TableCell>
                            );
                          }
                          
                          return (
                            <TableCell key={column.key} className={cn(
                              "py-2", 
                              column.numeric ? "text-right" : "text-left"
                            )}>
                              {formatCellValue(column.key, group[column.key as keyof GroupedDataItem])}
                            </TableCell>
                          );
                        })}
                      </motion.tr>
                    )}
                    
                    {/* Child rows for expanded grouped mode */}
                    {tableView === "grouped" && expandedRows[group.key] && group.children && (
                      <>
                        {group.children.map((child: ProcessedData, index: number) => (
                          <motion.tr 
                            key={`child-${group.key}-${index}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-gray-50/50 border-t border-gray-100/50 bg-gray-50/20"
                            style={{ height: `${rowHeight}px` }}
                          >
                            <TableCell className="py-1">
                              <div className="w-4"></div>
                            </TableCell>
                            
                            {visibleColumns.map(column => {
                              if (column.key === 'teacherName') {
                                return (
                                  <TableCell key={column.key} className="py-1 text-left">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={trainerAvatars[child.teacherName || '']} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{(child.teacherName || '?').charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">{child.teacherName}</span>
                                    </div>
                                  </TableCell>
                                );
                              }

                              const childValue = child[column.key as keyof ProcessedData];
                              
                              return (
                                <TableCell key={column.key} className={cn(
                                  "py-1", 
                                  column.numeric ? "text-right" : "text-left"
                                )}>
                                  {formatCellValue(column.key, childValue)}
                                </TableCell>
                              );
                            })}
                          </motion.tr>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + (tableView === "grouped" ? 1 : 0)} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {sortedGroups.length > pageSize && (
          <div className="py-4 bg-white/80 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => goToPage(currentPage - 1)}
                    className={cn("cursor-pointer", currentPage === 1 && "opacity-50 cursor-not-allowed")}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => goToPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => goToPage(currentPage + 1)}
                    className={cn("cursor-pointer", currentPage === totalPages && "opacity-50 cursor-not-allowed")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
