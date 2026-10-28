# Customer Churn Prediction — Flask & Scikit-Learn AI Platform

A clean, modern, beginner-friendly machine learning web application that predicts whether a customer is likely to leave (churn from) a company.

Built using **Python, Flask, Pandas, and Scikit-Learn**, with interactive visualizations powered by **Chart.js**.

---

## 📌 Project Overview

Customer churn occurs when a customer cancels their subscription or stops doing business with a company. This application provides a complete, leak-free machine learning workflow on a **single scrollable page**:

- **Section 1: Upload Dataset:** Ingest any customer CSV, inspect rows, columns, and missing values, select the target column (`Churn`), and view a data preview table. Includes a 1-click **Use Sample Dataset** button.
- **Section 2: Train AI Model:** With a single click, trains two industry-standard classifiers: **Logistic Regression** and **Random Forest**. Preprocessing (median imputation, standard scaling, and one-hot encoding) is fitted **strictly on the 80% training set** to prevent data leakage.
- **Section 3: Model Evaluation:** Evaluates both models on the isolated 20% test split across **Accuracy, Precision, Recall, and F1-score**, displays confusion matrices, and automatically awards a **★ Best Model (Highest F1-Score)** badge to the winning model.
- **Section 4: Customer Prediction:** Dynamically generates input fields matching the features of the uploaded dataset, allowing users to enter customer attributes and compute real-time defection probabilities.
- **Section 5: Feature Importance:** Visualizes a simple horizontal bar chart showing which customer characteristics (e.g. Month-to-month contracts, low tenure, high monthly fees) have the greatest influence on churn.

---

## 📁 Project Structure

```
.
├── app.py                     # Python Flask backend & Scikit-Learn training/inference pipeline
├── sample_churn_data.csv      # Bundled 100-row realistic customer churn dataset
├── requirements.txt           # Python dependencies (Flask, Pandas, Scikit-learn, Joblib)
├── templates/
│   └── index.html             # Clean single-page HTML layout with 5 scrollable sections
├── static/
│   ├── style.css              # Dark theme CSS with responsive cards and meter bars
│   └── script.js              # Vanilla JavaScript for API calls, dynamic forms, and Chart.js
└── README.md                  # Installation, running guide, and interview explanations
```

---

## 🚀 Step-by-Step Local Setup & Run Guide

Follow these steps to run the application on your computer using a standard Python virtual environment.

### Prerequisites
Make sure you have **Python 3.10 or higher** installed. Check in your terminal:
```bash
python --version
```
*(On macOS/Linux, you may need to use `python3`).*

---

### Step 1: Open Terminal in Project Folder
Open your terminal (PowerShell, Command Prompt, or Terminal) and navigate to the project directory:
```bash
cd /path/to/Customer-Churn-Prediction
```

---

### Step 2: Create a Python Virtual Environment
Creating a virtual environment keeps your project dependencies isolated.

- **On Windows (PowerShell):**
  ```powershell
  python -m venv venv
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\venv\Scripts\Activate.ps1
  ```

- **On Windows (Command Prompt):**
  ```cmd
  python -m venv venv
  venv\Scripts\activate.bat
  ```

- **On macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

*(When activated, `(venv)` will appear at the start of your terminal line).*

---

### Step 3: Install Required Dependencies
Upgrade `pip` and install the required packages listed in `requirements.txt`:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 4: Run the Flask Web Application
Start the Flask development server:
```bash
python app.py
```

You will see:
```text
============================================================
 Customer Churn Prediction — Flask Server Starting
 Open in browser: http://localhost:5000
============================================================
 * Running on http://127.0.0.1:5000
```

---

### Step 5: Open in Your Browser
Open your favorite web browser and go to:
```
http://localhost:5000
```

1. Click **"Use Sample Dataset (100 Rows)"** to inspect the data preview.
2. Scroll to Section 2 and click **"Train Models"**.
3. View the evaluation comparison in Section 3 and the winning model badge.
4. In Section 4, adjust customer details (e.g. set tenure to 1 month and contract to Month-to-month) and click **"Predict Customer Churn"** to see live predictions.
5. In Section 5, explore the top features driving churn decisions.

---

## 💡 How to Explain This Project in an AI Engineer Interview

When discussing this project in an interview, highlight these key engineering decisions:

1. **Data Leakage Prevention:**
   > *"A common mistake is scaling or imputing data on the entire dataset before splitting. In this project, I used Scikit-Learn's `ColumnTransformer` inside an isolated training step: the median imputer, standard scaler, and one-hot encoder are strictly fitted on the 80% training split. The 20% test split is transformed using the training parameters, ensuring realistic evaluation."*

2. **Why F1-Score Decides the Best Model:**
   > *"In customer churn datasets, the churn class is usually the minority. High accuracy can be deceiving: a trivial model predicting everyone stays might achieve 80% accuracy while failing completely at catching churners. F1-score is the harmonic mean of Precision and Recall, balancing false alarms against missed churners."*

3. **Model Comparison (Linear vs Non-Linear):**
   > *"I trained Logistic Regression as an interpretable linear baseline and Random Forest to capture non-linear feature interactions (such as the compounding risk of high monthly charges combined with short tenure and no tech support)."*

4. **Dynamic Preprocessing Schema:**
   > *"The application dynamically categorizes uploaded columns into numeric vs categorical types, automatically discards identifier keys (like `customerID`), and dynamically generates input form fields so users can score customers on any valid tabular churn dataset."*
