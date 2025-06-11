"""
Domain-specific router for data analysis

This module implements a LangChain-based router that directs data to
domain-specific agents for specialized analysis.
"""

from typing import Dict, Any, List, Optional, Union
import os
import json
from typing import TYPE_CHECKING, Union

# Handle pandas type hints without importing in the global scope
# This allows the module to be imported without pandas installed
if TYPE_CHECKING:
    import pandas as pd

from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

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


class DomainRouter:
    """
    A router that directs data to domain-specific analysis agents.
    """
    
    def __init__(self, model_name: str = "gpt-4o", temperature: float = 0):
        """Initialize the domain router with LLM and chains."""
        # Initialize the LLM
        self.llm = ChatOpenAI(
            model_name=model_name,
            temperature=temperature,
            api_key=os.environ.get("OPENAI_API_KEY")
        )
        
        # Create domain-specific chains
        self.chains = self._create_domain_chains()
        
    def _create_domain_chains(self) -> Dict[str, LLMChain]:
        """Create LLMChains for each supported domain."""
        chains = {}
        
        # Finance domain chain
        finance_prompt = PromptTemplate(
            input_variables=["data", "columns", "question"],
            template="""
You are a financial data analyst expert. You analyze financial datasets to extract valuable insights.

Dataset Summary:
- Columns: {columns}
- Sample Data: {data}

Question or Analysis Request: {question}

Provide a detailed analysis with the following:
1. A direct answer to the question 
2. 3-5 key insights specific to financial data (trends, outliers, correlations)
3. Financial metrics that would be important to calculate
4. 2-3 visualization suggestions specifically suited for financial data

Keep your analysis focused on financial aspects such as: revenue, expenses, profit margins, 
ROI, cash flow, investments, stocks, assets, liabilities, and financial ratios.
"""
        )
        chains[DOMAIN_FINANCE] = LLMChain(llm=self.llm, prompt=finance_prompt)
        
        # Food/Nutrition domain chain
        food_prompt = PromptTemplate(
            input_variables=["data", "columns", "question"],
            template="""
You are a nutrition data analyst expert. You analyze food and nutrition datasets to extract valuable insights.

Dataset Summary:
- Columns: {columns}
- Sample Data: {data}

Question or Analysis Request: {question}

Provide a detailed analysis with the following:
1. A direct answer to the question
2. 3-5 key insights specific to nutrition data (nutritional patterns, health implications)
3. Nutritional metrics that would be important to calculate
4. 2-3 visualization suggestions specifically suited for food and nutrition data

Keep your analysis focused on nutritional aspects such as: calories, macronutrients (protein, carbs, fat), 
micronutrients (vitamins, minerals), food groups, dietary patterns, and health correlations.
"""
        )
        chains[DOMAIN_FOOD] = LLMChain(llm=self.llm, prompt=food_prompt)
        
        # Sales domain chain
        sales_prompt = PromptTemplate(
            input_variables=["data", "columns", "question"],
            template="""
You are a sales data analyst expert. You analyze sales datasets to extract valuable insights.

Dataset Summary:
- Columns: {columns}
- Sample Data: {data}

Question or Analysis Request: {question}

Provide a detailed analysis with the following:
1. A direct answer to the question
2. 3-5 key insights specific to sales data (sales trends, product performance, customer behavior)
3. Sales metrics that would be important to calculate
4. 2-3 visualization suggestions specifically suited for sales data

Keep your analysis focused on sales aspects such as: revenue, units sold, customer segments,
product categories, sales channels, seasonality, geographic distribution, and sales funnel metrics.
"""
        )
        chains[DOMAIN_SALES] = LLMChain(llm=self.llm, prompt=sales_prompt)
        
        # Healthcare domain chain
        healthcare_prompt = PromptTemplate(
            input_variables=["data", "columns", "question"],
            template="""
You are a healthcare data analyst expert. You analyze healthcare datasets to extract valuable insights.

Dataset Summary:
- Columns: {columns}
- Sample Data: {data}

Question or Analysis Request: {question}

Provide a detailed analysis with the following:
1. A direct answer to the question
2. 3-5 key insights specific to healthcare data (patient outcomes, treatment effectiveness, health patterns)
3. Healthcare metrics that would be important to calculate
4. 2-3 visualization suggestions specifically suited for healthcare data

Keep your analysis focused on healthcare aspects such as: patient demographics, diagnosis codes,
treatment efficacy, readmission rates, length of stay, healthcare costs, clinical outcomes, and public health indicators.
"""
        )
        chains[DOMAIN_HEALTHCARE] = LLMChain(llm=self.llm, prompt=healthcare_prompt)
        
        # Education domain chain
        education_prompt = PromptTemplate(
            input_variables=["data", "columns", "question"],
            template="""
You are an education data analyst expert. You analyze educational datasets to extract valuable insights.

Dataset Summary:
- Columns: {columns}
- Sample Data: {data}

Question or Analysis Request: {question}

Provide a detailed analysis with the following:
1. A direct answer to the question
2. 3-5 key insights specific to education data (student performance, learning patterns, educational outcomes)
3. Education metrics that would be important to calculate
4. 2-3 visualization suggestions specifically suited for education data

Keep your analysis focused on education aspects such as: test scores, attendance, graduation rates,
student demographics, course enrollment, teaching methods, educational resources, and learning outcomes.
"""
        )
        chains[DOMAIN_EDUCATION] = LLMChain(llm=self.llm, prompt=education_prompt)
        
        # HR domain chain
        hr_prompt = PromptTemplate(
            input_variables=["data", "columns", "question"],
            template="""
You are an HR data analyst expert. You analyze human resources datasets to extract valuable insights.

Dataset Summary:
- Columns: {columns}
- Sample Data: {data}

Question or Analysis Request: {question}

Provide a detailed analysis with the following:
1. A direct answer to the question
2. 3-5 key insights specific to HR data (employee patterns, retention factors, performance indicators)
3. HR metrics that would be important to calculate
4. 2-3 visualization suggestions specifically suited for HR data

Keep your analysis focused on HR aspects such as: employee demographics, retention rates, performance reviews,
salary distributions, talent acquisition, employee satisfaction, training effectiveness, and workforce planning.
"""
        )
        chains[DOMAIN_HR] = LLMChain(llm=self.llm, prompt=hr_prompt)
        
        # Marketing domain chain
        marketing_prompt = PromptTemplate(
            input_variables=["data", "columns", "question"],
            template="""
You are a marketing data analyst expert. You analyze marketing datasets to extract valuable insights.

Dataset Summary:
- Columns: {columns}
- Sample Data: {data}

Question or Analysis Request: {question}

Provide a detailed analysis with the following:
1. A direct answer to the question
2. 3-5 key insights specific to marketing data (campaign performance, customer engagement, channel effectiveness)
3. Marketing metrics that would be important to calculate
4. 2-3 visualization suggestions specifically suited for marketing data

Keep your analysis focused on marketing aspects such as: campaign metrics, customer acquisition costs,
conversion rates, engagement metrics, customer journey analytics, channel performance, ROI on marketing spend, and audience segmentation.
"""
        )
        chains[DOMAIN_MARKETING] = LLMChain(llm=self.llm, prompt=marketing_prompt)
        
        # Generic domain chain (for error handling only)
        generic_prompt = PromptTemplate(
            input_variables=["data", "columns", "question"],
            template="""
You are a data analyst expert. You analyze datasets to extract valuable insights.

Dataset Summary:
- Columns: {columns}
- Sample Data: {data}

Question or Analysis Request: {question}

Provide a detailed analysis with the following:
1. A direct answer to the question
2. 3-5 key insights from the data (patterns, outliers, correlations)
3. Important metrics that would be useful to calculate
4. 2-3 visualization suggestions that would best represent this data

Base your analysis on the specific column types and data patterns you observe.
"""
        )
        chains[DOMAIN_GENERIC] = LLMChain(llm=self.llm, prompt=generic_prompt)
        
        return chains
    
    def route_and_analyze(self, domain: str, data: Union[str, List[Dict[str, Any]], 'pd.DataFrame'], 
                         question: str = "What are the key insights from this data?") -> Dict[str, Any]:
        """
        Route data to the appropriate domain-specific chain and generate analysis.
        
        Args:
            domain: The detected domain for the data
            data: The dataset as CSV string, list of dictionaries, or pandas DataFrame
            question: The analysis question or request
            
        Returns:
            Dictionary containing analysis results
        """
        # Import pandas inside the function
        import pandas as pd
        
        # Normalize domain name
        normalized_domain = domain.strip().title()
        
        # Convert data to proper format for analysis
        if isinstance(data, pd.DataFrame):
            df = data
        elif isinstance(data, list) and len(data) > 0:
            df = pd.DataFrame(data)
        elif isinstance(data, str):
            try:
                df = pd.read_csv(data)
            except:
                # Try to parse as JSON if CSV parsing fails
                try:
                    parsed_data = json.loads(data)
                    if isinstance(parsed_data, list):
                        df = pd.DataFrame(parsed_data)
                    else:
                        raise ValueError("Data string is not in CSV or JSON list format")
                except:
                    raise ValueError("Failed to parse data string as CSV or JSON")
        else:
            raise ValueError("Data must be a DataFrame, list of dictionaries, or CSV string")
        
        # Get columns and sample data
        columns = list(df.columns)
        sample_data = df.head(5).to_string()
        
        # Select the appropriate chain
        if normalized_domain in self.chains:
            chain = self.chains[normalized_domain]
        else:
            # Fall back to generic if domain not supported
            chain = self.chains[DOMAIN_GENERIC]
            normalized_domain = DOMAIN_GENERIC
        
        # Run the chain
        try:
            result = chain.run(data=sample_data, columns=", ".join(columns), question=question)
            
            # Parse results into a structured format
            analysis_result = {
                "domain": normalized_domain,
                "analysis": result,
                "question": question,
                "processed_sample_size": len(df) if len(df) <= 5 else 5,
                "total_rows": len(df),
                "column_count": len(columns),
                "columns": columns
            }
            
            return analysis_result
        except Exception as e:
            # Fallback to generic if domain-specific analysis fails
            if normalized_domain != DOMAIN_GENERIC:
                try:
                    chain = self.chains[DOMAIN_GENERIC]
                    result = chain.run(data=sample_data, columns=", ".join(columns), question=question)
                    
                    return {
                        "domain": DOMAIN_GENERIC,
                        "analysis": result,
                        "question": question,
                        "processed_sample_size": len(df) if len(df) <= 5 else 5,
                        "total_rows": len(df),
                        "column_count": len(columns),
                        "columns": columns,
                        "error_reason": str(e)
                    }
                except Exception as error_handler:
                    return {
                        "error": "Analysis failed",
                        "details": "Error occurred while handling the original error",
                        "original_error": str(e)
                    }
            else:
                return {
                    "error": "Analysis failed",
                    "details": str(e)
                }


