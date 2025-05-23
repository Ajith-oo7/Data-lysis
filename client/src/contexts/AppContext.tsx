import { createContext, useContext, useState, ReactNode } from 'react';
import { 
  FileInfo, 
  ProcessingResult, 
  QueryResult, 
  QueryHistoryItem, 
  ResultTab, 
  ProcessingStatus,
  Step
} from '@/types';

interface AppContextType {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  fileInfo: FileInfo;
  setFileInfo: (fileInfo: FileInfo) => void;
  preprocessingRules: string;
  setPreprocessingRules: (rules: string) => void;
  processingStatus: ProcessingStatus;
  setProcessingStatus: (status: ProcessingStatus) => void;
  processingResults: ProcessingResult | null;
  setProcessingResults: (results: ProcessingResult | null) => void;
  resultTab: ResultTab;
  setResultTab: (tab: ResultTab) => void;
  query: string;
  setQuery: (query: string) => void;
  isQuerying: boolean;
  setIsQuerying: (isQuerying: boolean) => void;
  queryResult: QueryResult | null;
  setQueryResult: (result: QueryResult | null) => void;
  queryHistory: QueryHistoryItem[];
  setQueryHistory: (history: QueryHistoryItem[]) => void;
  addToQueryHistory: (item: QueryHistoryItem) => void;
  clearFileInfo: () => void;
  clearResults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [fileInfo, setFileInfo] = useState<FileInfo>({ file: null, fileName: '', fileSize: '' });
  const [preprocessingRules, setPreprocessingRules] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [processingResults, setProcessingResults] = useState<ProcessingResult | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('insights');
  const [query, setQuery] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);

  const addToQueryHistory = (item: QueryHistoryItem) => {
    setQueryHistory((prev) => [item, ...prev]);
  };

  const clearFileInfo = () => {
    setFileInfo({ file: null, fileName: '', fileSize: '' });
  };

  const clearResults = () => {
    setProcessingResults(null);
    setQueryResult(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        fileInfo,
        setFileInfo,
        preprocessingRules,
        setPreprocessingRules,
        processingStatus,
        setProcessingStatus,
        processingResults,
        setProcessingResults,
        resultTab,
        setResultTab,
        query,
        setQuery,
        isQuerying,
        setIsQuerying,
        queryResult,
        setQueryResult,
        queryHistory,
        setQueryHistory,
        addToQueryHistory,
        clearFileInfo,
        clearResults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
