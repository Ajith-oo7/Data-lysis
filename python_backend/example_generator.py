import json
import logging
import os
import pandas as pd
from typing import List, Dict, Any, Union

# Import OpenAI for generating example queries
from openai import OpenAI

# Import domain detection to provide context
from domain_detection import detect_data_domain

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def generate_example_queries(data: Union[str, List[Dict[str, Any]]]) -> List[str]:
    """
    Generate example natural language queries for a dataset
    
    Args:
        data: Either a CSV string or list of dictionaries representing the data
        
    Returns:
        List of example query strings relevant to the dataset
    """
    try:
        # Convert input to pandas DataFrame
        df = convert_to_dataframe(data)
        
        # Get column information
        columns = list(df.columns)
        column_types = get_column_types(df)
        
        # Get domain information
        sample_values = df.head(3).to_dict('records')
        domain_info = detect_data_domain(columns, sample_values)
        
        # Generate examples using AI
        examples = generate_ai_examples(df, column_types, domain_info)
        
        return examples
    
    except Exception as e:
        logger.error(f"Error generating example queries: {str(e)}")
        # Return generic examples as fallback
        return generate_fallback_examples()

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

def get_column_types(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Extract column type information from DataFrame"""
    column_types = {}
    
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            column_types[col] = {
                "type": "numeric",
                "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None
            }
        elif pd.api.types.is_string_dtype(df[col]):
            unique_values = df[col].nunique()
            if unique_values < 15:  # Categorical
                column_types[col] = {
                    "type": "categorical",
                    "unique_values": unique_values,
                    "examples": df[col].dropna().unique()[:5].tolist()
                }
            else:
                column_types[col] = {
                    "type": "text",
                    "unique_values": unique_values
                }
        elif pd.api.types.is_datetime64_dtype(df[col]):
            column_types[col] = {
                "type": "datetime",
                "min": df[col].min().isoformat() if not pd.isna(df[col].min()) else None,
                "max": df[col].max().isoformat() if not pd.isna(df[col].max()) else None
            }
        else:
            column_types[col] = {"type": "other"}
    
    return column_types

def generate_ai_examples(df: pd.DataFrame, column_types: Dict[str, Dict[str, Any]], domain_info: Dict[str, Any]) -> List[str]:
    """Generate domain-specific example queries using AI"""
    try:
        # Prepare data sample for OpenAI
        data_sample = df.head(20).to_csv(index=False)
        
        # Create prompt
        prompt = f"""
Given the following data structure, generate 5 sophisticated, domain-specific questions that a data analyst would want to ask about this dataset.

DATASET INFORMATION:
Domain: {domain_info['domain']}
Domain context: {domain_info['reason']}
Sample data:
{data_sample}

Column information:
{json.dumps(column_types, indent=2)}

IMPORTANT GUIDELINES:
- First analyze the data structure to identify patterns and key variables
- Generate questions that require analysis (comparisons, trends, correlations, outliers, distributions)
- ONLY use columns that actually exist in the provided data
- Create questions that would benefit from visualizations
- Include at least one question about the highest/lowest values
- Include at least one question about patterns or trends if time data exists
- For numerical data, include questions about statistical properties
- For categorical data, include questions about distributions
- Make questions specific to the {domain_info['domain']} domain, not generic
- Phrase questions in natural language as a business user would ask them

Format your response as JSON with the following structure:
{{
  "queries": [
    string, // Specific, domain-relevant question 1
    string, // Specific, domain-relevant question 2
    string, // Specific, domain-relevant question 3
    string, // Specific, domain-relevant question 4
    string  // Specific, domain-relevant question 5
  ]
}}
"""
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7  # Higher temperature for more creative variety
        )
        
        # Extract and parse examples
        content = response.choices[0].message.content
        try:
            examples_data = json.loads(content)
            examples = examples_data.get("queries", [])
            
            # Validate format and ensure we have examples
            if not examples or not isinstance(examples, list):
                logger.warning("Invalid examples format returned by AI")
                return generate_domain_specific_examples(df, domain_info['domain'])
            
            # Validate each example
            validated_examples = []
            for example in examples:
                if isinstance(example, str) and example.strip():
                    validated_examples.append(example.strip())
            
            # If we don't have enough valid examples, supplement with domain-specific ones
            if len(validated_examples) < 3:
                domain_examples = generate_domain_specific_examples(df, domain_info['domain'])
                validated_examples.extend(domain_examples)
                validated_examples = list(set(validated_examples))  # Remove duplicates
            
            # Return up to 5 examples
            return validated_examples[:5]
            
        except json.JSONDecodeError:
            logger.error(f"Failed to parse OpenAI examples response as JSON: {content}")
            return generate_domain_specific_examples(df, domain_info['domain'])
    
    except Exception as e:
        logger.error(f"Error generating AI examples: {str(e)}")
        return generate_domain_specific_examples(df, domain_info['domain'])

def generate_domain_specific_examples(df: pd.DataFrame, domain: str) -> List[str]:
    """Generate domain-specific example queries based on the dataset structure"""
    examples = []
    
    # Get column lists by type
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = [col for col in df.columns if df[col].nunique() < 15 and col not in numeric_cols]
    time_cols = [col for col in df.columns if any(kw in col.lower() for kw in 
                                                ['date', 'time', 'year', 'month', 'day'])]
    
    # Domain-specific examples
    domain = domain.lower()
    
    if domain == 'nutrition' or domain == 'food':
        if numeric_cols:
            nutrition_cols = [col for col in numeric_cols if any(kw in col.lower() for kw in 
                                                              ['calorie', 'protein', 'fat', 'carb', 'sugar'])]
            cal_col = next((col for col in nutrition_cols if 'calorie' in col.lower()), nutrition_cols[0] if nutrition_cols else numeric_cols[0])
            
            examples.append(f"Which items have the highest {cal_col} content?")
            
            if len(nutrition_cols) >= 2:
                col1, col2 = nutrition_cols[:2]
                examples.append(f"What's the relationship between {col1} and {col2}?")
            
            if categorical_cols:
                cat_col = categorical_cols[0]
                examples.append(f"How does {cal_col} compare across different {cat_col} categories?")
    
    elif domain == 'financial' or domain == 'sales':
        if numeric_cols:
            financial_cols = [col for col in numeric_cols if any(kw in col.lower() for kw in 
                                                            ['price', 'revenue', 'cost', 'sale', 'amount'])]
            value_col = financial_cols[0] if financial_cols else numeric_cols[0]
            
            examples.append(f"What are the total {value_col} values?")
            
            if categorical_cols:
                cat_col = categorical_cols[0]
                examples.append(f"Which {cat_col} has the highest {value_col}?")
                examples.append(f"How is {value_col} distributed across different {cat_col} categories?")
            
            if time_cols:
                time_col = time_cols[0]
                examples.append(f"What's the trend of {value_col} over time based on {time_col}?")
    
    elif domain == 'healthcare':
        if numeric_cols:
            health_cols = [col for col in numeric_cols if any(kw in col.lower() for kw in 
                                                           ['age', 'weight', 'height', 'bmi', 'blood'])]
            value_col = health_cols[0] if health_cols else numeric_cols[0]
            
            examples.append(f"What's the average {value_col} across all records?")
            
            if categorical_cols:
                cat_col = categorical_cols[0]
                examples.append(f"How does {value_col} vary across different {cat_col} groups?")
            
            if len(health_cols) >= 2:
                col1, col2 = health_cols[:2]
                examples.append(f"Is there a correlation between {col1} and {col2}?")
    
    # Generic examples if we don't have enough domain-specific ones
    if len(examples) < 3:
        # Add generic statistical questions
        if numeric_cols:
            num_col = numeric_cols[0]
            examples.append(f"What is the highest {num_col} in the dataset?")
            examples.append(f"What is the average {num_col} value?")
        
        # Add generic categorical questions
        if categorical_cols:
            cat_col = categorical_cols[0]
            examples.append(f"What is the distribution of {cat_col} in the dataset?")
        
        # Add generic time-based question
        if time_cols and numeric_cols:
            time_col = time_cols[0]
            num_col = numeric_cols[0]
            examples.append(f"How has {num_col} changed over time according to {time_col}?")
    
    # If we still don't have enough examples, add very generic ones
    if len(examples) < 3:
        examples.append("What interesting patterns can be found in this dataset?")
        examples.append("What are the key insights from this data?")
        examples.append("What columns have the strongest relationships in this dataset?")
    
    # Return unique examples, limited to 5
    return list(set(examples))[:5]

def generate_fallback_examples() -> List[str]:
    """Return error message instead of generic examples"""
    return [
        "Error: Unable to generate example queries. Please check the API key configuration."
    ]
