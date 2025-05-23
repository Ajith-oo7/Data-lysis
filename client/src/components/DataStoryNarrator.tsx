import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Sparkles, 
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Download
} from "lucide-react";
import { ProcessingResult } from '@/types';

interface DataStoryNarratorProps {
  processingResults: ProcessingResult;
  onSelectChart?: (chartIndex: number) => void;
}

export function DataStoryNarrator({ processingResults, onSelectChart }: DataStoryNarratorProps) {
  const [storyMode, setStoryMode] = useState<'insights' | 'guided-tour'>('insights');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [interval, setIntervalState] = useState<number | null>(null);
  
  const { dataProfile, insights, charts } = processingResults;
  
  // Create story slides based on insights and charts
  const storySlides = [
    // Introduction slide
    {
      title: "Data Story Overview",
      content: `This dataset contains ${dataProfile?.rowCount || 0} records with ${dataProfile?.columnCount || 0} columns. ${
        dataProfile?.datasetType ? `It appears to be ${dataProfile.datasetType.replace('_', ' ')} data.` : ''
      }`,
      type: 'introduction',
      chartIndex: -1
    },
    // Data quality slide
    {
      title: "Data Quality Assessment",
      content: `The dataset has ${(dataProfile?.missingValuesPercentage || 0).toFixed(2)}% missing values and ${(dataProfile?.duplicateRowsPercentage || 0).toFixed(2)}% duplicates. ${
        (dataProfile?.missingValuesPercentage || 0) < 5 ? 'The data quality is good!' : 'There are some data quality issues to address.'
      }`,
      type: 'quality',
      chartIndex: -1
    },
    // Add insights as slides
    ...(insights?.map((insight, idx) => ({
      title: insight.title,
      content: `${insight.description} ${insight.recommendation ? `\n\nRecommendation: ${insight.recommendation}` : ''}`,
      type: 'insight',
      chartIndex: -1,
      insightIndex: idx
    })) || []),
    // Add charts as slides
    ...(charts?.map((chart, idx) => ({
      title: chart.title || 'Visualization',
      content: getChartDescription(chart, dataProfile),
      type: 'chart',
      chartIndex: idx
    })) || [])
  ];
  
  // Function to get detailed chart descriptions with column names
  function getChartDescription(chart: any, dataProfile: any) {
    const chartType = chart.type?.toLowerCase() || 'chart';
    const description = chart.description || '';
    
    // Add column-specific context where possible
    let columnContext = '';
    if (chart.data && dataProfile?.columns) {
      // Extract column names from chart data (if they match dataset columns)
      const chartColumns = new Set<string>();
      
      if (chartType === 'bar' || chartType === 'line') {
        // For most charts, the category might be a column name
        const categoryColumn = dataProfile.columns.find(
          (col: any) => col.name.toLowerCase() === (chart.xAxis || 'category').toLowerCase()
        );
        if (categoryColumn) {
          chartColumns.add(categoryColumn.name);
        }
        
        // Value columns
        const valueColumn = dataProfile.columns.find(
          (col: any) => col.name.toLowerCase() === (chart.yAxis || 'value').toLowerCase()
        );
        if (valueColumn) {
          chartColumns.add(valueColumn.name);
        }
      } else if (chartType === 'scatter') {
        // For scatter plots, look for x and y columns
        const xColumn = dataProfile.columns.find(
          (col: any) => col.name.toLowerCase() === (chart.xAxis || 'x').toLowerCase()
        );
        if (xColumn) {
          chartColumns.add(xColumn.name);
        }
        
        const yColumn = dataProfile.columns.find(
          (col: any) => col.name.toLowerCase() === (chart.yAxis || 'y').toLowerCase()
        );
        if (yColumn) {
          chartColumns.add(yColumn.name);
        }
      }
      
      // Add column context if we found matching columns
      if (chartColumns.size > 0) {
        columnContext = `\n\nThis visualization uses the following columns: ${Array.from(chartColumns).join(', ')}.`;
      }
    }
    
    // Base description based on chart type
    let baseDescription = '';
    switch(chartType) {
      case 'bar':
        baseDescription = 'This bar chart shows the relative magnitude of values across different categories. The height of each bar represents the value magnitude, making it easy to compare different categories.';
        break;
      case 'pie':
        baseDescription = 'This pie chart shows how different parts contribute to a whole. Each segment represents a proportion of the total, making it useful for showing composition and percentage distribution.';
        break;
      case 'line':
        baseDescription = 'This line chart shows trends over time or sequence. The line connects data points to highlight patterns, changes, and growth or decline across the dataset.';
        break;
      case 'scatter':
        baseDescription = 'This scatter plot shows the relationship between two variables. Each point represents a data entry with its position determined by the x and y values, helping identify correlations and outliers.';
        break;
      case 'radar':
        baseDescription = 'This radar chart compares multiple variables simultaneously. Each axis represents a different variable, and the connected points show the relative strength of each variable.';
        break;
      case 'stacked_bar':
        baseDescription = 'This stacked bar chart shows both the total value and the composition of each category. The stacked segments represent different components that make up the whole.';
        break;
      default:
        baseDescription = `This ${chartType} visualization helps identify patterns and relationships in your data.`;
    }
    
    return `${description}\n\n${baseDescription}${columnContext}`;
  }
  
  // Control playback of the story
  useEffect(() => {
    if (isPlaying) {
      const id = window.setInterval(() => {
        setCurrentSlide(prev => {
          const next = prev + 1;
          if (next >= storySlides.length) {
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
      }, 8000); // Change slide every 8 seconds
      
      setIntervalState(id);
      return () => {
        if (interval) window.clearInterval(interval);
      };
    } else if (interval) {
      window.clearInterval(interval);
      setIntervalState(null);
    }
  }, [isPlaying, storySlides.length]);
  
  // Handle navigation
  const goToNextSlide = () => {
    if (currentSlide < storySlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };
  
  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  const jumpToSlide = (index: number) => {
    if (index >= 0 && index < storySlides.length) {
      setCurrentSlide(index);
    }
  };
  
  // When a chart slide is shown, notify parent to highlight the corresponding chart
  useEffect(() => {
    const currentSlideData = storySlides[currentSlide];
    if (currentSlideData?.type === 'chart' && currentSlideData.chartIndex >= 0 && onSelectChart) {
      onSelectChart(currentSlideData.chartIndex);
    }
  }, [currentSlide, storySlides, onSelectChart]);
  
  const currentSlideData = storySlides[currentSlide];
  
  return (
    <div className="data-story-narrator">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Interactive Data Story</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={storyMode === 'insights' ? 'bg-blue-50 text-blue-600' : ''}
            onClick={() => setStoryMode('insights')}
          >
            <Lightbulb className="h-4 w-4 mr-1.5" />
            Insights
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={storyMode === 'guided-tour' ? 'bg-blue-50 text-blue-600' : ''}
            onClick={() => setStoryMode('guided-tour')}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Guided Tour
          </Button>
        </div>
      </div>
      
      <Card className="shadow-md border-blue-100">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              Slide {currentSlide + 1} of {storySlides.length}
            </Badge>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="px-2 w-8 h-8"
                onClick={() => jumpToSlide(0)}
                disabled={currentSlide === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-2 w-8 h-8"
                onClick={goToPrevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-2 w-8 h-8"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-2 w-8 h-8"
                onClick={goToNextSlide}
                disabled={currentSlide === storySlides.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-2 w-8 h-8"
                onClick={() => jumpToSlide(storySlides.length - 1)}
                disabled={currentSlide === storySlides.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="slide-content mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{currentSlideData?.title}</h3>
            <div className="bg-gray-50 p-4 rounded-md text-gray-700 whitespace-pre-line">
              {currentSlideData?.content}
            </div>
            
            {currentSlideData?.type === 'chart' && currentSlideData.chartIndex >= 0 && (
              <div className="mt-4 flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onSelectChart && onSelectChart(currentSlideData.chartIndex)}
                  className="text-blue-600"
                >
                  View this visualization
                </Button>
              </div>
            )}
          </div>
          
          {/* Progress indicator */}
          <div className="mt-6 flex justify-center">
            <div className="flex gap-1">
              {storySlides.map((_, index) => (
                <button
                  key={index}
                  className={`h-1.5 rounded-full ${
                    index === currentSlide ? 'w-4 bg-blue-600' : 'w-2 bg-gray-300'
                  }`}
                  onClick={() => jumpToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" className="text-sm">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export as PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}