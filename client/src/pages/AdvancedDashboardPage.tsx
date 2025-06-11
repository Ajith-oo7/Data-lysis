import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import CustomDashboard from '../components/CustomDashboard';

const AdvancedDashboardPage: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <CustomDashboard />
      </div>
    </ThemeProvider>
  );
};

export default AdvancedDashboardPage; 