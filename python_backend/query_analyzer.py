import json
import logging
import os
import pandas as pd
from typing import List, Dict, Any, Union, Optional

# Import OpenAI for natural language query processing
from openai import OpenAI

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def analyze_query(query: str, data: Union[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Analyze a natural language query against the dataset and generate results
    
    Args:
        query: The natural language query string
        data: Either a CSV string or list of dictionaries representing the data
        
    Returns:
        Dictionary containing query results including answer, SQL query, and visualization
    """
    try:
        # Convert input to pandas DataFrame for basic analysis
        df = convert_to_dataframe(data)
        
        # Use AI to analyze query and generate response
        result = generate_ai_query_response(query, df)
        
        return result
    
    except Exception as e:
        logger.error(f"Error in query analysis: {str(e)}")
        return {
            "answer": f"Error analyzing query: {str(e)}",
            "sql": "",
            "visualization": None
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

def generate_ai_query_response(query: str, df: pd.DataFrame) -> Dict[str, Any]:
    """Generate answer, SQL, and visualization for query using AI"""
    try:
        # Prepare data sample for OpenAI
        data_sample = df.head(50).to_csv(index=False)
        
        # Extract column information for more context
        column_info = {}
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                column_info[col] = {
                    "type": "numeric",
                    "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                    "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                    "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None
                }
            elif pd.api.types.is_string_dtype(df[col]):
                unique_values = df[col].nunique()
                if unique_values < 15:  # Categorical
                    column_info[col] = {
                        "type": "categorical",
                        "unique_values": unique_values,
                        "examples": df[col].dropna().unique()[:5].tolist()
                    }
                else:
                    column_info[col] = {
                        "type": "text",
                        "unique_values": unique_values
                    }
            elif pd.api.types.is_datetime64_dtype(df[col]):
                column_info[col] = {
                    "type": "datetime",
                    "min": df[col].min().isoformat() if not pd.isna(df[col].min()) else None,
                    "max": df[col].max().isoformat() if not pd.isna(df[col].max()) else None
                }
            else:
                column_info[col] = {"type": "other"}
        
        # Create prompt
        prompt = f"""
You are an advanced data analyst expert specialized in interpreting complex data queries.
Given the following data and a question, provide:
1. A clear, detailed answer to the question based ONLY on the actual data provided, with exact numbers and statistics
2. The SQL query that would extract this information (with proper column names exactly matching the data)
3. A visualization specification optimized for the specific question and data

Here's the data:
{data_sample}

Additional column information:
{json.dumps(column_info, indent=2)}

IMPORTANT GUIDELINES:
- Answer ONLY based on what is actually in the data. Never invent or assume data not present.
- If the query asks about something not in the data, clearly state that the information is not available.
- Use actual column names from the dataset in both your answer and SQL query.
- For time series data, identify trends or patterns if applicable.
- For categorical data, include distribution information.
- For numerical data, include relevant statistics (min, max, average) when appropriate.
- Make sure visualizations match the data types and domain.
- Provide specific, data-driven insights rather than generic statements.

Question: {query}

Format your response as JSON with the following structure:
{{
  "answer": string, // A detailed, data-driven answer to the question
  "sql": string, // The SQL query with correct column names matching the dataset
  "visualization": {{ // Required unless absolutely inappropriate
    "type": string, // "bar", "line", "pie", "scatter", "histogram", "heatmap", etc.
    "data": array, // Structured data array for visualization
    "title": string, // Descriptive chart title
    "xAxisLabel": string, // Label for x-axis
    "yAxisLabel": string, // Label for y-axis
    "insights": string // 1-2 sentence insight from the visualization
  }}
}}
"""
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        # Extract and parse result
        content = response.choices[0].message.content
        try:
            result = json.loads(content)
            
            # Basic validation
            if not isinstance(result, dict):
                raise ValueError("Response is not a valid JSON object")
            
            if "answer" not in result or not isinstance(result["answer"], str) or not result["answer"]:
                raise ValueError("Response missing valid 'answer' field")
            
            if "sql" not in result or not isinstance(result["sql"], str):
                result["sql"] = "-- No SQL query generated"
            
            # Handle visualization - create a default one if missing
            if "visualization" not in result or not isinstance(result["visualization"], dict):
                result["visualization"] = create_default_visualization(df, query)
            
            return result
            
        except json.JSONDecodeError:
            logger.error(f"Failed to parse OpenAI query response as JSON: {content}")
            return create_fallback_query_response(df, query, content)
    
    except Exception as e:
        logger.error(f"Error generating AI query response: {str(e)}")
        return create_fallback_query_response(df, query)

def create_default_visualization(df: pd.DataFrame, query: str) -> Dict[str, Any]:
    """No longer creates fallback visualizations, just returns an error message"""
    return {
        "type": "error",
        "title": "Error: Unable to Generate Visualization",
        "message": "We could not generate a visualization for your query. Please check the API key configuration and try again.",
        "error": True
    }
