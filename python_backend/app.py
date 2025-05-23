"""
Flask API for the Excel Data Analysis Platform

This module implements the Flask API endpoints for domain detection,
data processing, and query analysis for the Excel data analysis platform.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import pandas as pd
from typing import List, Dict, Any, Union, Optional

# Import our backend modules
from domain_detection import detect_data_domain
from data_processor import process_data
from query_analyzer import analyze_query
from example_generator import generate_example_queries
from domain_router import (
    DomainRouter,
    analyze_domain_query,
    SUPPORTED_DOMAINS
)
from visualization_generator import generate_domain_visualizations

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Python backend is running',
        'supported_domains': SUPPORTED_DOMAINS,
        'api_keys': {
            'openai': 'configured' if os.environ.get('OPENAI_API_KEY') else 'missing',
            'anthropic': 'configured' if os.environ.get('ANTHROPIC_API_KEY') else 'missing',
        }
    })

@app.route('/detect-domain', methods=['POST'])
def domain_detection_endpoint():
    """Detect domain from column names and sample data"""
    try:
        # Get request data
        data = request.json
        columns = data.get('columns', [])
        sample_data = data.get('sampleData', [])
        
        # Call domain detection
        result = detect_data_domain(columns, sample_data)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to detect domain'
        }), 500

@app.route('/process-data', methods=['POST'])
def process_data_endpoint():
    """Process data with AI-enhanced analysis"""
    try:
        # Get request data
        data = request.json
        file_content = data.get('data', [])
        preprocessing_rules = data.get('preprocessingRules', '')
        
        # Call data processor
        result = process_data(file_content, preprocessing_rules)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to process data'
        }), 500

@app.route('/analyze-query', methods=['POST'])
def analyze_query_endpoint():
    """Analyze a natural language query against the dataset"""
    try:
        # Get request data
        data = request.json
        query = data.get('query', '')
        dataset = data.get('data', [])
        domain = data.get('domain', 'Generic')
        
        # Use domain router if domain is provided
        if domain and domain != 'Generic':
            result = analyze_domain_query(domain, dataset, query)
        else:
            # Fall back to general query analyzer
            result = analyze_query(query, dataset)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to analyze query'
        }), 500

@app.route('/example-queries', methods=['POST'])
def example_queries_endpoint():
    """Generate example queries for the dataset"""
    try:
        # Get request data
        data = request.json
        dataset = data.get('data', [])
        domain = data.get('domain', None)
        
        # Generate example queries
        queries = generate_example_queries(dataset)
        
        return jsonify({
            'queries': queries,
            'domain': domain
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to generate example queries'
        }), 500

@app.route('/domain-visualizations', methods=['POST'])
def domain_visualizations_endpoint():
    """Generate domain-specific visualization suggestions"""
    try:
        # Get request data
        data = request.json
        domain = data.get('domain', 'Generic')
        dataset = data.get('data', [])
        
        # Generate domain-specific visualizations
        visualizations = generate_domain_visualizations(domain, dataset)
        
        return jsonify({
            'visualizations': visualizations,
            'domain': domain
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to generate domain visualizations'
        }), 500

if __name__ == '__main__':
    # Set the port - use environment variable or default to 5001
    port = int(os.environ.get('PYTHON_PORT', 5001))
    
    print(f"Starting Python backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)