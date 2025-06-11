import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);

interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  execution_time?: number;
  plots?: string[];
  dataframes?: Record<string, any>;
}

interface ExecutionRequest {
  script: string;
  data: any[];
  globals?: Record<string, any>;
  timeout?: number;
}

export class PythonExecutor {
  private static instance: PythonExecutor;
  private tempDir: string;

  private constructor() {
    this.tempDir = path.join(process.cwd(), 'temp_scripts');
    this.ensureTempDir();
  }

  public static getInstance(): PythonExecutor {
    if (!PythonExecutor.instance) {
      PythonExecutor.instance = new PythonExecutor();
    }
    return PythonExecutor.instance;
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Execute Python script with data access
   */
  public async executeScript(request: ExecutionRequest): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const scriptPath = path.join(this.tempDir, `script_${executionId}.py`);
    const dataPath = path.join(this.tempDir, `data_${executionId}.json`);
    const outputPath = path.join(this.tempDir, `output_${executionId}.json`);
    
    const startTime = Date.now();

    try {
      // Prepare the execution environment
      const wrappedScript = this.wrapScript(request.script, dataPath, outputPath);
      
      // Write files
      await writeFile(scriptPath, wrappedScript);
      await writeFile(dataPath, JSON.stringify(request.data));

      // Execute the script
      const result = await this.runPythonScript(scriptPath, request.timeout || 30000);
      
      const executionTime = (Date.now() - startTime) / 1000;

      if (result.success) {
        // Read output if available
        let output: any = null;
        let plots: string[] = [];
        let dataframes: Record<string, any> = {};

        try {
          if (fs.existsSync(outputPath)) {
            const outputData = await readFile(outputPath, 'utf8');
            const parsedOutput = JSON.parse(outputData);
            output = parsedOutput.output;
            plots = parsedOutput.plots || [];
            dataframes = parsedOutput.dataframes || {};
          }
        } catch (outputError) {
          console.warn('Failed to read script output:', outputError);
        }

        return {
          success: true,
          output: output || result.stdout,
          execution_time: executionTime,
          plots,
          dataframes
        };
      } else {
        return {
          success: false,
          error: result.stderr || 'Script execution failed',
          execution_time: executionTime
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        execution_time: (Date.now() - startTime) / 1000
      };
    } finally {
      // Cleanup temporary files
      this.cleanup([scriptPath, dataPath, outputPath]);
    }
  }

  /**
   * Wrap user script with safety and data access features
   */
  private wrapScript(userScript: string, dataPath: string, outputPath: string): string {
    return `
import sys
import json
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
import warnings
import traceback
from contextlib import redirect_stdout, redirect_stderr

# Suppress warnings
warnings.filterwarnings('ignore')

# Global variables for output capture
_datalysis_output = {
    'output': None,
    'plots': [],
    'dataframes': {},
    'stdout': '',
    'stderr': ''
}

# Custom print function to capture output
_original_print = print
_stdout_buffer = io.StringIO()

def print(*args, **kwargs):
    # Print to buffer
    _original_print(*args, file=_stdout_buffer, **kwargs)
    # Also print normally for immediate feedback
    _original_print(*args, **kwargs)

# Function to capture plot as base64
def _capture_current_plot():
    try:
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        plot_data = base64.b64encode(buffer.getvalue()).decode()
        _datalysis_output['plots'].append(plot_data)
        plt.close()  # Close the figure to free memory
        return plot_data
    except Exception as e:
        print(f"Error capturing plot: {e}")
        return None

# Override plt.show to capture plots
_original_show = plt.show
def show():
    _capture_current_plot()

plt.show = show

# Load data
try:
    with open('${dataPath}', 'r') as f:
        data_list = json.load(f)
    
    # Convert to DataFrame
    df = pd.DataFrame(data_list)
    
    print(f"Data loaded successfully: {df.shape}")
    
except Exception as e:
    print(f"Error loading data: {e}")
    df = pd.DataFrame()

# Execute user script
try:
    # Capture stdout and stderr
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
        # Execute the user script
        exec_globals = {
            'df': df,
            'pd': pd,
            'np': np,
            'plt': plt,
            'sns': sns,
            'print': print,
            '__builtins__': __builtins__
        }
        
        # Execute user code
        result = exec("""${userScript.replace(/"/g, '\\"').replace(/\n/g, '\\n')}""", exec_globals)
        
        # If the script returns something, capture it
        if result is not None:
            _datalysis_output['output'] = str(result)
    
    # Capture any remaining plots
    if plt.get_fignums():
        for fig_num in plt.get_fignums():
            plt.figure(fig_num)
            _capture_current_plot()
    
    # Capture stdout
    _datalysis_output['stdout'] = _stdout_buffer.getvalue()
    
    # Capture any DataFrames created
    for name, obj in exec_globals.items():
        if isinstance(obj, pd.DataFrame) and name != 'df':
            try:
                # Convert DataFrame to JSON-serializable format
                _datalysis_output['dataframes'][name] = obj.head(100).to_dict('records')
            except Exception as e:
                print(f"Error serializing DataFrame {name}: {e}")

except Exception as e:
    error_msg = f"Error executing script: {str(e)}\\n{traceback.format_exc()}"
    print(error_msg)
    _datalysis_output['stderr'] = error_msg

# Save output
try:
    # Combine stdout buffer with any explicit output
    combined_output = _datalysis_output['stdout']
    if _datalysis_output['output']:
        combined_output += "\\n" + str(_datalysis_output['output'])
    
    final_output = {
        'output': combined_output,
        'plots': _datalysis_output['plots'],
        'dataframes': _datalysis_output['dataframes']
    }
    
    with open('${outputPath}', 'w') as f:
        json.dump(final_output, f)
        
except Exception as e:
    print(f"Error saving output: {e}")

# Clean up
plt.close('all')
print("Script execution completed")
`;
  }

  /**
   * Run Python script using subprocess
   */
  private runPythonScript(scriptPath: string, timeout: number): Promise<{
    success: boolean;
    stdout?: string;
    stderr?: string;
  }> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', [scriptPath], {
        cwd: this.tempDir,
        timeout
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr
        });
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          stderr: `Process error: ${error.message}`
        });
      });

      // Handle timeout
      setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        resolve({
          success: false,
          stderr: `Script execution timed out after ${timeout}ms`
        });
      }, timeout);
    });
  }

  /**
   * Clean up temporary files
   */
  private async cleanup(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (error) {
        console.warn(`Failed to cleanup file ${filePath}:`, error);
      }
    }
  }

  /**
   * Check if Python is available
   */
  public async checkPythonAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', ['--version']);
      
      pythonProcess.on('close', (code) => {
        resolve(code === 0);
      });

      pythonProcess.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Install required packages
   */
  public async installRequiredPackages(): Promise<boolean> {
    const packages = ['pandas', 'numpy', 'matplotlib', 'seaborn', 'scipy', 'scikit-learn'];
    
    return new Promise((resolve) => {
      const installProcess = spawn('pip', ['install', ...packages]);
      
      installProcess.on('close', (code) => {
        resolve(code === 0);
      });

      installProcess.on('error', () => {
        resolve(false);
      });
    });
  }
} 