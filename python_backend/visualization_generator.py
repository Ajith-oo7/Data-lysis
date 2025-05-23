"""
Domain-specific visualization generator for Excel data analysis platform

This module generates visualization code and suggestions based on data domain and content.
"""

from typing import Dict, Any, List, Optional, Union, Tuple
import os
import json
import re
from typing import TYPE_CHECKING

# Handle pandas type hints without importing in the global scope
if TYPE_CHECKING:
    import pandas as pd

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_community.chat_models import ChatOpenAI

# Import domain constants
from domain_router import (
    DOMAIN_FINANCE,
    DOMAIN_FOOD,
    DOMAIN_SALES,
    DOMAIN_HEALTHCARE, 
    DOMAIN_EDUCATION,
    DOMAIN_HR,
    DOMAIN_MARKETING,
    DOMAIN_GENERIC
)

class VisualizationGenerator:
    """
    Generates domain-specific visualization code and suggestions.
    """
    
    def __init__(self, model_name: str = "gpt-4o", temperature: float = 0.2):
        """Initialize the visualization generator with LLM and chains."""
        # Initialize the LLM
        self.llm = ChatOpenAI(
            model_name=model_name,
            temperature=temperature,
            api_key=os.environ.get("OPENAI_API_KEY")
        )
        
        # Create visualization chains
        self.chains = self._create_visualization_chains()
    
    def _create_visualization_chains(self) -> Dict[str, LLMChain]:
        """Create LLMChains for each domain's visualization generation."""
        chains = {}
        
        # Finance domain visualizations
        finance_viz_prompt = PromptTemplate(
            input_variables=["data", "columns", "column_types"],
            template="""
You are a financial data visualization expert.

Dataset Summary:
- Columns: {columns}
- Column Types: {column_types}
- Sample Data: {data}

Recommend the 3 best visualization types (e.g., bar chart, line chart, scatter plot, heatmap) 
to understand this financial dataset.

For each visualization:
1. Suggest a specific chart type in Plotly
2. Choose appropriate columns for x-axis, y-axis, and color/size encoding
3. Provide a title and description explaining what insights this chart will reveal
4. Write the Python code using Plotly Express to generate this chart

Your visualizations should focus on financial metrics such as:
- Revenue, expenses, profit over time
- Financial ratios and KPIs
- Performance comparisons across categories
- Distribution of financial values

Return your response in JSON format with this structure:
```json
[
  {{
    "title": "Chart title",
    "description": "What insights this chart reveals",
    "chart_type": "bar/line/scatter/etc",
    "columns_used": ["column1", "column2"],
    "plotly_code": "Complete Python code using Plotly Express",
    "x_axis": "column_name",
    "y_axis": "column_name",
    "color": "optional_column_name",
    "size": "optional_column_name"
  }},
  // Additional visualizations...
]
```
"""
        )
        chains[DOMAIN_FINANCE] = LLMChain(llm=self.llm, prompt=finance_viz_prompt)
        
        # Food domain visualizations
        food_viz_prompt = PromptTemplate(
            input_variables=["data", "columns", "column_types"],
            template="""
You are a nutrition data visualization expert.

Dataset Summary:
- Columns: {columns}
- Column Types: {column_types}
- Sample Data: {data}

IMPORTANT: You MUST ONLY use columns that actually exist in the dataset. Do not invent or assume columns that are not in the data.

Recommend the 3 best visualization types (e.g., bar chart, line chart, scatter plot, heatmap) 
to understand this specific food/nutrition dataset based ONLY on its actual columns and data.

For each visualization:
1. Suggest a specific chart type in Plotly that best fits the actual data columns present
2. Choose appropriate columns for x-axis, y-axis from ONLY the available columns in the dataset
3. Provide a title and description that accurately reflects what the visualization shows about THIS specific dataset
4. Write the Python code using Plotly Express to generate this chart using ONLY the columns that exist in the dataset

ABSOLUTELY NO GENERIC VISUALIZATIONS: Each visualization must be specifically tailored to the unique structure and content of this dataset.

DO NOT ASSUME these common nutrition columns exist unless they are actually in the dataset:
- Do not use "protein", "carbs", "fat" unless these exact columns exist
- Do not use "calories" unless a column with this name exists
- Do not use "category" or "food_type" unless such columns exist

Return your response in JSON format with this structure:
```json
[
  {{
    "title": "Chart title specific to this dataset's actual columns",
    "description": "What insights this specific chart reveals about THIS dataset",
    "chart_type": "bar/line/scatter/etc",
    "columns_used": ["column1", "column2"], // ONLY columns that actually exist in the dataset
    "plotly_code": "Complete Python code using Plotly Express with ONLY actual dataset columns",
    "x_axis": "column_name_that_exists",
    "y_axis": "column_name_that_exists",
    "color": "optional_column_name_that_exists",
    "size": "optional_column_name_that_exists"
  }},
  // Additional visualizations...
]
```
"""
        )
        chains[DOMAIN_FOOD] = LLMChain(llm=self.llm, prompt=food_viz_prompt)
        
        # Sales domain visualizations
        sales_viz_prompt = PromptTemplate(
            input_variables=["data", "columns", "column_types"],
            template="""
You are a sales data visualization expert.

Dataset Summary:
- Columns: {columns}
- Column Types: {column_types}
- Sample Data: {data}

Recommend the 3 best visualization types (e.g., bar chart, line chart, scatter plot, heatmap) 
to understand this sales dataset.

For each visualization:
1. Suggest a specific chart type in Plotly
2. Choose appropriate columns for x-axis, y-axis, and color/size encoding
3. Provide a title and description explaining what insights this chart will reveal
4. Write the Python code using Plotly Express to generate this chart

Your visualizations should focus on sales metrics such as:
- Sales trends over time
- Product/category performance comparisons
- Geographic sales distribution
- Customer segment analysis
- Revenue and profit analysis

Return your response in JSON format with this structure:
```json
[
  {{
    "title": "Chart title",
    "description": "What insights this chart reveals",
    "chart_type": "bar/line/scatter/etc",
    "columns_used": ["column1", "column2"],
    "plotly_code": "Complete Python code using Plotly Express",
    "x_axis": "column_name",
    "y_axis": "column_name",
    "color": "optional_column_name",
    "size": "optional_column_name"
  }},
  // Additional visualizations...
]
```
"""
        )
        chains[DOMAIN_SALES] = LLMChain(llm=self.llm, prompt=sales_viz_prompt)
        
        # Healthcare domain visualizations
        healthcare_viz_prompt = PromptTemplate(
            input_variables=["data", "columns", "column_types"],
            template="""
You are a healthcare data visualization expert.

Dataset Summary:
- Columns: {columns}
- Column Types: {column_types}
- Sample Data: {data}

Recommend the 3 best visualization types (e.g., bar chart, line chart, scatter plot, heatmap) 
to understand this healthcare dataset.

For each visualization:
1. Suggest a specific chart type in Plotly
2. Choose appropriate columns for x-axis, y-axis, and color/size encoding
3. Provide a title and description explaining what insights this chart will reveal
4. Write the Python code using Plotly Express to generate this chart

Your visualizations should focus on healthcare metrics such as:
- Patient outcomes across categories
- Treatment efficacy comparisons
- Healthcare utilization trends
- Demographic analysis of health indicators
- Disease prevalence and distribution

Return your response in JSON format with this structure:
```json
[
  {{
    "title": "Chart title",
    "description": "What insights this chart reveals",
    "chart_type": "bar/line/scatter/etc",
    "columns_used": ["column1", "column2"],
    "plotly_code": "Complete Python code using Plotly Express",
    "x_axis": "column_name",
    "y_axis": "column_name",
    "color": "optional_column_name",
    "size": "optional_column_name"
  }},
  // Additional visualizations...
]
```
"""
        )
        chains[DOMAIN_HEALTHCARE] = LLMChain(llm=self.llm, prompt=healthcare_viz_prompt)
        
        # Education domain visualizations
        education_viz_prompt = PromptTemplate(
            input_variables=["data", "columns", "column_types"],
            template="""
You are an education data visualization expert.

Dataset Summary:
- Columns: {columns}
- Column Types: {column_types}
- Sample Data: {data}

Recommend the 3 best visualization types (e.g., bar chart, line chart, scatter plot, heatmap) 
to understand this education dataset.

For each visualization:
1. Suggest a specific chart type in Plotly
2. Choose appropriate columns for x-axis, y-axis, and color/size encoding
3. Provide a title and description explaining what insights this chart will reveal
4. Write the Python code using Plotly Express to generate this chart

Your visualizations should focus on education metrics such as:
- Student performance across subjects or time
- Demographic factors and educational outcomes
- Attendance and graduation rates
- Course enrollment patterns
- Educational resource effectiveness

Return your response in JSON format with this structure:
```json
[
  {{
    "title": "Chart title",
    "description": "What insights this chart reveals",
    "chart_type": "bar/line/scatter/etc",
    "columns_used": ["column1", "column2"],
    "plotly_code": "Complete Python code using Plotly Express",
    "x_axis": "column_name",
    "y_axis": "column_name",
    "color": "optional_column_name",
    "size": "optional_column_name"
  }},
  // Additional visualizations...
]
```
"""
        )
        chains[DOMAIN_EDUCATION] = LLMChain(llm=self.llm, prompt=education_viz_prompt)
        
        # HR domain visualizations
        hr_viz_prompt = PromptTemplate(
            input_variables=["data", "columns", "column_types"],
            template="""
You are an HR data visualization expert.

Dataset Summary:
- Columns: {columns}
- Column Types: {column_types}
- Sample Data: {data}

Recommend the 3 best visualization types (e.g., bar chart, line chart, scatter plot, heatmap) 
to understand this HR dataset.

For each visualization:
1. Suggest a specific chart type in Plotly
2. Choose appropriate columns for x-axis, y-axis, and color/size encoding
3. Provide a title and description explaining what insights this chart will reveal
4. Write the Python code using Plotly Express to generate this chart

Your visualizations should focus on HR metrics such as:
- Employee retention and turnover
- Performance evaluation distributions
- Salary and compensation analysis
- Department or team comparisons
- Recruitment and hiring metrics

Return your response in JSON format with this structure:
```json
[
  {{
    "title": "Chart title",
    "description": "What insights this chart reveals",
    "chart_type": "bar/line/scatter/etc",
    "columns_used": ["column1", "column2"],
    "plotly_code": "Complete Python code using Plotly Express",
    "x_axis": "column_name",
    "y_axis": "column_name",
    "color": "optional_column_name",
    "size": "optional_column_name"
  }},
  // Additional visualizations...
]
```
"""
        )
        chains[DOMAIN_HR] = LLMChain(llm=self.llm, prompt=hr_viz_prompt)
        
        # Marketing domain visualizations
        marketing_viz_prompt = PromptTemplate(
            input_variables=["data", "columns", "column_types"],
            template="""
You are a marketing data visualization expert.

Dataset Summary:
- Columns: {columns}
- Column Types: {column_types}
- Sample Data: {data}

Recommend the 3 best visualization types (e.g., bar chart, line chart, scatter plot, heatmap) 
to understand this marketing dataset.

For each visualization:
1. Suggest a specific chart type in Plotly
2. Choose appropriate columns for x-axis, y-axis, and color/size encoding
3. Provide a title and description explaining what insights this chart will reveal
4. Write the Python code using Plotly Express to generate this chart

Your visualizations should focus on marketing metrics such as:
- Campaign performance comparisons
- Customer acquisition and retention
- Channel effectiveness
- Conversion funnel analysis
- Customer segmentation analysis

Return your response in JSON format with this structure:
```json
[
  {{
    "title": "Chart title",
    "description": "What insights this chart reveals",
    "chart_type": "bar/line/scatter/etc",
    "columns_used": ["column1", "column2"],
    "plotly_code": "Complete Python code using Plotly Express",
    "x_axis": "column_name",
    "y_axis": "column_name",
    "color": "optional_column_name",
    "size": "optional_column_name"
  }},
  // Additional visualizations...
]
```
"""
        )
        chains[DOMAIN_MARKETING] = LLMChain(llm=self.llm, prompt=marketing_viz_prompt)
        
        # Generic domain visualizations
        generic_viz_prompt = PromptTemplate(
            input_variables=["data", "columns", "column_types"],
            template="""
You are a data visualization expert.

Dataset Summary:
- Columns: {columns}
- Column Types: {column_types}
- Sample Data: {data}

Recommend the 3 best visualization types (e.g., bar chart, line chart, scatter plot, heatmap) 
to understand this dataset.

For each visualization:
1. Suggest a specific chart type in Plotly
2. Choose appropriate columns for x-axis, y-axis, and color/size encoding
3. Provide a title and description explaining what insights this chart will reveal
4. Write the Python code using Plotly Express to generate this chart

Return your response in JSON format with this structure:
```json
[
  {{
    "title": "Chart title",
    "description": "What insights this chart reveals",
    "chart_type": "bar/line/scatter/etc",
    "columns_used": ["column1", "column2"],
    "plotly_code": "Complete Python code using Plotly Express",
    "x_axis": "column_name",
    "y_axis": "column_name",
    "color": "optional_column_name",
    "size": "optional_column_name"
  }},
  // Additional visualizations...
]
```
"""
        )
        chains[DOMAIN_GENERIC] = LLMChain(llm=self.llm, prompt=generic_viz_prompt)
        
        return chains
    
    def _generate_default_visualizations(self, df, columns, column_types, data_profile=None):
        """Replaced with error message instead of generating default visualizations"""
        return [{
            "title": "Error: Unable to Generate Visualizations",
            "description": "There was an error generating visualizations with AI. Please check your API key configuration and try again.",
            "chart_type": "error",
            "error": True
        }]

    def _enhance_visualizations_with_real_data(self, visualizations, df, domain):
        """Enhance AI-generated visualizations with real data from the dataset"""
        import pandas as pd
        import numpy as np
        import re
        
        enhanced_vizs = []
        df_columns = df.columns.tolist()
        print(f"Available dataset columns: {df_columns}")
        
        for viz in visualizations:
            try:
                # Extract columns used from the visualization
                columns_used = viz.get("columns_used", [])
                x_axis = viz.get("x_axis")
                y_axis = viz.get("y_axis")
                color = viz.get("color")
                
                # If columns aren't specified but axes are, use those
                if not columns_used and (x_axis or y_axis):
                    columns_used = []
                    if x_axis: columns_used.append(x_axis)
                    if y_axis: columns_used.append(y_axis)
                    if color: columns_used.append(color)
                
                # Validate that all referenced columns actually exist in the dataset
                valid_columns = [col for col in columns_used if col in df_columns]
                
                # Validate x and y axes specifically
                valid_x_axis = x_axis if x_axis in df_columns else None
                valid_y_axis = y_axis if y_axis in df_columns else None
                valid_color = color if color in df_columns else None
                
                # Skip this visualization if no valid x or y axis
                if not valid_x_axis and not valid_y_axis:
                    print(f"Skipping visualization '{viz.get('title')}': No valid axis columns found")
                    continue
                
                # Update visualization with validated columns
                viz["columns_used"] = valid_columns
                viz["x_axis"] = valid_x_axis
                viz["y_axis"] = valid_y_axis
                viz["color"] = valid_color
                
                # If there's plotly_code, update it to only use valid columns
                if "plotly_code" in viz and viz["plotly_code"]:
                    code = viz["plotly_code"]
                    
                    # Replace any column references in the code with valid ones
                    for col in columns_used:
                        if col not in df_columns:
                            # Replace invalid column references in the code
                            pattern = rf"['\"]({re.escape(col)})['\"]"
                            if valid_columns:
                                replacement = f"'{valid_columns[0]}'"  # Use the first valid column as replacement
                                code = re.sub(pattern, replacement, code)
                    
                    viz["plotly_code"] = code
                
                # Check if any required columns are missing
                missing_columns = [col for col in columns_used if col not in df.columns]
                
                if missing_columns:
                    print(f"Warning: Some columns referenced in visualization not found in data: {missing_columns}")
                    
                    # Try to fix plotly_code by replacing missing column names with actual columns
                    for missing_col in missing_columns:
                        # Find suitable replacement based on column name hints
                        replacement = None
                        
                        # For date/time columns
                        if any(hint in missing_col.lower() for hint in ['date', 'time', 'year', 'month', 'day']):
                            date_cols = [col for col in df.columns if 
                                        pd.api.types.is_datetime64_any_dtype(df[col]) or
                                        any(hint in col.lower() for hint in ['date', 'time', 'year', 'month', 'day'])]
                            if date_cols:
                                replacement = date_cols[0]
                                
                        # For numeric value columns
                        elif any(hint in missing_col.lower() for hint in ['value', 'amount', 'price', 'cost', 'sales', 'revenue']):
                            num_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
                            if num_cols:
                                replacement = num_cols[0]
                                
                        # For category columns
                        elif any(hint in missing_col.lower() for hint in ['category', 'type', 'group', 'segment']):
                            cat_cols = [col for col in df.columns if 
                                       df[col].nunique() < 20 and not pd.api.types.is_numeric_dtype(df[col])]
                            if cat_cols:
                                replacement = cat_cols[0]
                        
                        # If we found a replacement, update the plotly code
                        if replacement:
                            viz["plotly_code"] = viz["plotly_code"].replace(f"'{missing_col}'", f"'{replacement}'")
                            viz["plotly_code"] = viz["plotly_code"].replace(f'"{missing_col}"', f'"{replacement}"')
                            
                            # Also update the metadata
                            if x_axis == missing_col:
                                viz["x_axis"] = replacement
                            if y_axis == missing_col:
                                viz["y_axis"] = replacement
                            if color == missing_col:
                                viz["color"] = replacement
                                
                            # Update columns_used
                            viz["columns_used"] = [replacement if col == missing_col else col for col in columns_used]
                
                # Add domain information
                viz["domain"] = domain
                
                # Add the enhanced visualization
                enhanced_vizs.append(viz)
                
            except Exception as e:
                print(f"Error enhancing visualization: {e}")
                # Still include it, but mark the error
                viz["error"] = str(e)
                enhanced_vizs.append(viz)
        
        return enhanced_vizs

    def generate_visualizations(self, domain: str, data: Union[str, List[Dict[str, Any]], 'pd.DataFrame']) -> List[Dict[str, Any]]:
        """
        Generate domain-specific visualization suggestions with Plotly code.
        
        Args:
            domain: The detected domain for the data
            data: The dataset as CSV string, list of dictionaries, or pandas DataFrame
            
        Returns:
            List of visualization suggestions with configuration and Plotly code
        """
        import pandas as pd
        
        print(f"Generating visualizations for domain: {domain}")
        
        # Convert data to DataFrame if not already
        if isinstance(data, str):
            # Assuming CSV format
            import io
            df = pd.read_csv(io.StringIO(data))
        elif isinstance(data, list):
            # List of dictionaries
            df = pd.DataFrame(data)
        elif isinstance(data, pd.DataFrame):
            # Already a DataFrame
            df = data
        else:
            raise ValueError(f"Unsupported data type: {type(data)}")
        
        # Extract column info
        columns = df.columns.tolist()
        
        # Determine column types with more detailed analysis
        column_types = {}
        column_stats = {}
        
        for col in columns:
            # Basic type detection
            if pd.api.types.is_numeric_dtype(df[col]):
                column_types[col] = "numeric"
                # Calculate statistics for numeric columns
                column_stats[col] = {
                    "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                    "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                    "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                    "median": float(df[col].median()) if not pd.isna(df[col].median()) else None,
                    "std": float(df[col].std()) if not pd.isna(df[col].std()) else None,
                    "missing": float(df[col].isna().sum() / len(df) * 100)
                }
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                column_types[col] = "datetime"
                # Statistics for datetime columns
                if not df[col].isna().all():
                    column_stats[col] = {
                        "min": df[col].min().strftime("%Y-%m-%d") if not pd.isna(df[col].min()) else None,
                        "max": df[col].max().strftime("%Y-%m-%d") if not pd.isna(df[col].max()) else None,
                        "missing": float(df[col].isna().sum() / len(df) * 100)
                    }
            elif pd.api.types.is_categorical_dtype(df[col]) or df[col].nunique() < 15:
                column_types[col] = "categorical"
                # Frequency for categorical columns
                column_stats[col] = {
                    "categories": df[col].value_counts().to_dict(),
                    "top_category": df[col].value_counts().index[0] if not df[col].isna().all() and len(df[col].value_counts()) > 0 else None,
                    "missing": float(df[col].isna().sum() / len(df) * 100)
                }
            else:
                column_types[col] = "text"
                column_stats[col] = {
                    "missing": float(df[col].isna().sum() / len(df) * 100)
                }
                
        # Identify time series columns
        time_series_candidates = []
        for col in columns:
            if column_types[col] == "datetime":
                time_series_candidates.append(col)
            elif "date" in col.lower() or "time" in col.lower() or "year" in col.lower():
                # Try to convert to datetime
                try:
                    df[col] = pd.to_datetime(df[col])
                    column_types[col] = "datetime"
                    time_series_candidates.append(col)
                except:
                    pass
        
        # Prepare sample data with more rows for better visualization quality
        sample_rows = df.head(10).to_dict(orient="records")
        sample_data = json.dumps(sample_rows, indent=2)
        
        # Add profile information to enhance visualization quality
        data_profile = {
            "row_count": len(df),
            "column_count": len(columns),
            "column_types": column_types,
            "column_stats": column_stats,
            "has_time_series": len(time_series_candidates) > 0,
            "time_columns": time_series_candidates,
            "numeric_columns": [col for col, type in column_types.items() if type == "numeric"],
            "categorical_columns": [col for col, type in column_types.items() if type == "categorical"]
        }
        
        # Normalize domain name for chain selection
        normalized_domain = domain.lower()
        
        # Select the appropriate domain chain
        if normalized_domain in self.chains:
            chain = self.chains[normalized_domain]
        else:
            # Fall back to generic if domain not supported
            chain = self.chains.get(DOMAIN_GENERIC, None)
            
            # If no generic chain, return error message
            if chain is None:
                print(f"No chain found for domain '{normalized_domain}', cannot generate visualizations")
                return [{
                    "title": "Visualization Error",
                    "description": "Unable to generate visualizations for this domain.",
                    "error": f"No visualization chain found for domain: {normalized_domain}",
                    "chart_type": "error"
                }]
        
        try:
            print(f"Running LLM chain for domain '{normalized_domain}'")
            # Generate domain-specific visualization suggestions with enhanced profile
            result = chain.run(
                data=sample_data,
                columns=json.dumps(columns),
                column_types=json.dumps(column_types),
                data_profile=json.dumps(data_profile, indent=2)
            )
            
            # Parse the JSON result
            try:
                # Extract JSON from result (handling potential non-JSON content)
                json_match = re.search(r'```json\s*(.*?)\s*```', result, re.DOTALL)
                if json_match:
                    result = json_match.group(1)
                    print("Extracted JSON from markdown code block")
                
                # Clean potential markdown or formatting
                result = re.sub(r'```.*?```', '', result, flags=re.DOTALL)
                
                # Parse the JSON
                visualizations = json.loads(result)
                print(f"Successfully parsed JSON response with {len(visualizations)} visualizations")
                
                # Post-process to ensure real data is used
                enhanced_vizs = self._enhance_visualizations_with_real_data(visualizations, df, normalized_domain)
                return enhanced_vizs
                
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"Error parsing visualization JSON: {e}")
                print(f"Raw result: {result}")
                return [{
                    "title": "JSON Parsing Error",
                    "description": "Unable to parse visualization results.",
                    "error": f"Error parsing visualization results: {str(e)}",
                    "chart_type": "error"
                }]
                
        except Exception as e:
            print(f"Error generating visualizations: {e}")
            return [{
                "title": "Visualization Generation Error",
                "description": "An unexpected error occurred while generating visualizations.",
                "error": f"Error: {str(e)}",
                "chart_type": "error"
            }]


