import { useEffect, useState } from 'react';
import { useStorage } from '@/contexts/StorageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileIcon, FileText, Trash } from 'lucide-react';
import { StorageReference } from '@/lib/firebase';

interface FileListProps {
  onSelectFile?: (file: StorageReference & { url?: string }) => void;
  className?: string;
}

export function FileList({ onSelectFile, className }: FileListProps) {
  const { user } = useAuth();
  const { files, listFiles, deleteFile, isLoading, error, refreshFiles } = useStorage();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      refreshFiles();
    }
  }, [user, refreshFiles]);
  
  const handleSelectFile = (file: StorageReference & { url?: string }) => {
    setSelectedFile(file.fullPath);
    if (onSelectFile) {
      onSelectFile(file);
    }
  };
  
  const handleDeleteFile = async (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(filePath);
    }
  };
  
  if (!user) {
    return (
      <Card className={cn("glassmorphism border-gray-200/20", className)}>
        <CardHeader>
          <CardTitle>My Files</CardTitle>
          <CardDescription>
            Sign in to view your files
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-gray-500">
          Please sign in to view your files
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("glassmorphism border-gray-200/20", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>My Files</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshFiles()}
            disabled={isLoading}
            className="hover-lift"
          >
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          {files.length} {files.length === 1 ? 'file' : 'files'} uploaded
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No files found</p>
            <p className="text-sm mt-1">Upload files to analyze them</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div 
                key={file.fullPath} 
                className={cn(
                  "p-3 rounded-md hover:bg-primary/5 cursor-pointer transition-all duration-300 border border-gray-200/10",
                  selectedFile === file.fullPath && "bg-primary/10 border-primary/20"
                )}
                onClick={() => handleSelectFile(file)}
              >
                <div className="flex items-center">
                  <div className="bg-primary/10 w-10 h-10 rounded-md flex items-center justify-center mr-3 shadow-inner">
                    <FileIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 truncate">{file.fullPath}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {file.url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover-lift" onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.url, '_blank');
                      }}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover-lift"
                      onClick={(e) => handleDeleteFile(file.fullPath, e)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}