#!/usr/bin/env python3
"""
Customer Churn Prediction - end-to-end Scikit-Learn / XGBoost pipeline.

Loads the IBM Telco Customer Churn dataset, trains and compares four
classifiers, evaluates them on a held-out test split, computes SHAP values
for the XGBoost model, and writes the dashboard data to
src/pipelineResults.json.

Run locally:
    python -m venv .venv
    .venv\\Scripts\\Activate.ps1
    pip install -r requirements.txt
    python run_pipeline.py
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

ROOT = Path(__file__).resolve().parent
DATA_CANDIDATES = [
    ROOT / "data" / "Telco-Customer-Churn.csv",
    ROOT / "WA_Fn-UseC_-Telco-Customer-Churn.csv",
]
OUTPUT_PATH = ROOT / "src" / "pipelineResults.json"
MODEL_PATH = ROOT / "churn_model_pipeline.joblib"

NUMERIC_FEATURES = ["tenure", "MonthlyCharges", "TotalCharges"]
CATEGORICAL_FEATURES = [
    "gender",
    "SeniorCitizen",
    "Partner",
    "Dependents",
    "PhoneService",
    "MultipleLines",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
    "Contract",
    "PaperlessBilling",
    "PaymentMethod",
]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def load_dataset() -> pd.DataFrame:
    for path in DATA_CANDIDATES:
        if path.exists():
            frame = pd.read_csv(path)
            print(f"[+] Loaded dataset: {path.relative_to(ROOT)} ({len(frame):,} rows)")
            return frame
    raise FileNotFoundError(
        "Telco dataset not found. Place Telco-Customer-Churn.csv in the data/ folder."
    )


def prepare_dataset(frame: pd.DataFrame) -> pd.DataFrame:
    frame = frame.copy()
    frame["TotalCharges"] = pd.to_numeric(frame["TotalCharges"], errors="coerce")
    frame["TotalCharges"] = frame["TotalCharges"].fillna(frame["TotalCharges"].median())
    frame["Churn_Label"] = (frame["Churn"] == "Yes").astype(int)
    return frame


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(
                    drop="first",
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )


def build_models() -> dict:
    return {
        "XGBoost": xgb.XGBClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=3,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        ),
        "Logistic Regression": LogisticRegression(
            C=0.1,
            max_iter=1000,
            class_weight="balanced",
            random_state=42,
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=5,
            class_weight="balanced",
            random_state=42,
        ),
    }


def algorithm_label(name: str) -> str:
    return {
        "XGBoost": "XGBClassifier (n_estimators=300, learning_rate=0.05, max_depth=3)",
        "Random Forest": "RandomForestClassifier (n_estimators=100, max_depth=8, class_weight=balanced)",
        "Logistic Regression": "LogisticRegression (C=0.1, penalty=l2, class_weight=balanced)",
        "Decision Tree": "DecisionTreeClassifier (max_depth=5, class_weight=balanced)",
    }[name]


def rate(frame: pd.DataFrame, column: str, value: str) -> float:
    subset = frame[frame[column] == value]
    return float(subset["Churn_Label"].mean() * 100) if len(subset) else 0.0


def band_rate(frame: pd.DataFrame, column: str, low: float, high: float) -> float:
    subset = frame[(frame[column] >= low) & (frame[column] <= high)]
    return float(subset["Churn_Label"].mean() * 100) if len(subset) else 0.0


def dataset_summary(frame: pd.DataFrame) -> dict:
    labels = frame["Churn_Label"]
    return {
        "totalRows": int(len(frame)),
        "totalFeatures": int(len(FEATURES)),
        "churnCount": int(labels.sum()),
        "retainedCount": int((labels == 0).sum()),
        "churnRate": round(float(labels.mean() * 100), 2),
        "avgTenureMonths": round(float(frame["tenure"].mean()), 1),
        "medianMonthlyCharges": round(float(frame["MonthlyCharges"].median()), 2),
    }


def churn_by_contract(frame: pd.DataFrame) -> list:
    order = {"Month-to-month": 0, "One year": 1, "Two year": 2}
    rows = []
    for contract, group in frame.groupby("Contract"):
        rows.append(
            {
                "contract": contract,
                "total": int(len(group)),
                "churned": int(group["Churn_Label"].sum()),
                "retained": int((group["Churn_Label"] == 0).sum()),
                "churnRate": round(float(group["Churn_Label"].mean() * 100), 1),
            }
        )
    rows.sort(key=lambda item: order.get(item["contract"], 99))
    return rows


def monthly_charges_vs_churn(frame: pd.DataFrame) -> list:
    bins = [0, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]
    labels = [
        "<$30",
        "$30-$40",
        "$40-$50",
        "$50-$60",
        "$60-$70",
        "$70-$80",
        "$80-$90",
        "$90-$100",
        "$100-$110",
        "$110-$120",
    ]
    ranges = pd.cut(
        frame["MonthlyCharges"],
        bins=bins,
        labels=labels,
        right=False,
        include_lowest=True,
    )
    rows = []
    for label in labels:
        group = frame[ranges == label]
        rows.append(
            {
                "range": label,
                "retained": int((group["Churn_Label"] == 0).sum()),
                "churned": int(group["Churn_Label"].sum()),
                "churnRate": round(float(group["Churn_Label"].mean() * 100), 1)
                if len(group)
                else 0.0,
            }
        )
    return rows


def sample_rows(frame: pd.DataFrame) -> list:
    rows = []
    for _, row in frame.head(10).iterrows():
        rows.append(
            {
                "id": row["customerID"],
                "gender": row["gender"],
                "tenure": int(row["tenure"]),
                "contract": row["Contract"],
                "internetService": row["InternetService"],
                "techSupport": row["TechSupport"],
                "paymentMethod": row["PaymentMethod"],
                "monthlyCharges": round(float(row["MonthlyCharges"]), 2),
                "totalCharges": round(float(row["TotalCharges"]), 2),
                "churn": row["Churn"],
            }
        )
    return rows


def train_and_evaluate(frame: pd.DataFrame):
    features = frame[FEATURES]
    labels = frame["Churn_Label"]
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.20,
        stratify=labels,
        random_state=42,
    )
    cross_validation = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    metrics = []
    confusion = {}
    probabilities = {}
    fitted = {}

    for name, classifier in build_models().items():
        pipeline = Pipeline(
            [
                ("preprocessor", build_preprocessor()),
                ("classifier", classifier),
            ]
        )
        scores = cross_val_score(
            pipeline,
            x_train,
            y_train,
            cv=cross_validation,
            scoring="roc_auc",
            n_jobs=-1,
        )
        pipeline.fit(x_train, y_train)
        probability = pipeline.predict_proba(x_test)[:, 1]
        prediction = (probability >= 0.5).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, prediction).ravel()

        metrics.append(
            {
                "name": name,
                "algorithm": algorithm_label(name),
                "accuracy": round(float(accuracy_score(y_test, prediction)), 3),
                "precision": round(float(precision_score(y_test, prediction)), 3),
                "recall": round(float(recall_score(y_test, prediction)), 3),
                "f1": round(float(f1_score(y_test, prediction)), 3),
                "rocAuc": round(float(roc_auc_score(y_test, probability)), 4),
                "cvAuc": round(float(scores.mean()), 4),
                "cvStd": round(float(scores.std()), 4),
            }
        )
        confusion[name] = {
            "tp": int(tp),
            "fp": int(fp),
            "fn": int(fn),
            "tn": int(tn),
        }
        probabilities[name] = probability
        fitted[name] = pipeline

    return metrics, confusion, probabilities, fitted, x_test, y_test


def build_roc_curve(probabilities: dict, y_test: pd.Series) -> list:
    keys = {
        "XGBoost": "xgboost",
        "Random Forest": "randomForest",
        "Logistic Regression": "logisticRegression",
        "Decision Tree": "decisionTree",
    }
    curves = {}
    for name, probability in probabilities.items():
        false_positive, true_positive, _ = roc_curve(y_test, probability)
        indices = np.unique(
            np.linspace(0, len(false_positive) - 1, 14).astype(int)
        )
        curves[keys[name]] = [
            (float(false_positive[index]), float(true_positive[index]))
            for index in indices
        ]

    all_fpr = sorted(
        {0.0, 1.0}
        | {point[0] for points in curves.values() for point in points}
    )
    rows = []
    for fpr in all_fpr:
        row = {"fpr": round(fpr, 4), "baseline": round(fpr, 4)}
        for key, points in curves.items():
            xs = [point[0] for point in points]
            ys = [point[1] for point in points]
            row[key] = round(float(np.interp(fpr, xs, ys)), 4)
        rows.append(row)
    return rows


def build_feature_meta(frame: pd.DataFrame) -> dict:
    month_to_month = rate(frame, "Contract", "Month-to-month")
    two_year = rate(frame, "Contract", "Two year")
    fiber = rate(frame, "InternetService", "Fiber optic")
    dsl = rate(frame, "InternetService", "DSL")
    no_internet = rate(frame, "InternetService", "No")
    electronic_check = rate(frame, "PaymentMethod", "Electronic check")
    early_tenure = band_rate(frame, "tenure", 1, 12)
    late_tenure = band_rate(frame, "tenure", 49, 72)
    peak_charges = band_rate(frame, "MonthlyCharges", 70, 90)
    paperless_yes = rate(frame, "PaperlessBilling", "Yes")
    paperless_no = rate(frame, "PaperlessBilling", "No")
    security_no = rate(frame, "OnlineSecurity", "No")
    security_yes = rate(frame, "OnlineSecurity", "Yes")
    support_no = rate(frame, "TechSupport", "No")
    support_yes = rate(frame, "TechSupport", "Yes")

    return {
        "Contract": {
            "feature": "Contract Type (Month-to-month)",
            "direction": "positive",
            "description": (
                f"Month-to-month customers churn at {month_to_month:.1f}%, "
                f"versus {two_year:.1f}% on two-year contracts."
            ),
        },
        "tenure": {
            "feature": "Tenure (Months)",
            "direction": "negative",
            "description": (
                f"Newer customers are highest risk: {early_tenure:.1f}% churn "
                f"in months 1-12, {late_tenure:.1f}% after month 48."
            ),
        },
        "InternetService": {
            "feature": "Internet Service (Fiber optic)",
            "direction": "positive",
            "description": (
                f"Fiber optic customers churn at {fiber:.1f}%, compared with "
                f"{dsl:.1f}% for DSL and {no_internet:.1f}% for no internet."
            ),
        },
        "PaymentMethod": {
            "feature": "Payment Method (Electronic check)",
            "direction": "positive",
            "description": (
                f"Electronic-check customers churn at {electronic_check:.1f}%, "
                "the highest rate of any payment method."
            ),
        },
        "MonthlyCharges": {
            "feature": "Monthly Charges ($)",
            "direction": "positive",
            "description": (
                f"Churn rises with monthly charges, reaching "
                f"{peak_charges:.1f}% in the $70-$90 band."
            ),
        },
        "PaperlessBilling": {
            "feature": "Paperless Billing (Yes)",
            "direction": "positive",
            "description": (
                f"Paperless-billing customers churn at {paperless_yes:.1f}%, "
                f"versus {paperless_no:.1f}% without paperless billing."
            ),
        },
        "OnlineSecurity": {
            "feature": "Online Security (No)",
            "direction": "positive",
            "description": (
                f"Customers without online security churn at {security_no:.1f}%, "
                f"versus {security_yes:.1f}% with it."
            ),
        },
        "TechSupport": {
            "feature": "Tech Support (No)",
            "direction": "positive",
            "description": (
                f"Customers without tech support churn at {support_no:.1f}%, "
                f"versus {support_yes:.1f}% with it."
            ),
        },
    }


def build_shap(pipeline: Pipeline, x_test: pd.DataFrame, frame: pd.DataFrame) -> list:
    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]
    transformed = preprocessor.transform(x_test)
    explainer = shap.TreeExplainer(classifier)
    values = explainer.shap_values(transformed)
    if isinstance(values, list):
        values = values[1]
    if values.ndim == 3:
        values = values[:, :, 1]

    feature_names = preprocessor.get_feature_names_out()
    grouped = {}
    for index, raw_name in enumerate(feature_names):
        name = raw_name.split("__", 1)[1]
        base = name
        for candidate in CATEGORICAL_FEATURES:
            if name == candidate or name.startswith(candidate + "_"):
                base = candidate
                break
        for candidate in NUMERIC_FEATURES:
            if name == candidate:
                base = candidate
                break
        grouped.setdefault(base, []).append(index)

    ranked = []
    for base, indices in grouped.items():
        importance = float(np.abs(values[:, indices]).sum(axis=1).mean())
        ranked.append((base, importance))
    ranked.sort(key=lambda item: item[1], reverse=True)

    meta = build_feature_meta(frame)
    rows = []
    for base, importance in ranked:
        if base in meta:
            info = meta[base]
            signed = -importance if info["direction"] == "negative" else importance
            rows.append(
                {
                    "feature": info["feature"],
                    "importance": round(signed, 4),
                    "direction": info["direction"],
                    "description": info["description"],
                }
            )
        else:
            rows.append(
                {
                    "feature": base,
                    "importance": round(importance, 4),
                    "direction": "positive",
                    "description": f"Mean absolute SHAP contribution: {importance:.3f}.",
                }
            )
        if len(rows) == 5:
            break
    return rows


def main() -> None:
    print("=" * 70)
    print("CUSTOMER CHURN PREDICTION - TRAINING PIPELINE")
    print("=" * 70)

    frame = prepare_dataset(load_dataset())
    print(
        f"[+] Cohort: {len(frame):,} customers | "
        f"Churn rate: {frame['Churn_Label'].mean() * 100:.2f}%"
    )

    metrics, confusion, probabilities, fitted, x_test, y_test = train_and_evaluate(
        frame
    )

    print("\n[+] Model comparison (held-out 20% test split):")
    print(f"{'Model':<22} {'CV AUC':<8} {'Test AUC':<9} {'Accuracy':<9} {'F1':<7}")
    print("-" * 62)
    for row in metrics:
        print(
            f"{row['name']:<22} {row['cvAuc']:<8.4f} {row['rocAuc']:<9.4f} "
            f"{row['accuracy']:<9.3f} {row['f1']:<7.3f}"
        )

    champion = max(metrics, key=lambda item: item["rocAuc"])
    print(
        f"\n[+] Champion: {champion['name']} "
        f"(test ROC-AUC {champion['rocAuc']:.4f})"
    )

    shap_rows = build_shap(fitted["XGBoost"], x_test, frame)
    print("\n[+] Top SHAP drivers:")
    for row in shap_rows:
        print(f"    {row['feature']:<42} {row['importance']:+.4f}")

    results = {
        "datasetSummary": dataset_summary(frame),
        "churnByContract": churn_by_contract(frame),
        "monthlyChargesVsChurn": monthly_charges_vs_churn(frame),
        "sampleDatasetRows": sample_rows(frame),
        "modelBenchmarkResults": metrics,
        "rocCurveData": build_roc_curve(probabilities, y_test),
        "confusionMatrices": confusion,
        "shapFeatureImportance": shap_rows,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as handle:
        json.dump(results, handle, indent=2)

    joblib.dump(fitted[champion["name"]], MODEL_PATH)

    print(f"\n[+] Dashboard data written to: {OUTPUT_PATH.relative_to(ROOT)}")
    print(f"[+] Champion pipeline exported to: {MODEL_PATH.name}")
    print("[+] Pipeline execution finished successfully.")


if __name__ == "__main__":
    main()
