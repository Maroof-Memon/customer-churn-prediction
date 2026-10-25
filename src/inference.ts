export interface InferenceInput {
  tenure: number;
  monthlyCharges: number;
  contract: 'Month-to-month' | 'One year' | 'Two year';
  internetService?: 'DSL' | 'Fiber optic' | 'No';
  techSupport?: 'Yes' | 'No';
}

export function predictCustomerChurn(input: InferenceInput): {
  probability: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  factors: { name: string; impact: string; isPositive: boolean }[];
} {
  let logOdds = -0.90;
  const factors: { name: string; impact: string; isPositive: boolean }[] = [];

  if (input.contract === 'Month-to-month') {
    logOdds += 1.25;
    factors.push({
      name: 'Month-to-month Contract',
      impact: 'High Impact Feature (Increases Risk)',
      isPositive: true,
    });
  } else if (input.contract === 'Two year') {
    logOdds -= 1.40;
    factors.push({
      name: '2-Year Contract',
      impact: 'Strong Negative Correlation (Protective)',
      isPositive: false,
    });
  } else {
    logOdds -= 0.55;
    factors.push({
      name: '1-Year Contract',
      impact: 'Negative Correlation (Protective)',
      isPositive: false,
    });
  }

  if (input.tenure <= 6) {
    logOdds += 0.95;
    factors.push({
      name: `Low Tenure (${input.tenure} mos)`,
      impact: 'High Impact Feature (Increases Risk)',
      isPositive: true,
    });
  } else if (input.tenure <= 18) {
    logOdds += 0.35;
    factors.push({
      name: `Intermediate Tenure (${input.tenure} mos)`,
      impact: 'Increases Probability',
      isPositive: true,
    });
  } else if (input.tenure >= 48) {
    logOdds -= 0.90;
    factors.push({
      name: `High Tenure (${input.tenure} mos)`,
      impact: 'Negative Correlation (Protective)',
      isPositive: false,
    });
  }

  if (input.monthlyCharges >= 85) {
    const chargeWeight = (input.monthlyCharges - 85) / 35;
    logOdds += 0.40 + chargeWeight * 0.35;
    factors.push({
      name: `High Monthly Charges ($${input.monthlyCharges.toFixed(2)})`,
      impact: 'Increases Probability',
      isPositive: true,
    });
  } else if (input.monthlyCharges <= 35) {
    logOdds -= 0.35;
    factors.push({
      name: `Low Monthly Charges ($${input.monthlyCharges.toFixed(2)})`,
      impact: 'Negative Correlation (Protective)',
      isPositive: false,
    });
  }

  if (input.internetService === 'Fiber optic') {
    logOdds += 0.45;
    factors.push({
      name: 'Fiber Optic Service',
      impact: 'Increases Probability',
      isPositive: true,
    });
  }
  if (input.techSupport === 'No' && input.internetService !== 'No') {
    logOdds += 0.35;
    factors.push({
      name: 'No Tech Support',
      impact: 'Increases Probability',
      isPositive: true,
    });
  } else if (input.techSupport === 'Yes') {
    logOdds -= 0.30;
    factors.push({
      name: 'Active Tech Support',
      impact: 'Negative Correlation (Protective)',
      isPositive: false,
    });
  }

  const prob = 1 / (1 + Math.exp(-logOdds));
  const probability = Math.min(0.96, Math.max(0.03, prob));

  let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  if (probability >= 0.70) riskLevel = 'Critical';
  else if (probability >= 0.45) riskLevel = 'High';
  else if (probability >= 0.25) riskLevel = 'Moderate';

  return {
    probability,
    riskLevel,
    factors,
  };
}
