#!/usr/bin/env python3
"""
Customer Churn Prediction Web Application
Built with Python Flask, Pandas, and Scikit-Learn.

This application demonstrates:
  1. Automated CSV ingestion, schema validation, and missing value detection
  2. Data leakage prevention: Preprocessing (imputation, scaling, encoding) fitted strictly on X_train
  3. Multi-model training: Logistic Regression vs Random Forest
  4. Automatic selection of the best model based on F1-Score
  5. Simple feature importance calculation
  6. Live single-customer inference using dynamic form fields

Usage:
  python app.py
  Open in browser: http://localhost:5000
"""

import os
import io
import json
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_from_directory
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size

# In-memory storage for active session (state preserved across requests)
SESSION_STATE = {
    "df": None,
    "target_col": None,
    "feature_cols": [],
    "num_cols": [],
    "cat_cols": [],
    "unique_categories": {},
    "models": {},
    "preprocessor": None,
    "evaluation_results": None,
    "best_model_name": None,
    "feature_importances": []
}


def clean_target_series(series: pd.Series):
    """
    Converts diverse binary target formats ('Yes'/'No', 1/0, 'True'/'False')
    into standard 0/1 integers.
    """
    if pd.api.types.is_numeric_dtype(series):
        unique_vals = set(series.dropna().unique())
        if unique_vals.issubset({0, 1}):
            return series.astype(int)

    # Convert string representation
    s_clean = series.astype(str).str.strip().str.lower()
    positive_flags = {'yes', '1', 'true', 'churn', 'churned', 'exited', 'left', 'leave'}
    negative_flags = {'no', '0', 'false', 'retained', 'stayed', 'stay', 'current'}

    if any(val in positive_flags for val in s_clean.unique()):
        return s_clean.apply(lambda x: 1 if x in positive_flags else (0 if x in negative_flags else np.nan)).fillna(0).astype(int)

    # Fallback: if exactly 2 classes, map the minority class to 1 (churn event)
    val_counts = series.value_counts()
    if len(val_counts) == 2:
        minority_label = val_counts.index[1]
        return (series == minority_label).astype(int)

    raise ValueError(f"Target column must have exactly 2 distinct classes. Found: {list(series.dropna().unique()[:5])}")


def identify_columns(df: pd.DataFrame, target_col: str):
    """
    Identifies numeric, categorical, and identifier columns.
    Excludes unique ID columns from the feature matrix to prevent data leakage and overfitting.
    """
    X_raw = df.drop(columns=[target_col]).copy()
    n_rows = len(df)

    # 1. Drop obvious ID columns
    cols_to_drop = []
    for col in X_raw.columns:
        col_lower = col.strip().lower()
        if col_lower in ['customerid', 'id', 'user_id', 'client_id', 'account_id', 'rownumber', 'name']:
            cols_to_drop.append(col)
        elif X_raw[col].dtype == 'object' and X_raw[col].nunique() >= 0.95 * n_rows and n_rows > 25:
            cols_to_drop.append(col)

    if cols_to_drop:
        X_raw = X_raw.drop(columns=cols_to_drop)

    num_cols = []
    cat_cols = []
    unique_categories = {}

    for col in X_raw.columns:
        if pd.api.types.is_numeric_dtype(X_raw[col]):
            num_cols.append(col)
        else:
            # Check if this column is numeric disguised as string (e.g. "$85.50" or " 120.0 ")
            coerced = pd.to_numeric(X_raw[col].astype(str).str.replace('$', '', regex=False).str.replace(',', '', regex=False).str.strip(), errors='coerce')
            if coerced.notnull().sum() / len(X_raw) >= 0.85:
                X_raw[col] = coerced
                num_cols.append(col)
            else:
                cat_cols.append(col)
                # Store unique categories for dynamic UI dropdowns
                unique_categories[col] = sorted([str(v) for v in X_raw[col].dropna().unique().tolist()][:20])

    return X_raw, list(X_raw.columns), num_cols, cat_cols, unique_categories


# ==============================================================================
# Routes
# ==============================================================================

