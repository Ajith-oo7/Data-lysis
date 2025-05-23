import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { FileList, FileUploader } from "@/components/storage";
import { LoginButton } from "@/components/auth";
import { useState, useEffect } from "react";
import { FileIcon, Upload, Database, FolderOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserFilesPage() {
  const { user, isLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  
  return (
    <div className="container mx-auto px-4 md:px-6 py-8 fade-in-up-animation">
      <div className="relative">
        {/* Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <FolderOpen className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-gradient">Your Files</h1>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !user ? (
            <Card className="glassmorphism border-gray-200/20 max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Sign in to access your files</CardTitle>
                <CardDescription>
                  Sign in to view, upload, and manage your data files securely in the cloud.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <LoginButton />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card className="glassmorphism border-gray-200/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Files
                    </CardTitle>
                    <CardDescription>
                      Upload your Excel files for analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUploader 
                      onUploadComplete={(url) => {
                        console.log("File uploaded:", url);
                        // Ideally you would refresh the file list here
                      }}
                    />
                  </CardContent>
                </Card>
                
                {selectedFile && (
                  <Card className="glassmorphism border-gray-200/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileIcon className="h-5 w-5" />
                        Selected File
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mb-4">
                        <div className="bg-primary/10 w-12 h-12 rounded-md flex items-center justify-center mr-3">
                          <FileIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">{selectedFile.fullPath}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button className="w-full btn-futuristic flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Analyze File
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="lg:col-span-2">
                <FileList 
                  onSelectFile={(file) => setSelectedFile(file)}
                  className="h-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}