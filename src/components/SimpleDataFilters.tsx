import React, { useState, useEffect } from 'react';
import { FilterOption, SortOption, ProcessedData } from '@/types/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { DateRangePicker } from './DateRangePicker';
import { 
  Filter, X, Check, ArrowDownUp, Calendar, MapPin, 
  CheckCircle2, Clock, Menu, BarChart2, User, ChevronDown, ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRange } from 'react-day-picker';

interface SimpleDataFiltersProps {
  onFilterChange: (filters: FilterOption[]) => void;
  onSortChange: (sortOptions: SortOption[]) => void;
  data: ProcessedData[];
  filtersCount: number;
}

const SimpleDataFilters: React.FC<SimpleDataFiltersProps> = ({ 
  onFilterChange, onSortChange, data, filtersCount 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'filters' | 'sort' | 'advanced'>('filters');
  const [activeFiltersList, setActiveFiltersList] = useState<FilterOption[]>([]);
  const [activeSorts, setActiveSorts] = useState<SortOption[]>([]);
  const [valueRanges, setValueRanges] = useState(false);

  // Extract filter options from data
  const classTypes = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueClasses = new Set(data.map(row => row.cleanedClass).filter(Boolean));
    return Array.from(uniqueClasses).sort();
  }, [data]);

  const locations = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueLocations = new Set(data.map(row => row.location).filter(Boolean));
    return Array.from(uniqueLocations).sort();
  }, [data]);

  const trainers = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueTrainers = new Set(data.map(row => row.teacherName).filter(Boolean));
    return Array.from(uniqueTrainers).sort();
  }, [data]);

  const daysOfWeek = React.useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    if (!data || data.length === 0) return days;
    const availableDays = new Set(data.map(row => row.dayOfWeek).filter(Boolean));
    return days.filter(day => availableDays.has(day));
  }, [data]);

  const periods = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniquePeriods = new Set(data.map(row => row.period).filter(Boolean));
    return Array.from(uniquePeriods).sort();
  }, [data]);

  // Range information for numeric values
  const checkinsRange = React.useMemo(() => {
    if (!data || data.length === 0) return [0, 50];
    const values = data.map(d => Number(d.totalCheckins)).filter(v => !isNaN(v));
    return [0, Math.max(...values, 50)];
  }, [data]);

  const revenueRange = React.useMemo(() => {
    if (!data || data.length === 0) return [0, 10000];
    const values = data.map(d => Number(d.totalRevenue)).filter(v => !isNaN(v));
    return [0, Math.max(...values, 10000)];
  }, [data]);

  // Filter state
  const [filterValues, setFilterValues] = useState({
    classType: "all",
    location: "all",
    trainer: "all",
    dayOfWeek: "all",
    period: "all",
    dateRange: { from: undefined, to: undefined } as DateRange,
    hasParticipants: false
  });

  // Update filter options when filterValues change
  useEffect(() => {
    const newFilters: FilterOption[] = [];
    
    if (filterValues.classType !== "all") {
      newFilters.push({
        field: "cleanedClass",
        operator: "equals",
        value: filterValues.classType
      });
    }

    if (filterValues.location !== "all") {
      newFilters.push({
        field: "location",
        operator: "equals",
        value: filterValues.location
      });
    }

    if (filterValues.trainer !== "all") {
      newFilters.push({
        field: "teacherName",
        operator: "equals",
        value: filterValues.trainer
      });
    }

    if (filterValues.dayOfWeek !== "all") {
      newFilters.push({
        field: "dayOfWeek",
        operator: "equals",
        value: filterValues.dayOfWeek
      });
    }

    if (filterValues.period !== "all") {
      newFilters.push({
        field: "period",
        operator: "equals",
        value: filterValues.period
      });
    }

    // Add date range filters
    if (filterValues.dateRange.from || filterValues.dateRange.to) {
      if (filterValues.dateRange.from) {
        newFilters.push({
          field: "date",
          operator: "after",
          value: filterValues.dateRange.from.toISOString().split('T')[0]
        });
      }
      
      if (filterValues.dateRange.to) {
        newFilters.push({
          field: "date",
          operator: "before",
          value: filterValues.dateRange.to.toISOString().split('T')[0]
        });
      }
    }

    // Add check-ins range filter
    if (valueRanges.checkins[0] > 0 || valueRanges.checkins[1] < checkinsRange[1]) {
      if (valueRanges.checkins[0] > 0) {
        newFilters.push({
          field: "totalCheckins",
          operator: "greater",
          value: valueRanges.checkins[0].toString()
        });
      }
      
      if (valueRanges.checkins[1] < checkinsRange[1]) {
        newFilters.push({
          field: "totalCheckins",
          operator: "less",
          value: valueRanges.checkins[1].toString()
        });
      }
    }

    // Add revenue range filter
    if (valueRanges.revenue[0] > 0 || valueRanges.revenue[1] < revenueRange[1]) {
      if (valueRanges.revenue[0] > 0) {
        newFilters.push({
          field: "totalRevenue",
          operator: "greater",
          value: valueRanges.revenue[0].toString()
        });
      }
      
      if (valueRanges.revenue[1] < revenueRange[1]) {
        newFilters.push({
          field: "totalRevenue",
          operator: "less",
          value: valueRanges.revenue[1].toString()
        });
      }
    }

    // Add participants filter
    if (filterValues.hasParticipants) {
      newFilters.push({
        field: "totalCheckins",
        operator: "greater",
        value: "0"
      });
    }

    setActiveFiltersList(newFilters);
    onFilterChange(newFilters);
  }, [filterValues, valueRanges, checkinsRange, revenueRange, onFilterChange]);

  // Handle sort selection
  const handleSortSelect = (field: keyof ProcessedData, direction: 'asc' | 'desc') => {
    const newSort: SortOption = { field, direction };
    const updatedSorts = [newSort];
    setActiveSorts(updatedSorts);
    onSortChange(updatedSorts);
  };

  const clearFilters = () => {
    setFilterValues({
      classType: "all",
      location: "all",
      trainer: "all",
      dayOfWeek: "all",
      period: "all",
      dateRange: { from: undefined, to: undefined },
      hasParticipants: false
    });
    
    setValueRanges({
      checkins: [0, checkinsRange[1]],
      revenue: [0, revenueRange[1]]
    });
    
    setActiveFiltersList([]);
    onFilterChange([]);
  };

  const clearAllSorts = () => {
    setActiveSorts([]);
    onSortChange([]);
  };

  const renderFilterBadges = () => {
    const badges = [];
    
    if (filterValues.classType !== "all") {
      badges.push(
        <Badge key="class" variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
          <span className="text-xs">Class: {filterValues.classType}</span>
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => setFilterValues({...filterValues, classType: "all"})}
          />
        </Badge>
      );
    }
    
    if (filterValues.location !== "all") {
      badges.push(
        <Badge key="location" variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
          <span className="text-xs">Location: {filterValues.location}</span>
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => setFilterValues({...filterValues, location: "all"})}
          />
        </Badge>
      );
    }
    
    if (filterValues.trainer !== "all") {
      badges.push(
        <Badge key="trainer" variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
          <span className="text-xs">Trainer: {filterValues.trainer}</span>
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => setFilterValues({...filterValues, trainer: "all"})}
          />
        </Badge>
      );
    }
    
    if (filterValues.dayOfWeek !== "all") {
      badges.push(
        <Badge key="day" variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
          <span className="text-xs">Day: {filterValues.dayOfWeek}</span>
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => setFilterValues({...filterValues, dayOfWeek: "all"})}
          />
        </Badge>
      );
    }
    
    if (filterValues.dateRange.from || filterValues.dateRange.to) {
      badges.push(
        <Badge key="date" variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
          <span className="text-xs">Date Range</span>
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => setFilterValues({...filterValues, dateRange: { from: undefined, to: undefined }})}
          />
        </Badge>
      );
    }
    
    if (valueRanges.checkins[0] > 0 || valueRanges.checkins[1] < checkinsRange[1]) {
      badges.push(
        <Badge key="checkins" variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
          <span className="text-xs">Check-ins: {valueRanges.checkins[0]}-{valueRanges.checkins[1]}</span>
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => setValueRanges({...valueRanges, checkins: [0, checkinsRange[1]]})}
          />
        </Badge>
      );
    }
    
    if (valueRanges.revenue[0] > 0 || valueRanges.revenue[1] < revenueRange[1]) {
      badges.push(
        <Badge key="revenue" variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
          <span className="text-xs">Revenue: ₹{valueRanges.revenue[0]}-₹{valueRanges.revenue[1]}</span>
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => setValueRanges({...valueRanges, revenue: [0, revenueRange[1]]})}
          />
        </Badge>
      );
    }
    
    if (filterValues.hasParticipants) {
      badges.push(
        <Badge key="participants" variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
          <span className="text-xs">Has Participants</span>
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => setFilterValues({...filterValues, hasParticipants: false})}
          />
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsOpen(!isOpen)} 
            className="bg-white/80 backdrop-blur-sm shadow-md hover:bg-white hover:shadow-lg transition-all duration-300 border-primary/30"
          >
            <Filter className="mr-2 h-4 w-4 text-primary" />
            Filters & Sort
            {activeFiltersList.length > 0 && (
              <Badge className="ml-2 bg-primary text-white">{activeFiltersList.length}</Badge>
            )}
            {isOpen ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
          
          {/* Quick sort options */}
          <div className="hidden sm:flex gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  Sort
                </Button>
              </PopoverTrigger>
              <PopoverContent side="bottom" className="w-64 p-0 rounded-lg bg-white shadow-xl border-none" align="start">
                <div className="grid grid-cols-2 gap-2 p-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={
                      activeSorts.some(s => s.field === 'teacherName' && s.direction === 'asc')
                      ? 'bg-primary/20 text-primary'
                      : ''
                    }
                    onClick={() => handleSortSelect('teacherName', 'asc')}
                  >
                    <User className="mr-1.5 h-3.5 w-3.5" />
                    Trainer A-Z
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={
                      activeSorts.some(s => s.field === 'teacherName' && s.direction === 'desc')
                      ? 'bg-primary/20 text-primary'
                      : ''
                    }
                    onClick={() => handleSortSelect('teacherName', 'desc')}
                  >
                    <User className="mr-1.5 h-3.5 w-3.5" />
                    Trainer Z-A
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={
                      activeSorts.some(s => s.field === 'totalCheckins' && s.direction === 'desc')
                      ? 'bg-primary/20 text-primary'
                      : ''
                    }
                    onClick={() => handleSortSelect('totalCheckins', 'desc')}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Most Check-ins
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={
                      activeSorts.some(s => s.field === 'totalRevenue' && s.direction === 'desc')
                      ? 'bg-primary/20 text-primary'
                      : ''
                    }
                    onClick={() => handleSortSelect('totalRevenue', 'desc')}
                  >
                    <BarChart2 className="mr-1.5 h-3.5 w-3.5" />
                    Highest Revenue
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={
                      activeSorts.some(s => s.field === 'classAverageExcludingEmpty' && s.direction === 'desc')
                      ? 'bg-primary/20 text-primary'
                      : ''
                    }
                    onClick={() => handleSortSelect('classAverageExcludingEmpty', 'desc')}
                  >
                    <BarChart2 className="mr-1.5 h-3.5 w-3.5" />
                    Best Average
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={
                      activeSorts.some(s => s.field === 'date' && s.direction === 'desc')
                      ? 'bg-primary/20 text-primary'
                      : ''
                    }
                    onClick={() => handleSortSelect('date', 'desc')}
                  >
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    Newest First
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={
                      activeSorts.some(s => s.field === 'date' && s.direction === 'asc')
                      ? 'bg-primary/20 text-primary'
                      : ''
                    }
                    onClick={() => handleSortSelect('date', 'asc')}
                  >
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    Oldest First
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {renderFilterBadges()}
          {(activeFiltersList.length > 0 || activeSorts.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs h-7 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Card className="bg-white/95 backdrop-blur-md shadow-xl border-none overflow-hidden">
              <CardContent className="p-4">
                <Tabs 
                  defaultValue="filters" 
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as 'filters' | 'sort' | 'advanced')}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 w-full max-w-md mb-4 bg-slate-100/70 backdrop-blur-sm">
                    <TabsTrigger value="filters" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Filter className="mr-2 h-4 w-4" />
                      Simple Filters
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Ranges
                    </TabsTrigger>
                    <TabsTrigger value="sort" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <ArrowDownUp className="mr-2 h-4 w-4" />
                      Sort Options
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="filters" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Menu className="h-4 w-4 mr-2 text-primary" />
                          <Label className="text-sm font-medium">Class Type</Label>
                        </div>
                        <Select 
                          value={filterValues.classType} 
                          onValueChange={(value) => setFilterValues({...filterValues, classType: value})}
                        >
                          <SelectTrigger className="w-full bg-white/80 shadow-sm border-slate-200">
                            <SelectValue placeholder="All Classes" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-lg shadow-lg">
                            <SelectItem value="all">All Classes</SelectItem>
                            {classTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          <Label className="text-sm font-medium">Location</Label>
                        </div>
                        <Select 
                          value={filterValues.location} 
                          onValueChange={(value) => setFilterValues({...filterValues, location: value})}
                        >
                          <SelectTrigger className="w-full bg-white/80 shadow-sm border-slate-200">
                            <SelectValue placeholder="All Locations" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-lg shadow-lg">
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map(location => (
                              <SelectItem key={location} value={location}>{location}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-primary" />
                          <Label className="text-sm font-medium">Trainer</Label>
                        </div>
                        <Select 
                          value={filterValues.trainer} 
                          onValueChange={(value) => setFilterValues({...filterValues, trainer: value})}
                        >
                          <SelectTrigger className="w-full bg-white/80 shadow-sm border-slate-200">
                            <SelectValue placeholder="All Trainers" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-lg shadow-lg">
                            <SelectItem value="all">All Trainers</SelectItem>
                            {trainers.map(trainer => (
                              <SelectItem key={trainer} value={trainer}>{trainer}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <Label className="text-sm font-medium">Day of Week</Label>
                        </div>
                        <Select 
                          value={filterValues.dayOfWeek} 
                          onValueChange={(value) => setFilterValues({...filterValues, dayOfWeek: value})}
                        >
                          <SelectTrigger className="w-full bg-white/80 shadow-sm border-slate-200">
                            <SelectValue placeholder="All Days" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-lg shadow-lg">
                            <SelectItem value="all">All Days</SelectItem>
                            {daysOfWeek.map(day => (
                              <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          <Label className="text-sm font-medium">Period</Label>
                        </div>
                        <Select 
                          value={filterValues.period} 
                          onValueChange={(value) => setFilterValues({...filterValues, period: value})}
                        >
                          <SelectTrigger className="w-full bg-white/80 shadow-sm border-slate-200">
                            <SelectValue placeholder="All Periods" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-lg shadow-lg">
                            <SelectItem value="all">All Periods</SelectItem>
                            {periods.map(period => (
                              <SelectItem key={period} value={period}>{period}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <Label className="text-sm font-medium">Date Range</Label>
                        </div>
                        <DateRangePicker
                          value={filterValues.dateRange}
                          onChange={(dateRange) => setFilterValues({
                            ...filterValues, 
                            dateRange: dateRange || { from: undefined, to: undefined }
                          })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-4">
                      <Switch
                        id="hasParticipants"
                        checked={filterValues.hasParticipants}
                        onCheckedChange={(checked) => 
                          setFilterValues({ ...filterValues, hasParticipants: checked })
                        }
                        className="data-[state=checked]:bg-primary"
                      />
                      <Label htmlFor="hasParticipants" className="text-sm">Only show classes with participants</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="mt-0">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                            <Label className="text-sm font-medium">Check-ins Range</Label>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{valueRanges.checkins[0]}</span>
                            <span className="mx-2">-</span>
                            <span className="font-medium">{valueRanges.checkins[1]}</span>
                          </div>
                        </div>
                        <Slider
                          value={valueRanges.checkins}
                          min={0}
                          max={checkinsRange[1]}
                          step={1}
                          onValueChange={(value) => setValueRanges({...valueRanges, checkins: value as [number, number]})}
                          className="py-4"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <BarChart2 className="h-4 w-4 mr-2 text-primary" />
                            <Label className="text-sm font-medium">Revenue Range (₹)</Label>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">₹{valueRanges.revenue[0].toLocaleString()}</span>
                            <span className="mx-2">-</span>
                            <span className="font-medium">₹{valueRanges.revenue[1].toLocaleString()}</span>
                          </div>
                        </div>
                        <Slider
                          value={valueRanges.revenue}
                          min={0}
                          max={revenueRange[1]}
                          step={100}
                          onValueChange={(value) => setValueRanges({...valueRanges, revenue: value as [number, number]})}
                          className="py-4"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sort" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button 
                        variant="outline" 
                        className={`justify-start ${
                          activeSorts.some(s => s.field === 'teacherName' && s.direction === 'asc')
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : ''
                        }`}
                        onClick={() => handleSortSelect('teacherName', 'asc')}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Trainer (A to Z)
                      </Button>

                      <Button 
                        variant="outline" 
                        className={`justify-start ${
                          activeSorts.some(s => s.field === 'cleanedClass' && s.direction === 'asc')
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : ''
                        }`}
                        onClick={() => handleSortSelect('cleanedClass', 'asc')}
                      >
                        <Menu className="mr-2 h-4 w-4" />
                        Class Name (A to Z)
                      </Button>

                      <Button 
                        variant="outline" 
                        className={`justify-start ${
                          activeSorts.some(s => s.field === 'totalCheckins' && s.direction === 'desc')
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : ''
                        }`}
                        onClick={() => handleSortSelect('totalCheckins', 'desc')}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Most Check-ins
                      </Button>

                      <Button 
                        variant="outline" 
                        className={`justify-start ${
                          activeSorts.some(s => s.field === 'totalRevenue' && s.direction === 'desc')
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : ''
                        }`}
                        onClick={() => handleSortSelect('totalRevenue', 'desc')}
                      >
                        <BarChart2 className="mr-2 h-4 w-4" />
                        Highest Revenue
                      </Button>

                      <Button 
                        variant="outline" 
                        className={`justify-start ${
                          activeSorts.some(s => s.field === 'classAverageExcludingEmpty' && s.direction === 'desc')
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : ''
                        }`}
                        onClick={() => handleSortSelect('classAverageExcludingEmpty', 'desc')}
                      >
                        <BarChart2 className="mr-2 h-4 w-4" />
                        Best Average Attendance
                      </Button>

                      <Button 
                        variant="outline" 
                        className={`justify-start ${
                          activeSorts.some(s => s.field === 'date' && s.direction === 'desc')
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : ''
                        }`}
                        onClick={() => handleSortSelect('date', 'desc')}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Newest First
                      </Button>
                    </div>

                    {activeSorts.length > 0 && (
                      <div className="mt-4 flex justify-end">
                        <Button variant="ghost" size="sm" onClick={clearAllSorts} className="text-xs">
                          <X className="mr-2 h-3.5 w-3.5" />
                          Clear Sort
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimpleDataFilters;
