import json
import logging
import os
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Union, Optional
import time

# Import OpenAI for AI-enhanced analysis
from openai import OpenAI

# Import our domain detector
from domain_detection import detect_data_domain

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def process_data(file_content: Union[str, List[Dict[str, Any]]], preprocessing_rules: Optional[str] = None) -> Dict[str, Any]:
    """
    Process data with comprehensive AI-enhanced analysis
    
    Args:
        file_content: Either a CSV string or list of dictionaries representing the data
        preprocessing_rules: Optional string containing preprocessing instructions
        
    Returns:
        Dictionary containing processing results including summary, insights, visualizations, etc.
    """
    start_time = time.time()
    
    try:
        # Convert input to pandas DataFrame
        df = convert_to_dataframe(file_content)
        
        # Apply preprocessing based on rules
        if preprocessing_rules:
            df = apply_preprocessing(df, preprocessing_rules)
        
        # Basic data profiling
        profile = profile_data(df)
        
        # Detect data domain using our AI-based approach
        columns = list(df.columns)
        sample_values = df.head(3).to_dict('records')
        domain_info = detect_data_domain(columns, sample_values)
        
        # Generate insights using OpenAI with domain context
        insights = generate_ai_insights(df, domain_info)
        
        # Generate visualization suggestions
        visualizations = generate_visualizations(df, domain_info)
        
        # Prepare data preview
        data_preview = {
            "headers": list(df.columns),
            "rows": df.head(5).to_dict('records'),
            "totalRows": len(df)
        }
        
        # Calculate processing time
        processing_time = f"{time.time() - start_time:.2f} seconds"
        
        # Compile results
        results = {
            "summary": {
                "rowsProcessed": len(df),
                "columnsProcessed": len(df.columns),
                "missingValuesHandled": int(df.isna().sum().sum()),
                "duplicatesRemoved": profile["duplicate_count"],
                "outliersTreated": profile["outlier_count"],
                "processingTime": processing_time
            },
            "domain": domain_info,
            "charts": visualizations,
            "insights": insights,
            "dataPreview": data_preview,
            "profile": profile
        }
        
        return results
    
    except Exception as e:
        logger.error(f"Error in data processing: {str(e)}")
        # Return basic error response
        return {
            "summary": {
                "rowsProcessed": 0,
                "columnsProcessed": 0,
                "missingValuesHandled": 0,
                "duplicatesRemoved": 0,
                "outliersTreated": 0,
                "processingTime": f"{time.time() - start_time:.2f} seconds",
                "error": str(e)
            },
            "charts": [],
            "insights": [{"title": "Error", "description": f"Failed to process data: {str(e)}", "recommendation": "Check data format and try again"}],
            "dataPreview": {"headers": [], "rows": [], "totalRows": 0}
        }

def convert_to_dataframe(data: Union[str, List[Dict[str, Any]]]) -> pd.DataFrame:
    """Convert input data to pandas DataFrame"""
    if isinstance(data, str):
        # Assume it's a CSV string
        try:
            return pd.read_csv(pd.StringIO(data))
        except Exception as e:
            logger.error(f"Failed to parse CSV string: {str(e)}")
            raise ValueError(f"Invalid CSV format: {str(e)}")
    
    elif isinstance(data, list):
        # Assume it's a list of dictionaries
        if not data:
            raise ValueError("Empty data list provided")
        return pd.DataFrame(data)
    
    else:
        raise ValueError(f"Unsupported data type: {type(data)}")

