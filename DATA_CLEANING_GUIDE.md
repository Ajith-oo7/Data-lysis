# 🧹 Comprehensive Data Cleaning Guide - Datalysis

This guide outlines all the data cleaning techniques available in the Datalysis application, following industry best practices.

## 📋 Table of Contents

1. [Basic Data Cleaning (Always Applied)](#basic-data-cleaning)
2. [Enhanced Data Cleaning](#enhanced-data-cleaning)
3. [Advanced Features](#advanced-features)
4. [Configuration Options](#configuration-options)
5. [Usage Examples](#usage-examples)
6. [Cleaning Log & Audit Trail](#cleaning-log)

---

## 🔧 Basic Data Cleaning (Always Applied)

These cleaning operations are automatically applied to all uploaded data:

### ✅ **Automatic Standardization**
```
• Empty strings ("") → null
• Whitespace-only strings → null  
• Common null representations ("N/A", "NA", "-", "null", "none", "undefined") → null
• Currency values: $1,234.56 → 1234.56
• Percentages: 75% → 0.75
• Booleans: "true"/"yes"/"y"/"1" → true, "false"/"no"/"n"/"0" → false
• Date standardization to ISO format (YYYY-MM-DD)
• Whitespace trimming from all string values
```

### 🔄 **Duplicate Removal**
```
• Exact duplicate rows removed automatically
• JSON-based comparison for detection
• Duplicate count logged and reported
```

---

## 🚀 Enhanced Data Cleaning

Activate enhanced cleaning by including `enhanced_cleaning` in your preprocessing rules. This enables all 15+ industry-standard techniques:

### 🔁 **1. Advanced Missing Data Handling**

**Thresholds:**
- Remove columns with >50% missing values (configurable)
- Remove rows with >70% missing values (configurable)

**Smart Imputation:**
```python
# Numeric columns:
- Mean (for normal distributions)
- Median (for skewed distributions, auto-detected)
- KNN imputation (when enabled)

# Categorical columns:
- Mode (most frequent value)
- "Unknown" placeholder

# DateTime columns:
- Forward fill → Backward fill
```

**Missing Indicator Variables:**
```python
# Create binary flags for missingness
original_column → original_column_was_missing (0/1)
```

**Configuration:**
```
missing_threshold: 30%     # Column removal threshold
knn_imputation            # Enable KNN imputation
missing_indicators        # Create missing indicator variables
```

### 🔧 **2. Intelligent Data Type Correction**

**Automatic Detection:**
```
• Text → Numeric (if >80% values convertible)
• Text → DateTime (if >50% values convertible)  
• Text → Categorical (if <10% unique ratio or <20 unique values)
• Mixed data type handling
```

### 🧹 **3. Advanced Duplicate Removal**

**Features:**
```
• Exact duplicate detection
• Near-duplicate detection with fuzzy matching
• Text normalization for duplicate detection
```

### 🧪 **4. Comprehensive Outlier Handling**

**Methods:**
```
IQR Method (default):
- Lower bound: Q1 - 1.5 × IQR
- Upper bound: Q3 + 1.5 × IQR

Z-Score Method:
- Values beyond ±3 standard deviations
```

**Actions:**
```
• Cap: Limit outliers to bounds (default)
• Remove: Delete outlier rows
• Keep: Mark but preserve outliers
```

**Configuration:**
```
zscore_outliers          # Use Z-score method
remove_outliers          # Remove instead of capping
```

### 🧱 **5. Advanced Data Standardization & Normalization**

**Scaling Methods:**
```
Standard Scaling (Z-score):
- Mean = 0, Standard Deviation = 1

Min-Max Scaling:
- Range [0, 1]

Robust Scaling:
- Uses median and IQR (less sensitive to outliers)

Log Transform:
- log(1 + x) for skewed distributions
- Handles zero values automatically

Box-Cox Transform:
- Optimal power transformation for normality
- Automatic fallback to log transform
```

**Configuration:**
```
standardize_data         # Enable standardization
normalize_data minmax    # Use Min-Max scaling
log_transform           # Apply log transformation
boxcox                  # Apply Box-Cox transformation
```

### 🔡 **6. Advanced Text Cleaning**

**Operations:**
```
• Trim whitespace
• Case normalization (lowercase)
• HTML tag removal
• Emoji removal and standardization
• Special character removal
• Extra space consolidation
• URL removal
• Email address removal
• Punctuation removal
• Abbreviation standardization
• Common value standardization:
  - yes/y/true/1 → "yes"
  - no/n/false/0 → "no"
  - male/m → "male"
  - female/f → "female"
  - USA/United States/US → "united states"
```

**Configuration:**
```
remove_html             # Remove HTML tags
remove_emojis           # Remove emoji characters
advanced_text_cleaning  # Enable all advanced features
```

### 🧩 **7. Data Integrity Validation**

**Logical Consistency:**
```
• Date logic: start_date < end_date
• Domain constraints:
  - Age: 0-120 years
  - Prices: ≥ 0
  - Custom constraints configurable
```

### 🔎 **8. Format Standardization**

**Automatic Format Fixing:**
```
• Phone numbers: Extract digits only
• Email addresses: Lowercase normalization
• Currency fields: Remove symbols, convert to numeric
• Date formats: Standardize to ISO format
```

### 🧮 **9. Advanced Categorical Data Encoding**

**Encoding Methods:**
```
Label Encoding:
- Categories → 0, 1, 2, 3...

One-Hot Encoding:
- Categories → Binary columns
- Limited to ≤10 categories (configurable)

Target Encoding:
- Categories → Target variable mean
- Requires target column specification

Frequency Encoding:
- Categories → Count of occurrences
- Preserves frequency information
```

**Configuration:**
```
encode_categorical      # Enable encoding
label_encoding         # Use label encoding
target_encoding        # Use target encoding
frequency_encoding     # Use frequency encoding
```

### 🧱 **10. Binning and Grouping**

**Binning Methods:**
```
Equal-Width Bins:
- Uniform interval sizes

Equal-Frequency Bins:  
- Uniform sample sizes per bin

Custom Bins:
- User-defined breakpoints
```

**Configuration:**
```
create_bins             # Enable binning
binning age: 0,18,35,50,65,100  # Custom age groups
```

### 🧮 **11. Feature Engineering**

**Date Feature Extraction:**
```
• Year, Month, Day extraction
• Weekday extraction
• Date arithmetic (duration calculation)
```

**Text Feature Extraction:**
```
• Text length
• Word count
• Character analysis
```

**Configuration:**
```
feature_engineering     # Enable feature extraction
```

### 📊 **12. Aggregation & Transformation**

**Group Operations:**
```
• Group by categorical columns
• Calculate aggregates (sum, mean, count, etc.)
• Create derived metrics
```

### 🧭 **13. Geospatial Data Cleaning**

**Validation:**
```
• Latitude: -90° to +90°
• Longitude: -180° to +180°
• Invalid coordinate removal
```

**Configuration:**
```
geospatial              # Enable geo validation
```

---

## 🆕 **Advanced Features**

### 🔄 **14. Unit Conversion System**

**Automatic Conversions:**
```
Distance:
- Kilometers ↔ Miles
- Meters ↔ Feet  
- Centimeters ↔ Inches

Weight:
- Kilograms ↔ Pounds
- Grams ↔ Ounces

Temperature:
- Celsius ↔ Fahrenheit
- Celsius ↔ Kelvin
- Fahrenheit ↔ Celsius

Volume:
- Liters ↔ Gallons
- Milliliters ↔ Fluid Ounces
```

**Configuration:**
```
unit_conversion         # Enable unit conversions
convert_units          # Auto-detect and convert common units
```

**Custom Conversions:**
```python
unit_conversion_config: {
    'conversion_rules': {
        'distance_km': {
            'type': 'distance',
            'conversion': 'km_to_miles'
        }
    },
    'auto_detect_units': True
}
```

---

## ⚙️ Configuration Options

### **Basic Preprocessing Rules**
```
remove_empty_rows
remove_empty_columns  
trim_strings
convert_types
normalize_case:column_name
replace:column_name:old_value|new_value
```

### **Enhanced Cleaning Rules**
```
enhanced_cleaning           # Enable all enhanced features
standardize_data           # Data standardization
log_transform             # Apply log transformation
boxcox                    # Apply Box-Cox transformation
encode_categorical         # Categorical encoding
target_encoding           # Target-based encoding
frequency_encoding        # Frequency-based encoding
feature_engineering        # Feature extraction
missing_indicators        # Create missing value flags
knn_imputation            # Advanced imputation
zscore_outliers           # Z-score outlier detection
remove_outliers           # Remove outliers instead of capping
remove_html               # Remove HTML tags
remove_emojis             # Remove emoji characters
advanced_text_cleaning    # Advanced text processing
unit_conversion           # Enable unit conversions
missing_threshold: 25%    # Custom missing value threshold
geospatial               # Geospatial validation
create_bins              # Enable binning
```

---

## 📝 Usage Examples

### **Basic Cleaning**
```
Preprocessing Instructions:
remove_empty_rows
convert_types
trim_strings
```

### **Advanced Cleaning**
```
Preprocessing Instructions:
enhanced_cleaning
standardize_data
encode_categorical
feature_engineering
knn_imputation
missing_threshold: 20%
remove_outliers
```

### **Comprehensive Cleaning (All Features)**
```
Preprocessing Instructions:
enhanced_cleaning
log_transform
target_encoding
frequency_encoding
missing_indicators
advanced_text_cleaning
remove_html
remove_emojis
unit_conversion
feature_engineering
geospatial
missing_threshold: 15%
```

### **Domain-Specific Cleaning**
```
Financial Data:
enhanced_cleaning
standardize_data minmax
remove_outliers
feature_engineering
unit_conversion

Healthcare Data:
enhanced_cleaning  
knn_imputation
zscore_outliers
geospatial
missing_threshold: 15%
missing_indicators

Text-Heavy Data:
enhanced_cleaning
encode_categorical frequency_encoding
feature_engineering
advanced_text_cleaning
remove_html
remove_emojis
```

---

## 📊 Cleaning Log & Audit Trail

The enhanced cleaning system provides comprehensive logging:

### **Operation Tracking**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "operation": "remove_missing_columns", 
  "details": "Removed columns with >50% missing: ['old_column']",
  "rows_before": 1000,
  "rows_after": 1000,
  "rows_changed": 0
}
```

### **Quality Metrics**
```json
{
  "completeness_before": 0.85,
  "completeness_after": 0.98,
  "missing_value_reduction": 0.13,
  "data_consistency_score": 0.92
}
```

### **Summary Report**
```json
{
  "original_shape": [1000, 15],
  "final_shape": [987, 12],
  "rows_removed": 13,
  "columns_removed": 3,
  "cleaning_operations": 8,
  "processing_time": "2.34 seconds"
}
```

---

## ✅ Best Practices

### **🔍 Data Assessment First**
1. Upload your data
2. Review the initial data profile
3. Identify specific cleaning needs
4. Configure appropriate cleaning rules

### **🎯 Incremental Cleaning**
1. Start with basic cleaning
2. Add enhanced techniques as needed
3. Monitor data quality improvements
4. Iterate based on analysis results

### **📋 Documentation**
1. Keep track of cleaning operations
2. Document business rules and constraints
3. Review cleaning logs for audit trail
4. Validate results with domain experts

### **🔄 Validation**
1. Always review cleaned data samples
2. Check data quality metrics
3. Verify domain-specific constraints
4. Test downstream analysis validity

---

## 🏆 Quality Assurance

The Datalysis cleaning system ensures:

- **✅ Reproducibility**: Same rules = same results
- **✅ Transparency**: Full operation logging  
- **✅ Configurability**: Flexible rule system
- **✅ Validation**: Quality metrics and checks
- **✅ Scalability**: Handles large datasets efficiently
- **✅ Extensibility**: Easy to add new techniques

Transform your raw data into analysis-ready datasets with confidence! 🚀 