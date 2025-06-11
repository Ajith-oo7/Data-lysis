"""
Enhanced Data Cleaning Module for Datalysis
Implements comprehensive data cleaning techniques following industry best practices
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple, Union
import re
import logging
from datetime import datetime
from sklearn.impute import KNNImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder, TargetEncoder
from sklearn.feature_selection import VarianceThreshold
import warnings
from scipy import stats
import string
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class EnhancedDataCleaner:
    """
    Comprehensive data cleaning following industry best practices
    """
    
    def __init__(self):
        self.cleaning_log = []
        self.original_shape = None
        self.final_shape = None
        
    def log_operation(self, operation: str, details: str, rows_before: int, rows_after: int):
        """Log cleaning operations for audit trail"""
        self.cleaning_log.append({
            'timestamp': datetime.now().isoformat(),
            'operation': operation,
            'details': details,
            'rows_before': rows_before,
            'rows_after': rows_after,
            'rows_changed': rows_before - rows_after
        })
        
    def comprehensive_clean(self, df: pd.DataFrame, config: Dict[str, Any] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Perform comprehensive data cleaning with all techniques
        """
        if config is None:
            config = self._get_default_config()
            
        self.original_shape = df.shape
        cleaned_df = df.copy()
        
        logger.info(f"Starting comprehensive cleaning of dataset: {df.shape}")
        
        # 1. Handle Missing Data
        if config.get('handle_missing', True):
            cleaned_df = self._handle_missing_data(cleaned_df, config.get('missing_config', {}))
            
        # 2. Correct Data Types
        if config.get('correct_types', True):
            cleaned_df = self._correct_data_types(cleaned_df)
            
        # 3. Remove Duplicates
        if config.get('remove_duplicates', True):
            cleaned_df = self._remove_duplicates(cleaned_df, config.get('duplicate_config', {}))
            
        # 4. Handle Outliers
        if config.get('handle_outliers', True):
            cleaned_df = self._handle_outliers(cleaned_df, config.get('outlier_config', {}))
            
        # 5. Standardize and Normalize
        if config.get('standardize', False):
            cleaned_df = self._standardize_normalize(cleaned_df, config.get('scaling_config', {}))
            
        # 6. Clean Text Data
        if config.get('clean_text', True):
            cleaned_df = self._clean_text_data(cleaned_df, config.get('text_config', {}))
            
        # 7. Validate Data Integrity
        if config.get('validate_integrity', True):
            cleaned_df = self._validate_data_integrity(cleaned_df, config.get('validation_config', {}))
            
        # 8. Handle Inconsistent Formats
        if config.get('fix_formats', True):
            cleaned_df = self._fix_inconsistent_formats(cleaned_df)
            
        # 9. Encode Categorical Data (optional)
        if config.get('encode_categorical', False):
            cleaned_df = self._encode_categorical(cleaned_df, config.get('encoding_config', {}))
            
        # 10. Binning and Grouping (optional)
        if config.get('create_bins', False):
            cleaned_df = self._create_bins(cleaned_df, config.get('binning_config', {}))
            
        # 11. Feature Engineering (optional)
        if config.get('feature_engineering', False):
            cleaned_df = self._feature_engineering(cleaned_df, config.get('feature_config', {}))
            
        # 12. Aggregation and Transformation (optional)
        if config.get('aggregate_transform', False):
            cleaned_df = self._aggregate_transform(cleaned_df, config.get('aggregation_config', {}))
            
        # 13. Geospatial Cleaning (if applicable)
        if config.get('clean_geospatial', False):
            cleaned_df = self._clean_geospatial(cleaned_df)
            
        # 14. Unit conversion system
        if config.get('handle_unit_conversions', False):
            cleaned_df = self._handle_unit_conversions(cleaned_df, config.get('unit_conversion_config', {}))
            
        self.final_shape = cleaned_df.shape
        
        # Generate cleaning summary
        summary = self._generate_cleaning_summary(df, cleaned_df)
        
        return cleaned_df, summary
        
    def _handle_missing_data(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """1. Comprehensive missing data handling"""
        rows_before = len(df)
        
        # Create missing indicator variables if requested
        if config.get('create_missing_indicators', False):
            for col in df.columns:
                if df[col].isnull().sum() > 0:
                    df[f'{col}_was_missing'] = df[col].isnull().astype(int)
        
        # Remove columns with too many missing values
        missing_threshold = config.get('column_missing_threshold', 0.5)
        cols_to_drop = []
        
        for col in df.columns:
            # Skip the missing indicator columns we just created
            if col.endswith('_was_missing'):
                continue
                
            missing_pct = df[col].isnull().sum() / len(df)
            if missing_pct > missing_threshold:
                cols_to_drop.append(col)
                
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)
            self.log_operation(
                'remove_missing_columns',
                f"Removed columns with >{missing_threshold*100}% missing: {cols_to_drop}",
                rows_before, len(df)
            )
        
        # Remove rows with too many missing values
        row_missing_threshold = config.get('row_missing_threshold', 0.7)
        missing_per_row = df.isnull().sum(axis=1) / len(df.columns)
        rows_to_keep = missing_per_row <= row_missing_threshold
        df = df[rows_to_keep]
        
        rows_removed = rows_before - len(df)
        if rows_removed > 0:
            self.log_operation(
                'remove_missing_rows',
                f"Removed {rows_removed} rows with >{row_missing_threshold*100}% missing values",
                rows_before, len(df)
            )
        
        # Impute missing values
        imputation_strategy = config.get('imputation_strategy', 'smart')
        
        for col in df.columns:
            if df[col].isnull().sum() > 0:
                if pd.api.types.is_numeric_dtype(df[col]):
                    if imputation_strategy == 'mean':
                        df[col].fillna(df[col].mean(), inplace=True)
                    elif imputation_strategy == 'median':
                        df[col].fillna(df[col].median(), inplace=True)
                    elif imputation_strategy == 'smart':
                        # Use median for skewed data, mean for normal
                        skewness = abs(df[col].skew())
                        if skewness > 1:
                            df[col].fillna(df[col].median(), inplace=True)
                        else:
                            df[col].fillna(df[col].mean(), inplace=True)
                            
                elif pd.api.types.is_categorical_dtype(df[col]) or df[col].dtype == 'object':
                    # Use mode for categorical data
                    mode_value = df[col].mode().iloc[0] if not df[col].mode().empty else 'Unknown'
                    df[col].fillna(mode_value, inplace=True)
                    
                elif pd.api.types.is_datetime64_any_dtype(df[col]):
                    # Forward fill for datetime
                    df[col].fillna(method='ffill', inplace=True)
                    df[col].fillna(method='bfill', inplace=True)
        
        # KNN Imputation for numeric columns (advanced)
        if config.get('use_knn_imputation', False):
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 1:
                knn_imputer = KNNImputer(n_neighbors=config.get('knn_neighbors', 5))
                df[numeric_cols] = knn_imputer.fit_transform(df[numeric_cols])
        
        return df
        
    def _correct_data_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """2. Intelligent data type correction"""
        rows_before = len(df)
        
        for col in df.columns:
            original_dtype = df[col].dtype
            
            # Skip if already optimal type
            if pd.api.types.is_numeric_dtype(df[col]) or pd.api.types.is_datetime64_any_dtype(df[col]):
                continue
                
            # Try to convert to numeric
            if df[col].dtype == 'object':
                # Clean and try numeric conversion
                cleaned_series = df[col].astype(str).str.strip()
                cleaned_series = cleaned_series.str.replace(r'[^\d.-]', '', regex=True)
                
                try:
                    numeric_series = pd.to_numeric(cleaned_series, errors='coerce')
                    # If >80% of values can be converted, use numeric
                    if numeric_series.notna().sum() / len(df) > 0.8:
                        df[col] = numeric_series
                        continue
                except:
                    pass
                    
                # Try datetime conversion
                try:
                    datetime_series = pd.to_datetime(df[col], errors='coerce', infer_datetime_format=True)
                    # If >50% of values can be converted, use datetime
                    if datetime_series.notna().sum() / len(df) > 0.5:
                        df[col] = datetime_series
                        continue
                except:
                    pass
                    
                # Check if should be categorical
                unique_ratio = df[col].nunique() / len(df)
                if unique_ratio < 0.1 or df[col].nunique() < 20:
                    df[col] = df[col].astype('category')
                    
        return df
        
    def _remove_duplicates(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """3. Advanced duplicate removal"""
        rows_before = len(df)
        
        # Exact duplicates
        df = df.drop_duplicates()
        exact_dupes_removed = rows_before - len(df)
        
        if exact_dupes_removed > 0:
            self.log_operation(
                'remove_exact_duplicates',
                f"Removed {exact_dupes_removed} exact duplicate rows",
                rows_before, len(df)
            )
        
        # Near-duplicate detection for text columns
        if config.get('fuzzy_matching', False):
            text_cols = df.select_dtypes(include=['object']).columns
            for col in text_cols:
                # Simple fuzzy matching - can be enhanced with more sophisticated algorithms
                df[col] = df[col].str.lower().str.strip()
                
        return df
        
    def _handle_outliers(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """4. Comprehensive outlier detection and handling"""
        method = config.get('method', 'iqr')
        action = config.get('action', 'cap')  # 'remove', 'cap', 'keep'
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if method == 'iqr':
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
            elif method == 'zscore':
                z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                lower_bound = df[col].mean() - 3 * df[col].std()
                upper_bound = df[col].mean() + 3 * df[col].std()
                
            # Apply action
            outliers_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
            outliers_count = outliers_mask.sum()
            
            if outliers_count > 0:
                if action == 'remove':
                    df = df[~outliers_mask]
                elif action == 'cap':
                    df.loc[df[col] < lower_bound, col] = lower_bound
                    df.loc[df[col] > upper_bound, col] = upper_bound
                    
                self.log_operation(
                    f'handle_outliers_{action}',
                    f"Handled {outliers_count} outliers in {col} using {method} method",
                    len(df), len(df)
                )
        
        return df
        
    def _standardize_normalize(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """5. Data standardization and normalization"""
        method = config.get('method', 'standard')  # 'standard', 'minmax', 'robust', 'log', 'boxcox'
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) > 0:
            # Apply transforms for skewed data
            if method == 'log':
                # Log transform (add small constant to handle zeros)
                for col in numeric_cols:
                    if (df[col] > 0).all():  # Only if all values are positive
                        df[col] = np.log1p(df[col])  # log(1 + x) for numerical stability
                    else:
                        # Add constant to make all values positive
                        min_val = df[col].min()
                        if min_val <= 0:
                            df[col] = df[col] - min_val + 1
                        df[col] = np.log1p(df[col])
                        
                self.log_operation(
                    'transform_log',
                    f"Applied log transform to {len(numeric_cols)} numeric columns",
                    len(df), len(df)
                )
                        
            elif method == 'boxcox':
                # Box-Cox transform (requires positive values)
                for col in numeric_cols:
                    if (df[col] > 0).all():  # Only if all values are positive
                        try:
                            df[col], _ = stats.boxcox(df[col])
                        except:
                            # Fallback to log transform if Box-Cox fails
                            df[col] = np.log1p(df[col])
                    else:
                        # Make values positive and apply Box-Cox
                        min_val = df[col].min()
                        if min_val <= 0:
                            df[col] = df[col] - min_val + 1
                        try:
                            df[col], _ = stats.boxcox(df[col])
                        except:
                            df[col] = np.log1p(df[col])
                            
                self.log_operation(
                    'transform_boxcox',
                    f"Applied Box-Cox transform to {len(numeric_cols)} numeric columns",
                    len(df), len(df)
                )
                        
            else:
                # Standard scaling methods
                if method == 'standard':
                    scaler = StandardScaler()
                elif method == 'minmax':
                    scaler = MinMaxScaler()
                else:
                    from sklearn.preprocessing import RobustScaler
                    scaler = RobustScaler()
                    
                df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
                
                self.log_operation(
                    f'scale_{method}',
                    f"Applied {method} scaling to {len(numeric_cols)} numeric columns",
                    len(df), len(df)
                )
        
        return df
        
    def _clean_text_data(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """6. Comprehensive text cleaning"""
        text_cols = df.select_dtypes(include=['object']).columns
        
        for col in text_cols:
            if df[col].dtype == 'object':
                # Basic cleaning
                df[col] = df[col].astype(str)
                df[col] = df[col].str.strip()
                
                # Remove HTML tags if requested
                if config.get('remove_html_tags', False):
                    df[col] = df[col].str.replace(r'<[^<>]*>', '', regex=True)
                    
                # Remove emojis if requested
                if config.get('remove_emojis', False):
                    # Remove emojis using Unicode ranges
                    emoji_pattern = re.compile("["
                                             u"\U0001F600-\U0001F64F"  # emoticons
                                             u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                                             u"\U0001F680-\U0001F6FF"  # transport & map symbols
                                             u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                                             u"\U00002702-\U000027B0"
                                             u"\U000024C2-\U0001F251"
                                             "]+", flags=re.UNICODE)
                    df[col] = df[col].str.replace(emoji_pattern, '', regex=True)
                
                if config.get('normalize_case', True):
                    df[col] = df[col].str.lower()
                    
                if config.get('remove_special_chars', False):
                    df[col] = df[col].str.replace(r'[^\w\s]', '', regex=True)
                    
                if config.get('remove_extra_spaces', True):
                    df[col] = df[col].str.replace(r'\s+', ' ', regex=True)
                    
                # Remove punctuation if requested
                if config.get('remove_punctuation', False):
                    df[col] = df[col].str.translate(str.maketrans('', '', string.punctuation))
                    
                # Handle common typos/variations
                if config.get('standardize_values', True):
                    # Example standardizations
                    common_replacements = {
                        r'\byes\b|\by\b|\btrue\b|\b1\b': 'yes',
                        r'\bno\b|\bn\b|\bfalse\b|\b0\b': 'no',
                        r'\bmale\b|\bm\b': 'male',
                        r'\bfemale\b|\bf\b': 'female',
                        # Add more domain-specific replacements
                        r'\busa\b|\bunited states\b|\bus\b': 'united states',
                        r'\buk\b|\bunited kingdom\b|\bbritain\b': 'united kingdom',
                        r'\bemail\b|\be-mail\b|\bemail address\b': 'email',
                        r'\bphone\b|\btelephone\b|\btel\b|\bmobile\b': 'phone'
                    }
                    
                    for pattern, replacement in common_replacements.items():
                        df[col] = df[col].str.replace(pattern, replacement, regex=True, case=False)
                
                # Advanced text standardization
                if config.get('advanced_standardization', False):
                    # Remove URLs
                    df[col] = df[col].str.replace(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', regex=True)
                    
                    # Remove email addresses
                    df[col] = df[col].str.replace(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '', regex=True)
                    
                    # Standardize common abbreviations
                    abbreviation_replacements = {
                        r'\bdr\b': 'doctor',
                        r'\bmr\b': 'mister',
                        r'\bmrs\b': 'missus',
                        r'\bms\b': 'miss',
                        r'\bprof\b': 'professor',
                        r'\bst\b': 'street',
                        r'\bave\b': 'avenue',
                        r'\brd\b': 'road',
                        r'\bblvd\b': 'boulevard'
                    }
                    
                    for pattern, replacement in abbreviation_replacements.items():
                        df[col] = df[col].str.replace(pattern, replacement, regex=True, case=False)
        
        return df
        
    def _validate_data_integrity(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """7. Data integrity validation"""
        # Date logic validation
        date_cols = df.select_dtypes(include=['datetime64']).columns
        if len(date_cols) >= 2:
            # Check for start_date < end_date patterns
            start_cols = [col for col in date_cols if 'start' in col.lower()]
            end_cols = [col for col in date_cols if 'end' in col.lower()]
            
            for start_col in start_cols:
                for end_col in end_cols:
                    if start_col in df.columns and end_col in df.columns:
                        invalid_dates = df[start_col] > df[end_col]
                        if invalid_dates.any():
                            # Fix by swapping or removing
                            if config.get('fix_date_logic', True):
                                df.loc[invalid_dates, [start_col, end_col]] = df.loc[invalid_dates, [end_col, start_col]].values
                                
        # Domain constraints
        constraints = config.get('domain_constraints', {})
        for col, constraint in constraints.items():
            if col in df.columns:
                if 'min' in constraint:
                    df = df[df[col] >= constraint['min']]
                if 'max' in constraint:
                    df = df[df[col] <= constraint['max']]
                    
        return df
        
    def _fix_inconsistent_formats(self, df: pd.DataFrame) -> pd.DataFrame:
        """8. Fix inconsistent formats"""
        for col in df.columns:
            if df[col].dtype == 'object':
                # Phone number standardization
                if any(keyword in col.lower() for keyword in ['phone', 'tel', 'mobile']):
                    df[col] = df[col].str.replace(r'[^\d]', '', regex=True)
                    
                # Email standardization
                elif 'email' in col.lower():
                    df[col] = df[col].str.lower().str.strip()
                    
                # Currency standardization
                elif any(keyword in col.lower() for keyword in ['price', 'cost', 'amount', 'salary']):
                    df[col] = df[col].str.replace(r'[^\d.-]', '', regex=True)
                    df[col] = pd.to_numeric(df[col], errors='coerce')
        
        return df
        
    def _encode_categorical(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """9. Categorical data encoding"""
        encoding_method = config.get('method', 'onehot')  # 'label', 'onehot', 'target', 'frequency'
        target_column = config.get('target_column', None)
        
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        
        for col in categorical_cols:
            if encoding_method == 'label':
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                
            elif encoding_method == 'onehot':
                # Only for columns with reasonable number of categories
                if df[col].nunique() <= config.get('max_categories_onehot', 10):
                    dummies = pd.get_dummies(df[col], prefix=col)
                    df = pd.concat([df.drop(col, axis=1), dummies], axis=1)
                    
            elif encoding_method == 'target' and target_column and target_column in df.columns:
                # Target encoding (mean of target for each category)
                try:
                    # Calculate mean target value for each category
                    target_mean = df.groupby(col)[target_column].mean()
                    df[f'{col}_target_encoded'] = df[col].map(target_mean)
                    # Keep original column for reference
                except Exception as e:
                    logger.warning(f"Target encoding failed for {col}: {str(e)}")
                    
            elif encoding_method == 'frequency':
                # Frequency encoding (count of each category)
                freq_encoding = df[col].value_counts().to_dict()
                df[f'{col}_frequency_encoded'] = df[col].map(freq_encoding)
                # Keep original column for reference
        
        self.log_operation(
            f'encode_{encoding_method}',
            f"Applied {encoding_method} encoding to categorical columns",
            len(df), len(df)
        )
        
        return df
        
    def _create_bins(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """10. Binning and grouping"""
        binning_rules = config.get('binning_rules', {})
        
        for col, rules in binning_rules.items():
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                if rules['method'] == 'equal_width':
                    df[f'{col}_binned'] = pd.cut(df[col], bins=rules['bins'])
                elif rules['method'] == 'equal_frequency':
                    df[f'{col}_binned'] = pd.qcut(df[col], q=rules['bins'])
                elif rules['method'] == 'custom':
                    df[f'{col}_binned'] = pd.cut(df[col], bins=rules['custom_bins'])
        
        return df
        
    def _feature_engineering(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """11. Basic feature engineering"""
        # Date feature extraction
        date_cols = df.select_dtypes(include=['datetime64']).columns
        for col in date_cols:
            if config.get('extract_date_features', True):
                df[f'{col}_year'] = df[col].dt.year
                df[f'{col}_month'] = df[col].dt.month
                df[f'{col}_day'] = df[col].dt.day
                df[f'{col}_weekday'] = df[col].dt.dayofweek
                
        # Text feature extraction
        text_cols = df.select_dtypes(include=['object']).columns
        for col in text_cols:
            if config.get('extract_text_features', False):
                df[f'{col}_length'] = df[col].astype(str).str.len()
                df[f'{col}_word_count'] = df[col].astype(str).str.split().str.len()
        
        return df
        
    def _aggregate_transform(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """12. Aggregation and transformation"""
        # Group by operations
        group_rules = config.get('group_rules', {})
        
        for group_col, agg_rules in group_rules.items():
            if group_col in df.columns:
                grouped = df.groupby(group_col)
                for agg_col, agg_func in agg_rules.items():
                    if agg_col in df.columns:
                        df[f'{agg_col}_{agg_func}_by_{group_col}'] = grouped[agg_col].transform(agg_func)
        
        return df
        
    def _clean_geospatial(self, df: pd.DataFrame) -> pd.DataFrame:
        """13. Geospatial data cleaning"""
        # Latitude validation (-90 to 90)
        lat_cols = [col for col in df.columns if 'lat' in col.lower()]
        for col in lat_cols:
            if col in df.columns:
                df = df[(df[col] >= -90) & (df[col] <= 90)]
                
        # Longitude validation (-180 to 180)
        lon_cols = [col for col in df.columns if 'lon' in col.lower() or 'lng' in col.lower()]
        for col in lon_cols:
            if col in df.columns:
                df = df[(df[col] >= -180) & (df[col] <= 180)]
        
        return df
        
    def _handle_unit_conversions(self, df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """14. Unit conversion system"""
        conversion_rules = config.get('conversion_rules', {})
        
        # Define conversion factors
        unit_conversions = {
            'distance': {
                'km_to_miles': 0.621371,
                'miles_to_km': 1.60934,
                'm_to_ft': 3.28084,
                'ft_to_m': 0.3048,
                'cm_to_inches': 0.393701,
                'inches_to_cm': 2.54
            },
            'weight': {
                'kg_to_lbs': 2.20462,
                'lbs_to_kg': 0.453592,
                'g_to_oz': 0.035274,
                'oz_to_g': 28.3495
            },
            'temperature': {
                'celsius_to_fahrenheit': lambda c: (c * 9/5) + 32,
                'fahrenheit_to_celsius': lambda f: (f - 32) * 5/9,
                'celsius_to_kelvin': lambda c: c + 273.15,
                'kelvin_to_celsius': lambda k: k - 273.15
            },
            'volume': {
                'liters_to_gallons': 0.264172,
                'gallons_to_liters': 3.78541,
                'ml_to_floz': 0.033814,
                'floz_to_ml': 29.5735
            }
        }
        
        # Apply conversions based on rules
        for col, conversion_info in conversion_rules.items():
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                conversion_type = conversion_info.get('type')
                conversion_name = conversion_info.get('conversion')
                
                if conversion_type in unit_conversions and conversion_name in unit_conversions[conversion_type]:
                    conversion_func = unit_conversions[conversion_type][conversion_name]
                    
                    if callable(conversion_func):
                        # For temperature conversions (functions)
                        df[f'{col}_{conversion_name}'] = df[col].apply(conversion_func)
                    else:
                        # For simple multiplication conversions
                        df[f'{col}_{conversion_name}'] = df[col] * conversion_func
                        
                    self.log_operation(
                        'unit_conversion',
                        f"Converted {col} using {conversion_name}",
                        len(df), len(df)
                    )
        
        # Auto-detect and suggest conversions
        if config.get('auto_detect_units', False):
            for col in df.columns:
                col_lower = col.lower()
                
                # Distance detection
                if any(unit in col_lower for unit in ['km', 'kilometer', 'mile', 'meter', 'feet', 'inch']):
                    if 'km' in col_lower and pd.api.types.is_numeric_dtype(df[col]):
                        df[f'{col}_miles'] = df[col] * unit_conversions['distance']['km_to_miles']
                    elif 'mile' in col_lower and pd.api.types.is_numeric_dtype(df[col]):
                        df[f'{col}_km'] = df[col] * unit_conversions['distance']['miles_to_km']
                
                # Weight detection
                elif any(unit in col_lower for unit in ['kg', 'kilogram', 'lb', 'pound', 'gram', 'ounce']):
                    if any(unit in col_lower for unit in ['kg', 'kilogram']) and pd.api.types.is_numeric_dtype(df[col]):
                        df[f'{col}_lbs'] = df[col] * unit_conversions['weight']['kg_to_lbs']
                    elif any(unit in col_lower for unit in ['lb', 'pound']) and pd.api.types.is_numeric_dtype(df[col]):
                        df[f'{col}_kg'] = df[col] * unit_conversions['weight']['lbs_to_kg']
                
                # Temperature detection
                elif any(unit in col_lower for unit in ['celsius', 'fahrenheit', 'kelvin', 'temp']):
                    if 'celsius' in col_lower and pd.api.types.is_numeric_dtype(df[col]):
                        df[f'{col}_fahrenheit'] = df[col].apply(unit_conversions['temperature']['celsius_to_fahrenheit'])
                    elif 'fahrenheit' in col_lower and pd.api.types.is_numeric_dtype(df[col]):
                        df[f'{col}_celsius'] = df[col].apply(unit_conversions['temperature']['fahrenheit_to_celsius'])
        
        return df
        
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default cleaning configuration"""
        return {
            'handle_missing': True,
            'correct_types': True,
            'remove_duplicates': True,
            'handle_outliers': True,
            'clean_text': True,
            'validate_integrity': True,
            'fix_formats': True,
            'standardize': False,
            'encode_categorical': False,
            'create_bins': False,
            'feature_engineering': False,
            'aggregate_transform': False,
            'clean_geospatial': False,
            'handle_unit_conversions': False,
            'missing_config': {
                'column_missing_threshold': 0.5,
                'row_missing_threshold': 0.7,
                'imputation_strategy': 'smart',
                'use_knn_imputation': False
            },
            'outlier_config': {
                'method': 'iqr',
                'action': 'cap'
            },
            'text_config': {
                'normalize_case': True,
                'remove_special_chars': False,
                'remove_extra_spaces': True,
                'standardize_values': True
            },
            'validation_config': {
                'fix_date_logic': True,
                'domain_constraints': {
                    'age': {'min': 0, 'max': 120},
                    'price': {'min': 0}
                }
            },
            'unit_conversion_config': {
                'auto_detect_units': False
            }
        }
        
    def _generate_cleaning_summary(self, original_df: pd.DataFrame, cleaned_df: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive cleaning summary"""
        return {
            'original_shape': self.original_shape,
            'final_shape': self.final_shape,
            'rows_removed': self.original_shape[0] - self.final_shape[0],
            'columns_removed': self.original_shape[1] - self.final_shape[1],
            'cleaning_operations': len(self.cleaning_log),
            'data_quality_improvement': self._calculate_quality_improvement(original_df, cleaned_df),
            'cleaning_log': self.cleaning_log,
            'final_data_types': cleaned_df.dtypes.to_dict(),
            'missing_values_final': cleaned_df.isnull().sum().to_dict()
        }
        
    def _calculate_quality_improvement(self, original_df: pd.DataFrame, cleaned_df: pd.DataFrame) -> Dict[str, float]:
        """Calculate data quality improvement metrics"""
        orig_missing = original_df.isnull().sum().sum()
        cleaned_missing = cleaned_df.isnull().sum().sum()
        
        orig_total_cells = original_df.shape[0] * original_df.shape[1]
        cleaned_total_cells = cleaned_df.shape[0] * cleaned_df.shape[1]
        
        return {
            'missing_value_reduction': (orig_missing - cleaned_missing) / orig_total_cells if orig_total_cells > 0 else 0,
            'completeness_before': 1 - (orig_missing / orig_total_cells) if orig_total_cells > 0 else 0,
            'completeness_after': 1 - (cleaned_missing / cleaned_total_cells) if cleaned_total_cells > 0 else 1,
            'data_consistency_score': self._calculate_consistency_score(cleaned_df)
        }
        
    def _calculate_consistency_score(self, df: pd.DataFrame) -> float:
        """Calculate data consistency score"""
        scores = []
        
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                # Check for consistent numeric ranges
                if df[col].notna().sum() > 0:
                    cv = df[col].std() / df[col].mean() if df[col].mean() != 0 else 0
                    scores.append(min(1.0, 1 / (1 + cv)))  # Lower CV = higher consistency
                    
            elif df[col].dtype == 'object':
                # Check for consistent text patterns
                if df[col].notna().sum() > 0:
                    unique_ratio = df[col].nunique() / len(df)
                    scores.append(1 - unique_ratio if unique_ratio < 1 else 0.5)
        
        return np.mean(scores) if scores else 1.0


# Integration function for the main application
def enhanced_clean_data(data: Union[str, List[Dict[str, Any]], pd.DataFrame], 
                       config: Dict[str, Any] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Main function to integrate enhanced cleaning with existing Datalysis app
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
    
    # Initialize cleaner
    cleaner = EnhancedDataCleaner()
    
    # Perform cleaning
    cleaned_df, summary = cleaner.comprehensive_clean(df, config)
    
    return cleaned_df, summary 