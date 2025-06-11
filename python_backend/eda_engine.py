"""
Comprehensive EDA Engine for Datalysis
Intelligently determines and executes appropriate EDA based on dataset characteristics
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple, Union
import logging
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

# Statistical and ML libraries
from scipy import stats
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import mutual_info_regression, mutual_info_classif
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

# Import the method classes
from eda_methods import EDAMethods
from specialized_eda import SpecializedEDAMethods

logger = logging.getLogger(__name__)

class EDAType(Enum):
    BASIC = "basic"
    COMPLEX = "complex"
    TEXTUAL = "textual"
    GEOSPATIAL = "geospatial"
    TIMESERIES = "timeseries"

@dataclass
class DatasetCharacteristics:
    """Holds dataset analysis results for EDA type determination"""
    rows: int
    columns: int
    numeric_columns: int
    categorical_columns: int
    text_columns: int
    datetime_columns: int
    geospatial_columns: int
    high_cardinality_columns: int
    missing_percentage: float
    duplicate_percentage: float
    is_time_series: bool
    is_high_dimensional: bool
    is_imbalanced: bool
    has_target_variable: bool
    complexity_score: float

class IntelligentEDAEngine(EDAMethods, SpecializedEDAMethods):
    """Main EDA engine that determines and executes appropriate analysis"""
    
    def __init__(self):
        self.characteristics = None
        self.eda_type = None
        self.analysis_results = {}
        
    def analyze_and_execute_eda(self, df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """Main method: analyze dataset and execute appropriate EDA"""
        
        # Step 1: Analyze dataset characteristics
        self.characteristics = self._analyze_dataset_characteristics(df, target_column)
        
        # Step 2: Determine EDA type based on characteristics
        self.eda_type = self._determine_eda_type(self.characteristics)
        
        # Step 3: Execute appropriate EDA
        if self.eda_type == EDAType.BASIC:
            results = self._execute_basic_eda(df, target_column)
        elif self.eda_type == EDAType.COMPLEX:
            results = self._execute_complex_eda(df, target_column)
        elif self.eda_type == EDAType.TIMESERIES:
            results = self._execute_timeseries_eda(df, target_column)
        elif self.eda_type == EDAType.GEOSPATIAL:
            results = self._execute_geospatial_eda(df, target_column)
        elif self.eda_type == EDAType.TEXTUAL:
            results = self._execute_textual_eda(df, target_column)
        else:
            results = self._execute_basic_eda(df, target_column)
            
        # Step 4: Add metadata and return
        results['eda_metadata'] = {
            'eda_type': self.eda_type.value,
            'characteristics': self.characteristics.__dict__,
            'timestamp': datetime.now().isoformat(),
            'analysis_summary': self._generate_analysis_summary()
        }
        
        return results
    
    def _analyze_dataset_characteristics(self, df: pd.DataFrame, target_column: str = None) -> DatasetCharacteristics:
        """Analyze dataset to determine its characteristics"""
        
        rows, columns = df.shape
        
        # Column type analysis
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        datetime_cols = df.select_dtypes(include=['datetime64']).columns
        
        # Text column detection (high cardinality string columns)
        text_cols = []
        high_cardinality_cols = []
        
        for col in categorical_cols:
            unique_ratio = df[col].nunique() / len(df)
            avg_length = df[col].astype(str).str.len().mean()
            
            if avg_length > 50 or unique_ratio > 0.8:
                text_cols.append(col)
            elif df[col].nunique() > 50:
                high_cardinality_cols.append(col)
        
        # Geospatial column detection
        geospatial_cols = []
        for col in df.columns:
            col_lower = col.lower()
            if any(geo_term in col_lower for geo_term in 
                   ['lat', 'lon', 'lng', 'latitude', 'longitude', 'coord', 'geo']):
                geospatial_cols.append(col)
        
        # Time series detection
        is_time_series = len(datetime_cols) > 0 or any(
            'time' in col.lower() or 'date' in col.lower() 
            for col in df.columns
        )
        
        # High dimensional check
        is_high_dimensional = columns > 20 or len(numeric_cols) > 15
        
        # Missing and duplicate analysis
        missing_percentage = (df.isnull().sum().sum() / (rows * columns)) * 100
        duplicate_percentage = (df.duplicated().sum() / rows) * 100
        
        # Target variable and imbalance check
        has_target_variable = target_column is not None and target_column in df.columns
        is_imbalanced = False
        
        if has_target_variable and df[target_column].dtype in ['object', 'category', 'bool']:
            value_counts = df[target_column].value_counts(normalize=True)
            if len(value_counts) > 1:
                is_imbalanced = value_counts.iloc[0] > 0.8 or value_counts.iloc[-1] < 0.1
        
        # Complexity score calculation
        complexity_score = self._calculate_complexity_score(
            rows, columns, len(numeric_cols), len(categorical_cols), 
            len(text_cols), len(high_cardinality_cols), is_time_series, 
            len(geospatial_cols), missing_percentage
        )
        
        return DatasetCharacteristics(
            rows=rows,
            columns=columns,
            numeric_columns=len(numeric_cols),
            categorical_columns=len(categorical_cols),
            text_columns=len(text_cols),
            datetime_columns=len(datetime_cols),
            geospatial_columns=len(geospatial_cols),
            high_cardinality_columns=len(high_cardinality_cols),
            missing_percentage=missing_percentage,
            duplicate_percentage=duplicate_percentage,
            is_time_series=is_time_series,
            is_high_dimensional=is_high_dimensional,
            is_imbalanced=is_imbalanced,
            has_target_variable=has_target_variable,
            complexity_score=complexity_score
        )
    
    def _calculate_complexity_score(self, rows: int, columns: int, numeric_cols: int, 
                                  categorical_cols: int, text_cols: int, 
                                  high_cardinality_cols: int, is_time_series: bool, 
                                  geospatial_cols: int, missing_percentage: float) -> float:
        """Calculate dataset complexity score (0-100)"""
        
        score = 0
        
        # Size complexity
        if rows > 10000:
            score += 15
        elif rows > 1000:
            score += 10
        else:
            score += 5
            
        if columns > 50:
            score += 20
        elif columns > 20:
            score += 15
        elif columns > 10:
            score += 10
        else:
            score += 5
        
        # Feature type complexity
        score += min(numeric_cols * 2, 20)
        score += min(categorical_cols * 1.5, 15)
        score += min(text_cols * 3, 15)
        score += min(high_cardinality_cols * 2, 10)
        
        # Special data type complexity
        if is_time_series:
            score += 10
        if geospatial_cols > 0:
            score += 10
        
        # Data quality complexity
        if missing_percentage > 20:
            score += 10
        elif missing_percentage > 10:
            score += 5
        
        return min(score, 100)
    
    def _determine_eda_type(self, characteristics: DatasetCharacteristics) -> EDAType:
        """Determine appropriate EDA type based on dataset characteristics"""
        
        # Priority-based decision tree
        
        # 1. Geospatial data
        if characteristics.geospatial_columns >= 2:
            return EDAType.GEOSPATIAL
        
        # 2. Text-heavy data
        if characteristics.text_columns >= 2 or characteristics.text_columns / characteristics.columns > 0.3:
            return EDAType.TEXTUAL
        
        # 3. Time series data
        if characteristics.is_time_series and characteristics.datetime_columns > 0:
            return EDAType.TIMESERIES
        
        # 4. Complex EDA conditions
        complex_conditions = [
            characteristics.is_high_dimensional,
            characteristics.complexity_score > 60,
            characteristics.high_cardinality_columns > 3,
            characteristics.is_imbalanced and characteristics.has_target_variable,
            characteristics.missing_percentage > 15,
            characteristics.columns > 15
        ]
        
        if sum(complex_conditions) >= 2:
            return EDAType.COMPLEX
        
        # 5. Default to Basic EDA
        return EDAType.BASIC
    
    def _execute_basic_eda(self, df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """Execute Basic EDA: Quick overview and sanity checks"""
        
        results = {
            'eda_type': 'basic',
            'summary_statistics': self._basic_summary_stats(df),
            'data_quality': self._basic_data_quality(df),
            'distributions': self._basic_distributions(df),
            'correlations': self._basic_correlations(df),
            'visualizations': self._basic_visualizations(df),
            'insights': self._basic_insights(df, target_column)
        }
        
        return results
    
    def _execute_complex_eda(self, df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """Execute Complex EDA: Advanced multivariate analysis"""
        
        # Start with basic EDA
        results = self._execute_basic_eda(df, target_column)
        
        # Add complex analysis
        results.update({
            'eda_type': 'complex',
            'multivariate_analysis': self._multivariate_analysis(df, target_column),
            'dimensionality_reduction': self._dimensionality_reduction(df),
            'feature_importance': self._feature_importance_analysis(df, target_column),
            'statistical_tests': self._statistical_tests(df, target_column),
            'clustering_analysis': self._clustering_analysis(df),
            'advanced_correlations': self._advanced_correlation_analysis(df),
            'outlier_analysis': self._advanced_outlier_analysis(df),
            'feature_interactions': self._feature_interaction_analysis(df, target_column)
        })
        
        return results
    
    def _execute_timeseries_eda(self, df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """Execute Time Series EDA"""
        
        results = self._execute_basic_eda(df, target_column)
        
        # Add time series specific analysis
        results.update({
            'eda_type': 'timeseries',
            'temporal_patterns': self._temporal_pattern_analysis(df),
            'seasonality_analysis': self._seasonality_analysis(df),
            'trend_analysis': self._trend_analysis(df),
            'time_series_decomposition': self._time_series_decomposition(df),
            'autocorrelation': self._autocorrelation_analysis(df)
        })
        
        return results
    
    def _execute_geospatial_eda(self, df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """Execute Geospatial EDA"""
        
        results = self._execute_basic_eda(df, target_column)
        
        # Add geospatial specific analysis
        results.update({
            'eda_type': 'geospatial',
            'spatial_distribution': self._spatial_distribution_analysis(df),
            'geographic_patterns': self._geographic_pattern_analysis(df),
            'spatial_clustering': self._spatial_clustering_analysis(df),
            'coordinate_validation': self._coordinate_validation(df)
        })
        
        return results
    
    def _execute_textual_eda(self, df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """Execute Textual EDA"""
        
        results = self._execute_basic_eda(df, target_column)
        
        # Add text specific analysis
        results.update({
            'eda_type': 'textual',
            'text_statistics': self._text_statistics_analysis(df),
            'text_patterns': self._text_pattern_analysis(df),
            'vocabulary_analysis': self._vocabulary_analysis(df),
            'text_quality': self._text_quality_analysis(df)
        })
        
        return results
    
    def _generate_analysis_summary(self) -> Dict[str, Any]:
        """Generate a summary of the analysis performed"""
        
        return {
            'recommended_eda_type': self.eda_type.value,
            'complexity_score': self.characteristics.complexity_score,
            'key_characteristics': self._get_key_characteristics(),
            'analysis_recommendations': self._get_analysis_recommendations()
        }
    
    def _get_key_characteristics(self) -> List[str]:
        """Get key characteristics that influenced EDA type selection"""
        
        characteristics = []
        
        if self.characteristics.is_high_dimensional:
            characteristics.append(f"High-dimensional data ({self.characteristics.columns} features)")
        
        if self.characteristics.is_time_series:
            characteristics.append("Time series data detected")
        
        if self.characteristics.geospatial_columns > 0:
            characteristics.append(f"Geospatial data ({self.characteristics.geospatial_columns} geo columns)")
        
        if self.characteristics.text_columns > 0:
            characteristics.append(f"Text data ({self.characteristics.text_columns} text columns)")
        
        if self.characteristics.missing_percentage > 15:
            characteristics.append(f"High missing data ({self.characteristics.missing_percentage:.1f}%)")
        
        if self.characteristics.is_imbalanced:
            characteristics.append("Imbalanced target variable")
        
        return characteristics
    
    def _get_analysis_recommendations(self) -> List[str]:
        """Get analysis recommendations based on EDA type"""
        
        recommendations = []
        
        if self.eda_type == EDAType.BASIC:
            recommendations.extend([
                "Focus on data quality checks and basic relationships",
                "Examine distributions and simple correlations",
                "Identify obvious patterns and outliers"
            ])
        
        elif self.eda_type == EDAType.COMPLEX:
            recommendations.extend([
                "Perform dimensionality reduction to understand feature relationships",
                "Analyze multivariate interactions and feature importance",
                "Consider advanced statistical tests and clustering"
            ])
        
        elif self.eda_type == EDAType.TIMESERIES:
            recommendations.extend([
                "Analyze temporal patterns and trends",
                "Check for seasonality and cyclical behavior",
                "Examine autocorrelation and time dependencies"
            ])
        
        elif self.eda_type == EDAType.GEOSPATIAL:
            recommendations.extend([
                "Visualize spatial distribution patterns",
                "Analyze geographic clustering and hotspots",
                "Validate coordinate data quality"
            ])
        
        elif self.eda_type == EDAType.TEXTUAL:
            recommendations.extend([
                "Analyze text length and vocabulary diversity",
                "Examine common patterns and themes",
                "Check text quality and preprocessing needs"
            ])
        
        return recommendations


# Integration function for main application
def intelligent_eda_analysis(data: Union[str, List[Dict[str, Any]], pd.DataFrame], 
                           target_column: str = None) -> Dict[str, Any]:
    """
    Main function to perform intelligent EDA analysis
    """
    # Convert data to DataFrame
    if isinstance(data, str):
        import io
        df = pd.read_csv(io.StringIO(data))
    elif isinstance(data, list):
        df = pd.DataFrame(data)
    elif isinstance(data, pd.DataFrame):
        df = data
    else:
        raise ValueError(f"Unsupported data type: {type(data)}")
    
    # Initialize and run EDA engine
    eda_engine = IntelligentEDAEngine()
    results = eda_engine.analyze_and_execute_eda(df, target_column)
    
    return results 