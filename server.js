const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// CSV parse endpoint
app.post('/api/upload-csv', upload.single('file'), (req, res) => {
  try {
    const csv = req.file ? req.file.buffer.toString('utf-8') : req.body.csv;
    if (!csv) return res.status(400).json({ error: 'No CSV data provided' });
    const partners = parseCSV(csv);
    const scored = scorePartners(partners);
    res.json({ partners: scored, summary: buildSummary(scored) });
  } catch (e) {
    res.status(400).json({ error: 'Failed to parse CSV: ' + e.message });
  }
});

// Demo data endpoint
app.get('/api/demo-data', (req, res) => {
  const partners = getDemoData();
  const scored = scorePartners(partners);
  res.json({ partners: scored, summary: buildSummary(scored) });
});

function parseCSV(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i] || '');
    return obj;
  });
}

function scorePartners(partners) {
  return partners.map(p => {
    const deals_last_90d = parseInt(p.deals_last_90d) || 0;
    const deals_prior_90d = parseInt(p.deals_prior_90d) || 0;
    const avg_deal_value = parseFloat(p.avg_deal_value) || 0;
    const days_since_last_deal = parseInt(p.days_since_last_deal) || 0;
    const response_rate = parseFloat(p.response_rate) || 0;
    const partner_tenure_months = parseInt(p.partner_tenure_months) || 0;

    // Risk scoring model (0-100, higher = more at risk)
    let risk = 0;

    // Deal velocity decline (biggest signal) — up to 40 pts
    if (deals_prior_90d > 0) {
      const decline = 1 - (deals_last_90d / deals_prior_90d);
      risk += Math.max(0, Math.min(40, decline * 40));
    } else if (deals_last_90d === 0) {
      risk += 35;
    }

    // Recency penalty — up to 25 pts
    if (days_since_last_deal > 120) risk += 25;
    else if (days_since_last_deal > 60) risk += 15;
    else if (days_since_last_deal > 30) risk += 5;

    // Engagement drop — up to 20 pts
    risk += Math.max(0, (1 - response_rate) * 20);

    // Tenure bonus (loyal partners get slight benefit) — up to -10 pts
    if (partner_tenure_months > 24) risk -= 10;
    else if (partner_tenure_months > 12) risk -= 5;

    // Zero recent deals hard floor
    if (deals_last_90d === 0 && deals_prior_90d > 0) risk = Math.max(risk, 65);

    risk = Math.max(0, Math.min(100, Math.round(risk)));

    const est_quarterly_revenue = deals_prior_90d * avg_deal_value;
    const est_lost_revenue = est_quarterly_revenue * (risk / 100);

    let risk_tier;
    if (risk >= 70) risk_tier = 'critical';
    else if (risk >= 45) risk_tier = 'high';
    else if (risk >= 25) risk_tier = 'medium';
    else risk_tier = 'low';

    let recommended_action;
    if (risk >= 70) recommended_action = 'Urgent: Schedule executive check-in call within 48 hours';
    else if (risk >= 45) recommended_action = 'High Priority: Send personalized re-engagement offer this week';
    else if (risk >= 25) recommended_action = 'Monitor: Include in next partner newsletter with incentive';
    else recommended_action = 'Maintain: Continue regular relationship cadence';

    return {
      ...p,
      deals_last_90d, deals_prior_90d, avg_deal_value,
      days_since_last_deal, response_rate, partner_tenure_months,
      risk_score: risk, risk_tier, est_quarterly_revenue, est_lost_revenue,
      recommended_action
    };
  });
}

function buildSummary(partners) {
  const total = partners.length;
  const critical = partners.filter(p => p.risk_tier === 'critical').length;
  const high = partners.filter(p => p.risk_tier === 'high').length;
  const medium = partners.filter(p => p.risk_tier === 'medium').length;
  const low = partners.filter(p => p.risk_tier === 'low').length;
  const totalAtRiskRevenue = partners.filter(p => p.risk_score >= 45)
    .reduce((s, p) => s + p.est_lost_revenue, 0);
  const totalQuarterlyRevenue = partners.reduce((s, p) => s + p.est_quarterly_revenue, 0);
  const avgRisk = Math.round(partners.reduce((s, p) => s + p.risk_score, 0) / total);

  return {
    total_partners: total,
    critical, high, medium, low,
    total_at_risk_revenue: totalAtRiskRevenue,
    total_quarterly_revenue: totalQuarterlyRevenue,
    avg_risk_score: avgRisk,
    win_back_candidates: critical + high
  };
}

function getDemoData() {
  return [
    { partner_name: 'Apex Financial Advisors', deals_last_90d: '0', deals_prior_90d: '8', avg_deal_value: '12500', days_since_last_deal: '142', response_rate: '0.15', partner_tenure_months: '36' },
    { partner_name: 'Summit Wealth Group', deals_last_90d: '1', deals_prior_90d: '6', avg_deal_value: '18000', days_since_last_deal: '78', response_rate: '0.30', partner_tenure_months: '24' },
    { partner_name: 'Heritage Insurance Co', deals_last_90d: '0', deals_prior_90d: '5', avg_deal_value: '9500', days_since_last_deal: '165', response_rate: '0.10', partner_tenure_months: '48' },
    { partner_name: 'Pinnacle Realty Partners', deals_last_90d: '3', deals_prior_90d: '4', avg_deal_value: '22000', days_since_last_deal: '12', response_rate: '0.75', partner_tenure_months: '18' },
    { partner_name: 'Cornerstone Legal Group', deals_last_90d: '2', deals_prior_90d: '7', avg_deal_value: '15000', days_since_last_deal: '35', response_rate: '0.40', partner_tenure_months: '30' },
    { partner_name: 'Meridian Tax Services', deals_last_90d: '0', deals_prior_90d: '3', avg_deal_value: '8000', days_since_last_deal: '200', response_rate: '0.05', partner_tenure_months: '12' },
    { partner_name: 'Atlas Benefits Consulting', deals_last_90d: '5', deals_prior_90d: '5', avg_deal_value: '14000', days_since_last_deal: '5', response_rate: '0.90', partner_tenure_months: '42' },
    { partner_name: 'Vanguard CPA Associates', deals_last_90d: '1', deals_prior_90d: '9', avg_deal_value: '11000', days_since_last_deal: '88', response_rate: '0.20', partner_tenure_months: '20' },
    { partner_name: 'Beacon Mortgage Group', deals_last_90d: '4', deals_prior_90d: '3', avg_deal_value: '25000', days_since_last_deal: '8', response_rate: '0.85', partner_tenure_months: '15' },
    { partner_name: 'Northstar Risk Advisors', deals_last_90d: '0', deals_prior_90d: '4', avg_deal_value: '16000', days_since_last_deal: '130', response_rate: '0.12', partner_tenure_months: '28' },
    { partner_name: 'Ironclad Business Brokers', deals_last_90d: '2', deals_prior_90d: '2', avg_deal_value: '35000', days_since_last_deal: '22', response_rate: '0.65', partner_tenure_months: '9' },
    { partner_name: 'Evergreen Payroll Services', deals_last_90d: '1', deals_prior_90d: '5', avg_deal_value: '7500', days_since_last_deal: '62', response_rate: '0.35', partner_tenure_months: '36' },
  ];
}

app.listen(PORT, () => {
  console.log(`Lost Deal Recovery Radar running on port ${PORT}`);
});
