import { useState, useRef } from 'react';
import { useStorage } from '@/contexts/StorageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Upload, File, X, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onUploadComplete?: (url: string) => void;
  acceptedFileTypes?: string;
  maxSizeInMB?: number;
  directory?: string;
  className?: string;
}

export function FileUploader({
  onUploadComplete,
  acceptedFileTypes = '.xlsx,.xls,.csv,.json',
  maxSizeInMB = 10,
  directory,
  className,
}: FileUploaderProps) {
  const { user } = useAuth();
  const { uploadFile, isLoading } = useStorage();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSizeInMB * 1024 * 1024;
    
    if (!acceptedFileTypes.split(',').some(type => 
      file.name.toLowerCase().endsWith(type.replace('*', '').toLowerCase())
    )) {
      return `File type not supported. Please upload: ${acceptedFileTypes}`;
    }
    
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeInMB}MB limit`;
    }
    
    return null;
  };
  
  const validateAndSetFile = (file: File) => {
    const validationError = validateFile(file);
    setError(validationError);
    setSelectedFile(validationError ? null : file);
    setIsSuccess(false);
    return !validationError;
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    try {
      setError(null);
      setIsSuccess(false);
      const url = await uploadFile(selectedFile, directory);
      
      setIsSuccess(true);
      
      if (onUploadComplete) {
        onUploadComplete(url);
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
      console.error('Upload error:', err);
    }
  };
  
  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
    setIsSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  if (!user) {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-sm text-gray-500">Please sign in to upload files</p>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 transition-all duration-300 relative overflow-hidden group",
            isDragging ? "border-primary bg-primary/5" : "border-gray-200/20 hover:border-primary/50",
          )}
        >
          {/* Background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10">
            <input
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all duration-300 shadow-inner",
                isDragging ? "bg-primary/20" : "bg-primary/10 group-hover:scale-110"
              )}>
                <Upload className={cn(
                  "h-6 w-6 transition-all duration-300",
                  isDragging ? "text-primary animate-bounce" : "text-primary/80 group-hover:text-primary"
                )} />
              </div>
              
              <h3 className="text-lg font-medium mb-1 group-hover:text-primary transition-colors">
                {isDragging ? "Drop your file here" : "Upload your data file"}
              </h3>
              
              <p className="text-sm text-gray-500 text-center mb-3">
                Drag & drop your file or browse
              </p>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="group-hover:border-primary group-hover:text-primary hover-lift"
              >
                Browse Files
              </Button>
              
              <p className="mt-3 text-xs text-gray-500">
                Supported formats: {acceptedFileTypes} (Max: {maxSizeInMB}MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 transition-all duration-300 relative overflow-hidden glassmorphism">
          <div className="flex items-center">
            <div className="bg-primary/10 w-12 h-12 rounded-md flex items-center justify-center mr-3 shadow-inner">
              <File className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSelection}
              className="h-8 w-8 hover-lift"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearSelection}
              disabled={isLoading}
              className="hover-lift"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isLoading}
              className="relative overflow-hidden btn-futuristic"
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/90">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              )}
              Upload File
            </Button>
          </div>
          
          {error && (
            <div className="mt-3 p-2 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {isSuccess && (
            <div className="mt-3 p-2 bg-success/10 text-success rounded-md text-sm flex items-center gap-2">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>File uploaded successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}