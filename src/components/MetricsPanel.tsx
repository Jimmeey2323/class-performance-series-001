
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ProcessedData } from '@/types/data';
import {
  LineChart,
  Clock,
  Calendar,
  User,
  Percent,
  DollarSign,
  Activity,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  BarChart,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';
import CountUp from 'react-countup';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const formatIndianCurrency = (value: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
};

interface MetricsPanelProps {
  data: ProcessedData[];
}

const generateSparklineData = (data: ProcessedData[], field: keyof ProcessedData, periods: number = 10): number[] => {
  // Group data by period
  const periodData = data.reduce((acc: Record<string, number>, item) => {
    const period = item.period || 'Unknown';
    if (!acc[period]) acc[period] = 0;
    const value = typeof item[field] === 'number' ? item[field] as number : 
                  typeof item[field] === 'string' ? parseFloat(item[field] as string) || 0 : 0;
    acc[period] += value;
    return acc;
  }, {});

  // Sort periods chronologically and take the last `periods` number
  const sortedPeriods = Object.keys(periodData).sort();
  const recentPeriods = sortedPeriods.slice(-periods);

  // Return the values for the recent periods
  return recentPeriods.map(period => periodData[period]);
};

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  const [showCountUp, setShowCountUp] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  useEffect(() => {
    // Trigger CountUp after component mounts
    setShowCountUp(true);
  }, []);

  const metrics = useMemo(() => {
    if (!data.length) return [];

    const totalClasses = data.reduce((sum, item) => sum + item.totalOccurrences, 0);
    const totalCheckins = data.reduce((sum, item) => sum + item.totalCheckins, 0);
    const totalRevenue = data.reduce((sum, item) => {
      const revenue = typeof item.totalRevenue === 'string' ? parseFloat(item.totalRevenue) : item.totalRevenue;
      return sum + (revenue || 0);
    }, 0);
    const totalCancelled = data.reduce((sum, item) => sum + item.totalCancelled, 0);
    const totalTime = data.reduce((sum, item) => sum + item.totalTime, 0);

    const totalNonEmpty = data.reduce((sum, item) => sum + item.totalNonEmpty, 0);
    const averageClassSize = totalClasses > 0 ? totalCheckins / totalClasses : 0;
    const averageRevenue = totalClasses > 0 ? totalRevenue / totalClasses : 0;
    const cancellationRate = totalCheckins + totalCancelled > 0 ? (totalCancelled / (totalCheckins + totalCancelled)) * 100 : 0;
    
    const uniqueTeachers = new Set(data.map(item => item.teacherName)).size;
    const uniqueClasses = new Set(data.map(item => item.cleanedClass)).size;
    const uniqueLocations = new Set(data.map(item => item.location)).size;

    const previousPeriodData = data.slice(0, Math.floor(data.length / 2));
    const currentPeriodData = data.slice(Math.floor(data.length / 2));
    
    const prevRevenue = previousPeriodData.reduce((sum, item) => {
      const revenue = typeof item.totalRevenue === 'string' ? parseFloat(item.totalRevenue) : item.totalRevenue;
      return sum + (revenue || 0);
    }, 0);
    
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return [
      {
        title: 'Total Classes',
        value: totalClasses,
        icon: Calendar,
        color: 'bg-blue-500',
        textColor: 'text-blue-500',
        sparkData: generateSparklineData(data, 'totalOccurrences'),
        description: 'Total number of classes conducted across all locations and trainers',
        trend: revenueGrowth > 0 ? 'up' : 'down',
        trendValue: Math.abs(revenueGrowth).toFixed(1)
      },
      {
        title: 'Total Check-ins',
        value: totalCheckins,
        icon: CheckCircle2,
        color: 'bg-green-500',
        textColor: 'text-green-500',
        sparkData: generateSparklineData(data, 'totalCheckins'),
        description: 'Total number of student check-ins across all classes',
        trend: 'up',
        trendValue: '12.5'
      },
      {
        title: 'Total Revenue',
        value: formatIndianCurrency(totalRevenue),
        icon: DollarSign,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-500',
        sparkData: generateSparklineData(data, 'totalRevenue'),
        description: 'Total revenue generated from all classes and services',
        trend: revenueGrowth > 0 ? 'up' : 'down',
        trendValue: Math.abs(revenueGrowth).toFixed(1)
      },
      {
        title: 'Avg. Class Size',
        value: averageClassSize.toFixed(1),
        icon: Users,
        color: 'bg-violet-500',
        textColor: 'text-violet-500',
        sparkData: [],
        description: 'Average number of students per class',
        trend: 'up',
        trendValue: '8.2'
      },
      {
        title: 'Cancellations',
        value: totalCancelled,
        icon: XCircle,
        color: 'bg-red-500',
        textColor: 'text-red-500',
        sparkData: generateSparklineData(data, 'totalCancelled'),
        description: 'Total number of late cancellations',
        trend: 'down',
        trendValue: '5.3'
      },
      {
        title: 'Cancellation Rate',
        value: `${cancellationRate.toFixed(1)}%`,
        icon: Percent,
        color: 'bg-orange-500',
        textColor: 'text-orange-500',
        sparkData: [],
        description: 'Percentage of bookings that were cancelled',
        trend: 'down',
        trendValue: '2.1'
      },
      {
        title: 'Revenue Per Class',
        value: formatIndianCurrency(averageRevenue),
        icon: BarChart,
        color: 'bg-amber-500',
        textColor: 'text-amber-500',
        sparkData: [],
        description: 'Average revenue generated per class',
        trend: 'up',
        trendValue: '15.7'
      },
      {
        title: 'Total Hours',
        value: totalTime.toFixed(0),
        icon: Clock,
        color: 'bg-cyan-500',
        textColor: 'text-cyan-500',
        sparkData: generateSparklineData(data, 'totalTime'),
        description: 'Total hours of classes conducted',
        trend: 'up',
        trendValue: '22.4'
      },
      {
        title: 'Unique Classes',
        value: uniqueClasses,
        icon: Activity,
        color: 'bg-fuchsia-500',
        textColor: 'text-fuchsia-500',
        sparkData: [],
        description: 'Number of different class types offered',
        trend: 'stable',
        trendValue: '0'
      },
      {
        title: 'Unique Trainers',
        value: uniqueTeachers,
        icon: User,
        color: 'bg-pink-500',
        textColor: 'text-pink-500',
        sparkData: [],
        description: 'Number of different trainers teaching classes',
        trend: 'up',
        trendValue: '25.0'
      },
      {
        title: 'Locations',
        value: uniqueLocations,
        icon: BarChart3,
        color: 'bg-yellow-500',
        textColor: 'text-yellow-500',
        sparkData: [],
        description: 'Number of different locations offering classes',
        trend: 'stable',
        trendValue: '0'
      },
      {
        title: 'Class Attendance',
        value: `${(totalCheckins * 100 / (totalClasses * 10)).toFixed(1)}%`,
        icon: LineChart,
        color: 'bg-teal-500', 
        textColor: 'text-teal-500',
        sparkData: [],
        description: 'Overall attendance rate across all classes',
        trend: 'up',
        trendValue: '7.9'
      }
    ];
  }, [data]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-400" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="h-32 border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden relative bg-gradient-to-br from-white via-white to-slate-50/50">
                    <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300", metric.color)} />
                    <CardContent className="p-4 h-full flex flex-col relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-muted-foreground leading-tight">{metric.title}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                            onClick={() => setSelectedMetric(metric)}
                          >
                            <Info className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(metric.trend)}
                          <span className="text-xs text-muted-foreground">
                            {metric.trendValue}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xl font-bold text-slate-800">
                          {typeof metric.value === 'number' ? (
                            showCountUp ? 
                              <CountUp 
                                start={0} 
                                end={metric.value} 
                                decimals={metric.title.includes('Avg') || metric.title.includes('Rate') ? 1 : 0}
                                separator="," 
                                decimal="."
                              /> : 0
                          ) : (
                            metric.value
                          )}
                        </div>
                        <metric.icon className={cn("h-5 w-5 opacity-70", metric.textColor)} />
                      </div>
                      
                      <div className="mt-auto h-8">
                        {metric.sparkData && metric.sparkData.length > 1 && (
                          <Sparklines data={metric.sparkData} height={24} margin={0}>
                            <SparklinesLine 
                              color={metric.textColor.replace('text-', '')} 
                              style={{ strokeWidth: 2, fill: "none" }} 
                            />
                            <SparklinesSpots 
                              size={2} 
                              style={{ 
                                stroke: metric.textColor.replace('text-', ''),
                                fill: metric.textColor.replace('text-', '')
                              }} 
                            />
                          </Sparklines>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-xs p-3 bg-slate-900 text-white border-none shadow-xl"
                >
                  <div className="space-y-2">
                    <p className="font-semibold">{metric.title}</p>
                    <p className="text-sm text-slate-300">{metric.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      {getTrendIcon(metric.trend)}
                      <span>
                        {metric.trend === 'up' ? 'Increased' : metric.trend === 'down' ? 'Decreased' : 'No change'} by {metric.trendValue}%
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </div>

        {/* Drill-down Modal */}
        <Dialog open={!!selectedMetric} onOpenChange={() => setSelectedMetric(null)}>
          <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                {selectedMetric && <selectedMetric.icon className={cn("h-6 w-6", selectedMetric.textColor)} />}
                {selectedMetric?.title} - Detailed Analytics
              </DialogTitle>
            </DialogHeader>
            
            {selectedMetric && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Current Value</h3>
                      <div className="text-3xl font-bold text-slate-800">
                        {selectedMetric.value}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Trend</h3>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(selectedMetric.trend)}
                        <span className="text-lg font-medium">
                          {selectedMetric.trend === 'up' ? 'Increasing' : 
                           selectedMetric.trend === 'down' ? 'Decreasing' : 'Stable'}
                        </span>
                        <span className="text-muted-foreground">({selectedMetric.trendValue}%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedMetric.description}
                      </p>
                    </div>
                    
                    {selectedMetric.sparkData && selectedMetric.sparkData.length > 1 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Trend Chart</h3>
                        <div className="h-20 bg-slate-50 rounded-lg p-2">
                          <Sparklines data={selectedMetric.sparkData} height={60} margin={5}>
                            <SparklinesLine 
                              color={selectedMetric.textColor.replace('text-', '')} 
                              style={{ strokeWidth: 3, fill: "none" }} 
                            />
                            <SparklinesSpots 
                              size={4} 
                              style={{ 
                                stroke: selectedMetric.textColor.replace('text-', ''),
                                fill: 'white',
                                strokeWidth: 2
                              }} 
                            />
                          </Sparklines>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Key Insights</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Performance has been {selectedMetric.trend === 'up' ? 'improving' : selectedMetric.trend === 'down' ? 'declining' : 'stable'} over the recent period</li>
                    <li>• Change of {selectedMetric.trendValue}% compared to previous period</li>
                    <li>• This metric is important for understanding overall business performance</li>
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default MetricsPanel;
