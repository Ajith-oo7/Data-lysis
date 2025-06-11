"""
Python backend for Excel Data Analysis Platform

This module contains Python implementations of the data processing,
domain detection, and analysis capabilities for our Excel data analysis platform.
"""

from .domain_detection import detect_data_domain
from .data_processor import process_data
from .query_analyzer import analyze_query
from .example_generator import generate_example_queries

__all__ = [
    'detect_data_domain',
    'process_data',
    'analyze_query',
    'generate_example_queries'
]