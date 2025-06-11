import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Save, 
  Upload, 
  Download, 
  Code, 
  Terminal, 
  FileText, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScriptResult {
  success: boolean;
  output?: any;
  error?: string;
  execution_time?: number;
  plots?: any[];
  dataframes?: Record<string, any>;
}

interface PythonScriptingEnvironmentProps {
  data: any[];
  dataInfo?: {
    columns: string[];
    shape: [number, number];
    dtypes: Record<string, string>;
  };
}

const SCRIPT_TEMPLATES = {
  basic_analysis: `# Basic Data Analysis
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Your data is available as 'df'
print(f"Dataset shape: {df.shape}")
print(f"Columns: {list(df.columns)}")

# Basic statistics
print("\\n=== BASIC STATISTICS ===")
print(df.describe())

# Missing values
print("\\n=== MISSING VALUES ===")
print(df.isnull().sum())

# Data types
print("\\n=== DATA TYPES ===")
print(df.dtypes)

# Return the dataframe for further analysis
df`,

  correlation_analysis: `# Correlation Analysis
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Select only numeric columns
numeric_df = df.select_dtypes(include=[np.number])

if len(numeric_df.columns) > 1:
    # Compute correlation matrix
    corr_matrix = numeric_df.corr()
    
    # Create correlation heatmap
    plt.figure(figsize=(10, 8))
    sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0,
                square=True, linewidths=0.5)
    plt.title('Correlation Matrix')
    plt.tight_layout()
    plt.show()
    
    # Find strong correlations
    strong_corr = []
    for i in range(len(corr_matrix.columns)):
        for j in range(i+1, len(corr_matrix.columns)):
            corr_val = corr_matrix.iloc[i, j]
            if abs(corr_val) > 0.7:  # Strong correlation threshold
                strong_corr.append({
                    'var1': corr_matrix.columns[i],
                    'var2': corr_matrix.columns[j],
                    'correlation': corr_val
                })
    
    print("=== STRONG CORRELATIONS (>0.7) ===")
    for corr in strong_corr:
        print(f"{corr['var1']} <-> {corr['var2']}: {corr['correlation']:.3f}")
        
    corr_matrix
else:
    print("Not enough numeric columns for correlation analysis")
    numeric_df`,

  outlier_detection: `# Outlier Detection and Analysis
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

numeric_df = df.select_dtypes(include=[np.number])

outliers_summary = {}

for column in numeric_df.columns:
    data = numeric_df[column].dropna()
    
    # IQR method
    Q1 = data.quantile(0.25)
    Q3 = data.quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    iqr_outliers = data[(data < lower_bound) | (data > upper_bound)]
    
    # Z-score method
    z_scores = np.abs(stats.zscore(data))
    z_outliers = data[z_scores > 3]
    
    outliers_summary[column] = {
        'iqr_outliers': len(iqr_outliers),
        'iqr_percentage': (len(iqr_outliers) / len(data)) * 100,
        'z_outliers': len(z_outliers),
        'z_percentage': (len(z_outliers) / len(data)) * 100,
        'iqr_bounds': [lower_bound, upper_bound],
        'outlier_values': iqr_outliers.tolist()[:10]  # First 10 outliers
    }

# Create visualizations
fig, axes = plt.subplots(2, min(3, len(numeric_df.columns)), figsize=(15, 10))
if len(numeric_df.columns) == 1:
    axes = axes.reshape(-1, 1)

for i, column in enumerate(numeric_df.columns[:3]):  # Limit to 3 columns
    if len(numeric_df.columns) > 1:
        ax1, ax2 = axes[0, i], axes[1, i]
    else:
        ax1, ax2 = axes[0], axes[1]
    
    # Box plot
    ax1.boxplot(numeric_df[column].dropna())
    ax1.set_title(f'{column} - Box Plot')
    ax1.set_ylabel('Values')
    
    # Histogram
    ax2.hist(numeric_df[column].dropna(), bins=30, alpha=0.7)
    ax2.set_title(f'{column} - Distribution')
    ax2.set_xlabel('Values')
    ax2.set_ylabel('Frequency')

plt.tight_layout()
plt.show()

print("=== OUTLIER DETECTION SUMMARY ===")
for column, summary in outliers_summary.items():
    print(f"\\n{column}:")
    print(f"  IQR Outliers: {summary['iqr_outliers']} ({summary['iqr_percentage']:.2f}%)")
    print(f"  Z-Score Outliers: {summary['z_outliers']} ({summary['z_percentage']:.2f}%)")
    print(f"  IQR Bounds: [{summary['iqr_bounds'][0]:.2f}, {summary['iqr_bounds'][1]:.2f}]")

outliers_summary`,

  custom_visualization: `# Custom Visualization
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go

# Set style
plt.style.use('default')
sns.set_palette("husl")

# Example: Advanced multi-plot analysis
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# Plot 1: Value counts of categorical columns
categorical_cols = df.select_dtypes(include=['object']).columns
if len(categorical_cols) > 0:
    col = categorical_cols[0]
    value_counts = df[col].value_counts().head(10)
    axes[0, 0].bar(range(len(value_counts)), value_counts.values)
    axes[0, 0].set_title(f'Top 10 {col} Categories')
    axes[0, 0].set_xticks(range(len(value_counts)))
    axes[0, 0].set_xticklabels(value_counts.index, rotation=45)

# Plot 2: Numeric distribution
numeric_cols = df.select_dtypes(include=['number']).columns
if len(numeric_cols) > 0:
    col = numeric_cols[0]
    axes[0, 1].hist(df[col].dropna(), bins=30, alpha=0.7, edgecolor='black')
    axes[0, 1].set_title(f'{col} Distribution')
    axes[0, 1].set_xlabel(col)
    axes[0, 1].set_ylabel('Frequency')

# Plot 3: Scatter plot if we have 2+ numeric columns
if len(numeric_cols) >= 2:
    x_col, y_col = numeric_cols[0], numeric_cols[1]
    axes[1, 0].scatter(df[x_col], df[y_col], alpha=0.6)
    axes[1, 0].set_title(f'{x_col} vs {y_col}')
    axes[1, 0].set_xlabel(x_col)
    axes[1, 0].set_ylabel(y_col)

# Plot 4: Missing data heatmap
missing_data = df.isnull()
if missing_data.sum().sum() > 0:
    sns.heatmap(missing_data, cbar=True, yticklabels=False, 
                cmap='viridis', ax=axes[1, 1])
    axes[1, 1].set_title('Missing Data Pattern')
else:
    axes[1, 1].text(0.5, 0.5, 'No Missing Data', 
                    horizontalalignment='center', verticalalignment='center',
                    transform=axes[1, 1].transAxes, fontsize=14)
    axes[1, 1].set_title('Missing Data Check')

plt.tight_layout()
plt.show()

# Return summary statistics
{
    'shape': df.shape,
    'columns': list(df.columns),
    'numeric_columns': list(numeric_cols),
    'categorical_columns': list(categorical_cols),
    'missing_values': df.isnull().sum().to_dict(),
    'summary_stats': df.describe().to_dict() if len(numeric_cols) > 0 else 'No numeric data'
}`,

  feature_engineering: `# Feature Engineering Examples
import pandas as pd
import numpy as np
from datetime import datetime

# Create a copy to avoid modifying original data
df_engineered = df.copy()

print("=== FEATURE ENGINEERING ===")

# 1. Handle datetime columns
datetime_cols = []
for col in df_engineered.columns:
    try:
        pd.to_datetime(df_engineered[col], errors='raise')
        datetime_cols.append(col)
        df_engineered[col] = pd.to_datetime(df_engineered[col])
        
        # Extract date features
        df_engineered[f'{col}_year'] = df_engineered[col].dt.year
        df_engineered[f'{col}_month'] = df_engineered[col].dt.month
        df_engineered[f'{col}_day'] = df_engineered[col].dt.day
        df_engineered[f'{col}_weekday'] = df_engineered[col].dt.weekday
        df_engineered[f'{col}_quarter'] = df_engineered[col].dt.quarter
        
        print(f"Created date features for {col}")
    except:
        pass

# 2. Numerical transformations
numeric_cols = df_engineered.select_dtypes(include=[np.number]).columns

for col in numeric_cols:
    if df_engineered[col].min() > 0:  # Log transform for positive values
        df_engineered[f'{col}_log'] = np.log1p(df_engineered[col])
    
    # Square root transform
    if df_engineered[col].min() >= 0:
        df_engineered[f'{col}_sqrt'] = np.sqrt(df_engineered[col])
    
    # Binning
    df_engineered[f'{col}_binned'] = pd.qcut(df_engineered[col], 
                                            q=5, labels=['Very Low', 'Low', 'Medium', 'High', 'Very High'],
                                            duplicates='drop')

print(f"Created numerical transformations for {len(numeric_cols)} columns")

# 3. Categorical encoding
categorical_cols = df_engineered.select_dtypes(include=['object']).columns

for col in categorical_cols:
    if df_engineered[col].nunique() < 20:  # One-hot encode low cardinality
        dummies = pd.get_dummies(df_engineered[col], prefix=col)
        df_engineered = pd.concat([df_engineered, dummies], axis=1)
        print(f"One-hot encoded {col} ({df_engineered[col].nunique()} categories)")
    else:  # Label encode high cardinality
        df_engineered[f'{col}_encoded'] = pd.Categorical(df_engineered[col]).codes
        print(f"Label encoded {col} ({df_engineered[col].nunique()} categories)")

# 4. Create interaction features (for numeric columns)
if len(numeric_cols) >= 2:
    for i, col1 in enumerate(numeric_cols[:3]):  # Limit to first 3 to avoid explosion
        for col2 in numeric_cols[i+1:4]:
            df_engineered[f'{col1}_x_{col2}'] = df_engineered[col1] * df_engineered[col2]
            df_engineered[f'{col1}_div_{col2}'] = df_engineered[col1] / (df_engineered[col2] + 1e-8)

print(f"\\nOriginal shape: {df.shape}")
print(f"Engineered shape: {df_engineered.shape}")
print(f"New features created: {df_engineered.shape[1] - df.shape[1]}")

# Return the engineered dataframe
df_engineered`
};