def apply_preprocessing(df: pd.DataFrame, rules: str) -> pd.DataFrame:
    """Apply preprocessing rules to the DataFrame"""
    logger.info(f"Applying preprocessing rules: {rules}")
    
    # Create a copy to avoid modifying the original
    processed_df = df.copy()
    
    # Parse and apply rules
    if 'remove_empty_rows' in rules.lower():
        processed_df = processed_df.dropna(how='all')
    
    if 'remove_empty_columns' in rules.lower():
        processed_df = processed_df.dropna(axis=1, how='all')
    
    if 'trim_strings' in rules.lower():
        # Trim whitespace from string columns
        for col in processed_df.select_dtypes(include=['object']).columns:
            processed_df[col] = processed_df[col].str.strip() if hasattr(processed_df[col], 'str') else processed_df[col]
    
    if 'convert_types' in rules.lower():
        # Try to convert object columns to numeric if possible
        for col in processed_df.select_dtypes(include=['object']).columns:
            try:
                processed_df[col] = pd.to_numeric(processed_df[col])
            except:
                # If conversion fails, keep as is
                pass
    
    # Detecting and applying custom rules
    rule_lines = rules.split('\n')
    for line in rule_lines:
        line = line.strip()
        
        # Normalize case rule
        if line.startswith('normalize_case:'):
            col_name = line.split(':', 1)[1].strip()
            if col_name in processed_df.columns:
                processed_df[col_name] = processed_df[col_name].str.lower() if hasattr(processed_df[col_name], 'str') else processed_df[col_name]
        
        # Replace value rule
        elif line.startswith('replace:'):
            parts = line.split(':', 2)
            if len(parts) == 3:
                col_name = parts[1].strip()
                values = parts[2].split('|')
                if len(values) == 2 and col_name in processed_df.columns:
                    old_val, new_val = values[0].strip(), values[1].strip()
                    processed_df[col_name] = processed_df[col_name].replace(old_val, new_val)
    
    # Remove duplicates
    initial_rows = len(processed_df)
    processed_df = processed_df.drop_duplicates()
    logger.info(f"Removed {initial_rows - len(processed_df)} duplicate rows")
    
    return processed_df

