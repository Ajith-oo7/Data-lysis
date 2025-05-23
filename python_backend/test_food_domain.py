#!/usr/bin/env python3
"""
Test script for food domain detection and visualization generation
"""

import json
import os
import sys
from typing import Dict, Any, List

# Import our modules
from domain_detection import detect_data_domain
from domain_router import analyze_domain_query
from visualization_generator import generate_domain_visualizations

# Food dataset for testing
FOOD_DATA = """
Food,Calories,Protein,Carbs,Fat,Fiber,Sugar
Apple,95,0.5,25,0.3,4.4,19
Banana,105,1.3,27,0.4,3.1,14
Chicken Breast,165,31,0,3.6,0,0
Salmon,206,22,0,13,0,0
Brown Rice,216,5,45,1.8,3.5,0.7
White Bread,74,2.6,14,1,0.6,1.4
Orange Juice,112,1.7,26,0.5,0.5,20.8
Almonds,164,6,6,14,3.5,1.2
Greek Yogurt,100,17,6,0.4,0,4
Avocado,160,2,8,15,6.7,0.7
"""

def main():
    """Test domain detection, analysis, and visualization for food data"""
    if not os.environ.get("OPENAI_API_KEY"):
        print("⚠️  Missing OPENAI_API_KEY environment variable")
        print("Please set it before running this script")
        sys.exit(1)
    
    # Extract column names and sample values
    lines = [line.strip() for line in FOOD_DATA.strip().split('\n')]
    if not lines:
        return
    
    columns = lines[0].split(',')
    sample_values = []
    
    for line in lines[1:]:
        values = line.split(',')
        if len(values) == len(columns):
            sample_row = {columns[j]: values[j] for j in range(len(columns))}
            sample_values.append(sample_row)
    
    # Test domain detection
    print("\n===== TESTING FOOD DOMAIN DETECTION =====")
    result = detect_data_domain(columns, sample_values)
    
    print(f"Detected domain: {result['domain']}")
    print(f"Confidence: {result['confidence']:.2f}")
    print(f"Reason: {result['reason']}")
    print(f"Features: {', '.join(result['features'])}")
    
    # Test domain-specific analysis
    print("\n===== TESTING FOOD DOMAIN ANALYSIS =====")
    queries = [
        "What are the nutritional highlights of this dataset?",
        "Which foods have the highest protein content?",
        "Compare the macronutrient profiles of these foods"
    ]
    
    # Convert to list of dictionaries for analysis
    import pandas as pd
    import io
    
    # Parse CSV data to dataframe then to list of dicts
    df = pd.read_csv(io.StringIO(FOOD_DATA.strip()))
    data_list = df.to_dict('records')
    
    for query in queries:
        print(f"\nQuery: {query}")
        try:
            analysis = analyze_domain_query("Food", data_list, query)
            print(f"Analysis: {analysis['analysis']}")
        except Exception as e:
            print(f"Error: {str(e)}")
    
    # Test visualization generation
    print("\n===== TESTING FOOD VISUALIZATION GENERATION =====")
    try:
        visualizations = generate_domain_visualizations("Food", data_list)
        
        print(f"Number of visualizations: {len(visualizations)}")
        
        for i, viz in enumerate(visualizations):
            print(f"\n--- Visualization {i+1} ---")
            print(f"Title: {viz.get('title', 'N/A')}")
            print(f"Chart type: {viz.get('chart_type', 'N/A')}")
            print(f"Description: {viz.get('description', 'N/A')}")
            
            if 'columns_used' in viz:
                print(f"Columns used: {', '.join(viz['columns_used'])}")
            
            if 'plotly_code' in viz:
                code_lines = viz['plotly_code'].strip().split('\n')
                print("\nCode snippet:")
                for line in code_lines[:10]:  # Print first 10 lines
                    print(f"    {line}")
                if len(code_lines) > 10:
                    print("    ...")
                    
    except Exception as e:
        print(f"Error generating visualizations: {str(e)}")

if __name__ == "__main__":
    main()