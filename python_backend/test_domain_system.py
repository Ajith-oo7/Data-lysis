#!/usr/bin/env python3
"""
Test script for domain detection and visualization generation
"""

import json
import os
import sys
from typing import Dict, Any, List

# Import our modules
from domain_detection import detect_data_domain
from domain_router import analyze_domain_query, SUPPORTED_DOMAINS
from visualization_generator import generate_domain_visualizations

# Sample datasets for testing
SAMPLE_DATA = {
    "finance": """
Date,Revenue,Expenses,Profit,Department
2023-01-01,12500,8000,4500,Sales
2023-01-02,9800,7500,2300,Marketing
2023-01-03,11200,6900,4300,Sales
2023-01-04,10500,7200,3300,Engineering
2023-01-05,13800,9100,4700,Sales
""",
    "food": """
Food,Calories,Protein,Carbs,Fat,Fiber,Sugar
Apple,95,0.5,25,0.3,4.4,19
Banana,105,1.3,27,0.4,3.1,14
Chicken Breast,165,31,0,3.6,0,0
Salmon,206,22,0,13,0,0
Brown Rice,216,5,45,1.8,3.5,0.7
""",
    "sales": """
Date,Product,Category,Quantity,UnitPrice,TotalSales,Region
2023-01-05,Laptop,Electronics,5,1200,6000,North
2023-01-06,Smartphone,Electronics,12,800,9600,South
2023-01-07,T-shirt,Clothing,30,25,750,East
2023-01-08,Jeans,Clothing,15,45,675,West
2023-01-09,Coffee Maker,Home,8,120,960,North
""",
    "healthcare": """
PatientID,Age,Gender,BloodPressure,Cholesterol,Diagnosis,TreatmentCost
P001,45,M,120/80,Normal,Hypertension,1500
P002,67,F,140/90,High,Diabetes,2300
P003,32,F,110/70,Normal,Migraine,800
P004,55,M,150/95,High,Heart Disease,5600
P005,29,M,118/76,Normal,Anxiety,950
"""
}

def test_domain_detection():
    """Test domain detection on sample datasets"""
    print("\n===== TESTING DOMAIN DETECTION =====")
    
    for domain_name, data in SAMPLE_DATA.items():
        # Extract column names and sample values
        lines = [line.strip() for line in data.strip().split('\n')]
        if not lines:
            continue
        
        columns = lines[0].split(',')
        sample_values = []
        
        for i, line in enumerate(lines[1:]):
            if i >= 5:  # Limit to 5 sample rows
                break
            
            values = line.split(',')
            if len(values) == len(columns):
                sample_row = {columns[j]: values[j] for j in range(len(columns))}
                sample_values.append(sample_row)
        
        # Detect domain
        result = detect_data_domain(columns, sample_values)
        
        # Print results
        print(f"\nTesting with {domain_name.upper()} dataset")
        print(f"Detected domain: {result['domain']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Reason: {result['reason']}")
        print(f"Features: {', '.join(result['features'])}")
        
        # Check if detected domain is expected
        if result['domain'].lower() == domain_name.lower():
            print(f"✅ CORRECT: Expected {domain_name}, detected {result['domain']}")
        else:
            print(f"❌ WRONG: Expected {domain_name}, detected {result['domain']}")


def test_domain_analysis():
    """Test domain-specific analysis on sample datasets"""
    print("\n\n===== TESTING DOMAIN ANALYSIS =====")
    
    for domain_name, data in SAMPLE_DATA.items():
        print(f"\nTesting domain analysis for {domain_name.upper()} dataset")
        
        # Create a query
        query = "What are the key trends and patterns in this data?"
        
        # Get domain-specific analysis
        try:
            result = analyze_domain_query(domain_name.capitalize(), data, query)
            
            # Print results
            print(f"Analysis domain: {result['domain']}")
            print(f"Analysis length: {len(result['analysis'])} characters")
            print(f"Analysis snippet: {result['analysis'][:150]}...")
        except Exception as e:
            print(f"Error analyzing {domain_name} data: {str(e)}")


def test_visualization_generation():
    """Test domain-specific visualization generation on sample datasets"""
    print("\n\n===== TESTING VISUALIZATION GENERATION =====")
    
    for domain_name, data in SAMPLE_DATA.items():
        print(f"\nTesting visualization generation for {domain_name.upper()} dataset")
        
        # Generate visualizations
        try:
            visualizations = generate_domain_visualizations(domain_name.capitalize(), data)
            
            # Print results
            print(f"Number of visualizations: {len(visualizations)}")
            
            for i, viz in enumerate(visualizations):
                print(f"\n- Visualization {i+1} -")
                print(f"Title: {viz.get('title', 'N/A')}")
                print(f"Chart type: {viz.get('chart_type', 'N/A')}")
                print(f"Description: {viz.get('description', 'N/A')[:100]}...")
                
                if 'columns_used' in viz:
                    print(f"Columns used: {', '.join(viz['columns_used'])}")
                
                if 'plotly_code' in viz:
                    code_snippet = viz['plotly_code']
                    print(f"Code snippet: {code_snippet[:60]}...")
                    
        except Exception as e:
            print(f"Error generating visualizations for {domain_name} data: {str(e)}")


if __name__ == "__main__":
    # Make sure we have API keys
    if not os.environ.get("OPENAI_API_KEY"):
        print("⚠️  Missing OPENAI_API_KEY environment variable")
        print("Please set it before running this script")
        sys.exit(1)
    
    # Run tests
    test_domain_detection()
    test_domain_analysis()
    test_visualization_generation()
    
    print("\n\nAll tests completed! Check the results above for any errors.")