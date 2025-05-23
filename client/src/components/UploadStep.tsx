import { useAppContext } from "@/contexts/AppContext";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Wand2, PieChart, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAnimations } from "@/hooks/use-animations";

export default function UploadStep() {
  const { fileInfo, setFileInfo, setCurrentStep } = useAppContext();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const { fadeInUp, scaleIn } = useAnimations();
  
  // Refs for animation targets
  const headerRef = useRef<HTMLHeadingElement>(null);
  const uploadCardRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const featureCardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Animate elements on mount
    if (headerRef.current) {
      fadeInUp(headerRef.current);
    }
    
    // Use setTimeout to create staggered animations
    setTimeout(() => {
      if (uploadCardRef.current) {
        fadeInUp(uploadCardRef.current);
      }
    }, 300);
    
    setTimeout(() => {
      if (featuresRef.current) {
        fadeInUp(featuresRef.current);
      }
    }, 500);
    
    // Animate feature cards with a delay
    featureCardsRef.current.forEach((card, index) => {
      setTimeout(() => {
        fadeInUp(card);
      }, 600 + (index * 100));
    });
  }, [fadeInUp]);

  // Animate file upload success
  useEffect(() => {
    if (fileInfo.file && uploadCardRef.current) {
      const successIcon = uploadCardRef.current.querySelector('.success-icon') as HTMLElement | null;
      if (successIcon) {
        scaleIn(successIcon);
      }
    }
  }, [fileInfo.file, scaleIn]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload an Excel or CSV file.",
        variant: "destructive"
      });
      return;
    }
    
    const fileSizeInKB = Math.round(file.size / 1024);
    
    setFileInfo({
      file,
      fileName: file.name,
      fileSize: `${fileSizeInKB} KB`
    });
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFileInfo({ file: null, fileName: '', fileSize: '' });
  };

  const handleContinue = () => {
    if (fileInfo.file) {
      setCurrentStep('preprocess');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-sm border border-gray-200" ref={uploadCardRef}>
        <CardContent className="p-6">
          <h2 ref={headerRef} className="text-xl font-semibold text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
            Upload Your Excel Data
          </h2>
          <p className="text-gray-600 mb-6">
            Upload an Excel file to begin analyzing your data. The platform supports .xlsx, .xls, and .csv formats.
          </p>
          
          <div
            className={`relative overflow-hidden glassmorphism ${
              dragActive 
                ? 'border-2 border-dashed border-primary animate-glow' 
                : 'border border-gray-200/50 hover:border-gray-300/80'
            } rounded-lg px-6 py-10 text-center transition-all duration-300 mb-6 cursor-pointer hover:shadow-lg group`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {/* Animated background elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl transform rotate-45 group-hover:bg-primary/10 transition-all duration-500"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/5 rounded-full blur-2xl transform -rotate-45 group-hover:bg-accent/10 transition-all duration-500"></div>
          
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileInputChange}
            />
            
            {!fileInfo.file ? (
              <div>
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-bounce-slow" />
                <p className="text-gray-700 font-medium mb-1">Drag and drop your file here or</p>
                <span className="text-primary-600 font-medium cursor-pointer hover:text-primary-700 transition-colors">
                  browse files
                </span>
                <p className="text-gray-500 text-sm mt-2">Supported formats: .xlsx, .xls, .csv</p>
              </div>
            ) : (
              <div>
                <div className="bg-green-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 success-icon">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-800 font-medium mb-1">{fileInfo.fileName}</p>
                <p className="text-gray-500 text-sm">{fileInfo.fileSize}</p>
                <Button
                  variant="link"
                  className="mt-4 text-sm text-primary-600 font-medium hover:text-primary-700"
                  onClick={handleClearFile}
                >
                  Change file
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button
              className={`btn-futuristic relative px-5 py-2.5 font-medium rounded-md transition-all duration-300 overflow-hidden ${
                fileInfo.file ? 'animate-gradient neon-border shadow-lg hover:shadow-xl' : 'opacity-50'
              }`}
              onClick={handleContinue}
              disabled={!fileInfo.file}
            >
              {/* Animated particles */}
              {fileInfo.file && (
                <>
                  <span className="absolute top-0 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"></span>
                  <span className="absolute bottom-0 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></span>
                </>
              )}
              
              <span className="relative z-10 flex items-center">
                Continue to Preprocessing
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div ref={featuresRef} className="mt-12 grid md:grid-cols-3 gap-6">
        <Card 
          className="p-6 relative overflow-hidden glassmorphism card-3d border-gray-200/20 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 group"
          ref={el => el && featureCardsRef.current.push(el)}
        >
          {/* Decorative background */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-xl opacity-70 transition-all duration-700 group-hover:bg-primary/20 group-hover:w-32 group-hover:h-32"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 text-primary flex items-center justify-center mb-4 animate-pulse-slow group-hover:scale-110 transition-transform duration-500">
              <Wand2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gradient mb-2">Automated Cleaning</h3>
            <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors">
              Our AI automatically identifies and fixes common data issues like missing values and duplicates.
            </p>
          </div>
        </Card>
        
        <Card 
          className="p-6 relative overflow-hidden glassmorphism card-3d border-gray-200/20 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 group"
          ref={el => el && featureCardsRef.current.push(el)}
        >
          {/* Decorative background */}
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/10 rounded-full blur-xl opacity-70 transition-all duration-700 group-hover:bg-accent/20 group-hover:w-32 group-hover:h-32"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/30 text-accent flex items-center justify-center mb-4 animate-pulse-slow group-hover:scale-110 transition-transform duration-500">
              <PieChart className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gradient mb-2">Instant Visualization</h3>
            <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors">
              Get immediate insights with automatically generated charts and visualizations of your data.
            </p>
          </div>
        </Card>
        
        <Card 
          className="p-6 relative overflow-hidden glassmorphism card-3d border-gray-200/20 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 group"
          ref={el => el && featureCardsRef.current.push(el)}
        >
          {/* Decorative background */}
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-primary/10 rounded-full blur-xl opacity-70 transition-all duration-700 group-hover:bg-primary/20 group-hover:w-32 group-hover:h-32"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/30 text-primary flex items-center justify-center mb-4 animate-pulse-slow group-hover:scale-110 transition-transform duration-500">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gradient mb-2">Natural Language Queries</h3>
            <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors">
              Ask questions about your data in plain English and get instant answers with the power of AI.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
