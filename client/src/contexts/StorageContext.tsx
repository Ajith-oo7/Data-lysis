import React, { createContext, useContext, useState } from 'react';
import { storage, StorageReference } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface StorageFile extends StorageReference {
  url?: string;
}

interface StorageContextType {
  uploadFile: (file: File, directory?: string) => Promise<string>;
  listFiles: (directory?: string) => Promise<StorageFile[]>;
  deleteFile: (filePath: string) => Promise<void>;
  files: StorageFile[];
  isLoading: boolean;
  error: string | null;
  refreshFiles: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType>({
  uploadFile: async () => '',
  listFiles: async () => [],
  deleteFile: async () => {},
  files: [],
  isLoading: false,
  error: null,
  refreshFiles: async () => {},
});

export const useStorage = () => useContext(StorageContext);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserStoragePath = () => {
    if (!user) return 'public';
    return `users/${user.uid}`;
  };

  const uploadFile = async (file: File, directory?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const basePath = directory || getUserStoragePath();
      const uploadRef = storage.ref(`${basePath}/${file.name}`);
      const snapshot = await uploadRef.put(file);
      const downloadUrl = await snapshot.ref.getDownloadURL();
      
      // Refresh the file list after uploading
      await refreshFiles();
      
      return downloadUrl;
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
      console.error('Error uploading file:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const listFiles = async (directory?: string): Promise<StorageFile[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const basePath = directory || getUserStoragePath();
      const fileList = await storage.listFiles(basePath);
      setFiles(fileList);
      return fileList;
    } catch (err: any) {
      setError(err.message || 'Error listing files');
      console.error('Error listing files:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (filePath: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock deletion by removing from our mock storage
      const fileRef = storage.ref(filePath);
      // In a real implementation, we would call fileRef.delete()
      console.log(`Deleting file at path: ${filePath}`);
      
      // Refresh the file list after deletion
      await refreshFiles();
    } catch (err: any) {
      setError(err.message || 'Error deleting file');
      console.error('Error deleting file:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFiles = async (): Promise<void> => {
    if (user) {
      await listFiles();
    }
  };

  return (
    <StorageContext.Provider value={{ 
      uploadFile, 
      listFiles, 
      deleteFile,
      files,
      isLoading,
      error,
      refreshFiles
    }}>
      {children}
    </StorageContext.Provider>
  );
};