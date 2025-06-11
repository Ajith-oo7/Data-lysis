"""
EDA Analysis Methods Implementation
Contains all the specific analysis methods for different EDA types
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from scipy import stats
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import mutual_info_regression, mutual_info_classif
from sklearn.cluster import KMeans
import re
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

class EDAMethods:
    """Collection of EDA analysis methods"""
    
    # =============================================================================
    # BASIC EDA METHODS
    # =============================================================================
    
    def _basic_summary_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Basic summary statistics"""
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        
        summary = {
            'dataset_shape': {'rows': len(df), 'columns': len(df.columns)},
            'column_types': {
                'numeric': len(numeric_cols),
                'categorical': len(categorical_cols),
                'datetime': len(df.select_dtypes(include=['datetime64']).columns)
            },
            'numeric_summary': {},
            'categorical_summary': {}
        }
        
        # Numeric columns summary
        if len(numeric_cols) > 0:
            numeric_stats = df[numeric_cols].describe()
            summary['numeric_summary'] = {
                col: {
                    'count': int(numeric_stats.loc['count', col]),
                    'mean': float(numeric_stats.loc['mean', col]),
                    'std': float(numeric_stats.loc['std', col]),
                    'min': float(numeric_stats.loc['min', col]),
                    'max': float(numeric_stats.loc['max', col]),
                    'q25': float(numeric_stats.loc['25%', col]),
                    'q50': float(numeric_stats.loc['50%', col]),
                    'q75': float(numeric_stats.loc['75%', col])
                }
                for col in numeric_cols
            }
        
        # Categorical columns summary
        if len(categorical_cols) > 0:
            for col in categorical_cols:
                value_counts = df[col].value_counts()
                summary['categorical_summary'][col] = {
                    'unique_values': int(df[col].nunique()),
                    'most_frequent': str(value_counts.index[0]) if len(value_counts) > 0 else None,
                    'most_frequent_count': int(value_counts.iloc[0]) if len(value_counts) > 0 else 0,
                    'top_5_values': value_counts.head(5).to_dict()
                }
        
        return summary
    
    def _basic_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Basic data quality assessment"""
        
        total_cells = len(df) * len(df.columns)
        missing_cells = df.isnull().sum().sum()
        
        quality = {
            'missing_data': {
                'total_missing_cells': int(missing_cells),
                'missing_percentage': float((missing_cells / total_cells) * 100),
                'columns_with_missing': df.isnull().sum()[df.isnull().sum() > 0].to_dict(),
                'rows_with_missing': int(df.isnull().any(axis=1).sum())
            },
            'duplicates': {
                'duplicate_rows': int(df.duplicated().sum()),
                'duplicate_percentage': float((df.duplicated().sum() / len(df)) * 100)
            },
            'data_types': df.dtypes.astype(str).to_dict(),
            'memory_usage': {
                'total_memory_mb': float(df.memory_usage(deep=True).sum() / 1024 / 1024),
                'memory_per_column': df.memory_usage(deep=True).to_dict()
            }
        }
        
        return quality
    
    def _basic_distributions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Basic distribution analysis"""
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        distributions = {}
        
        for col in numeric_cols:
            if df[col].dropna().empty:
                continue
                
            data = df[col].dropna()
            
            # Basic distribution statistics
            skewness = float(data.skew())
            kurtosis = float(data.kurtosis())
            
            # Normality test (if sample size is reasonable)
            normality_test = None
            if 3 <= len(data) <= 5000:
                try:
                    statistic, p_value = stats.shapiro(data)
                    normality_test = {
                        'test': 'shapiro_wilk',
                        'statistic': float(statistic),
                        'p_value': float(p_value),
                        'is_normal': p_value > 0.05
                    }
                except:
                    pass
            
            distributions[col] = {
                'skewness': skewness,
                'kurtosis': kurtosis,
                'normality_test': normality_test,
                'distribution_type': self._classify_distribution(skewness, kurtosis)
            }
        
        return distributions
    
    def _basic_correlations(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Basic correlation analysis"""
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) < 2:
            return {'message': 'Insufficient numeric columns for correlation analysis'}
        
        # Correlation matrix
        corr_matrix = df[numeric_cols].corr()
        
        # Find strong correlations (|r| > 0.7)
        strong_correlations = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:
                    strong_correlations.append({
                        'variable1': corr_matrix.columns[i],
                        'variable2': corr_matrix.columns[j],
                        'correlation': float(corr_value),
                        'strength': 'strong positive' if corr_value > 0.7 else 'strong negative'
                    })
        
        return {
            'correlation_matrix': corr_matrix.round(3).to_dict(),
            'strong_correlations': strong_correlations,
            'average_correlation': float(corr_matrix.abs().mean().mean())
        }
    
    def _basic_visualizations(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Generate basic visualization suggestions"""
        
        visualizations = []
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        
        # Histogram for numeric distributions
        for col in numeric_cols[:3]:  # Limit to first 3
            visualizations.append({
                'type': 'histogram',
                'title': f'Distribution of {col}',
                'data': self._prepare_histogram_data(df[col]),
                'description': f'Shows the frequency distribution of {col}'
            })
        
        # Bar chart for categorical data
        for col in categorical_cols[:2]:  # Limit to first 2
            value_counts = df[col].value_counts().head(10)
            visualizations.append({
                'type': 'bar',
                'title': f'Top Values in {col}',
                'data': {
                    'categories': value_counts.index.tolist(),
                    'values': value_counts.values.tolist()
                },
                'description': f'Shows the most frequent values in {col}'
            })
        
        # Correlation heatmap if enough numeric columns
        if len(numeric_cols) >= 3:
            corr_matrix = df[numeric_cols].corr()
            visualizations.append({
                'type': 'heatmap',
                'title': 'Correlation Matrix',
                'data': {
                    'matrix': corr_matrix.round(3).values.tolist(),
                    'labels': corr_matrix.columns.tolist()
                },
                'description': 'Shows correlations between numeric variables'
            })
        
        return visualizations
    
    def _basic_insights(self, df: pd.DataFrame, target_column: str = None) -> List[Dict[str, str]]:
        """Generate basic insights"""
        
        insights = []
        
        # Dataset overview
        insights.append({
            'type': 'overview',
            'title': 'Dataset Overview',
            'description': f'Dataset contains {len(df)} rows and {len(df.columns)} columns',
            'recommendation': 'Start with data quality checks and basic visualizations'
        })
        
        # Missing data insight
        missing_pct = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        if missing_pct > 5:
            insights.append({
                'type': 'data_quality',
                'title': 'Missing Data Detected',
                'description': f'{missing_pct:.1f}% of data points are missing',
                'recommendation': 'Consider imputation strategies or removal of sparse columns'
            })
        
        # High correlation insight
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) >= 2:
            corr_matrix = df[numeric_cols].corr()
            max_corr = corr_matrix.abs().unstack().sort_values(ascending=False)
            max_corr = max_corr[max_corr < 1.0].iloc[0] if len(max_corr) > len(numeric_cols) else 0
            
            if max_corr > 0.8:
                insights.append({
                    'type': 'correlation',
                    'title': 'High Correlation Detected',
                    'description': f'Maximum correlation between variables is {max_corr:.2f}',
                    'recommendation': 'Consider feature selection to remove redundant variables'
                })
        
        return insights
    
    # =============================================================================
    # COMPLEX EDA METHODS
    # =============================================================================
    
    def _multivariate_analysis(self, df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """Advanced multivariate analysis"""
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) < 3:
            return {'message': 'Insufficient numeric variables for multivariate analysis'}
        
        # Partial correlations
        partial_corr = self._calculate_partial_correlations(df[numeric_cols])
        
        # Multicollinearity check (VIF)
        vif_scores = self._calculate_vif(df[numeric_cols])
        
        # Target variable analysis if provided
        target_analysis = None
        if target_column and target_column in df.columns:
            target_analysis = self._analyze_target_relationships(df, target_column)
        
        return {
            'partial_correlations': partial_corr,
            'multicollinearity': vif_scores,
            'target_analysis': target_analysis
        }
    
    def _dimensionality_reduction(self, df: pd.DataFrame) -> Dict[str, Any]:
        """PCA and dimensionality reduction analysis"""
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) < 3:
            return {'message': 'Insufficient numeric variables for PCA'}
        
        # Prepare data
        X = df[numeric_cols].dropna()
        if len(X) == 0:
            return {'message': 'No valid data for PCA after removing missing values'}
        
        # Standardize data
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Perform PCA
        pca = PCA()
        X_pca = pca.fit_transform(X_scaled)
        
        # Calculate cumulative explained variance
        cumvar = np.cumsum(pca.explained_variance_ratio_)
        n_components_95 = np.argmax(cumvar >= 0.95) + 1
        n_components_90 = np.argmax(cumvar >= 0.90) + 1
        
        return {
            'explained_variance_ratio': pca.explained_variance_ratio_.tolist(),
            'cumulative_variance': cumvar.tolist(),
            'components_for_95_variance': int(n_components_95),
            'components_for_90_variance': int(n_components_90),
            'total_components': len(numeric_cols),
            'principal_components': pca.components_[:5].tolist() if len(pca.components_) >= 5 else pca.components_.tolist()
        }
    
    def _feature_importance_analysis(self, df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """Feature importance analysis"""
        
        if not target_column or target_column not in df.columns:
            return {'message': 'Target column required for feature importance analysis'}
        
        # Prepare features
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        feature_cols = [col for col in numeric_cols if col != target_column]
        
        if len(feature_cols) < 2:
            return {'message': 'Insufficient features for importance analysis'}
        
        # Remove rows with missing values
        analysis_df = df[feature_cols + [target_column]].dropna()
        
        if len(analysis_df) < 10:
            return {'message': 'Insufficient data after removing missing values'}
        
        X = analysis_df[feature_cols]
        y = analysis_df[target_column]
        
        # Determine if regression or classification
        is_regression = pd.api.types.is_numeric_dtype(y)
        
        try:
            if is_regression:
                importance_scores = mutual_info_regression(X, y)
            else:
                importance_scores = mutual_info_classif(X, y)
            
            # Create feature importance ranking
            feature_importance = [
                {'feature': feature_cols[i], 'importance': float(importance_scores[i])}
                for i in range(len(feature_cols))
            ]
            feature_importance.sort(key=lambda x: x['importance'], reverse=True)
            
            return {
                'feature_importance': feature_importance,
                'analysis_type': 'regression' if is_regression else 'classification',
                'top_features': feature_importance[:5]
            }
            
        except Exception as e:
            return {'message': f'Error in feature importance analysis: {str(e)}'}
    
    def _statistical_tests(self, df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """Perform statistical tests"""
        
        tests = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        
        # Normality tests for numeric columns
        normality_tests = {}
        for col in numeric_cols:
            data = df[col].dropna()
            if len(data) >= 3 and len(data) <= 5000:
                try:
                    stat, p_value = stats.shapiro(data)
                    normality_tests[col] = {
                        'statistic': float(stat),
                        'p_value': float(p_value),
                        'is_normal': p_value > 0.05
                    }
                except:
                    normality_tests[col] = {'error': 'Test failed'}
        
        tests['normality_tests'] = normality_tests
        
        # Chi-square tests for categorical variables
        if len(categorical_cols) >= 2:
            chi_square_tests = {}
            for i, col1 in enumerate(categorical_cols[:3]):
                for col2 in categorical_cols[i+1:4]:
                    try:
                        contingency = pd.crosstab(df[col1], df[col2])
                        chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
                        chi_square_tests[f'{col1}_vs_{col2}'] = {
                            'chi2_statistic': float(chi2),
                            'p_value': float(p_value),
                            'degrees_of_freedom': int(dof),
                            'is_independent': p_value > 0.05
                        }
                    except:
                        chi_square_tests[f'{col1}_vs_{col2}'] = {'error': 'Test failed'}
            
            tests['chi_square_tests'] = chi_square_tests
        
        return tests
    
    def _clustering_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """K-means clustering analysis"""
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) < 2:
            return {'message': 'Insufficient numeric variables for clustering'}
        
        # Prepare data
        X = df[numeric_cols].dropna()
        if len(X) < 10:
            return {'message': 'Insufficient data for clustering'}
        
        # Standardize data
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Try different numbers of clusters
        inertias = []
        silhouette_scores = []
        k_range = range(2, min(11, len(X)//2))
        
        for k in k_range:
            try:
                kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                cluster_labels = kmeans.fit_predict(X_scaled)
                inertias.append(kmeans.inertia_)
                
                # Calculate silhouette score
                from sklearn.metrics import silhouette_score
                sil_score = silhouette_score(X_scaled, cluster_labels)
                silhouette_scores.append(sil_score)
            except:
                break
        
        # Find optimal k using elbow method
        optimal_k = self._find_elbow_point(list(k_range), inertias)
        
        return {
            'k_values': list(k_range),
            'inertias': inertias,
            'silhouette_scores': silhouette_scores,
            'optimal_k': optimal_k,
            'recommendation': f'Optimal number of clusters appears to be {optimal_k}'
        }
    
    # =============================================================================
    # HELPER METHODS
    # =============================================================================
    
    def _classify_distribution(self, skewness: float, kurtosis: float) -> str:
        """Classify distribution type based on skewness and kurtosis"""
        
        if abs(skewness) < 0.5 and abs(kurtosis) < 0.5:
            return 'normal'
        elif skewness > 1:
            return 'right_skewed'
        elif skewness < -1:
            return 'left_skewed'
        elif kurtosis > 1:
            return 'heavy_tailed'
        elif kurtosis < -1:
            return 'light_tailed'
        else:
            return 'moderately_skewed'
    
    def _prepare_histogram_data(self, series: pd.Series, bins: int = 10) -> Dict[str, Any]:
        """Prepare histogram data for visualization"""
        
        data = series.dropna()
        if len(data) == 0:
            return {'bins': [], 'counts': []}
        
        counts, bin_edges = np.histogram(data, bins=bins)
        
        return {
            'bins': [f'{bin_edges[i]:.2f}-{bin_edges[i+1]:.2f}' for i in range(len(bin_edges)-1)],
            'counts': counts.tolist()
        }
    
    def _calculate_partial_correlations(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate partial correlations"""
        
        # This is a simplified version - full partial correlation requires more complex matrix operations
        corr_matrix = df.corr()
        
        # For now, return regular correlations with a note
        return {
            'note': 'Simplified correlation analysis - partial correlations require advanced implementation',
            'correlation_matrix': corr_matrix.round(3).to_dict()
        }
    
    def _calculate_vif(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate Variance Inflation Factor"""
        
        # Simplified VIF calculation
        vif_data = {}
        
        for i, col in enumerate(df.columns):
            # Use correlation with other variables as a proxy for VIF
            other_cols = [c for c in df.columns if c != col]
            if len(other_cols) > 0:
                corr_with_others = df[col].corr(df[other_cols].mean(axis=1))
                vif_data[col] = float(1 / (1 - corr_with_others**2)) if abs(corr_with_others) < 0.99 else 999
        
        return vif_data
    
    def _analyze_target_relationships(self, df: pd.DataFrame, target_column: str) -> Dict[str, Any]:
        """Analyze relationships with target variable"""
        
        target_data = df[target_column].dropna()
        is_numeric_target = pd.api.types.is_numeric_dtype(target_data)
        
        analysis = {
            'target_type': 'numeric' if is_numeric_target else 'categorical',
            'target_summary': {}
        }
        
        if is_numeric_target:
            analysis['target_summary'] = {
                'mean': float(target_data.mean()),
                'std': float(target_data.std()),
                'min': float(target_data.min()),
                'max': float(target_data.max())
            }
        else:
            value_counts = target_data.value_counts()
            analysis['target_summary'] = {
                'unique_values': len(value_counts),
                'most_common': str(value_counts.index[0]),
                'distribution': value_counts.to_dict()
            }
        
        return analysis
    
    def _find_elbow_point(self, k_values: List[int], inertias: List[float]) -> int:
        """Find elbow point for optimal k in clustering"""
        
        if len(inertias) < 3:
            return k_values[0] if k_values else 2
        
        # Simple method: find the point with maximum rate of change decrease
        diffs = [inertias[i] - inertias[i+1] for i in range(len(inertias)-1)]
        second_diffs = [diffs[i] - diffs[i+1] for i in range(len(diffs)-1)]
        
        if second_diffs:
            max_second_diff_idx = second_diffs.index(max(second_diffs))
            return k_values[max_second_diff_idx + 1]
        
        return k_values[1] if len(k_values) > 1 else k_values[0] 