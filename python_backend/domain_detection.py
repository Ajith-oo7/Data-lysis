"""
Domain detection module for Excel data analysis platform

This module detects the most likely domain for a dataset based on column names and sample values.
"""

from typing import List, Dict, Any, Optional, Union
import os
import json
import re

from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI

# Constants for domain types
DOMAIN_FINANCE = "Finance"
DOMAIN_FOOD = "Food"
DOMAIN_SALES = "Sales"
DOMAIN_HEALTHCARE = "Healthcare"
DOMAIN_EDUCATION = "Education"
DOMAIN_HR = "HR"
DOMAIN_MARKETING = "Marketing"
DOMAIN_GENERIC = "Generic"

# List of supported domains
SUPPORTED_DOMAINS = [
    DOMAIN_FINANCE,
    DOMAIN_FOOD,
    DOMAIN_SALES,
    DOMAIN_HEALTHCARE,
    DOMAIN_EDUCATION,
    DOMAIN_HR,
    DOMAIN_MARKETING,
    DOMAIN_GENERIC
]

def detect_data_domain(columns: List[str], sample_values: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Detect the most likely domain for a dataset based on column names and optional sample values.
    
    Args:
        columns: List of column names from the dataset
        sample_values: Optional list of sample rows from the dataset
        
    Returns:
        Dictionary containing domain classification details:
        {
            "domain": The identified domain as a string,
            "reason": Explanation for the domain classification,
            "confidence": Confidence score (0.0 to 1.0),
            "features": List of detected domain features
        }
    """
    try:
        # Format domain prompt with column names and sample data
        domain_prompt = _build_domain_prompt(columns, sample_values)
        
        # Detect domain using LangChain/OpenAI
        domain_result = _detect_with_langchain(domain_prompt)
        
        # Extract domain info from result
        domain_info = _parse_domain_result(domain_result, columns)
        
        return domain_info
    except Exception as e:
        print(f"Error in domain detection: {str(e)}")
        # Return error message instead of using fallback detection
        return {"domain": "Error", "reason": f"Unable to detect domain: {str(e)}. Please check API key configuration.", "confidence": 0.0, "features": []}

def _build_domain_prompt(columns: List[str], sample_values: Optional[List[Dict[str, Any]]] = None) -> str:
    """Build the prompt for domain detection"""
    column_list = ", ".join(columns)
    
    # Format sample data for prompt
    sample_data_str = ""
    if sample_values and len(sample_values) > 0:
        sample_data_str = "Sample data rows:\n"
        for i, row in enumerate(sample_values[:3]):  # Include up to 3 sample rows
            row_values = []
            for col in columns:
                if col in row:
                    value = str(row[col])
                    # Truncate very long values
                    if len(value) > 100:
                        value = value[:97] + "..."
                    row_values.append(f"{col}: {value}")
            sample_data_str += f"Row {i+1}: {', '.join(row_values)}\n"
    
    return f"""You are a domain expert tasked with classifying a dataset based on its columns and sample data.

Column names: {column_list}

{sample_data_str}

Based on these column names and sample data, determine the domain this dataset belongs to.
Choose from the following domains:
- Finance: financial data, accounting, investments, stocks, revenue, expenses, etc.
- Food: nutritional data, recipes, ingredients, calories, food items, etc.
- Sales: sales data, products, customers, orders, revenue, transactions, etc.
- Healthcare: medical data, patients, diagnoses, treatments, health metrics, etc.
- Education: student data, courses, grades, educational performance, etc.
- HR: employee data, HR metrics, hiring, performance reviews, etc.
- Marketing: marketing campaigns, customer segments, promotions, advertising, etc.
- Generic: general data that doesn't fit clearly into any specific domain

Provide your answer in JSON format:
{{
  "domain": "the most likely domain from the list above",
  "confidence": a decimal number between 0 and 1 indicating your confidence,
  "reason": "a detailed explanation of why you chose this domain",
  "features": ["list of domain-specific features or terms identified in the dataset"]
}}"""

def _detect_with_langchain(prompt: str) -> str:
    """Use LangChain with OpenAI to detect domain"""
    # Initialize the LLM
    llm = ChatOpenAI(
        model_name="gpt-4o",
        temperature=0,
        api_key=os.environ.get("OPENAI_API_KEY")
    )
    
    # Define template
    template = PromptTemplate(
        input_variables=["prompt"],
        template="{prompt}"
    )
    
    # Create chain
    chain = LLMChain(llm=llm, prompt=template)
    
    # Run chain
    result = chain.run(prompt=prompt)
    
    return result

def _parse_domain_result(result: str, columns: List[str]) -> Dict[str, Any]:
    """Parse the domain detection result"""
    try:
        # Extract JSON from result (in case there's additional text)
        json_match = re.search(r'({[\s\S]*})', result)
        if json_match:
            json_str = json_match.group(1)
            domain_info = json.loads(json_str)
            
            # Validate and normalize the result
            if 'domain' not in domain_info or not domain_info['domain']:
                raise ValueError("No domain found in response")
            
            normalized_domain = domain_info['domain'].strip().title()
            if normalized_domain not in SUPPORTED_DOMAINS:
                normalized_domain = "Generic"
            
            # Ensure all required fields are present
            if 'confidence' not in domain_info or not isinstance(domain_info['confidence'], (int, float)):
                domain_info['confidence'] = 0.7
            if 'features' not in domain_info or not isinstance(domain_info['features'], list):
                domain_info['features'] = extract_features_from_reason(domain_info.get('reason', ''), columns)
            
            # Normalize response
            return {
                "domain": normalized_domain,
                "confidence": min(1.0, max(0.0, float(domain_info['confidence']))),
                "reason": domain_info.get('reason', 'Domain detected based on column patterns'),
                "features": domain_info['features']
            }
        else:
            raise ValueError("No JSON found in response")
    except Exception as e:
        print(f"Error parsing domain result: {str(e)}, result: {result}")
        # Create a default response if parsing fails
        return {
            "domain": "Generic",
            "confidence": 0.5,
            "reason": f"Error parsing domain detection result: {str(e)}",
            "features": extract_features_from_reason(result, columns)
        }

def extract_features_from_reason(reason: str, columns: List[str]) -> List[str]:
    """Extract domain-specific features from the AI's reasoning text"""
    features = []
    
    # Extract key terms from the reason based on capitalized words and quoted terms
    quoted_terms = re.findall(r'"([^"]+)"', reason)
    features.extend(quoted_terms)
    
    # Add column names that are explicitly mentioned in the reason
    for col in columns:
        if col.lower() in reason.lower():
            features.append(col)
    
    # Remove duplicates and empty strings
    features = list(set(feature for feature in features if feature.strip()))
    
    # If we still don't have features, add some column names as features
    if not features and columns:
        features = columns[:min(5, len(columns))]
    
    return features

def fallback_rule_based_domain_detection(columns: List[str], sample_values: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Returns an error message instead of using rule-based fallback detection"""
    return {
        "domain": "Error",
        "reason": "Unable to detect domain using AI. Please check the API key configuration and try again.",
        "confidence": 0.0,
        "features": []
    }

# The rest of the file with test code is omitted since it is used only for testing and development
# This prevents showing any fallback/placeholder content to users
    generic_result = fallback_rule_based_domain_detection(generic_columns)
    print(f"Generic test: {generic_result}")