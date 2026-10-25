# Customer Churn Prediction

End-to-end customer churn project built around the IBM Telco Customer Churn dataset. The repository contains a reproducible Python training pipeline and an interactive React dashboard that visualises the results.

## What is included

- `run_pipeline.py` - loads and cleans the dataset, builds preprocessing pipelines, trains and compares four classifiers, evaluates them on a stratified holdout split, computes SHAP values for XGBoost, and regenerates the dashboard data.
- `src/` - React + TypeScript dashboard. It reads `src/pipelineResults.json`, so the charts and tables always match the latest pipeline run.
- `data/Telco-Customer-Churn.csv` - public IBM Telco sample dataset used by the pipeline.

## Dataset

The IBM Telco Customer Churn dataset contains 7,043 customers and 21 columns (19 predictors plus the customer ID and churn label).

Source: https://github.com/IBM/telco-customer-churn-on-icp4d

## Run the training pipeline

Requires Python 3.10+.

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run_pipeline.py
```

The script prints a model comparison and writes:

- `src/pipelineResults.json` - data used by the dashboard
- `churn_model_pipeline.joblib` - fitted champion pipeline (not committed)

## Run the dashboard

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. To create a production build:

```bash
npm run build
```

## Model comparison

Held-out test set: 1,409 customers (20% stratified split).

| Model | 5-fold CV ROC-AUC | Test ROC-AUC | Accuracy | F1 |
| --- | --- | --- | --- | --- |
| XGBoost | 0.847 | 0.845 | 0.806 | 0.592 |
| Random Forest | 0.846 | 0.843 | 0.754 | 0.634 |
| Logistic Regression | 0.846 | 0.841 | 0.742 | 0.617 |
| Decision Tree | 0.824 | 0.831 | 0.735 | 0.618 |

XGBoost is selected as the champion model by test ROC-AUC. The dashboard also includes:

- exploratory statistics and contract-level churn rates
- preprocessing specification
- ROC curves and confusion matrices for every model
- mean absolute SHAP values for the top five churn drivers
- a live risk estimator

## Notes

- The live risk estimator is a simplified scoring model for interactive what-if analysis. The trained pipeline and all reported metrics come from `run_pipeline.py`.
- SHAP values are computed with `shap.TreeExplainer` on the fitted XGBoost model.
- Rerun `python run_pipeline.py` after changing the dataset or model settings to refresh `src/pipelineResults.json`.

## Stack

Python, Pandas, NumPy, Scikit-Learn, XGBoost, SHAP, React, TypeScript, Vite, Tailwind CSS, Recharts.