def profile_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Generate comprehensive profile of the dataset"""
    profile = {}
    
    # Basic stats
    profile["row_count"] = len(df)
    profile["column_count"] = len(df.columns)
    
    # Duplicate analysis
    initial_rows = len(df)
    deduplicated = df.drop_duplicates()
    profile["duplicate_count"] = initial_rows - len(deduplicated)
    profile["duplicate_percentage"] = (profile["duplicate_count"] / initial_rows * 100) if initial_rows > 0 else 0
    
    # Missing values analysis
    missing_counts = df.isna().sum()
    missing_percentages = (missing_counts / len(df) * 100)
    profile["missing_values"] = {
        "total": int(missing_counts.sum()),
        "percentage": float(missing_percentages.mean()),
        "by_column": {col: {"count": int(count), "percentage": float(pct)} 
                     for col, count, pct in zip(df.columns, missing_counts, missing_percentages)}
    }
    
    # Column profiles
    profile["columns"] = {}
    for col in df.columns:
        col_profile = profile_column(df, col)
        profile["columns"][col] = col_profile
    
    # Detect outliers
    numeric_columns = df.select_dtypes(include=['number']).columns
    outlier_count = 0
    
    for col in numeric_columns:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)][col]
        outlier_count += len(outliers)
        
        if col in profile["columns"]:
            profile["columns"][col]["outliers"] = {
                "count": len(outliers),
                "percentage": len(outliers) / len(df) * 100 if len(df) > 0 else 0,
                "lower_bound": float(lower_bound),
                "upper_bound": float(upper_bound)
            }
    
    profile["outlier_count"] = outlier_count
    
    return profile

def profile_column(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    """Generate profile for a specific column"""
    col_data = df[column]
    profile = {}
    
    # Basic info
    profile["name"] = column
    profile["count"] = len(col_data)
    profile["missing_count"] = int(col_data.isna().sum())
    profile["missing_percentage"] = profile["missing_count"] / profile["count"] * 100 if profile["count"] > 0 else 0
    profile["unique_count"] = int(col_data.nunique())
    profile["unique_percentage"] = profile["unique_count"] / profile["count"] * 100 if profile["count"] > 0 else 0
    
    # Determine data type
    if pd.api.types.is_numeric_dtype(col_data):
        profile["data_type"] = "numeric"
        
        # Add numeric-specific stats
        profile["min"] = float(col_data.min()) if not pd.isna(col_data.min()) else None
        profile["max"] = float(col_data.max()) if not pd.isna(col_data.max()) else None
        profile["mean"] = float(col_data.mean()) if not pd.isna(col_data.mean()) else None
        profile["median"] = float(col_data.median()) if not pd.isna(col_data.median()) else None
        profile["std"] = float(col_data.std()) if not pd.isna(col_data.std()) else None
        
        # Determine if likely ID column
        profile["is_likely_id"] = (profile["unique_percentage"] > 90 and 
                                  profile["missing_percentage"] < 5)
        
    elif pd.api.types.is_string_dtype(col_data):
        profile["data_type"] = "string"
        
        # Add string-specific stats
        non_null_values = col_data.dropna()
        if len(non_null_values) > 0:
            profile["min_length"] = int(min(non_null_values.str.len()))
            profile["max_length"] = int(max(non_null_values.str.len()))
            profile["avg_length"] = float(non_null_values.str.len().mean())
        else:
            profile["min_length"] = 0
            profile["max_length"] = 0
            profile["avg_length"] = 0
        
        # Determine if categorical or free text
        unique_pct = profile["unique_count"] / (profile["count"] - profile["missing_count"]) * 100 if (profile["count"] - profile["missing_count"]) > 0 else 0
        profile["is_categorical"] = unique_pct < 15 or profile["unique_count"] < 20
        
        # Get top categories if categorical
        if profile["is_categorical"]:
            value_counts = col_data.value_counts(dropna=True)
            top_n = min(10, len(value_counts))
            profile["top_values"] = [{"value": str(val), "count": int(count)} 
                                    for val, count in value_counts.head(top_n).items()]
    
    elif pd.api.types.is_datetime64_dtype(col_data):
        profile["data_type"] = "datetime"
        
        # Add datetime-specific stats
        profile["min"] = col_data.min().isoformat() if not pd.isna(col_data.min()) else None
        profile["max"] = col_data.max().isoformat() if not pd.isna(col_data.max()) else None
        
        # Calculate range in days
        if not pd.isna(col_data.min()) and not pd.isna(col_data.max()):
            profile["range_days"] = (col_data.max() - col_data.min()).days
        else:
            profile["range_days"] = None
    
    else:
        profile["data_type"] = "other"
    
    return profile

def generate_ai_insights(df: pd.DataFrame, domain_info: Dict[str, Any]) -> List[Dict[str, str]]:
    """Generate AI-enhanced insights using OpenAI with domain context"""
    try:
        # Prepare data sample for OpenAI
        data_sample = df.head(50).to_csv(index=False)
        
        # Create prompt with domain information
        prompt = f"""
You are a data analysis expert specializing in {domain_info['domain']} datasets.
Analyze this dataset sample and provide 3-5 key insights that would be valuable to users.

Domain: {domain_info['domain']}
Domain reason: {domain_info['reason']}

Dataset sample:
{data_sample}

For each insight, provide:
1. A concise title
2. A detailed description including specific values and statistics
3. A practical recommendation based on the insight

Focus on the most interesting patterns, outliers, or relationships in the data.
Make insights specific to the {domain_info['domain']} domain.

