
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatIndianCurrency } from './MetricsPanel';
import { Calendar, Clock, MapPin, ChevronDown, User, Activity, Trophy, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TopBottomFormatsTrainersProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const TopBottomFormatsTrainers: React.FC<TopBottomFormatsTrainersProps> = ({ data, trainerAvatars }) => {
  const [metric, setMetric] = useState<'attendance' | 'revenue' | 'classes'>('attendance');
  const [displayCount, setDisplayCount] = useState(5);

  // Filter out "Hosted" classes
  const filteredData = useMemo(() => {
    return data.filter(item => !item.cleanedClass?.toLowerCase().includes('hosted'));
  }, [data]);

  const getTopBottomFormats = () => {
    if (!filteredData || filteredData.length === 0) return { top: [], bottom: [] };

    // Group by class format (cleanedClass)
    const grouped = filteredData.reduce((acc, item) => {
      const key = item.cleanedClass;
      if (!acc[key]) {
        acc[key] = {
          format: item.cleanedClass,
          totalCheckins: 0,
          totalRevenue: 0,
          totalClasses: 0,
          locations: new Set(),
          trainers: new Set(),
          averageAttendance: 0
        };
      }
      acc[key].totalCheckins += Number(item.totalCheckins || 0);
      acc[key].totalRevenue += Number(item.totalRevenue || 0);
      acc[key].totalClasses += 1;
      if (item.location) acc[key].locations.add(item.location);
      if (item.teacherName) acc[key].trainers.add(item.teacherName);
      
      return acc;
    }, {} as Record<string, any>);

    const formats = Object.values(grouped).map(item => ({
      ...item,
      locations: Array.from(item.locations),
      trainers: Array.from(item.trainers),
      averageAttendance: item.totalClasses > 0 ? item.totalCheckins / item.totalClasses : 0
    }));

    // Filter formats with at least 3 classes
    const filteredFormats = formats.filter(item => item.totalClasses >= 3);

    const sortKey = metric === 'attendance' ? 'averageAttendance' : 
                   metric === 'revenue' ? 'totalRevenue' : 'totalClasses';

    return {
      top: filteredFormats
        .sort((a, b) => b[sortKey] - a[sortKey])
        .slice(0, displayCount),
      bottom: filteredFormats
        .sort((a, b) => a[sortKey] - b[sortKey])
        .slice(0, displayCount)
    };
  };

  const getTopBottomTrainers = () => {
    if (!filteredData || filteredData.length === 0) return { top: [], bottom: [] };

    // Group by trainer
    const grouped = filteredData.reduce((acc, item) => {
      const key = item.teacherName;
      if (!key) return acc;
      
      if (!acc[key]) {
        acc[key] = {
          trainer: item.teacherName,
          teacherEmail: item.teacherEmail,
          totalCheckins: 0,
          totalRevenue: 0,
          totalClasses: 0,
          formats: new Set(),
          locations: new Set(),
          averageAttendance: 0
        };
      }
      acc[key].totalCheckins += Number(item.totalCheckins || 0);
      acc[key].totalRevenue += Number(item.totalRevenue || 0);
      acc[key].totalClasses += 1;
      if (item.cleanedClass) acc[key].formats.add(item.cleanedClass);
      if (item.location) acc[key].locations.add(item.location);
      
      return acc;
    }, {} as Record<string, any>);

    const trainers = Object.values(grouped).map(item => ({
      ...item,
      formats: Array.from(item.formats),
      locations: Array.from(item.locations),
      averageAttendance: item.totalClasses > 0 ? item.totalCheckins / item.totalClasses : 0
    }));

    // Filter trainers with at least 5 classes
    const filteredTrainers = trainers.filter(item => item.totalClasses >= 5);

    const sortKey = metric === 'attendance' ? 'averageAttendance' : 
                   metric === 'revenue' ? 'totalRevenue' : 'totalClasses';

    return {
      top: filteredTrainers
        .sort((a, b) => b[sortKey] - a[sortKey])
        .slice(0, displayCount),
      bottom: filteredTrainers
        .sort((a, b) => a[sortKey] - b[sortKey])
        .slice(0, displayCount)
    };
  };

  const formats = getTopBottomFormats();
  const trainers = getTopBottomTrainers();

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  const getMetricValue = (item: any, type: 'format' | 'trainer') => {
    switch(metric) {
      case 'attendance':
        return item.averageAttendance.toFixed(1);
      case 'revenue':
        return formatIndianCurrency(item.totalRevenue);
      case 'classes':
        return item.totalClasses.toString();
      default:
        return item.averageAttendance.toFixed(1);
    }
  };

  const getMetricLabel = () => {
    switch(metric) {
      case 'attendance':
        return 'Avg. Attendance';
      case 'revenue':
        return 'Total Revenue';
      case 'classes':
        return 'Total Classes';
      default:
        return 'Avg. Attendance';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Performance Rankings
        </h2>
        <div className="flex items-center gap-4">
          <Select value={metric} onValueChange={(value: 'attendance' | 'revenue' | 'classes') => setMetric(value)}>
            <SelectTrigger className="w-[180px] bg-white shadow-md border-0">
              <SelectValue placeholder="Ranking Metric" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-xl">
              <SelectItem value="attendance">By Attendance</SelectItem>
              <SelectItem value="revenue">By Revenue</SelectItem>
              <SelectItem value="classes">By Classes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="formats" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg border-0">
          <TabsTrigger value="formats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="mr-2 h-4 w-4" />
            Class Formats
          </TabsTrigger>
          <TabsTrigger value="trainers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="mr-2 h-4 w-4" />
            Trainers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formats" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Formats */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Top {displayCount} Formats</h3>
                </div>
                <div className="space-y-4">
                  {formats.top.length > 0 ? formats.top.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/80 rounded-lg shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-green-600 w-8">
                          #{index + 1}
                        </span>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">{item.format}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {item.totalClasses} classes
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.trainers.length} trainer{item.trainers.length > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.locations.length} location{item.locations.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-semibold text-slate-800">
                          {getMetricValue(item, 'format')}
                        </p>
                        <p className="text-sm text-slate-600">{getMetricLabel()}</p>
                        <div className="text-xs text-slate-500">
                          Total check-ins: {item.totalCheckins}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 text-center text-slate-500">
                      No formats found matching the criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Formats */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">Bottom {displayCount} Formats</h3>
                </div>
                <div className="space-y-4">
                  {formats.bottom.length > 0 ? formats.bottom.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/80 rounded-lg shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-red-500 w-8">
                          #{displayCount - index}
                        </span>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">{item.format}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {item.totalClasses} classes
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.trainers.length} trainer{item.trainers.length > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.locations.length} location{item.locations.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-semibold text-slate-800">
                          {getMetricValue(item, 'format')}
                        </p>
                        <p className="text-sm text-slate-600">{getMetricLabel()}</p>
                        <div className="text-xs text-slate-500">
                          Total check-ins: {item.totalCheckins}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 text-center text-slate-500">
                      No formats found matching the criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trainers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Trainers */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-800">Top {displayCount} Trainers</h3>
                </div>
                <div className="space-y-4">
                  {trainers.top.length > 0 ? trainers.top.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/80 rounded-lg shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-blue-600 w-8">
                          #{index + 1}
                        </span>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                            <AvatarImage src={trainerAvatars[item.trainer]} />
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                              {item.trainer?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-800">{item.trainer}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {item.totalClasses} classes
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {item.formats.length} format{item.formats.length > 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.locations.length} location{item.locations.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-semibold text-slate-800">
                          {getMetricValue(item, 'trainer')}
                        </p>
                        <p className="text-sm text-slate-600">{getMetricLabel()}</p>
                        <div className="text-xs text-slate-500">
                          Total check-ins: {item.totalCheckins}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 text-center text-slate-500">
                      No trainers found matching the criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Trainers */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-800">Bottom {displayCount} Trainers</h3>
                </div>
                <div className="space-y-4">
                  {trainers.bottom.length > 0 ? trainers.bottom.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/80 rounded-lg shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-orange-500 w-8">
                          #{displayCount - index}
                        </span>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-orange-200">
                            <AvatarImage src={trainerAvatars[item.trainer]} />
                            <AvatarFallback className="bg-orange-100 text-orange-700 font-medium">
                              {item.trainer?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-800">{item.trainer}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {item.totalClasses} classes
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {item.formats.length} format{item.formats.length > 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.locations.length} location{item.locations.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-semibold text-slate-800">
                          {getMetricValue(item, 'trainer')}
                        </p>
                        <p className="text-sm text-slate-600">{getMetricLabel()}</p>
                        <div className="text-xs text-slate-500">
                          Total check-ins: {item.totalCheckins}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 text-center text-slate-500">
                      No trainers found matching the criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={handleShowMore}
          className="bg-white shadow-lg border-0 hover:bg-gray-50"
        >
          Show More <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TopBottomFormatsTrainers;
