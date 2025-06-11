/**
 * Theme Context Provider
 * 
 * Provides comprehensive theming support including dark mode,
 * custom themes, and user preferences.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

export interface CustomTheme {
  id: string;
  name: string;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: {
      default: string;
      paper: string;
      elevation1: string;
      elevation2: string;
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    divider: string;
    action: {
      active: string;
      hover: string;
      selected: string;
      disabled: string;
    };
  };
  typography: {
    fontFamily: string;
    h1: { fontSize: string; fontWeight: number };
    h2: { fontSize: string; fontWeight: number };
    h3: { fontSize: string; fontWeight: number };
    h4: { fontSize: string; fontWeight: number };
    h5: { fontSize: string; fontWeight: number };
    h6: { fontSize: string; fontWeight: number };
    body1: { fontSize: string; lineHeight: number };
    body2: { fontSize: string; lineHeight: number };
    caption: { fontSize: string; lineHeight: number };
  };
  spacing: {
    unit: number;
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadows: {
    light: string;
    medium: string;
    heavy: string;
  };
  animation: {
    duration: {
      short: number;
      standard: number;
      long: number;
    };
    easing: {
      standard: string;
      accelerate: string;
      decelerate: string;
    };
  };
  components: {
    chart: {
      colors: string[];
      grid: string;
      axis: string;
    };
    dataTable: {
      headerBackground: string;
      rowHover: string;
      border: string;
    };
    dashboard: {
      widgetBackground: string;
      widgetBorder: string;
      widgetShadow: string;
    };
  };
}

export interface ThemeContextType {
  currentTheme: CustomTheme;
  themeName: string;
  availableThemes: CustomTheme[];
  isDarkMode: boolean;
  isHighContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Theme actions
  setTheme: (themeName: string) => void;
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  createCustomTheme: (theme: Omit<CustomTheme, 'id'>) => void;
  updateCustomTheme: (id: string, updates: Partial<CustomTheme>) => void;
  deleteCustomTheme: (id: string) => void;
  resetToDefault: () => void;
  
  // Utility functions
  getChartColors: () => string[];
  getComponentTheme: (component: string) => any;
  exportTheme: () => string;
  importTheme: (themeJson: string) => void;
}

const defaultLightTheme: CustomTheme = {
  id: 'light',
  name: 'light',
  displayName: 'Light Theme',
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      elevation1: '#f5f5f5',
      elevation2: '#eeeeee'
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)'
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 300 },
    h2: { fontSize: '2rem', fontWeight: 400 },
    h3: { fontSize: '1.75rem', fontWeight: 400 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.43 },
    caption: { fontSize: '0.75rem', lineHeight: 1.66 }
  },
  spacing: {
    unit: 8,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12
  },
  shadows: {
    light: '0 1px 3px rgba(0,0,0,0.12)',
    medium: '0 4px 6px rgba(0,0,0,0.1)',
    heavy: '0 10px 25px rgba(0,0,0,0.15)'
  },
  animation: {
    duration: {
      short: 150,
      standard: 300,
      long: 500
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)'
    }
  },
  components: {
    chart: {
      colors: ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#00acc1', '#f57c00', '#5d4037'],
      grid: 'rgba(0, 0, 0, 0.1)',
      axis: 'rgba(0, 0, 0, 0.54)'
    },
    dataTable: {
      headerBackground: '#f5f5f5',
      rowHover: 'rgba(0, 0, 0, 0.04)',
      border: 'rgba(0, 0, 0, 0.12)'
    },
    dashboard: {
      widgetBackground: '#ffffff',
      widgetBorder: 'rgba(0, 0, 0, 0.12)',
      widgetShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  }
};

const defaultDarkTheme: CustomTheme = {
  id: 'dark',
  name: 'dark',
  displayName: 'Dark Theme',
  colors: {
    primary: '#90caf9',
    secondary: '#f48fb1',
    success: '#66bb6a',
    warning: '#ffb74d',
    error: '#f44336',
    info: '#42a5f5',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
      elevation1: '#2d2d2d',
      elevation2: '#383838'
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      disabled: 'rgba(255, 255, 255, 0.38)'
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    action: {
      active: 'rgba(255, 255, 255, 0.54)',
      hover: 'rgba(255, 255, 255, 0.04)',
      selected: 'rgba(255, 255, 255, 0.08)',
      disabled: 'rgba(255, 255, 255, 0.26)'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 300 },
    h2: { fontSize: '2rem', fontWeight: 400 },
    h3: { fontSize: '1.75rem', fontWeight: 400 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.43 },
    caption: { fontSize: '0.75rem', lineHeight: 1.66 }
  },
  spacing: {
    unit: 8,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12
  },
  shadows: {
    light: '0 1px 3px rgba(0,0,0,0.25)',
    medium: '0 4px 6px rgba(0,0,0,0.2)',
    heavy: '0 10px 25px rgba(0,0,0,0.3)'
  },
  animation: {
    duration: {
      short: 150,
      standard: 300,
      long: 500
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)'
    }
  },
  components: {
    chart: {
      colors: ['#90caf9', '#f48fb1', '#66bb6a', '#ffb74d', '#ce93d8', '#4fc3f7', '#ffcc02', '#a1887f'],
      grid: 'rgba(255, 255, 255, 0.1)',
      axis: 'rgba(255, 255, 255, 0.54)'
    },
    dataTable: {
      headerBackground: '#2d2d2d',
      rowHover: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(255, 255, 255, 0.12)'
    },
    dashboard: {
      widgetBackground: '#1e1e1e',
      widgetBorder: 'rgba(255, 255, 255, 0.12)',
      widgetShadow: '0 2px 4px rgba(0,0,0,0.25)'
    }
  }
};

const highContrastTheme: CustomTheme = {
  id: 'high-contrast',
  name: 'high-contrast',
  displayName: 'High Contrast',
  colors: {
    primary: '#ffffff',
    secondary: '#ffff00',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
    background: {
      default: '#000000',
      paper: '#000000',
      elevation1: '#1a1a1a',
      elevation2: '#333333'
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      disabled: '#666666'
    },
    divider: '#ffffff',
    action: {
      active: '#ffffff',
      hover: 'rgba(255, 255, 255, 0.1)',
      selected: 'rgba(255, 255, 255, 0.2)',
      disabled: '#666666'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 700 },
    h3: { fontSize: '1.75rem', fontWeight: 700 },
    h4: { fontSize: '1.5rem', fontWeight: 700 },
    h5: { fontSize: '1.25rem', fontWeight: 700 },
    h6: { fontSize: '1rem', fontWeight: 700 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.43 },
    caption: { fontSize: '0.75rem', lineHeight: 1.66 }
  },
  spacing: {
    unit: 8,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32
  },
  borderRadius: {
    small: 0,
    medium: 0,
    large: 0
  },
  shadows: {
    light: '0 0 0 2px #ffffff',
    medium: '0 0 0 3px #ffffff',
    heavy: '0 0 0 4px #ffffff'
  },
  animation: {
    duration: {
      short: 0,
      standard: 0,
      long: 0
    },
    easing: {
      standard: 'linear',
      accelerate: 'linear',
      decelerate: 'linear'
    }
  },
  components: {
    chart: {
      colors: ['#ffffff', '#ffff00', '#00ff00', '#ff0000', '#00ffff', '#ff00ff', '#ffa500', '#ffc0cb'],
      grid: '#ffffff',
      axis: '#ffffff'
    },
    dataTable: {
      headerBackground: '#333333',
      rowHover: 'rgba(255, 255, 255, 0.1)',
      border: '#ffffff'
    },
    dashboard: {
      widgetBackground: '#000000',
      widgetBorder: '#ffffff',
      widgetShadow: '0 0 0 2px #ffffff'
    }
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<string>('light');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);

  // Load preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('datalysis-theme');
    const savedDarkMode = localStorage.getItem('datalysis-dark-mode');
    const savedHighContrast = localStorage.getItem('datalysis-high-contrast');
    const savedFontSize = localStorage.getItem('datalysis-font-size');
    const savedCustomThemes = localStorage.getItem('datalysis-custom-themes');

    if (savedTheme) setThemeName(savedTheme);
    if (savedDarkMode) setIsDarkMode(JSON.parse(savedDarkMode));
    if (savedHighContrast) setIsHighContrast(JSON.parse(savedHighContrast));
    if (savedFontSize) setFontSize(savedFontSize as 'small' | 'medium' | 'large');
    if (savedCustomThemes) {
      try {
        setCustomThemes(JSON.parse(savedCustomThemes));
      } catch (error) {
        console.error('Failed to parse custom themes:', error);
      }
    }

    // Detect system dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (!savedTheme && !savedDarkMode) {
      setIsDarkMode(mediaQuery.matches);
      setThemeName(mediaQuery.matches ? 'dark' : 'light');
    }

    // Listen for system theme changes
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('datalysis-theme')) {
        setIsDarkMode(e.matches);
        setThemeName(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('datalysis-theme', themeName);
    localStorage.setItem('datalysis-dark-mode', JSON.stringify(isDarkMode));
    localStorage.setItem('datalysis-high-contrast', JSON.stringify(isHighContrast));
    localStorage.setItem('datalysis-font-size', fontSize);
    localStorage.setItem('datalysis-custom-themes', JSON.stringify(customThemes));
  }, [themeName, isDarkMode, isHighContrast, fontSize, customThemes]);

  const availableThemes = [defaultLightTheme, defaultDarkTheme, highContrastTheme, ...customThemes];

  const getCurrentTheme = (): CustomTheme => {
    if (isHighContrast) return highContrastTheme;
    
    let theme = availableThemes.find(t => t.name === themeName);
    if (!theme) {
      theme = isDarkMode ? defaultDarkTheme : defaultLightTheme;
    }

    // Apply font size modifications
    const fontSizeMultiplier = fontSize === 'small' ? 0.875 : fontSize === 'large' ? 1.125 : 1;
    
    return {
      ...theme,
      typography: {
        ...theme.typography,
        h1: { ...theme.typography.h1, fontSize: `${parseFloat(theme.typography.h1.fontSize) * fontSizeMultiplier}rem` },
        h2: { ...theme.typography.h2, fontSize: `${parseFloat(theme.typography.h2.fontSize) * fontSizeMultiplier}rem` },
        h3: { ...theme.typography.h3, fontSize: `${parseFloat(theme.typography.h3.fontSize) * fontSizeMultiplier}rem` },
        h4: { ...theme.typography.h4, fontSize: `${parseFloat(theme.typography.h4.fontSize) * fontSizeMultiplier}rem` },
        h5: { ...theme.typography.h5, fontSize: `${parseFloat(theme.typography.h5.fontSize) * fontSizeMultiplier}rem` },
        h6: { ...theme.typography.h6, fontSize: `${parseFloat(theme.typography.h6.fontSize) * fontSizeMultiplier}rem` },
        body1: { ...theme.typography.body1, fontSize: `${parseFloat(theme.typography.body1.fontSize) * fontSizeMultiplier}rem` },
        body2: { ...theme.typography.body2, fontSize: `${parseFloat(theme.typography.body2.fontSize) * fontSizeMultiplier}rem` },
        caption: { ...theme.typography.caption, fontSize: `${parseFloat(theme.typography.caption.fontSize) * fontSizeMultiplier}rem` }
      }
    };
  };

  const currentTheme = getCurrentTheme();

  // Convert custom theme to MUI theme
  const muiTheme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: currentTheme.colors.primary
      },
      secondary: {
        main: currentTheme.colors.secondary
      },
      success: {
        main: currentTheme.colors.success
      },
      warning: {
        main: currentTheme.colors.warning
      },
      error: {
        main: currentTheme.colors.error
      },
      info: {
        main: currentTheme.colors.info
      },
      background: {
        default: currentTheme.colors.background.default,
        paper: currentTheme.colors.background.paper
      },
      text: {
        primary: currentTheme.colors.text.primary,
        secondary: currentTheme.colors.text.secondary,
        disabled: currentTheme.colors.text.disabled
      },
      divider: currentTheme.colors.divider,
      action: {
        active: currentTheme.colors.action.active,
        hover: currentTheme.colors.action.hover,
        selected: currentTheme.colors.action.selected,
        disabled: currentTheme.colors.action.disabled
      }
    },
    typography: {
      fontFamily: currentTheme.typography.fontFamily,
      h1: {
        fontSize: currentTheme.typography.h1.fontSize,
        fontWeight: currentTheme.typography.h1.fontWeight
      },
      h2: {
        fontSize: currentTheme.typography.h2.fontSize,
        fontWeight: currentTheme.typography.h2.fontWeight
      },
      h3: {
        fontSize: currentTheme.typography.h3.fontSize,
        fontWeight: currentTheme.typography.h3.fontWeight
      },
      h4: {
        fontSize: currentTheme.typography.h4.fontSize,
        fontWeight: currentTheme.typography.h4.fontWeight
      },
      h5: {
        fontSize: currentTheme.typography.h5.fontSize,
        fontWeight: currentTheme.typography.h5.fontWeight
      },
      h6: {
        fontSize: currentTheme.typography.h6.fontSize,
        fontWeight: currentTheme.typography.h6.fontWeight
      },
      body1: {
        fontSize: currentTheme.typography.body1.fontSize,
        lineHeight: currentTheme.typography.body1.lineHeight
      },
      body2: {
        fontSize: currentTheme.typography.body2.fontSize,
        lineHeight: currentTheme.typography.body2.lineHeight
      },
      caption: {
        fontSize: currentTheme.typography.caption.fontSize,
        lineHeight: currentTheme.typography.caption.lineHeight
      }
    },
    spacing: currentTheme.spacing.unit,
    shape: {
      borderRadius: currentTheme.borderRadius.medium
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease, color 0.3s ease'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: currentTheme.shadows.light,
            '&:hover': {
              boxShadow: currentTheme.shadows.medium
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: currentTheme.borderRadius.medium,
            transition: `all ${currentTheme.animation.duration.standard}ms ${currentTheme.animation.easing.standard}`
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: currentTheme.borderRadius.medium
            }
          }
        }
      }
    }
  });

  const contextValue: ThemeContextType = {
    currentTheme,
    themeName,
    availableThemes,
    isDarkMode,
    isHighContrast,
    fontSize,

    setTheme: (name: string) => {
      setThemeName(name);
      if (name === 'dark') setIsDarkMode(true);
      else if (name === 'light') setIsDarkMode(false);
    },

    toggleDarkMode: () => {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      setThemeName(newDarkMode ? 'dark' : 'light');
    },

    toggleHighContrast: () => {
      setIsHighContrast(!isHighContrast);
    },

    setFontSize: (size: 'small' | 'medium' | 'large') => {
      setFontSize(size);
    },

    createCustomTheme: (theme: Omit<CustomTheme, 'id'>) => {
      const newTheme: CustomTheme = {
        ...theme,
        id: `custom_${Date.now()}`
      };
      setCustomThemes([...customThemes, newTheme]);
    },

    updateCustomTheme: (id: string, updates: Partial<CustomTheme>) => {
      setCustomThemes(customThemes.map(theme =>
        theme.id === id ? { ...theme, ...updates } : theme
      ));
    },

    deleteCustomTheme: (id: string) => {
      setCustomThemes(customThemes.filter(theme => theme.id !== id));
      if (themeName === availableThemes.find(t => t.id === id)?.name) {
        setThemeName('light');
      }
    },

    resetToDefault: () => {
      setThemeName('light');
      setIsDarkMode(false);
      setIsHighContrast(false);
      setFontSize('medium');
      setCustomThemes([]);
    },

    getChartColors: () => currentTheme.components.chart.colors,

    getComponentTheme: (component: string) => {
      return (currentTheme.components as any)[component] || {};
    },

    exportTheme: () => {
      return JSON.stringify(currentTheme, null, 2);
    },

    importTheme: (themeJson: string) => {
      try {
        const importedTheme: CustomTheme = JSON.parse(themeJson);
        if (importedTheme.id && importedTheme.name) {
          // Ensure unique ID
          importedTheme.id = `imported_${Date.now()}`;
          importedTheme.name = `imported_${importedTheme.name}`;
          setCustomThemes([...customThemes, importedTheme]);
        }
      } catch (error) {
        console.error('Failed to import theme:', error);
        throw new Error('Invalid theme format');
      }
    }
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

// Theme Customization Hook
export const useThemeCustomization = () => {
  const themeContext = useTheme();
  
  const createThemeVariant = (baseTheme: CustomTheme, modifications: Partial<CustomTheme>): CustomTheme => {
    return {
      ...baseTheme,
      ...modifications,
      id: `variant_${Date.now()}`,
      colors: {
        ...baseTheme.colors,
        ...modifications.colors
      },
      typography: {
        ...baseTheme.typography,
        ...modifications.typography
      },
      components: {
        ...baseTheme.components,
        ...modifications.components
      }
    };
  };

  const generateColorPalette = (primaryColor: string): Partial<CustomTheme['colors']> => {
    // Simple color palette generation (in real app, use proper color theory)
    const hsl = hexToHsl(primaryColor);
    
    return {
      primary: primaryColor,
      secondary: hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
      success: hslToHex(120, hsl.s, hsl.l),
      warning: hslToHex(45, hsl.s, hsl.l),
      error: hslToHex(0, hsl.s, hsl.l),
      info: hslToHex(200, hsl.s, hsl.l)
    };
  };

  return {
    ...themeContext,
    createThemeVariant,
    generateColorPalette
  };
};

// Color utility functions
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 1/6) {
    r = c; g = x; b = 0;
  } else if (1/6 <= h && h < 1/3) {
    r = x; g = c; b = 0;
  } else if (1/3 <= h && h < 1/2) {
    r = 0; g = c; b = x;
  } else if (1/2 <= h && h < 2/3) {
    r = 0; g = x; b = c;
  } else if (2/3 <= h && h < 5/6) {
    r = x; g = 0; b = c;
  } else if (5/6 <= h && h < 1) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default ThemeProvider; 