Format as JSON with this structure:
[
  {{
    "title": "Insight title",
    "description": "Detailed description with specific values",
    "recommendation": "Practical recommendation"
  }},
  ...
]
"""
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        # Extract and parse insights
        content = response.choices[0].message.content
        try:
            insights_data = json.loads(content)
            if isinstance(insights_data, dict) and "insights" in insights_data:
                insights = insights_data["insights"]
            elif isinstance(insights_data, list):
                insights = insights_data
            else:
                insights = []
            
            # Validate insights format
            validated_insights = []
            for insight in insights:
                if isinstance(insight, dict) and "title" in insight and "description" in insight:
                    validated_insights.append({
                        "title": insight.get("title", ""),
                        "description": insight.get("description", ""),
                        "recommendation": insight.get("recommendation", "")
                    })
            
            return validated_insights
        
        except json.JSONDecodeError:
            logger.error(f"Failed to parse OpenAI insights response as JSON: {content}")
            return [{
                "title": "Error: Unable to Generate Insights",
                "content": "There was an error generating insights. Please check your API key configuration and try again.",
                "type": "error"
            }]
    
    except Exception as e:
        logger.error(f"Error generating AI insights: {str(e)}")
        return [{
            "title": "Error: Unable to Generate Insights",
            "content": f"An error occurred: {str(e)}. Please check your API key configuration and try again.",
            "type": "error"
        }]

def fallback_insights(df: pd.DataFrame, domain_info: Dict[str, Any]) -> List[Dict[str, str]]:
    """Error message when AI insights generation fails"""
    return [{
        "title": "Error: Unable to Generate Insights",
        "content": "There was an error generating insights with AI. Please check your API key configuration and try again.",
        "type": "error"
    }]

def generate_visualizations(df: pd.DataFrame, domain_info: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate visualization suggestions based on data and domain"""
    visualizations = []
    domain = domain_info["domain"].lower()
    
    # Get lists of columns by type
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = [col for col in df.columns if df[col].nunique() < 15 and col not in numeric_cols]
    
    # Look for time-related columns
    time_cols = [col for col in df.columns if any(kw in col.lower() for kw in 
                                               ['date', 'time', 'year', 'month', 'day'])]
    
    # Domain-specific visualizations
    if domain == 'nutrition':
        # Nutrition comparison chart
        nutrition_cols = [col for col in numeric_cols if any(kw in col.lower() for kw in 
                                                           ['calorie', 'protein', 'fat', 'carb', 'sugar'])]
        if nutrition_cols and categorical_cols:
            # Find a good category column (like food name)
            category_col = categorical_cols[0]
            sample_data = prepare_visualization_data(df, category_col, nutrition_cols[:3])
            
            visualizations.append({
                "type": "bar",
                "data": sample_data,
                "title": "Nutritional Content Comparison",
                "xAxisLabel": category_col,
                "yAxisLabel": "Nutritional Values"
            })
            
            # Radar chart for nutritional profile
            if len(nutrition_cols) >= 3:
                radar_data = prepare_radar_data(df, category_col, nutrition_cols[:5])
                visualizations.append({
                    "type": "radar",
                    "data": radar_data,
                    "title": "Nutritional Profile Comparison",
                })
    
    elif domain == 'financial' or domain == 'sales':
        # Financial metrics over time
        financial_cols = [col for col in numeric_cols if any(kw in col.lower() for kw in 
                                                           ['price', 'revenue', 'cost', 'amount', 'sale'])]
        
        if financial_cols and time_cols:
            time_col = time_cols[0]
            financial_col = financial_cols[0]
            
            # Time series visualization
            time_series_data = prepare_time_series_data(df, time_col, financial_col)
            visualizations.append({
                "type": "line",
                "data": time_series_data,
                "title": f"{financial_col} Over Time",
                "xAxisLabel": time_col,
                "yAxisLabel": financial_col
            })
        
        # Category breakdown
        if financial_cols and categorical_cols:
            category_col = categorical_cols[0]
            financial_col = financial_cols[0]
            
            # Bar chart for category comparison
            category_data = prepare_category_data(df, category_col, financial_col)
            visualizations.append({
                "type": "bar",
                "data": category_data,
                "title": f"{financial_col} by {category_col}",
                "xAxisLabel": category_col,
                "yAxisLabel": financial_col
            })
            
            # Pie chart for percentage breakdown
            pie_data = prepare_pie_data(df, category_col, financial_col)
            visualizations.append({
                "type": "pie",
                "data": pie_data,
                "title": f"{financial_col} Distribution by {category_col}"
            })
    
    elif domain == 'healthcare':
        # Healthcare-specific visualizations
        health_metrics = [col for col in numeric_cols if any(kw in col.lower() for kw in 
                                                           ['age', 'weight', 'height', 'bmi', 'pressure', 'rate'])]
        
        if health_metrics and len(health_metrics) >= 2:
            # Scatter plot for correlation between health metrics
            scatter_data = prepare_scatter_data(df, health_metrics[0], health_metrics[1])
            visualizations.append({
                "type": "scatter",
                "data": scatter_data,
                "title": f"Correlation: {health_metrics[0]} vs {health_metrics[1]}",
                "xAxisLabel": health_metrics[0],
                "yAxisLabel": health_metrics[1]
            })
        
        # Distribution of a key health metric
        if health_metrics:
            metric = health_metrics[0]
            histogram_data = prepare_histogram_data(df, metric)
            visualizations.append({
                "type": "histogram",
                "data": histogram_data,
                "title": f"Distribution of {metric}",
                "xAxisLabel": metric,
                "yAxisLabel": "Frequency"
            })
    
    # Generic visualizations if we don't have enough domain-specific ones
    if len(visualizations) < 2:
        # Bar chart for a numeric column by category
        if numeric_cols and categorical_cols:
            bar_data = prepare_category_data(df, categorical_cols[0], numeric_cols[0])
            visualizations.append({
                "type": "bar",
                "data": bar_data,
                "title": f"{numeric_cols[0]} by {categorical_cols[0]}",
                "xAxisLabel": categorical_cols[0],
                "yAxisLabel": numeric_cols[0]
            })
        
        # Distribution histogram
        if numeric_cols:
            histogram_data = prepare_histogram_data(df, numeric_cols[0])
            visualizations.append({
                "type": "histogram",
                "data": histogram_data,
                "title": f"Distribution of {numeric_cols[0]}",
                "xAxisLabel": numeric_cols[0],
                "yAxisLabel": "Frequency"
            })
        
        # Scatter plot for correlation
        if len(numeric_cols) >= 2:
            scatter_data = prepare_scatter_data(df, numeric_cols[0], numeric_cols[1])
            visualizations.append({
                "type": "scatter",
                "data": scatter_data,
                "title": f"Correlation: {numeric_cols[0]} vs {numeric_cols[1]}",
                "xAxisLabel": numeric_cols[0],
                "yAxisLabel": numeric_cols[1]
            })
    
    return visualizations

