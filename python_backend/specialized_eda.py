"""
Specialized EDA Methods for Time Series, Geospatial, and Textual Data
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import re
from collections import Counter
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class SpecializedEDAMethods:
    """Specialized EDA methods for different data types"""
    
    # =============================================================================
    # TIME SERIES EDA METHODS
    # =============================================================================
    
    def _temporal_pattern_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze temporal patterns in time series data"""
        
        datetime_cols = df.select_dtypes(include=['datetime64']).columns
        if len(datetime_cols) == 0:
            # Try to find date-like columns
            datetime_cols = [col for col in df.columns if 
                           any(kw in col.lower() for kw in ['date', 'time', 'year', 'month'])]
        
        if len(datetime_cols) == 0:
            return {'message': 'No datetime columns found for temporal analysis'}
        
        patterns = {}
        
        for col in datetime_cols[:2]:  # Analyze first 2 datetime columns
            try:
                # Convert to datetime if not already
                if not pd.api.types.is_datetime64_any_dtype(df[col]):
                    date_series = pd.to_datetime(df[col], errors='coerce')
                else:
                    date_series = df[col]
                
                # Remove null dates
                date_series = date_series.dropna()
                
                if len(date_series) == 0:
                    continue
                
                # Extract temporal components
                patterns[col] = {
                    'date_range': {
                        'start': date_series.min().isoformat(),
                        'end': date_series.max().isoformat(),
                        'span_days': (date_series.max() - date_series.min()).days
                    },
                    'temporal_distribution': {
                        'by_year': date_series.dt.year.value_counts().to_dict(),
                        'by_month': date_series.dt.month.value_counts().to_dict(),
                        'by_day_of_week': date_series.dt.dayofweek.value_counts().to_dict(),
                        'by_hour': date_series.dt.hour.value_counts().to_dict() if date_series.dt.hour.sum() > 0 else {}
                    },
                    'frequency_analysis': self._analyze_time_frequency(date_series)
                }
                
            except Exception as e:
                patterns[col] = {'error': f'Failed to analyze: {str(e)}'}
        
        return patterns
    
    def _seasonality_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze seasonal patterns"""
        
        datetime_cols = df.select_dtypes(include=['datetime64']).columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(datetime_cols) == 0 or len(numeric_cols) == 0:
            return {'message': 'Need both datetime and numeric columns for seasonality analysis'}
        
        seasonality = {}
        
        for date_col in datetime_cols[:1]:  # Analyze primary date column
            for num_col in numeric_cols[:3]:  # Analyze first 3 numeric columns
                try:
                    # Create time series
                    ts_data = df[[date_col, num_col]].dropna()
                    ts_data = ts_data.set_index(date_col).sort_index()
                    
                    if len(ts_data) < 12:  # Need enough data for seasonality
                        continue
                    
                    # Analyze monthly and weekly patterns
                    monthly_pattern = ts_data.groupby(ts_data.index.month)[num_col].mean()
                    weekly_pattern = ts_data.groupby(ts_data.index.dayofweek)[num_col].mean()
                    
                    seasonality[f'{date_col}_{num_col}'] = {
                        'monthly_averages': monthly_pattern.to_dict(),
                        'weekly_averages': weekly_pattern.to_dict(),
                        'seasonal_variance': {
                            'monthly_cv': float(monthly_pattern.std() / monthly_pattern.mean()) if monthly_pattern.mean() != 0 else 0,
                            'weekly_cv': float(weekly_pattern.std() / weekly_pattern.mean()) if weekly_pattern.mean() != 0 else 0
                        }
                    }
                    
                except Exception as e:
                    seasonality[f'{date_col}_{num_col}'] = {'error': f'Analysis failed: {str(e)}'}
        
        return seasonality
    
    def _trend_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze trends in time series data"""
        
        datetime_cols = df.select_dtypes(include=['datetime64']).columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(datetime_cols) == 0 or len(numeric_cols) == 0:
            return {'message': 'Need both datetime and numeric columns for trend analysis'}
        
        trends = {}
        
        for date_col in datetime_cols[:1]:
            for num_col in numeric_cols[:3]:
                try:
                    # Create time series
                    ts_data = df[[date_col, num_col]].dropna()
                    ts_data = ts_data.set_index(date_col).sort_index()
                    
                    if len(ts_data) < 5:
                        continue
                    
                    # Calculate trend using linear regression
                    x = np.arange(len(ts_data))
                    y = ts_data[num_col].values
                    
                    # Linear trend
                    slope, intercept = np.polyfit(x, y, 1)
                    r_squared = np.corrcoef(x, y)[0, 1] ** 2
                    
                    # Moving averages
                    window_size = min(7, len(ts_data) // 3)
                    if window_size >= 2:
                        moving_avg = ts_data[num_col].rolling(window=window_size).mean()
                        trend_direction = 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable'
                    else:
                        moving_avg = ts_data[num_col]
                        trend_direction = 'insufficient_data'
                    
                    trends[f'{date_col}_{num_col}'] = {
                        'linear_trend': {
                            'slope': float(slope),
                            'intercept': float(intercept),
                            'r_squared': float(r_squared),
                            'direction': trend_direction
                        },
                        'moving_average': moving_avg.dropna().to_dict(),
                        'trend_strength': 'strong' if r_squared > 0.7 else 'moderate' if r_squared > 0.3 else 'weak'
                    }
                    
                except Exception as e:
                    trends[f'{date_col}_{num_col}'] = {'error': f'Trend analysis failed: {str(e)}'}
        
        return trends
    
    def _time_series_decomposition(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Basic time series decomposition"""
        
        datetime_cols = df.select_dtypes(include=['datetime64']).columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(datetime_cols) == 0 or len(numeric_cols) == 0:
            return {'message': 'Need both datetime and numeric columns for decomposition'}
        
        decomposition = {}
        
        for date_col in datetime_cols[:1]:
            for num_col in numeric_cols[:2]:
                try:
                    # Create time series
                    ts_data = df[[date_col, num_col]].dropna()
                    ts_data = ts_data.set_index(date_col).sort_index()
                    
                    if len(ts_data) < 24:  # Need enough data for decomposition
                        continue
                    
                    # Simple decomposition (trend + seasonal + residual)
                    # Calculate trend using moving average
                    window_size = min(12, len(ts_data) // 4)
                    trend = ts_data[num_col].rolling(window=window_size, center=True).mean()
                    
                    # Remove trend to get detrended series
                    detrended = ts_data[num_col] - trend
                    
                    # Estimate seasonal component (simplified)
                    if len(ts_data) >= 12:
                        seasonal_period = 12  # Assume monthly seasonality
                        seasonal = detrended.groupby(detrended.index.month).transform('mean')
                    else:
                        seasonal = pd.Series(0, index=detrended.index)
                    
                    # Residual
                    residual = detrended - seasonal
                    
                    decomposition[f'{date_col}_{num_col}'] = {
                        'trend_component': trend.dropna().to_dict(),
                        'seasonal_component': seasonal.dropna().to_dict(),
                        'residual_component': residual.dropna().to_dict(),
                        'decomposition_quality': {
                            'trend_variance_explained': float(1 - (trend.var() / ts_data[num_col].var())) if ts_data[num_col].var() != 0 else 0,
                            'seasonal_strength': float(seasonal.var() / ts_data[num_col].var()) if ts_data[num_col].var() != 0 else 0
                        }
                    }
                    
                except Exception as e:
                    decomposition[f'{date_col}_{num_col}'] = {'error': f'Decomposition failed: {str(e)}'}
        
        return decomposition
    
    def _autocorrelation_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze autocorrelation patterns"""
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        autocorr = {}
        
        for col in numeric_cols[:3]:
            try:
                data = df[col].dropna()
                if len(data) < 10:
                    continue
                
                # Calculate autocorrelation for different lags
                max_lags = min(20, len(data) // 4)
                autocorr_values = []
                
                for lag in range(1, max_lags + 1):
                    if len(data) > lag:
                        corr = data.autocorr(lag=lag)
                        autocorr_values.append({'lag': lag, 'autocorrelation': float(corr) if not pd.isna(corr) else 0})
                
                # Find significant autocorrelations
                significant_lags = [item for item in autocorr_values if abs(item['autocorrelation']) > 0.3]
                
                autocorr[col] = {
                    'autocorrelation_values': autocorr_values,
                    'significant_lags': significant_lags,
                    'max_autocorr': max(autocorr_values, key=lambda x: abs(x['autocorrelation'])) if autocorr_values else None
                }
                
            except Exception as e:
                autocorr[col] = {'error': f'Autocorrelation analysis failed: {str(e)}'}
        
        return autocorr
    
    # =============================================================================
    # GEOSPATIAL EDA METHODS
    # =============================================================================
    
    def _spatial_distribution_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze spatial distribution of geographic data"""
        
        # Find potential geographic columns
        geo_cols = self._identify_geo_columns(df)
        
        if len(geo_cols) < 2:
            return {'message': 'Insufficient geographic columns for spatial analysis'}
        
        spatial_analysis = {}
        
        # Analyze coordinate pairs
        for i in range(0, len(geo_cols), 2):
            if i + 1 < len(geo_cols):
                lat_col = geo_cols[i]
                lon_col = geo_cols[i + 1]
                
                try:
                    # Extract valid coordinates
                    coords_df = df[[lat_col, lon_col]].dropna()
                    coords_df = coords_df[
                        (coords_df[lat_col].between(-90, 90)) & 
                        (coords_df[lon_col].between(-180, 180))
                    ]
                    
                    if len(coords_df) == 0:
                        continue
                    
                    spatial_analysis[f'{lat_col}_{lon_col}'] = {
                        'coordinate_summary': {
                            'valid_coordinates': len(coords_df),
                            'latitude_range': {
                                'min': float(coords_df[lat_col].min()),
                                'max': float(coords_df[lat_col].max()),
                                'center': float(coords_df[lat_col].mean())
                            },
                            'longitude_range': {
                                'min': float(coords_df[lon_col].min()),
                                'max': float(coords_df[lon_col].max()),
                                'center': float(coords_df[lon_col].mean())
                            }
                        },
                        'spatial_extent': self._calculate_spatial_extent(coords_df[lat_col], coords_df[lon_col]),
                        'density_analysis': self._analyze_point_density(coords_df[lat_col], coords_df[lon_col])
                    }
                    
                except Exception as e:
                    spatial_analysis[f'{lat_col}_{lon_col}'] = {'error': f'Spatial analysis failed: {str(e)}'}
        
        return spatial_analysis
    
    def _geographic_pattern_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze geographic patterns and clusters"""
        
        geo_cols = self._identify_geo_columns(df)
        
        if len(geo_cols) < 2:
            return {'message': 'Insufficient geographic columns for pattern analysis'}
        
        patterns = {}
        
        for i in range(0, len(geo_cols), 2):
            if i + 1 < len(geo_cols):
                lat_col = geo_cols[i]
                lon_col = geo_cols[i + 1]
                
                try:
                    coords_df = df[[lat_col, lon_col]].dropna()
                    coords_df = coords_df[
                        (coords_df[lat_col].between(-90, 90)) & 
                        (coords_df[lon_col].between(-180, 180))
                    ]
                    
                    if len(coords_df) < 5:
                        continue
                    
                    # Grid-based analysis
                    grid_analysis = self._grid_based_analysis(coords_df[lat_col], coords_df[lon_col])
                    
                    # Distance analysis
                    distance_analysis = self._distance_analysis(coords_df[lat_col], coords_df[lon_col])
                    
                    patterns[f'{lat_col}_{lon_col}'] = {
                        'grid_analysis': grid_analysis,
                        'distance_analysis': distance_analysis,
                        'geographic_center': {
                            'latitude': float(coords_df[lat_col].mean()),
                            'longitude': float(coords_df[lon_col].mean())
                        }
                    }
                    
                except Exception as e:
                    patterns[f'{lat_col}_{lon_col}'] = {'error': f'Pattern analysis failed: {str(e)}'}
        
        return patterns
    
    def _spatial_clustering_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze spatial clustering patterns"""
        
        geo_cols = self._identify_geo_columns(df)
        
        if len(geo_cols) < 2:
            return {'message': 'Insufficient geographic columns for clustering analysis'}
        
        clustering = {}
        
        for i in range(0, len(geo_cols), 2):
            if i + 1 < len(geo_cols):
                lat_col = geo_cols[i]
                lon_col = geo_cols[i + 1]
                
                try:
                    coords_df = df[[lat_col, lon_col]].dropna()
                    coords_df = coords_df[
                        (coords_df[lat_col].between(-90, 90)) & 
                        (coords_df[lon_col].between(-180, 180))
                    ]
                    
                    if len(coords_df) < 10:
                        continue
                    
                    # Simple clustering using K-means
                    from sklearn.cluster import KMeans
                    from sklearn.preprocessing import StandardScaler
                    
                    # Prepare coordinates
                    X = coords_df[[lat_col, lon_col]].values
                    scaler = StandardScaler()
                    X_scaled = scaler.fit_transform(X)
                    
                    # Try different numbers of clusters
                    cluster_results = {}
                    for k in range(2, min(8, len(coords_df)//3)):
                        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                        labels = kmeans.fit_predict(X_scaled)
                        
                        # Calculate cluster statistics
                        cluster_stats = []
                        for cluster_id in range(k):
                            cluster_points = coords_df[labels == cluster_id]
                            if len(cluster_points) > 0:
                                cluster_stats.append({
                                    'cluster_id': cluster_id,
                                    'size': len(cluster_points),
                                    'center_lat': float(cluster_points[lat_col].mean()),
                                    'center_lon': float(cluster_points[lon_col].mean()),
                                    'radius_km': self._calculate_cluster_radius(cluster_points[lat_col], cluster_points[lon_col])
                                })
                        
                        cluster_results[f'k_{k}'] = {
                            'inertia': float(kmeans.inertia_),
                            'clusters': cluster_stats
                        }
                    
                    clustering[f'{lat_col}_{lon_col}'] = cluster_results
                    
                except Exception as e:
                    clustering[f'{lat_col}_{lon_col}'] = {'error': f'Clustering analysis failed: {str(e)}'}
        
        return clustering
    
    def _coordinate_validation(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate coordinate data quality"""
        
        geo_cols = self._identify_geo_columns(df)
        validation = {}
        
        for col in geo_cols:
            try:
                data = df[col].dropna()
                
                if 'lat' in col.lower():
                    # Latitude validation
                    valid_range = data.between(-90, 90)
                    validation[col] = {
                        'total_values': len(data),
                        'valid_coordinates': int(valid_range.sum()),
                        'invalid_coordinates': int((~valid_range).sum()),
                        'validity_percentage': float(valid_range.mean() * 100),
                        'coordinate_type': 'latitude',
                        'range_issues': {
                            'below_-90': int((data < -90).sum()),
                            'above_90': int((data > 90).sum())
                        }
                    }
                
                elif any(kw in col.lower() for kw in ['lon', 'lng']):
                    # Longitude validation
                    valid_range = data.between(-180, 180)
                    validation[col] = {
                        'total_values': len(data),
                        'valid_coordinates': int(valid_range.sum()),
                        'invalid_coordinates': int((~valid_range).sum()),
                        'validity_percentage': float(valid_range.mean() * 100),
                        'coordinate_type': 'longitude',
                        'range_issues': {
                            'below_-180': int((data < -180).sum()),
                            'above_180': int((data > 180).sum())
                        }
                    }
                
            except Exception as e:
                validation[col] = {'error': f'Validation failed: {str(e)}'}
        
        return validation
    
    # =============================================================================
    # TEXTUAL EDA METHODS
    # =============================================================================
    
    def _text_statistics_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze basic text statistics"""
        
        text_cols = self._identify_text_columns(df)
        
        if len(text_cols) == 0:
            return {'message': 'No text columns found for analysis'}
        
        text_stats = {}
        
        for col in text_cols:
            try:
                text_data = df[col].dropna().astype(str)
                
                if len(text_data) == 0:
                    continue
                
                # Calculate text metrics
                lengths = text_data.str.len()
                word_counts = text_data.str.split().str.len()
                char_counts = text_data.str.replace(' ', '').str.len()
                
                text_stats[col] = {
                    'text_length_stats': {
                        'mean_length': float(lengths.mean()),
                        'median_length': float(lengths.median()),
                        'min_length': int(lengths.min()),
                        'max_length': int(lengths.max()),
                        'std_length': float(lengths.std())
                    },
                    'word_count_stats': {
                        'mean_words': float(word_counts.mean()),
                        'median_words': float(word_counts.median()),
                        'min_words': int(word_counts.min()),
                        'max_words': int(word_counts.max())
                    },
                    'character_analysis': {
                        'mean_chars': float(char_counts.mean()),
                        'total_unique_chars': len(set(''.join(text_data))),
                        'avg_word_length': float(char_counts.mean() / word_counts.mean()) if word_counts.mean() > 0 else 0
                    },
                    'text_diversity': {
                        'unique_texts': int(text_data.nunique()),
                        'uniqueness_ratio': float(text_data.nunique() / len(text_data))
                    }
                }
                
            except Exception as e:
                text_stats[col] = {'error': f'Text analysis failed: {str(e)}'}
        
        return text_stats
    
    def _text_pattern_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze text patterns and common structures"""
        
        text_cols = self._identify_text_columns(df)
        patterns = {}
        
        for col in text_cols:
            try:
                text_data = df[col].dropna().astype(str)
                
                if len(text_data) == 0:
                    continue
                
                # Common patterns
                patterns[col] = {
                    'email_patterns': int(text_data.str.contains(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', regex=True).sum()),
                    'url_patterns': int(text_data.str.contains(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', regex=True).sum()),
                    'phone_patterns': int(text_data.str.contains(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', regex=True).sum()),
                    'numeric_patterns': int(text_data.str.contains(r'\d+', regex=True).sum()),
                    'uppercase_ratio': float(text_data.str.isupper().mean()),
                    'lowercase_ratio': float(text_data.str.islower().mean()),
                    'mixed_case_ratio': float((~text_data.str.isupper() & ~text_data.str.islower()).mean()),
                    'punctuation_analysis': self._analyze_punctuation(text_data),
                    'common_prefixes': self._find_common_prefixes(text_data),
                    'common_suffixes': self._find_common_suffixes(text_data)
                }
                
            except Exception as e:
                patterns[col] = {'error': f'Pattern analysis failed: {str(e)}'}
        
        return patterns
    
    def _vocabulary_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze vocabulary and word usage"""
        
        text_cols = self._identify_text_columns(df)
        vocabulary = {}
        
        for col in text_cols:
            try:
                text_data = df[col].dropna().astype(str)
                
                if len(text_data) == 0:
                    continue
                
                # Combine all text and analyze vocabulary
                all_text = ' '.join(text_data.str.lower())
                words = re.findall(r'\b\w+\b', all_text)
                
                if len(words) == 0:
                    continue
                
                word_freq = Counter(words)
                
                vocabulary[col] = {
                    'total_words': len(words),
                    'unique_words': len(word_freq),
                    'vocabulary_richness': float(len(word_freq) / len(words)),
                    'most_common_words': word_freq.most_common(20),
                    'word_length_distribution': self._analyze_word_lengths(words),
                    'language_indicators': self._detect_language_indicators(words)
                }
                
            except Exception as e:
                vocabulary[col] = {'error': f'Vocabulary analysis failed: {str(e)}'}
        
        return vocabulary
    
    def _text_quality_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze text quality and potential issues"""
        
        text_cols = self._identify_text_columns(df)
        quality = {}
        
        for col in text_cols:
            try:
                text_data = df[col].dropna().astype(str)
                
                if len(text_data) == 0:
                    continue
                
                quality[col] = {
                    'encoding_issues': int(text_data.str.contains(r'[^\x00-\x7F]', regex=True).sum()),
                    'empty_or_whitespace': int(text_data.str.strip().eq('').sum()),
                    'very_short_texts': int((text_data.str.len() < 3).sum()),
                    'very_long_texts': int((text_data.str.len() > 1000).sum()),
                    'repeated_characters': int(text_data.str.contains(r'(.)\1{3,}', regex=True).sum()),
                    'all_caps': int(text_data.str.isupper().sum()),
                    'no_spaces': int((~text_data.str.contains(' ')).sum()),
                    'special_char_heavy': int((text_data.str.count(r'[^a-zA-Z0-9\s]') > text_data.str.len() * 0.3).sum()),
                    'quality_score': self._calculate_text_quality_score(text_data)
                }
                
            except Exception as e:
                quality[col] = {'error': f'Quality analysis failed: {str(e)}'}
        
        return quality
    
    # =============================================================================
    # HELPER METHODS FOR SPECIALIZED EDA
    # =============================================================================
    
    def _analyze_time_frequency(self, date_series: pd.Series) -> Dict[str, Any]:
        """Analyze time frequency patterns"""
        
        if len(date_series) < 2:
            return {'message': 'Insufficient data for frequency analysis'}
        
        # Calculate time differences
        sorted_dates = date_series.sort_values()
        time_diffs = sorted_dates.diff().dropna()
        
        # Most common interval
        mode_interval = time_diffs.mode().iloc[0] if len(time_diffs.mode()) > 0 else None
        
        return {
            'average_interval_days': float(time_diffs.dt.days.mean()),
            'median_interval_days': float(time_diffs.dt.days.median()),
            'most_common_interval_days': float(mode_interval.days) if mode_interval else None,
            'irregular_intervals': int((time_diffs.dt.days == 0).sum()),
            'frequency_assessment': self._assess_frequency_pattern(time_diffs)
        }
    
    def _assess_frequency_pattern(self, time_diffs: pd.Series) -> str:
        """Assess the frequency pattern of time series"""
        
        avg_days = time_diffs.dt.days.mean()
        
        if avg_days < 1:
            return 'sub_daily'
        elif avg_days <= 1.5:
            return 'daily'
        elif avg_days <= 8:
            return 'weekly'
        elif avg_days <= 32:
            return 'monthly'
        elif avg_days <= 95:
            return 'quarterly'
        elif avg_days <= 370:
            return 'yearly'
        else:
            return 'irregular'
    
    def _identify_geo_columns(self, df: pd.DataFrame) -> List[str]:
        """Identify potential geographic columns"""
        
        geo_keywords = ['lat', 'latitude', 'lon', 'lng', 'longitude', 'coord', 'geo']
        geo_cols = []
        
        for col in df.columns:
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in geo_keywords):
                # Check if it's numeric
                if pd.api.types.is_numeric_dtype(df[col]):
                    geo_cols.append(col)
        
        return geo_cols
    
    def _calculate_spatial_extent(self, lat_series: pd.Series, lon_series: pd.Series) -> Dict[str, float]:
        """Calculate spatial extent of coordinates"""
        
        lat_range = lat_series.max() - lat_series.min()
        lon_range = lon_series.max() - lon_series.min()
        
        # Approximate area (very rough estimation)
        approx_area_km2 = lat_range * lon_range * 111 * 111  # 1 degree ≈ 111 km
        
        return {
            'latitude_span': float(lat_range),
            'longitude_span': float(lon_range),
            'approximate_area_km2': float(approx_area_km2)
        }
    
    def _analyze_point_density(self, lat_series: pd.Series, lon_series: pd.Series) -> Dict[str, Any]:
        """Analyze point density distribution"""
        
        # Simple grid-based density analysis
        lat_bins = min(10, len(lat_series) // 5)
        lon_bins = min(10, len(lon_series) // 5)
        
        if lat_bins < 2 or lon_bins < 2:
            return {'message': 'Insufficient data for density analysis'}
        
        # Create histogram
        hist, lat_edges, lon_edges = np.histogram2d(lat_series, lon_series, bins=[lat_bins, lon_bins])
        
        return {
            'max_density': int(hist.max()),
            'avg_density': float(hist.mean()),
            'density_variance': float(hist.var()),
            'grid_dimensions': f'{lat_bins}x{lon_bins}'
        }
    
    def _identify_text_columns(self, df: pd.DataFrame) -> List[str]:
        """Identify text columns for analysis"""
        
        text_cols = []
        
        for col in df.columns:
            if df[col].dtype == 'object':
                # Check if it's likely text (high cardinality, long strings)
                sample_data = df[col].dropna().astype(str)
                if len(sample_data) > 0:
                    avg_length = sample_data.str.len().mean()
                    unique_ratio = sample_data.nunique() / len(sample_data)
                    
                    if avg_length > 20 or unique_ratio > 0.7:
                        text_cols.append(col)
        
        return text_cols
    
    def _analyze_punctuation(self, text_series: pd.Series) -> Dict[str, int]:
        """Analyze punctuation usage in text"""
        
        all_text = ' '.join(text_series)
        
        return {
            'periods': all_text.count('.'),
            'commas': all_text.count(','),
            'exclamation': all_text.count('!'),
            'question': all_text.count('?'),
            'quotes': all_text.count('"') + all_text.count("'"),
            'parentheses': all_text.count('(') + all_text.count(')')
        }
    
    def _find_common_prefixes(self, text_series: pd.Series, min_length: int = 3) -> List[Dict[str, Any]]:
        """Find common text prefixes"""
        
        prefixes = {}
        
        for text in text_series:
            if len(text) >= min_length:
                prefix = text[:min_length].lower()
                prefixes[prefix] = prefixes.get(prefix, 0) + 1
        
        # Return top 10 prefixes
        sorted_prefixes = sorted(prefixes.items(), key=lambda x: x[1], reverse=True)
        return [{'prefix': prefix, 'count': count} for prefix, count in sorted_prefixes[:10]]
    
    def _find_common_suffixes(self, text_series: pd.Series, min_length: int = 3) -> List[Dict[str, Any]]:
        """Find common text suffixes"""
        
        suffixes = {}
        
        for text in text_series:
            if len(text) >= min_length:
                suffix = text[-min_length:].lower()
                suffixes[suffix] = suffixes.get(suffix, 0) + 1
        
        # Return top 10 suffixes
        sorted_suffixes = sorted(suffixes.items(), key=lambda x: x[1], reverse=True)
        return [{'suffix': suffix, 'count': count} for suffix, count in sorted_suffixes[:10]]
    
    def _analyze_word_lengths(self, words: List[str]) -> Dict[str, float]:
        """Analyze distribution of word lengths"""
        
        lengths = [len(word) for word in words]
        
        return {
            'avg_word_length': float(np.mean(lengths)),
            'median_word_length': float(np.median(lengths)),
            'min_word_length': int(min(lengths)),
            'max_word_length': int(max(lengths))
        }
    
    def _detect_language_indicators(self, words: List[str]) -> Dict[str, Any]:
        """Detect language indicators in text"""
        
        # Simple language detection based on common words
        english_indicators = ['the', 'and', 'or', 'is', 'are', 'was', 'were', 'have', 'has', 'had']
        
        word_set = set(words)
        english_score = sum(1 for indicator in english_indicators if indicator in word_set)
        
        return {
            'likely_english': english_score >= 3,
            'english_indicators_found': english_score,
            'contains_numbers': any(word.isdigit() for word in words),
            'mixed_case_words': sum(1 for word in words if any(c.isupper() for c in word) and any(c.islower() for c in word))
        }
    
    def _calculate_text_quality_score(self, text_series: pd.Series) -> float:
        """Calculate overall text quality score (0-100)"""
        
        score = 100.0
        
        # Penalty for very short texts
        very_short_pct = (text_series.str.len() < 3).mean()
        score -= very_short_pct * 20
        
        # Penalty for very long texts
        very_long_pct = (text_series.str.len() > 1000).mean()
        score -= very_long_pct * 10
        
        # Penalty for all caps
        all_caps_pct = text_series.str.isupper().mean()
        score -= all_caps_pct * 15
        
        # Penalty for no spaces (likely not natural text)
        no_spaces_pct = (~text_series.str.contains(' ')).mean()
        score -= no_spaces_pct * 25
        
        return max(0.0, score) 