# Create a function to generate domain-specific visualizations
def generate_domain_visualizations(domain: str, data: Union[str, List[Dict[str, Any]], 'pd.DataFrame']) -> List[Dict[str, Any]]:
    """
    Generate domain-specific visualization suggestions.
    
    Args:
        domain: The detected domain for the data
        data: The dataset as CSV string, list of dictionaries, or pandas DataFrame
        
    Returns:
        List of visualization suggestions with config
    """
    import pandas as pd
    
    # Initialize the router
    router = DomainRouter(model_name="gpt-4o", temperature=0)
    
    # Convert data to proper format
    if not isinstance(data, pd.DataFrame):
        if isinstance(data, list) and len(data) > 0:
            df = pd.DataFrame(data)
        elif isinstance(data, str):
            try:
                df = pd.read_csv(data)
            except:
                try:
                    parsed_data = json.loads(data)
                    if isinstance(parsed_data, list):
                        df = pd.DataFrame(parsed_data)
                    else:
                        raise ValueError("Data string is not in CSV or JSON list format")
                except:
                    raise ValueError("Failed to parse data string as CSV or JSON")
        else:
            raise ValueError("Data must be a DataFrame, list of dictionaries, or CSV string")
    else:
        df = data
    
    # Get column types to help with visualization selection
    column_types = {}
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            column_types[col] = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            column_types[col] = "datetime"
        elif pd.api.types.is_categorical_dtype(df[col]) or df[col].nunique() < 20:
            column_types[col] = "categorical"
        else:
            column_types[col] = "text"
    
    # Generate domain-specific visualization suggestions using LLM
    visualization_prompt = PromptTemplate(
        input_variables=["domain", "columns", "column_types", "data_sample"],
        template="""
You are a data visualization expert specializing in {domain} data.

Dataset information:
- Domain: {domain}
- Columns: {columns}
- Column Types: {column_types}
- Sample Data: {data_sample}

Generate 3-5 visualization suggestions that would be most insightful for this {domain} dataset.
For each visualization:
1. Suggest a specific chart type (bar chart, line chart, scatter plot, etc.)
2. Specify which columns to use and how (x-axis, y-axis, color, size, etc.)
3. Explain what insights this visualization might reveal
4. Suggest a title for the visualization

Return the results as a JSON array with this structure for each suggestion:
{{
  "chart_type": "type of chart",
  "title": "suggested title",
  "description": "what insights this will show",
  "columns": ["column1", "column2"],
  "config": {{
    "x": "column_name",
    "y": "column_name",
    "color": "optional_column_name",
    "size": "optional_column_name",
    "additional_settings": {{}}
  }}
}}

Focus on visualizations that reveal important patterns in {domain} data specifically.
"""
    )
    
    vis_chain = LLMChain(llm=router.llm, prompt=visualization_prompt)
    
    try:
        result = vis_chain.run(
            domain=domain,
            columns=", ".join(df.columns),
            column_types=json.dumps(column_types),
            data_sample=df.head(3).to_string()
        )
        
        # Try to parse the result as JSON
        try:
            parsed_result = json.loads(result)
            if isinstance(parsed_result, list):
                return parsed_result
            else:
                return [parsed_result]
        except:
            # If parsing fails, return a simplified format
            return [{
                "chart_type": "generic",
                "title": "Data Overview",
                "description": "Could not parse LLM response as JSON. Original response included.",
                "raw_response": result
            }]
            
    except Exception as e:
        return [{
            "chart_type": "error",
            "title": "Visualization Generation Error",
            "description": f"Error generating visualizations: {str(e)}",
            "error": str(e)
        }]