export const PythonScriptingEnvironment: React.FC<PythonScriptingEnvironmentProps> = ({
  data,
  dataInfo
}) => {
  const [script, setScript] = useState('');
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [savedScripts, setSavedScripts] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load script templates on mount
  useEffect(() => {
    setSavedScripts(SCRIPT_TEMPLATES);
  }, []);

  const executeScript = async () => {
    if (!script.trim()) return;
    
    setIsExecuting(true);
    setResult(null);

    try {
      const response = await fetch('/api/python/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script,
          data: data,
          globals: {
            'df': data
          }
        }),
      });

      const result = await response.json();
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const loadTemplate = (templateKey: string) => {
    const template = SCRIPT_TEMPLATES[templateKey as keyof typeof SCRIPT_TEMPLATES];
    if (template) {
      setScript(template);
      setSelectedTemplate(templateKey);
    }
  };

  const saveScript = () => {
    const name = prompt('Enter a name for this script:');
    if (name && script.trim()) {
      setSavedScripts(prev => ({
        ...prev,
        [name]: script
      }));
    }
  };

  const loadScript = (name: string) => {
    const savedScript = savedScripts[name];
    if (savedScript) {
      setScript(savedScript);
      setSelectedTemplate(name);
    }
  };

  const exportScript = () => {
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datalysis_script.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importScript = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setScript(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card className="w-full h-[800px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Python Power User Environment
            </CardTitle>
            <CardDescription>
              Write custom Python code with full access to your data as a pandas DataFrame (df)
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {dataInfo ? `${dataInfo.shape[0]} rows × ${dataInfo.shape[1]} cols` : `${data.length} rows`}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={executeScript}
              disabled={!script.trim() || isExecuting}
              className="flex items-center gap-2"
            >
              {isExecuting ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isExecuting ? 'Executing...' : 'Run Script'}
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="outline" size="sm" onClick={saveScript}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>

            <Button variant="outline" size="sm" onClick={exportScript}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>

            <input
              type="file"
              accept=".py,.txt"
              onChange={importScript}
              style={{ display: 'none' }}
              id="import-script"
            />
            <Button variant="outline" size="sm" onClick={() => document.getElementById('import-script')?.click()}>
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTemplate}
              onChange={(e) => loadTemplate(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="">Choose Template...</option>
              <option value="basic_analysis">Basic Analysis</option>
              <option value="correlation_analysis">Correlation Analysis</option>
              <option value="outlier_detection">Outlier Detection</option>
              <option value="custom_visualization">Custom Visualization</option>
              <option value="feature_engineering">Feature Engineering</option>
              {Object.keys(savedScripts).filter(key => !SCRIPT_TEMPLATES.hasOwnProperty(key)).map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Script Editor */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Python Script</span>
            </div>
            
            <Textarea
              ref={textareaRef}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="# Write your Python code here...
# Your data is available as 'df' (pandas DataFrame)
# Available libraries: pandas (pd), numpy (np), matplotlib.pyplot (plt), seaborn (sns)

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Example: Basic data exploration
print(df.head())
print(df.info())
df.describe()"
              className="flex-1 font-mono text-sm resize-none"
              style={{ minHeight: '400px' }}
            />
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lightbulb className="h-3 w-3" />
              <span>Available: pandas, numpy, matplotlib, seaborn, scipy, sklearn</span>
            </div>
          </div>

          {/* Results Panel */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <span className="font-medium">Results</span>
              {result && (
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Success" : "Error"}
                </Badge>
              )}
              {result?.execution_time && (
                <Badge variant="outline" className="text-xs">
                  {result.execution_time.toFixed(2)}s
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg p-4 bg-slate-50">
              {!result && !isExecuting && (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Execute your script to see results here</p>
                  </div>
                </div>
              )}

              {isExecuting && (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-500" />
                    <p className="text-sm text-muted-foreground">Executing Python script...</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {result.success ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Script executed successfully
                        {result.execution_time && ` in ${result.execution_time.toFixed(2)} seconds`}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Execution failed: {result.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.output && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Output:</h4>
                      <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-48 border">
                        {typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.plots && result.plots.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Generated Plots:</h4>
                      <div className="grid gap-2">
                        {result.plots.map((plot, index) => (
                          <img 
                            key={index}
                            src={`data:image/png;base64,${plot}`}
                            alt={`Generated plot ${index + 1}`}
                            className="border rounded max-w-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {result.dataframes && Object.keys(result.dataframes).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Generated DataFrames:</h4>
                      {Object.entries(result.dataframes).map(([name, df]) => (
                        <div key={name} className="border rounded p-2">
                          <h5 className="font-medium text-xs mb-1">{name}</h5>
                          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(df, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Data Info Panel */}
        {dataInfo && (
          <Card className="p-3">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="font-medium">Shape:</span> {dataInfo.shape[0]} × {dataInfo.shape[1]}
              </div>
              <div>
                <span className="font-medium">Columns:</span> {dataInfo.columns.join(', ')}
              </div>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}; 