# For direct usage without the class
def generate_domain_visualizations(domain: str, data: Union[str, List[Dict[str, Any]], 'pd.DataFrame']) -> List[Dict[str, Any]]:
    """
    Generate domain-specific visualization suggestions with Plotly code.
    
    Args:
        domain: The detected domain for the data
        data: The dataset as CSV string, list of dictionaries, or pandas DataFrame
        
    Returns:
        List of visualization suggestions with configuration and Plotly code
    """
    # Create the generator and use it
    generator = VisualizationGenerator()
    return generator.generate_visualizations(domain, data)


# Testing functionality (will not run when imported as a module)
if __name__ == "__main__":
    import re
    
    # Sample data for testing
    sample_financial_data = """
Date,Revenue,Expenses,Profit,Department
2023-01-01,12500,8000,4500,Sales
2023-01-02,9800,7500,2300,Marketing
2023-01-03,11200,6900,4300,Sales
2023-01-04,10500,7200,3300,Engineering
2023-01-05,13800,9100,4700,Sales
2023-01-06,10200,6800,3400,Marketing
2023-01-07,11500,7300,4200,Engineering
2023-01-08,14200,9500,4700,Sales
2023-01-09,9500,7100,2400,Marketing
2023-01-10,12800,8200,4600,Sales
"""
    
    # Initialize visualization generator
    generator = VisualizationGenerator()
    
    # Test with financial data
    vis_suggestions = generator.generate_visualizations(DOMAIN_FINANCE, sample_financial_data)
    print("\nVisualization Suggestions:", json.dumps(vis_suggestions, indent=2))