# Helper functions for visualization data preparation
def prepare_visualization_data(df: pd.DataFrame, category_col: str, value_cols: List[str], limit: int = 10) -> List[Dict]:
    """Prepare data for multi-series bar chart"""
    # Group by category and calculate means for each value column
    grouped = df.groupby(category_col)[value_cols].mean().reset_index()
    
    # Limit to top categories by the first value column
    if len(grouped) > limit:
        top_categories = grouped.nlargest(limit, value_cols[0])[category_col].tolist()
        grouped = grouped[grouped[category_col].isin(top_categories)]
    
    # Transform to required format
    result = []
    for _, row in grouped.iterrows():
        item = {"category": str(row[category_col])}
        for col in value_cols:
            item[col] = float(row[col])
        result.append(item)
    
    return result

def prepare_radar_data(df: pd.DataFrame, category_col: str, value_cols: List[str], limit: int = 5) -> List[Dict]:
    """Prepare data for radar chart"""
    # Group by category and calculate means for each value column
    grouped = df.groupby(category_col)[value_cols].mean().reset_index()
    
    # Limit to top categories by the sum of all value columns
    if len(grouped) > limit:
        grouped['total'] = grouped[value_cols].sum(axis=1)
        top_categories = grouped.nlargest(limit, 'total')[category_col].tolist()
        grouped = grouped[grouped[category_col].isin(top_categories)]
    
    # Transform to required format
    result = []
    for _, row in grouped.iterrows():
        item = {"category": str(row[category_col])}
        for col in value_cols:
            item[col] = float(row[col])
        result.append(item)
    
    return result

