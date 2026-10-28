// ==============================================================================
// Customer Churn Prediction — Single-Page Client Application
// Vanilla JavaScript connecting to Flask backend
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let currentDataset = null;
  let trainedModels = null;
  let bestModel = null;
  let evalChart = null;
  let featChart = null;

  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const btnSelectFile = document.getElementById('btnSelectFile');
  const btnUseSample = document.getElementById('btnUseSample');
  const targetColSelect = document.getElementById('targetColSelect');
  const uploadAlert = document.getElementById('uploadAlert');

  const metaFilename = document.getElementById('metaFilename');
  const metaRows = document.getElementById('metaRows');
  const metaCols = document.getElementById('metaCols');
  const metaMissing = document.getElementById('metaMissing');

  const previewTableHeaders = document.getElementById('previewTableHeaders');
  const previewTableBody = document.getElementById('previewTableBody');

  const btnTrain = document.getElementById('btnTrain');
  const trainAlert = document.getElementById('trainAlert');

  const evalContainer = document.getElementById('evalContainer');
  const evalEmpty = document.getElementById('evalEmpty');
  const evalCards = document.getElementById('evalCards');

  const predictEmpty = document.getElementById('predictEmpty');
  const predictFormContainer = document.getElementById('predictFormContainer');
  const predictModelSelect = document.getElementById('predictModelSelect');
  const btnPredict = document.getElementById('btnPredict');
  const predictResult = document.getElementById('predictResult');
  const predStatus = document.getElementById('predStatus');
  const predProb = document.getElementById('predProb');
  const probMeterFill = document.getElementById('probMeterFill');
  const predNote = document.getElementById('predNote');

  const featSection = document.getElementById('featSection');
  const featEmpty = document.getElementById('featEmpty');
  const featList = document.getElementById('featList');

  // ============================================================================
  // Helpers
  // ============================================================================
  const showAlert = (el, message, type = 'error') => {
    if (!el) return;
    el.style.display = 'flex';
    el.className = `alert alert-${type}`;
    const icon = type === 'error' ? '❌' : (type === 'success' ? '✅' : 'ℹ️');
    el.innerHTML = `<span>${icon}</span><div>${message}</div>`;
  };

  const hideAlert = (el) => {
    if (el) el.style.display = 'none';
  };

  // ============================================================================
  // Section 1: Upload Dataset & Metadata Inspection
  // ============================================================================
  if (btnSelectFile && fileInput) {
    btnSelectFile.addEventListener('click', () => fileInput.click());
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadFile(e.target.files[0]);
      }
    });
  }

  if (btnUseSample) {
    btnUseSample.addEventListener('click', async () => {
      hideAlert(uploadAlert);
      btnUseSample.disabled = true;
      btnUseSample.textContent = 'Loading Sample...';
      try {
        const res = await fetch('/api/sample-data');
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load sample dataset.');
        }
        displayDatasetMetadata(data);
        showAlert(uploadAlert, 'Loaded sample customer churn dataset (100 rows). You can now click "Train Models".', 'success');
      } catch (err) {
        showAlert(uploadAlert, err.message || 'Error loading sample data.');
      } finally {
        btnUseSample.disabled = false;
        btnUseSample.textContent = 'Use Sample Dataset';
      }
    });
  }

  const uploadFile = async (file) => {
    hideAlert(uploadAlert);
    if (!file.name.endsWith('.csv')) {
      showAlert(uploadAlert, 'Invalid file format. Please upload a .csv file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const dropzoneTitle = document.getElementById('dropzoneTitle');
    if (dropzoneTitle) dropzoneTitle.textContent = `Reading ${file.name}...`;

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload and parse CSV.');
      }
      displayDatasetMetadata(data);
      showAlert(uploadAlert, `Successfully loaded "${data.filename}". Target column selected: "${data.default_target}".`, 'success');
      if (dropzoneTitle) dropzoneTitle.textContent = `Active File: ${data.filename}`;
    } catch (err) {
      if (dropzoneTitle) dropzoneTitle.textContent = 'Drag and drop your CSV here';
      showAlert(uploadAlert, err.message || 'Error uploading dataset.');
    }
  };

  const displayDatasetMetadata = (data) => {
    currentDataset = data;
    metaFilename.textContent = data.filename;
    metaRows.textContent = Number(data.rows).toLocaleString();
    metaCols.textContent = Number(data.columns_count).toLocaleString();
    metaMissing.textContent = Number(data.total_missing).toLocaleString();

    // Populate target column dropdown (FIXED: Force select the actual Churn/Exited column)
    if (targetColSelect && data.columns) {
      targetColSelect.innerHTML = '';
      let matchedTarget = false;

      data.columns.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col.name;
        opt.textContent = `${col.name} (${col.type})`;
        
        // If this is the target column, select it
        if (col.name === data.default_target || 
            col.name.toLowerCase() === 'churn' || 
            col.name.toLowerCase() === 'exited') {
          opt.selected = true;
          matchedTarget = true;
        }
        targetColSelect.appendChild(opt);
      });

      // Fallback: If the backend didn't give a target, check if there's an ID column selected and switch it
      if (!matchedTarget && targetColSelect.options.length > 0) {
         const firstOpt = targetColSelect.options[0];
         if (firstOpt.text.includes('int') || firstOpt.text.includes('string')) {
             // Just select the last column as a fallback if it looks like an ID
             targetColSelect.selectedIndex = targetColSelect.options.length - 1;
         }
      }
    }

    // Render Preview Table
    if (data.preview_rows && data.preview_rows.length > 0) {
      const sample = data.preview_rows[0];
      const cols = Object.keys(sample);
      if (previewTableHeaders) {
        previewTableHeaders.innerHTML = cols.map(c => `<th>${c}</th>`).join('');
      }
      if (previewTableBody) {
        previewTableBody.innerHTML = data.preview_rows.map(row => {
          const cells = cols.map(c => {
            const val = row[c];
            if (c.toLowerCase() === 'churn' || c.toLowerCase() === 'target' || c.toLowerCase() === 'exited') {
              const isYes = String(val).toLowerCase() === 'yes' || String(val) === '1' || String(val).toLowerCase() === 'true';
              return `<td><span class="badge ${isYes ? 'badge-yes' : 'badge-no'}">${val}</span></td>`;
            }
            return `<td>${val ?? '–'}</td>`;
          }).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
      }
    }

    // Reset evaluation / prediction states until user clicks train
    if (evalContainer) evalContainer.style.display = 'none';
    if (evalEmpty) evalEmpty.style.display = 'block';
    if (predictFormContainer) predictFormContainer.style.display = 'none';
    if (predictEmpty) predictEmpty.style.display = 'block';
    if (featSection) featSection.style.display = 'none';
    if (featEmpty) featEmpty.style.display = 'block';
  };

  // ============================================================================
  // Section 2: Train AI Models (Logistic Regression & Random Forest)
  // ============================================================================
  if (btnTrain) {
    btnTrain.addEventListener('click', async () => {
      hideAlert(trainAlert);
      const chosenTarget = targetColSelect ? targetColSelect.value : 'Churn';

      btnTrain.disabled = true;
      btnTrain.textContent = 'Training Models...';

      const formData = new FormData();
      formData.append('target_column', chosenTarget);

      try {
        const res = await fetch('/api/train', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Model training failed.');
        }

        trainedModels = data.models;
        bestModel = data.best_model;

        // 1. Display evaluation
        displayEvaluationResults(data);

        // 2. Build dynamic prediction input form
        buildPredictionForm(data);

        // 3. Display feature importance
        displayFeatureImportance(data);

        showAlert(
          trainAlert,
          `Training Complete! Evaluated on 20% holdout test set (${data.test_samples} test records). Best model: <strong>${data.best_model}</strong> (F1-Score: <strong>${data.best_f1}</strong>).`,
          'success'
        );
      } catch (err) {
        showAlert(trainAlert, err.message || 'Error training models.');
      } finally {
        btnTrain.disabled = false;
        btnTrain.textContent = '⚡ Train Models';
      }
    });
  }

  // ============================================================================
  // Section 3: Model Evaluation (Metrics, Best F1 Badge, Confusion Matrix, Chart)
  // ============================================================================
  const displayEvaluationResults = (data) => {
    if (evalEmpty) evalEmpty.style.display = 'none';
    if (evalContainer) evalContainer.style.display = 'block';

    // Render model comparison cards
    if (evalCards && data.models) {
      evalCards.innerHTML = data.models.map(m => {
        const isBest = m.is_best;
        const cm = m.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 };
        return `
          <div class="model-card ${isBest ? 'best' : ''}">
            <div class="model-head">
              <span class="model-name">${m.name}</span>
              ${isBest ? '<span class="badge-best">★ Best Model</span>' : ''}
            </div>

            <div class="metrics-list">
              <div class="metric-item">
                <span class="metric-label">Accuracy</span>
                <span class="metric-val">${(m.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Precision</span>
                <span class="metric-val">${(m.precision * 100).toFixed(1)}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Recall</span>
                <span class="metric-val">${(m.recall * 100).toFixed(1)}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label" style="color: var(--primary);">F1-Score</span>
                <span class="metric-val" style="color: ${isBest ? 'var(--warning)' : 'var(--primary)'};">${m.f1.toFixed(3)}</span>
              </div>
            </div>

            <div>
              <div class="cm-title">Confusion Matrix</div>
              <div class="cm-matrix">
                <div class="cm-box">
                  <span class="cm-box-label">True Negative</span>
                  <span class="cm-box-val" style="color: var(--success);">${cm.tn}</span>
                </div>
                <div class="cm-box">
                  <span class="cm-box-label">False Positive</span>
                  <span class="cm-box-val" style="color: var(--warning);">${cm.fp}</span>
                </div>
                <div class="cm-box">
                  <span class="cm-box-label">False Negative</span>
                  <span class="cm-box-val" style="color: var(--danger);">${cm.fn}</span>
                </div>
                <div class="cm-box">
                  <span class="cm-box-label">True Positive</span>
                  <span class="cm-box-val" style="color: var(--success);">${cm.tp}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Side-by-Side Comparison Chart
    const ctx = document.getElementById('evalChart');
    if (ctx && data.models && data.models.length >= 2) {
      if (evalChart) evalChart.destroy();
      const m1 = data.models[0];
      const m2 = data.models[1];

      evalChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
          datasets: [
            {
              label: m1.name,
              data: [m1.accuracy, m1.precision, m1.recall, m1.f1],
              backgroundColor: '#58a6ff', // Matched to new primary blue
              borderRadius: 4
            },
            {
              label: m2.name,
              data: [m2.accuracy, m2.precision, m2.recall, m2.f1],
              backgroundColor: '#238636', // Matched to new success green
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#8b949e', font: { size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}%`
              }
            }
          },
          scales: {
            x: {
              grid: { color: '#30363d' },
              ticks: { color: '#8b949e' }
            },
            y: {
              grid: { color: '#30363d' },
              ticks: { color: '#8b949e', callback: v => (v * 100) + '%' },
              min: 0,
              max: 1.05
            }
          }
        }
      });
    }
  };

  // ============================================================================
  // Section 4: Dynamic Customer Prediction Form
  // ============================================================================
  const buildPredictionForm = (data) => {
    if (predictEmpty) predictEmpty.style.display = 'none';
    if (predictFormContainer) predictFormContainer.style.display = 'block';

    // Populate model select dropdown
    if (predictModelSelect && data.models) {
      predictModelSelect.innerHTML = data.models.map(m => `
        <option value="${m.name}" ${m.is_best ? 'selected' : ''}>
          ${m.name} ${m.is_best ? '(Best ★)' : ''}
        </option>
      `).join('');
    }

    const formGrid = document.getElementById('predictDynamicInputs');
    if (!formGrid || !data.feature_cols) return;

    formGrid.innerHTML = '';
    const numCols = data.num_cols || [];
    const catCols = data.cat_cols || [];
    const uniqueCats = data.unique_categories || {};

    data.feature_cols.forEach(col => {
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = col;
      formGroup.appendChild(label);

      if (numCols.includes(col)) {
        // Numeric input field
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-control';
        input.name = col;
        input.id = `input_${col}`;
        input.placeholder = `Enter ${col}`;

        // Set sensible defaults if column matches common churn terms
        if (col.toLowerCase().includes('tenure')) input.value = '6';
        else if (col.toLowerCase().includes('monthly')) input.value = '85';
        else if (col.toLowerCase().includes('total')) input.value = '510';
        else input.value = '10';

        formGroup.appendChild(input);
      } else if (catCols.includes(col)) {
        // Categorical dropdown select
        const select = document.createElement('select');
        select.className = 'form-control';
        select.name = col;
        select.id = `input_${col}`;

        const cats = uniqueCats[col] || ['Yes', 'No'];
        cats.forEach(val => {
          const opt = document.createElement('option');
          opt.value = val;
          opt.textContent = val;
          select.appendChild(opt);
        });

        formGroup.appendChild(select);
      }

      formGrid.appendChild(formGroup);
    });
  };

  if (btnPredict) {
    btnPredict.addEventListener('click', async () => {
      const selectedModel = predictModelSelect ? predictModelSelect.value : 'Random Forest';
      const inputs = document.querySelectorAll('#predictDynamicInputs [name]');
      const payload = { selected_model: selectedModel };

      inputs.forEach(input => {
        payload[input.name] = input.value;
      });

      btnPredict.disabled = true;
      btnPredict.textContent = 'Calculating...';

      try {
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Prediction calculation failed.');
        }

        displayPredictionResult(result);
      } catch (err) {
        alert(err.message || 'Error making prediction.');
      } finally {
        btnPredict.disabled = false;
        btnPredict.textContent = 'Predict Churn';
      }
    });
  }

  const displayPredictionResult = (result) => {
    if (predictResult) predictResult.style.display = 'block';

    const willChurn = result.churn_flag === 1;
    if (predStatus) {
      predStatus.textContent = result.prediction;
      predStatus.style.color = willChurn ? 'var(--danger)' : 'var(--success)';
    }

    if (predProb) {
      if (result.probability !== null && result.probability !== undefined) {
        predProb.textContent = `Estimated Churn Probability: ${result.probability}% (${result.risk_level})`;
        predProb.style.display = 'block';
        
        if (probMeterFill) {
          probMeterFill.style.width = `${result.probability}%`;
          
          // Change color based on probability
          if (result.probability < 40) {
            probMeterFill.style.backgroundColor = 'var(--success)'; // Green
          } else if (result.probability < 70) {
            probMeterFill.style.backgroundColor = 'var(--warning)'; // Yellow/Orange
          } else {
            probMeterFill.style.backgroundColor = 'var(--danger)';  // Red
          }
        }
      } else {
        predProb.style.display = 'none';
      }
    }

    if (predNote) {
      predNote.textContent = willChurn
        ? `This customer is flagged as HIGH RISK of leaving. Consider reaching out with proactive retention incentives.`
        : `This customer is predicted to STAY. Their profile aligns with retained customer accounts.`;
    }

    predictResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // ============================================================================
  // Section 5: Feature Importance
  // ============================================================================
  const displayFeatureImportance = (data) => {
    if (featEmpty) featEmpty.style.display = 'none';
    if (featSection) featSection.style.display = 'block';

    const importances = data.feature_importances || [];
    if (importances.length === 0) return;

    // Render Chart.js Horizontal Bar Chart
    const ctx = document.getElementById('featChart');
    if (ctx) {
      if (featChart) featChart.destroy();
      featChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: importances.map(f => f.feature),
          datasets: [{
            label: 'Relative Feature Importance',
            data: importances.map(f => f.importance),
            backgroundColor: '#58a6ff', // Matched to new primary blue
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: '#30363d' },
              ticks: { color: '#8b949e' },
              title: { display: true, text: 'Importance Weight', color: '#8b949e', font: { size: 10 } }
            },
            y: {
              grid: { color: '#30363d' },
              ticks: { color: '#c9d1d9', font: { size: 11 } }
            }
          }
        }
      });
    }

    // Render plain-English explanation list
    if (featList) {
      const maxVal = Math.max(...importances.map(f => f.importance));
      featList.innerHTML = importances.map((f, idx) => {
        const pct = maxVal > 0 ? (f.importance / maxVal) * 100 : 50;
        return `
          <div class="feat-item">
            <div>
              <span class="feat-name">#${idx + 1} ${f.feature}</span>
              <p style="font-size: 0.72rem; color: #8b949e; margin-top: 0.15rem;">${f.explanation}</p>
            </div>
            <div class="feat-bar-wrap">
              <div class="feat-bar-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="feat-val">${f.importance.toFixed(3)}</span>
          </div>
        `;
      }).join('');
    }
  };

  // Auto-load sample dataset on first visit
  if (btnUseSample) {
    btnUseSample.click();
  }
});