# Create a function to parse query responses
def analyze_domain_query(domain: str, data: Union[str, List[Dict[str, Any]], 'pd.DataFrame'], 
                       query: str) -> Dict[str, Any]:
    """
    Analyze a query against domain-specific data.
    
    Args:
        domain: The detected domain for the data
        data: The dataset as CSV string, list of dictionaries, or pandas DataFrame
        query: The natural language query to analyze
        
    Returns:
        Dictionary containing query results and domain-specific analysis
    """
    # Import pandas inside the function to avoid global import
    import pandas as pd
    
    router = DomainRouter(model_name="gpt-4o", temperature=0)
    return router.route_and_analyze(domain, data, query)


# Testing functionality (will not run when imported as a module)
if __name__ == "__main__":
    # Sample data for testing
    sample_financial_data = """
Date,Revenue,Expenses,Profit,Department
2023-01-01,12500,8000,4500,Sales
2023-01-02,9800,7500,2300,Marketing
2023-01-03,11200,6900,4300,Sales
2023-01-04,10500,7200,3300,Engineering
2023-01-05,13800,9100,4700,Sales
"""
    
    # Initialize router
    router = DomainRouter()
    
    # Test financial data analysis
    result = router.route_and_analyze(DOMAIN_FINANCE, sample_financial_data, 
                                     "What are the key profit trends?")
    
    print("Domain:", result["domain"])
    print("Analysis:", result["analysis"])
    
    # Test visualization generation
    vis_suggestions = generate_domain_visualizations(DOMAIN_FINANCE, sample_financial_data)
    print("\nVisualization Suggestions:", json.dumps(vis_suggestions, indent=2))