def prepare_time_series_data(df: pd.DataFrame, time_col: str, value_col: str) -> List[Dict]:
    """Prepare data for time series chart"""
    # Check if we need to parse the time column
    if pd.api.types.is_object_dtype(df[time_col]):
        try:
            df[time_col] = pd.to_datetime(df[time_col])
        except:
            pass
    
    # Group by time and calculate aggregate values
    if pd.api.types.is_datetime64_dtype(df[time_col]):
        df['year_month'] = df[time_col].dt.strftime('%Y-%m')
        grouped = df.groupby('year_month')[value_col].sum().reset_index()
        time_field = 'year_month'
    else:
        grouped = df.groupby(time_col)[value_col].sum().reset_index()
        time_field = time_col
    
    # Transform to required format
    result = []
    for _, row in grouped.iterrows():
        result.append({
            "time": str(row[time_field]),
            "value": float(row[value_col])
        })
    
    # Sort by time
    result.sort(key=lambda x: x["time"])
    
    return result

def prepare_category_data(df: pd.DataFrame, category_col: str, value_col: str, limit: int = 10) -> List[Dict]:
    """Prepare data for category bar chart"""
    # Group by category and sum values
    grouped = df.groupby(category_col)[value_col].sum().reset_index()
    
    # Limit to top categories
    if len(grouped) > limit:
        grouped = grouped.nlargest(limit, value_col)
    
    # Transform to required format
    result = []
    for _, row in grouped.iterrows():
        result.append({
            "category": str(row[category_col]),
            "value": float(row[value_col])
        })
    
    return result

def prepare_pie_data(df: pd.DataFrame, category_col: str, value_col: str, limit: int = 8) -> List[Dict]:
    """Prepare data for pie chart"""
    # Group by category and sum values
    grouped = df.groupby(category_col)[value_col].sum().reset_index()
    
    # Limit to top categories + "Other"
    if len(grouped) > limit:
        top_categories = grouped.nlargest(limit-1, value_col)
        other_sum = grouped[~grouped[category_col].isin(top_categories[category_col])][value_col].sum()
        
        # Add "Other" category
        other_row = pd.DataFrame({category_col: ["Other"], value_col: [other_sum]})
        grouped = pd.concat([top_categories, other_row])
    
    # Transform to required format
    result = []
    for _, row in grouped.iterrows():
        result.append({
            "category": str(row[category_col]),
            "value": float(row[value_col])
        })
    
    return result

def prepare_scatter_data(df: pd.DataFrame, x_col: str, y_col: str, limit: int = 100) -> List[Dict]:
    """Prepare data for scatter plot"""
    # Sample rows if dataset is too large
    if len(df) > limit:
        sample_df = df.sample(limit)
    else:
        sample_df = df
    
    # Transform to required format
    result = []
    for _, row in sample_df.iterrows():
        if pd.notna(row[x_col]) and pd.notna(row[y_col]):
            result.append({
                "x": float(row[x_col]),
                "y": float(row[y_col])
            })
    
    return result

def prepare_histogram_data(df: pd.DataFrame, value_col: str, bins: int = 10) -> List[Dict]:
    """Prepare data for histogram"""
    # Calculate histogram
    hist, bin_edges = np.histogram(df[value_col].dropna(), bins=bins)
    
    # Transform to required format
    result = []
    for i in range(len(hist)):
        result.append({
            "bin": f"{bin_edges[i]:.1f} - {bin_edges[i+1]:.1f}",
            "frequency": int(hist[i])
        })
    
    return result