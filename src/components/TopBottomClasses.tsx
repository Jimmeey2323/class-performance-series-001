
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatIndianCurrency } from './MetricsPanel';
import { Calendar, Clock, MapPin, ChevronDown, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TopBottomClassesProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data, trainerAvatars }) => {
  const [groupByTrainer, setGroupByTrainer] = useState(false);
  const [metric, setMetric] = useState<'attendance' | 'revenue'>('attendance');
  const [displayCount, setDisplayCount] = useState(5);

  // Filter out "Hosted" classes
  const filteredData = useMemo(() => {
    return data.filter(item => !item.cleanedClass?.toLowerCase().includes('hosted'));
  }, [data]);

  const getTopBottomClasses = () => {
    if (!filteredData || filteredData.length === 0) return { top: [], bottom: [] };

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
        acc[key].totalRevenue += Number(item.totalRevenue || 0);
        acc[key].totalOccurrences += 1;
        
        return acc;
      }, {} as Record<string, any>);

      const classes = Object.values(grouped).map(item => ({
        ...item,
        average: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageIncludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageExcludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0
      }));

      // Filter out classes that don't meet criteria
      const filteredClasses = classes.filter(item => item.totalOccurrences >= 2);

      return {
        top: filteredClasses
          .sort((a, b) => metric === 'attendance' 
            ? b.average - a.average 
            : b.totalRevenue - a.totalRevenue
          )
          .slice(0, displayCount),
        bottom: filteredClasses
          .sort((a, b) => metric === 'attendance'
            ? a.average - b.average
            : a.totalRevenue - b.totalRevenue
          )
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
        acc[key].totalRevenue += Number(item.totalRevenue || 0);
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
        classAverageExcludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0
      }));

      // Filter out classes that don't meet criteria
      const filteredClasses = classes.filter(item => item.totalOccurrences >= 2);

      return {
        top: filteredClasses
          .sort((a, b) => metric === 'attendance'
            ? b.average - a.average
            : b.totalRevenue - a.totalRevenue
          )
          .slice(0, displayCount),
        bottom: filteredClasses
          .sort((a, b) => metric === 'attendance'
            ? a.average - b.average
            : a.totalRevenue - b.totalRevenue
          )
          .slice(0, displayCount)
      };
    }
  };

  const { top, bottom } = getTopBottomClasses();
  const hasMoreData = useMemo(() => {
    const totalFilteredClasses = filteredData.filter(item => 
      !item.cleanedClass?.toLowerCase().includes('hosted')
    ).length;
    
    return totalFilteredClasses > displayCount;
  }, [filteredData, displayCount]);

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Top & Bottom Classes
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-md">
            <Switch
              checked={groupByTrainer}
              onCheckedChange={setGroupByTrainer}
              id="trainer-switch" 
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="trainer-switch" className="font-medium">Include Trainer</Label>
          </div>
          
          <Select value={metric} onValueChange={(value: 'attendance' | 'revenue') => setMetric(value)}>
            <SelectTrigger className="w-[180px] bg-white shadow-md border-0">
              <SelectValue placeholder="Ranking Metric" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-xl">
              <SelectItem value="attendance">By Attendance</SelectItem>
              <SelectItem value="revenue">By Revenue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Classes */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              Top {displayCount} Classes
            </h3>
            <div className="space-y-4">
              {top.length > 0 ? top.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/80 rounded-lg shadow-sm hover:shadow-md transition-all border border-green-100">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-green-600 w-8">
                      #{index + 1}
                    </span>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-800">{item.cleanedClass}</p>
                      
                      {/* Enhanced Class Details */}
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-semibold px-2 py-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {item.dayOfWeek}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 font-semibold px-2 py-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.classTime}
                        </Badge>
                      </div>
                      
                      {groupByTrainer && item.teacherName && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 ring-2 ring-green-200">
                            <AvatarImage src={trainerAvatars[item.teacherName]} />
                            <AvatarFallback className="bg-green-100 text-green-700 text-xs font-medium">
                              {item.teacherName?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-slate-700">{item.teacherName}</span>
                        </div>
                      )}
                      
                      {!groupByTrainer && Array.isArray(item.trainers) && (
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.trainers.length} trainer{item.trainers.length > 1 ? 's' : ''}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                        <span>{item.totalOccurrences} classes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-semibold text-slate-800">
                      {metric === 'attendance' 
                        ? item.average.toFixed(1)
                        : formatIndianCurrency(item.totalRevenue)
                      }
                    </p>
                    <p className="text-sm text-slate-600">
                      {metric === 'attendance' ? 'Avg. Attendance' : 'Total Revenue'}
                    </p>
                    <div className="text-xs text-slate-500">
                      Total check-ins: {item.totalCheckins}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-center text-slate-500">
                  No classes found matching the criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Classes */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-red-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-800 flex items-center gap-2">
              <div className="w-2 h-6 bg-red-500 rounded-full"></div>
              Bottom {displayCount} Classes
            </h3>
            <div className="space-y-4">
              {bottom.length > 0 ? bottom.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/80 rounded-lg shadow-sm hover:shadow-md transition-all border border-red-100">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-red-500 w-8">
                      #{displayCount - index}
                    </span>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-800">{item.cleanedClass}</p>
                      
                      {/* Enhanced Class Details */}
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-semibold px-2 py-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {item.dayOfWeek}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 font-semibold px-2 py-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.classTime}
                        </Badge>
                      </div>
                      
                      {groupByTrainer && item.teacherName && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 ring-2 ring-red-200">
                            <AvatarImage src={trainerAvatars[item.teacherName]} />
                            <AvatarFallback className="bg-red-100 text-red-700 text-xs font-medium">
                              {item.teacherName?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-slate-700">{item.teacherName}</span>
                        </div>
                      )}
                      
                      {!groupByTrainer && Array.isArray(item.trainers) && (
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.trainers.length} trainer{item.trainers.length > 1 ? 's' : ''}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                        <span>{item.totalOccurrences} classes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-semibold text-slate-800">
                      {metric === 'attendance'
                        ? item.average.toFixed(1)
                        : formatIndianCurrency(item.totalRevenue)
                      }
                    </p>
                    <p className="text-sm text-slate-600">
                      {metric === 'attendance' ? 'Avg. Attendance' : 'Total Revenue'}
                    </p>
                    <div className="text-xs text-slate-500">
                      Total check-ins: {item.totalCheckins}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-center text-slate-500">
                  No classes found matching the criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {hasMoreData && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={handleShowMore}
            className="bg-white shadow-lg border-0 hover:bg-gray-50"
          >
            Show More <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TopBottomClasses;