@app.route('/')
def index():
    """Serves the main single-page application."""
    if os.path.exists(os.path.join(app.template_folder, 'index.html')):
        return render_template('index.html')
    # Fallback to serving root index.html if templates directory not used
    return send_from_directory('.', 'index.html')


@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serves static files (CSS, JS)."""
    return send_from_directory('static', filename)


@app.route('/api/upload', methods=['POST'])
def upload_dataset():
    """
    Section 1: Ingests uploaded CSV file, extracts row/column counts,
    detects candidate target columns, and returns a preview table.
    """
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded. Please select a CSV file."}), 400

    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({"success": False, "error": "Invalid file format. Please upload a .csv file."}), 400

    try:
        content = file.read().decode('utf-8', errors='replace')
        df = pd.read_csv(io.StringIO(content))
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to parse CSV file: {str(e)}"}), 400

    if len(df) < 10:
        return jsonify({"success": False, "error": f"Dataset is too small ({len(df)} rows). Please upload at least 10 rows."}), 400

    # Auto-detect candidate target columns
    candidate_targets = []
    preferred = ['churn', 'exited', 'target', 'attrition', 'status', 'left']
    for col in df.columns:
        if any(p in col.lower() for p in preferred):
            candidate_targets.append(col)

    # Check for binary columns
    for col in df.columns:
        if col not in candidate_targets and df[col].nunique(dropna=True) == 2:
            candidate_targets.append(col)

    default_target = candidate_targets[0] if candidate_targets else df.columns[-1]

    # Save to session
    SESSION_STATE["df"] = df
    SESSION_STATE["target_col"] = default_target

    # Total missing values count
    total_missing = int(df.isnull().sum().sum())

    # Build column types summary
    columns_info = []
    for col in df.columns:
        dtype = "numeric" if pd.api.types.is_numeric_dtype(df[col]) else "categorical"
        columns_info.append({
            "name": col,
            "type": dtype,
            "unique": int(df[col].nunique()),
            "missing": int(df[col].isnull().sum())
        })

    # Preview first 8 rows
    preview_df = df.head(8).fillna("–")
    preview_rows = preview_df.to_dict(orient='records')

    return jsonify({
        "success": True,
        "filename": file.filename,
        "rows": len(df),
        "columns_count": len(df.columns),
        "columns": columns_info,
        "candidate_targets": candidate_targets,
        "default_target": default_target,
        "total_missing": total_missing,
        "preview_rows": preview_rows
    })


@app.route('/api/sample-data', methods=['GET', 'POST'])
def load_sample_data():
    """Loads the bundled sample customer churn CSV dataset for instant testing."""
    sample_path = 'sample_churn_data.csv'
    if not os.path.exists(sample_path):
        sample_path = 'customer_churn_test.csv'

    if not os.path.exists(sample_path):
        return jsonify({"success": False, "error": "Sample data file not found."}), 404

    df = pd.read_csv(sample_path)
    SESSION_STATE["df"] = df
    SESSION_STATE["target_col"] = "Churn" if "Churn" in df.columns else df.columns[-1]

    columns_info = []
    for col in df.columns:
        dtype = "numeric" if pd.api.types.is_numeric_dtype(df[col]) else "categorical"
        columns_info.append({
            "name": col,
            "type": dtype,
            "unique": int(df[col].nunique()),
            "missing": int(df[col].isnull().sum())
        })

    preview_df = df.head(8).fillna("–")
    preview_rows = preview_df.to_dict(orient='records')

    return jsonify({
        "success": True,
        "filename": "sample_churn_data.csv",
        "rows": len(df),
        "columns_count": len(df.columns),
        "columns": columns_info,
        "candidate_targets": ["Churn"],
        "default_target": "Churn",
        "total_missing": int(df.isnull().sum().sum()),
        "preview_rows": preview_rows
    })


@app.route('/api/train', methods=['POST'])
def train_models():
    """
    Section 2 & 3:
    - Trains Logistic Regression and Random Forest.
    - Preprocessing is fitted strictly on X_train to prevent data leakage.
    - Computes Accuracy, Precision, Recall, F1-Score, and Confusion Matrix.
    - Automatically highlights the model with highest F1-Score.
    - Computes simple feature importances.
    """
    df = SESSION_STATE.get("df")
    if df is None:
        # Auto-load sample data if user clicked Train directly
        load_sample_data()
        df = SESSION_STATE.get("df")

    if df is None:
        return jsonify({"success": False, "error": "No dataset found. Please upload a CSV first."}), 400

    target_col = request.form.get("target_column") or SESSION_STATE.get("target_col")
    if not target_col or target_col not in df.columns:
        return jsonify({"success": False, "error": f"Target column '{target_col}' not found in dataset."}), 400

    # 1. Clean target variable
    try:
        y = clean_target_series(df[target_col])
    except Exception as e:
        return jsonify({"success": False, "error": f"Invalid target column: {str(e)}"}), 400

    # 2. Check class representation
    churn_count = int((y == 1).sum())
    retained_count = int((y == 0).sum())
    if churn_count < 2 or retained_count < 2:
        return jsonify({
            "success": False,
            "error": f"Cannot train model: Target column must have at least 2 records for each class. Found {churn_count} Churned vs {retained_count} Retained."
        }), 400

    # 3. Identify numeric and categorical columns, dropping IDs
    try:
        X, feature_cols, num_cols, cat_cols, unique_categories = identify_columns(df, target_col)
    except Exception as e:
        return jsonify({"success": False, "error": f"Error preparing features: {str(e)}"}), 400

    if len(feature_cols) == 0:
        return jsonify({"success": False, "error": "No usable predictor features found after removing identifiers."}), 400

    # 4. Split data into training and testing sets (80/20 stratified split)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # 5. Build Scikit-Learn Preprocessing Pipeline
    # CRITICAL: We fit this ColumnTransformer ONLY on X_train to prevent data leakage!
    transformers = []
    if num_cols:
        num_pipe = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        transformers.append(('num', num_pipe, num_cols))

    if cat_cols:
        cat_pipe = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(sparse_output=False, handle_unknown='ignore'))
        ])
        transformers.append(('cat', cat_pipe, cat_cols))

    preprocessor = ColumnTransformer(transformers=transformers, remainder='drop')

    # Fit preprocessor strictly on training data
    preprocessor.fit(X_train)
    encoded_feature_names = preprocessor.get_feature_names_out()
    clean_feature_names = [n.replace('num__', '').replace('cat__', '') for n in encoded_feature_names]

    # Transform both splits using the fitted preprocessor
    X_train_trans = preprocessor.transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    # 6. Candidate Models
    models_to_train = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    }

    results = []
    fitted_models = {}
    best_f1 = -1.0
    best_model_name = None

    for name, clf in models_to_train.items():
        # Train model on preprocessed training data
        clf.fit(X_train_trans, y_train)
        fitted_models[name] = clf

        # Evaluate on test set
        y_pred = clf.predict(X_test_trans)

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))

        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        if cm.shape == (2, 2):
            tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
        else:
            tn, fp, fn, tp = int(cm[0, 0]), 0, 0, 0

        model_eval = {
            "name": name,
            "accuracy": round(acc, 3),
            "precision": round(prec, 3),
            "recall": round(rec, 3),
            "f1": round(f1, 3),
            "confusion_matrix": {
                "tn": tn,
                "fp": fp,
                "fn": fn,
                "tp": tp
            },
            "is_best": False
        }
        results.append(model_eval)

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name

    # Mark the best model based on F1-Score
    for r in results:
        if r["name"] == best_model_name:
            r["is_best"] = True

    # 7. Extract Feature Importance for the best model (Section 5)
    best_clf = fitted_models[best_model_name]
    feature_importances = []

    try:
        if hasattr(best_clf, 'feature_importances_'):
            # Random Forest feature importance
            raw_scores = best_clf.feature_importances_
        elif hasattr(best_clf, 'coef_'):
            # Logistic Regression absolute coefficients
            raw_scores = np.abs(best_clf.coef_[0])
        else:
            raw_scores = np.ones(len(clean_feature_names)) / len(clean_feature_names)

        sorted_indices = np.argsort(raw_scores)[::-1]
        top_k = min(8, len(sorted_indices))

        for i in range(top_k):
            idx = sorted_indices[i]
            score = float(raw_scores[idx])
            name = clean_feature_names[idx]
            feature_importances.append({
                "feature": name,
                "importance": round(score, 3),
                "rank": i + 1,
                "explanation": f"Feature '{name}' strongly impacts whether the customer will stay or leave."
            })
    except Exception as e:
        print(f"Feature importance calculation error: {e}")

    # Save to session state
    SESSION_STATE["target_col"] = target_col
    SESSION_STATE["feature_cols"] = feature_cols
    SESSION_STATE["num_cols"] = num_cols
    SESSION_STATE["cat_cols"] = cat_cols
    SESSION_STATE["unique_categories"] = unique_categories
    SESSION_STATE["preprocessor"] = preprocessor
    SESSION_STATE["models"] = fitted_models
    SESSION_STATE["best_model_name"] = best_model_name
    SESSION_STATE["evaluation_results"] = results
    SESSION_STATE["feature_importances"] = feature_importances

    return jsonify({
        "success": True,
        "best_model": best_model_name,
        "best_f1": round(best_f1, 3),
        "models": results,
        "feature_importances": feature_importances,
        "feature_cols": feature_cols,
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "unique_categories": unique_categories,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "churn_count": churn_count,
        "retained_count": retained_count
    })


@app.route('/api/predict', methods=['POST'])
def predict_churn():
    """
    Section 4: Single Customer Prediction.
    Accepts customer profile parameters matching the uploaded dataset,
    transforms them using the fitted preprocessor, and returns the prediction
    and churn probability.
    """
    preprocessor = SESSION_STATE.get("preprocessor")
    models = SESSION_STATE.get("models")
    best_name = SESSION_STATE.get("best_model_name", "Random Forest")

    if preprocessor is None or not models:
        # Train automatically if not yet trained
        train_models()
        preprocessor = SESSION_STATE.get("preprocessor")
        models = SESSION_STATE.get("models")
        best_name = SESSION_STATE.get("best_model_name", "Random Forest")

    if preprocessor is None or not models:
        return jsonify({"success": False, "error": "Please train models first before making predictions."}), 400

    payload = request.get_json() or {}
    selected_model_name = payload.get("selected_model", best_name)
    model = models.get(selected_model_name, list(models.values())[0])

    feature_cols = SESSION_STATE.get("feature_cols", [])
    num_cols = SESSION_STATE.get("num_cols", [])

    # Construct single customer dataframe
    row_data = {}
    for col in feature_cols:
        val = payload.get(col, '')
        if col in num_cols:
            try:
                row_data[col] = float(val) if val != '' else 0.0
            except ValueError:
                row_data[col] = 0.0
        else:
            row_data[col] = str(val)

    customer_df = pd.DataFrame([row_data])

    try:
        trans_data = preprocessor.transform(customer_df)
        prediction = int(model.predict(trans_data)[0])

        probability = None
        if hasattr(model, 'predict_proba'):
            prob_array = model.predict_proba(trans_data)[0]
            probability = round(float(prob_array[1]) * 100, 1)

        result_label = "Likely to Churn" if prediction == 1 else "Likely to Stay"
        risk_level = "High Risk" if (probability is not None and probability >= 50.0) else "Low Risk"

        return jsonify({
            "success": True,
            "model_used": selected_model_name,
            "prediction": result_label,
            "churn_flag": prediction,
            "probability": probability,
            "risk_level": risk_level
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Prediction error: {str(e)}"}), 400


if __name__ == '__main__':
    # Start local Flask development server
    print("\n" + "=" * 60)
    print(" Customer Churn Prediction — Flask Server Starting")
    print(" Open in browser: http://localhost:5000")
    print("=" * 60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
