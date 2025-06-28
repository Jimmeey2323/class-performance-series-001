
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatIndianCurrency } from './MetricsPanel';
import { Calendar, Clock, MapPin, ChevronDown, User, Trophy, Target, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [groupByTrainer, setGroupByTrainer] = useState(false);
  const [metric, setMetric] = useState<'attendance' | 'revenue' | 'conversion' | 'retention'>('attendance');
  const [displayCount, setDisplayCount] = useState(5);

  const getTopBottomClasses = () => {
    if (!data || data.length === 0) return { top: [], bottom: [] };

    // Filter out "Hosted" classes
    const filteredData = data.filter(item => 
      !item.cleanedClass?.toLowerCase().includes('hosted')
    );

    if (groupByTrainer) {
      // Group by trainer and class type
      const grouped = filteredData.reduce((acc, item) => {
        const key = `${item.teacherName}-${item.cleanedClass}-${item.dayOfWeek}-${item.classTime}-${item.location}`;
        if (!acc[key]) {
          acc[key] = {
            teacherName: item.teacherName,
            cleanedClass: item.cleanedClass,
            dayOfWeek: item.dayOfWeek,
            classTime: item.classTime,
            location: item.location,
            totalCheckins: 0,
            totalRevenue: 0,
            totalOccurrences: 0,
            classAverageIncludingEmpty: 0,
            classAverageExcludingEmpty: 0
          };
        }
        acc[key].totalCheckins += Number(item.totalCheckins || 0);
        const revenueValue = typeof item.totalRevenue === 'string' ? parseFloat(item.totalRevenue) || 0 : item.totalRevenue || 0;
        acc[key].totalRevenue += revenueValue;
        acc[key].totalOccurrences += 1;
        
        return acc;
      }, {} as Record<string, any>);

      const classes = Object.values(grouped).map(item => ({
        ...item,
        average: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageIncludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageExcludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        conversionRate: Math.random() * 30 + 10, // Mock data
        retentionRate: Math.random() * 40 + 30 // Mock data
      }));

      // Filter out classes that don't meet criteria
      const filteredClasses = classes.filter(item => {
        return !item.cleanedClass.includes('Recovery') && 
               item.totalOccurrences >= 2;
      });

      const getSortValue = (item: any) => {
        switch (metric) {
          case 'attendance':
            return item.average;
          case 'revenue':
            return item.totalRevenue;
          case 'conversion':
            return item.conversionRate;
          case 'retention':
            return item.retentionRate;
          default:
            return item.average;
        }
      };

      return {
        top: filteredClasses
          .sort((a, b) => getSortValue(b) - getSortValue(a))
          .slice(0, displayCount),
        bottom: filteredClasses
          .sort((a, b) => getSortValue(a) - getSortValue(b))
          .slice(0, displayCount)
      };
    } else {
      // Group by class type, day, time and location
      const grouped = filteredData.reduce((acc, item) => {
        const key = `${item.cleanedClass}-${item.dayOfWeek}-${item.classTime}-${item.location}`;
        if (!acc[key]) {
          acc[key] = {
            cleanedClass: item.cleanedClass,
            dayOfWeek: item.dayOfWeek,
            classTime: item.classTime,
            location: item.location,
            totalCheckins: 0,
            totalRevenue: 0,
            totalOccurrences: 0,
            trainers: new Set(),
          };
        }
        acc[key].totalCheckins += Number(item.totalCheckins || 0);
        const revenueValue = typeof item.totalRevenue === 'string' ? parseFloat(item.totalRevenue) || 0 : item.totalRevenue || 0;
        acc[key].totalRevenue += revenueValue;
        acc[key].totalOccurrences += 1;
        if (item.teacherName) {
          acc[key].trainers.add(item.teacherName);
        }
        
        return acc;
      }, {} as Record<string, any>);

      const classes = Object.values(grouped).map(item => ({
        ...item,
        trainers: Array.from(item.trainers),
        average: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageIncludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageExcludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        conversionRate: Math.random() * 30 + 10, // Mock data
        retentionRate: Math.random() * 40 + 30 // Mock data
      }));

      // Filter out classes that don't meet criteria
      const filteredClasses = classes.filter(item => {
        return !item.cleanedClass.includes('Recovery') && 
               item.totalOccurrences >= 2;
      });

      const getSortValue = (item: any) => {
        switch (metric) {
          case 'attendance':
            return item.average;
          case 'revenue':
            return item.totalRevenue;
          case 'conversion':
            return item.conversionRate;
          case 'retention':
            return item.retentionRate;
          default:
            return item.average;
        }
      };

      return {
        top: filteredClasses
          .sort((a, b) => getSortValue(b) - getSortValue(a))
          .slice(0, displayCount),
        bottom: filteredClasses
          .sort((a, b) => getSortValue(a) - getSortValue(b))
          .slice(0, displayCount)
      };
    }
  };

  const { top, bottom } = getTopBottomClasses();
  const hasMoreData = useMemo(() => {
    const totalFilteredClasses = data.filter(item => 
      !item.cleanedClass?.toLowerCase().includes('hosted') && 
      !item.cleanedClass?.toLowerCase().includes('recovery')
    ).length;
    
    return totalFilteredClasses > displayCount;
  }, [data, displayCount]);

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  const getMetricValue = (item: any) => {
    switch (metric) {
      case 'attendance':
        return item.average.toFixed(1);
      case 'revenue':
        return formatIndianCurrency(item.totalRevenue);
      case 'conversion':
        return `${item.conversionRate.toFixed(1)}%`;
      case 'retention':
        return `${item.retentionRate.toFixed(1)}%`;
      default:
        return item.average.toFixed(1);
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'attendance':
        return 'Avg. Attendance';
      case 'revenue':
        return 'Total Revenue';
      case 'conversion':
        return 'Conversion Rate';
      case 'retention':
        return 'Retention Rate';
      default:
        return 'Avg. Attendance';
    }
  };

  const getMetricIcon = () => {
    switch (metric) {
      case 'attendance':
        return <BarChart3 className="h-4 w-4" />;
      case 'revenue':
        return <Target className="h-4 w-4" />;
      case 'conversion':
        return <Trophy className="h-4 w-4" />;
      case 'retention':
        return <User className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Top & Bottom Classes
            </h2>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3 p-3 bg-white/90 rounded-xl shadow-lg border border-primary/20">
            <Switch
              checked={groupByTrainer}
              onCheckedChange={setGroupByTrainer}
              id="trainer-switch"
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="trainer-switch" className="font-medium">Group by Trainer</Label>
          </div>
          
          <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
            <SelectTrigger className="w-[200px] bg-white/90 backdrop-blur-sm shadow-lg border-primary/20">
              <div className="flex items-center gap-2">
                {getMetricIcon()}
                <SelectValue placeholder="Select Metric" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-lg border-none shadow-xl">
              <SelectItem value="attendance">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  By Attendance
                </div>
              </SelectItem>
              <SelectItem value="revenue">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  By Revenue
                </div>
              </SelectItem>
              <SelectItem value="conversion">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  By Conversion
                </div>
              </SelectItem>
              <SelectItem value="retention">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  By Retention
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Classes */}
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-green-50 via-white to-emerald-50">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-white" />
                <h3 className="text-xl font-bold text-white">Top {displayCount} Classes</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {getMetricLabel()}
                </Badge>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {top.length > 0 ? top.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-green-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-800">{item.cleanedClass}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 font-bold text-slate-700">
                          <Calendar className="h-3 w-3" />
                          {item.dayOfWeek}
                        </div>
                        <div className="flex items-center gap-1 font-bold text-slate-700">
                          <Clock className="h-3 w-3" />
                          {item.classTime}
                        </div>
                      </div>
                      {groupByTrainer ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="font-medium">{item.teacherName}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(item.trainers) 
                            ? `${item.trainers.length} trainer${item.trainers.length > 1 ? 's' : ''}` 
                            : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                        <span>{item.totalOccurrences} classes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xl font-bold text-green-600">
                      {getMetricValue(item)}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {getMetricLabel()}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Check-ins: {item.totalCheckins}</div>
                      <div>Avg: {item.classAverageIncludingEmpty.toFixed(1)}</div>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No classes found matching the criteria</p>
                </div>
              )}
            </div>
            
            {hasMoreData && (
              <div className="p-6 pt-0">
                <Button 
                  variant="outline" 
                  onClick={handleShowMore}
                  className="w-full border-green-200 hover:bg-green-50"
                >
                  Show More <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Classes */}
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-red-50 via-white to-rose-50">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-white" />
                <h3 className="text-xl font-bold text-white">Bottom {displayCount} Classes</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {getMetricLabel()}
                </Badge>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {bottom.length > 0 ? bottom.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-red-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white font-bold text-sm">
                      #{displayCount - index}
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-800">{item.cleanedClass}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 font-bold text-slate-700">
                          <Calendar className="h-3 w-3" />
                          {item.dayOfWeek}
                        </div>
                        <div className="flex items-center gap-1 font-bold text-slate-700">
                          <Clock className="h-3 w-3" />
                          {item.classTime}
                        </div>
                      </div>
                      {groupByTrainer ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="font-medium">{item.teacherName}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(item.trainers) 
                            ? `${item.trainers.length} trainer${item.trainers.length > 1 ? 's' : ''}` 
                            : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                        <span>{item.totalOccurrences} classes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xl font-bold text-red-600">
                      {getMetricValue(item)}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {getMetricLabel()}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Check-ins: {item.totalCheckins}</div>
                      <div>Avg: {item.classAverageIncludingEmpty.toFixed(1)}</div>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No classes found matching the criteria</p>
                </div>
              )}
            </div>
            
            {hasMoreData && (
              <div className="p-6 pt-0">
                <Button 
                  variant="outline" 
                  onClick={handleShowMore}
                  className="w-full border-red-200 hover:bg-red-50"
                >
                  Show More <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopBottomClasses;
