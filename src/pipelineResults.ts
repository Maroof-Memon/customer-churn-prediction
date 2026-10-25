import results from './pipelineResults.json';

export interface CustomerRecord {
  id: string;
  gender: string;
  tenure: number;
  contract: 'Month-to-month' | 'One year' | 'Two year';
  internetService: 'DSL' | 'Fiber optic' | 'No';
  techSupport: string;
  paymentMethod: string;
  monthlyCharges: number;
  totalCharges: number;
  churn: 'Yes' | 'No';
}

export interface ModelMetric {
  name: string;
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  cvAuc?: number;
  cvStd?: number;
}

export interface ConfusionMatrixData {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

export interface ShapFeature {
  feature: string;
  importance: number;
  direction: 'positive' | 'negative';
  description: string;
}

export const DATASET_SUMMARY = results.datasetSummary;
export const CHURN_BY_CONTRACT = results.churnByContract;
export const MONTHLY_CHARGES_VS_CHURN = results.monthlyChargesVsChurn;
export const SAMPLE_DATASET_ROWS = results.sampleDatasetRows as unknown as CustomerRecord[];
export const MODEL_BENCHMARK_RESULTS = results.modelBenchmarkResults as ModelMetric[];
export const ROC_CURVE_DATA = results.rocCurveData;
export const CONFUSION_MATRICES = results.confusionMatrices as Record<string, ConfusionMatrixData>;
export const SHAP_FEATURE_IMPORTANCE = results.shapFeatureImportance as unknown as ShapFeature[];

export const PREPROCESSING_SPECS = {
  numericFeatures: ['tenure', 'MonthlyCharges', 'TotalCharges'],
  categoricalFeatures: [
    'gender',
    'SeniorCitizen',
    'Partner',
    'Dependents',
    'PhoneService',
    'MultipleLines',
    'InternetService',
    'OnlineSecurity',
    'OnlineBackup',
    'DeviceProtection',
    'TechSupport',
    'StreamingTV',
    'StreamingMovies',
    'Contract',
    'PaperlessBilling',
    'PaymentMethod',
  ],
  pipelinePythonCode: `from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
import xgboost as xgb

numeric_features = ['tenure', 'MonthlyCharges', 'TotalCharges']
categorical_features = [
    'gender', 'SeniorCitizen', 'Partner', 'Dependents', 'PhoneService',
    'MultipleLines', 'InternetService', 'OnlineSecurity', 'OnlineBackup',
    'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies',
    'Contract', 'PaperlessBilling', 'PaymentMethod'
]

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numeric_features),
        ('cat', OneHotEncoder(drop='first', handle_unknown='ignore', sparse_output=False), categorical_features)
    ]
)

model_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', xgb.XGBClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=3,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric='logloss',
        random_state=42
    ))
])`,
};
