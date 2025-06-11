import json
import logging
import os
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Union, Optional
import time
import io
from datetime import datetime
import re

# Import OpenAI for AI-enhanced analysis
from openai import OpenAI

# Import our domain detector
from domain_detection import detect_data_domain

# Import the enhanced cleaner
try:
    from enhanced_data_cleaner import enhanced_clean_data, EnhancedDataCleaner
    ENHANCED_CLEANING_AVAILABLE = True
except ImportError:
    ENHANCED_CLEANING_AVAILABLE = False
    logger.warning("Enhanced data cleaning module not available")

# Import the intelligent EDA system
try:
    from eda_engine import intelligent_eda_analysis
    INTELLIGENT_EDA_AVAILABLE = True
except ImportError:
    INTELLIGENT_EDA_AVAILABLE = False
    logger.warning("Intelligent EDA system not available")

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
        Dictionary containing processing results including summary, analysis, and insights
    """
    try:
        # Convert data to DataFrame
        if isinstance(file_content, str):
            df = pd.read_csv(io.StringIO(file_content))
        elif isinstance(file_content, list):
            df = pd.DataFrame(file_content)
        else:
            raise ValueError(f"Unsupported data type: {type(file_content)}")
        
        # Parse preprocessing rules
        rules_config = parse_preprocessing_rules(preprocessing_rules) if preprocessing_rules else {}
        
        # Initialize results
        results = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'original_shape': {'rows': len(df), 'columns': len(df.columns)}
        }
        
        # Data cleaning (if requested)
        if rules_config.get('enhanced_cleaning', False) and ENHANCED_CLEANING_AVAILABLE:
            logger.info("Applying enhanced data cleaning...")
            cleaning_config = parse_enhanced_cleaning_config(preprocessing_rules)
            df, cleaning_log = enhanced_clean_data(df, cleaning_config)
            results['cleaning_applied'] = True
            results['cleaning_log'] = cleaning_log
        else:
            # Apply basic preprocessing
            df = preprocess_dataframe(df, rules_config)
            results['cleaning_applied'] = False
        
        # Intelligent EDA Analysis
        target_column = rules_config.get('target_column', None)
        
        if INTELLIGENT_EDA_AVAILABLE:
            logger.info("Performing intelligent EDA analysis...")
            eda_results = intelligent_eda_analysis(df, target_column)
            results['eda_analysis'] = eda_results
        else:
            # Fallback to basic analysis
            results['eda_analysis'] = basic_analysis_fallback(df)
        
        # Generate comprehensive insights
        results['insights'] = generate_comprehensive_insights(df, results.get('eda_analysis', {}))
        
        # Final data summary
        results['final_shape'] = {'rows': len(df), 'columns': len(df.columns)}
        results['processing_summary'] = generate_processing_summary(results)
        
        return results
        
    except Exception as e:
        logger.error(f"Error in data processing: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def parse_preprocessing_rules(preprocessing_rules: str) -> Dict[str, Any]:
    """Parse preprocessing rules string into configuration dictionary"""
    
    config = {
        'enhanced_cleaning': False,
        'target_column': None,
        'eda_type': 'auto'  # auto, basic, complex, timeseries, geospatial, textual
    }
    
    rules_lower = preprocessing_rules.lower()
    
    # Enhanced cleaning detection
    if any(keyword in rules_lower for keyword in ['enhanced_cleaning', 'comprehensive_cleaning', 'advanced_cleaning']):
        config['enhanced_cleaning'] = True
    
    # Target column detection
    target_match = re.search(r'target[_\s]*column[_\s]*[:\=]\s*([a-zA-Z_][a-zA-Z0-9_]*)', rules_lower)
    if target_match:
        config['target_column'] = target_match.group(1)
    
    # EDA type detection
    if 'basic_eda' in rules_lower:
        config['eda_type'] = 'basic'
    elif 'complex_eda' in rules_lower:
        config['eda_type'] = 'complex'
    elif 'timeseries_eda' in rules_lower or 'time_series_eda' in rules_lower:
        config['eda_type'] = 'timeseries'
    elif 'geospatial_eda' in rules_lower or 'geo_eda' in rules_lower:
        config['eda_type'] = 'geospatial'
    elif 'textual_eda' in rules_lower or 'text_eda' in rules_lower:
        config['eda_type'] = 'textual'
    
    return config

def basic_analysis_fallback(df: pd.DataFrame) -> Dict[str, Any]:
    """Fallback basic analysis when intelligent EDA is not available"""
    
    return {
        'eda_type': 'basic_fallback',
        'summary_statistics': df.describe().to_dict(),
        'data_types': df.dtypes.astype(str).to_dict(),
        'missing_values': df.isnull().sum().to_dict(),
        'shape': {'rows': len(df), 'columns': len(df.columns)},
        'message': 'Basic analysis performed - intelligent EDA not available'
    }

def generate_comprehensive_insights(df: pd.DataFrame, eda_results: Dict[str, Any]) -> List[Dict[str, str]]:
    """Generate comprehensive insights based on EDA results"""
    
    insights = []
    
    # Add EDA-specific insights
    if 'eda_metadata' in eda_results:
        eda_type = eda_results['eda_metadata'].get('eda_type', 'unknown')
        characteristics = eda_results['eda_metadata'].get('characteristics', {})
        
        insights.append({
            'type': 'eda_approach',
            'title': f'Intelligent EDA Applied: {eda_type.title()}',
            'description': f'Applied {eda_type} EDA based on dataset characteristics',
            'recommendation': f"Dataset complexity score: {characteristics.get('complexity_score', 0):.1f}/100"
        })
        
        # Add characteristic-based insights
        if characteristics.get('is_high_dimensional', False):
            insights.append({
                'type': 'dimensionality',
                'title': 'High-Dimensional Dataset',
                'description': f"Dataset has {characteristics.get('columns', 0)} features",
                'recommendation': 'Consider dimensionality reduction techniques like PCA'
            })
        
        if characteristics.get('is_time_series', False):
            insights.append({
                'type': 'temporal',
                'title': 'Time Series Data Detected',
                'description': 'Dataset contains temporal patterns',
                'recommendation': 'Analyze trends, seasonality, and temporal dependencies'
            })
        
        if characteristics.get('geospatial_columns', 0) > 0:
            insights.append({
                'type': 'geospatial',
                'title': 'Geospatial Data Present',
                'description': f"Found {characteristics.get('geospatial_columns', 0)} geographic columns",
                'recommendation': 'Consider spatial clustering and geographic pattern analysis'
            })
    
    # Add data quality insights
    missing_pct = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
    if missing_pct > 10:
        insights.append({
            'type': 'data_quality',
            'title': 'Significant Missing Data',
            'description': f'{missing_pct:.1f}% of data points are missing',
            'recommendation': 'Apply enhanced cleaning with smart imputation strategies'
        })
    
    return insights

def generate_processing_summary(results: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a summary of the processing that was performed"""
    
    summary = {
        'data_shape_change': {
            'original': results['original_shape'],
            'final': results['final_shape'],
            'rows_changed': results['final_shape']['rows'] - results['original_shape']['rows'],
            'columns_changed': results['final_shape']['columns'] - results['original_shape']['columns']
        },
        'cleaning_performed': results.get('cleaning_applied', False),
        'eda_type': results.get('eda_analysis', {}).get('eda_type', 'unknown'),
        'insights_generated': len(results.get('insights', [])),
        'processing_status': 'success' if results.get('success', False) else 'failed'
    }
    
    # Add EDA-specific summary
    if 'eda_analysis' in results and 'eda_metadata' in results['eda_analysis']:
        eda_meta = results['eda_analysis']['eda_metadata']
        summary['eda_details'] = {
            'complexity_score': eda_meta.get('characteristics', {}).get('complexity_score', 0),
            'analysis_recommendations': eda_meta.get('analysis_recommendations', []),
            'key_characteristics': eda_meta.get('key_characteristics', [])
        }
    
    return summary

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

def parse_enhanced_cleaning_config(preprocessing_rules: str) -> Dict[str, Any]:
    """
    Parse enhanced cleaning configuration from preprocessing rules string
    """
    config = {
        'handle_missing': True,
        'correct_types': True,
        'remove_duplicates': True,
        'handle_outliers': True,
        'clean_text': True,
        'validate_integrity': True,
        'fix_formats': True,
        'standardize': False,
        'encode_categorical': False,
        'create_bins': False,
        'feature_engineering': False,
        'aggregate_transform': False,
        'clean_geospatial': False,
        'handle_unit_conversions': False
    }
    
    rules_lower = preprocessing_rules.lower()
    
    # Parse specific enhanced cleaning options
    if 'standardize_data' in rules_lower or 'normalize_data' in rules_lower:
        config['standardize'] = True
        config['scaling_config'] = {'method': 'standard'}
        if 'minmax' in rules_lower:
            config['scaling_config']['method'] = 'minmax'
        elif 'log_transform' in rules_lower:
            config['scaling_config']['method'] = 'log'
        elif 'boxcox' in rules_lower:
            config['scaling_config']['method'] = 'boxcox'
    
    if 'encode_categorical' in rules_lower:
        config['encode_categorical'] = True
        config['encoding_config'] = {'method': 'onehot', 'max_categories_onehot': 10}
        if 'label_encoding' in rules_lower:
            config['encoding_config']['method'] = 'label'
        elif 'target_encoding' in rules_lower:
            config['encoding_config']['method'] = 'target'
        elif 'frequency_encoding' in rules_lower:
            config['encoding_config']['method'] = 'frequency'
    
    if 'create_bins' in rules_lower or 'binning' in rules_lower:
        config['create_bins'] = True
        # Default binning configuration
        config['binning_config'] = {
            'binning_rules': {}  # Would be populated based on specific column rules
        }
    
    if 'feature_engineering' in rules_lower:
        config['feature_engineering'] = True
        config['feature_config'] = {
            'extract_date_features': True,
            'extract_text_features': False
        }
    
    if 'missing_indicators' in rules_lower:
        config['missing_config'] = config.get('missing_config', {})
        config['missing_config']['create_missing_indicators'] = True
    
    if 'knn_imputation' in rules_lower:
        config['missing_config'] = config.get('missing_config', {})
        config['missing_config']['use_knn_imputation'] = True
        config['missing_config']['knn_neighbors'] = 5
    
    if 'zscore_outliers' in rules_lower:
        config['outlier_config'] = {'method': 'zscore', 'action': 'cap'}
    elif 'remove_outliers' in rules_lower:
        config['outlier_config'] = {'method': 'iqr', 'action': 'remove'}
    
    if 'geospatial' in rules_lower:
        config['clean_geospatial'] = True
    
    # Enhanced text cleaning options
    if 'remove_html' in rules_lower:
        config['text_config'] = config.get('text_config', {})
        config['text_config']['remove_html_tags'] = True
    
    if 'remove_emojis' in rules_lower:
        config['text_config'] = config.get('text_config', {})
        config['text_config']['remove_emojis'] = True
    
    if 'advanced_text_cleaning' in rules_lower:
        config['text_config'] = config.get('text_config', {})
        config['text_config']['advanced_standardization'] = True
        config['text_config']['remove_punctuation'] = True
    
    # Unit conversion options
    if 'unit_conversion' in rules_lower or 'convert_units' in rules_lower:
        config['handle_unit_conversions'] = True
        config['unit_conversion_config'] = {'auto_detect_units': True}
    
    # Parse missing value thresholds
    threshold_match = re.search(r'missing_threshold[:\s]+(\d+\.?\d*)%?', rules_lower)
    if threshold_match:
        threshold = float(threshold_match.group(1))
        if threshold > 1:  # Assume percentage
            threshold = threshold / 100
        config['missing_config'] = config.get('missing_config', {})
        config['missing_config']['column_missing_threshold'] = threshold
    
    return config