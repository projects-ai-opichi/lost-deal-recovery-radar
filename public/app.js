// ===== TUTORIAL =====
const tutorialSteps = [
  {
    title: '📡 Welcome to Recovery Radar',
    body: `<p>Every quarter, companies lose <span class="highlight">15-30% of referral partner revenue</span> to silent attrition — partners who slowly stop sending deals without ever saying goodbye.</p>
    <div class="stat-callout">The average firm loses $420K/year to undetected partner churn</div>
    <p>Recovery Radar detects these at-risk partnerships <strong>before</strong> the revenue disappears — giving you a window to act.</p>`
  },
  {
    title: '📊 Step 1: Upload Your Data',
    body: `<p>Start by uploading your referral partner history — a simple CSV with deal counts, values, and engagement metrics.</p>
    <p>We need just <span class="highlight">7 columns</span> per partner:</p>
    <ul style="color:var(--text-muted);margin:12px 0;padding-left:20px;line-height:2">
      <li><strong>partner_name</strong> — who they are</li>
      <li><strong>deals_last_90d / deals_prior_90d</strong> — deal velocity trend</li>
      <li><strong>avg_deal_value</strong> — revenue per deal</li>
      <li><strong>days_since_last_deal</strong> — recency signal</li>
      <li><strong>response_rate</strong> — engagement (0-1)</li>
      <li><strong>partner_tenure_months</strong> — relationship depth</li>
    </ul>
    <p>No integration required. If you have a spreadsheet, you have what you need.</p>`
  },
  {
    title: '🧠 Step 2: AI Risk Scoring',
    body: `<p>Our scoring engine analyzes each partner across <span class="highlight">4 risk dimensions</span>:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
      <div style="background:rgba(239,68,68,0.1);padding:12px;border-radius:8px;text-align:center"><strong style="color:var(--critical)">Deal Velocity</strong><br><small style="color:var(--text-muted)">40% weight — declining deal flow</small></div>
      <div style="background:rgba(249,115,22,0.1);padding:12px;border-radius:8px;text-align:center"><strong style="color:var(--high)">Recency</strong><br><small style="color:var(--text-muted)">25% weight — days since last deal</small></div>
      <div style="background:rgba(234,179,8,0.1);padding:12px;border-radius:8px;text-align:center"><strong style="color:var(--medium)">Engagement</strong><br><small style="color:var(--text-muted)">20% weight — response rate drop</small></div>
      <div style="background:rgba(99,102,241,0.1);padding:12px;border-radius:8px;text-align:center"><strong style="color:var(--primary)">Tenure</strong><br><small style="color:var(--text-muted)">15% weight — loyalty adjustment</small></div>
    </div>
    <p>Each partner gets a <strong>0-100 risk score</strong> and is classified into Critical, High, Medium, or Low tiers.</p>`
  },
  {
    title: '🎯 Step 3: Prioritized Win-Back',
    body: `<p>Not all at-risk partners are equal. Recovery Radar ranks them by <span class="highlight">estimated recoverable revenue</span> — so your team focuses on the highest-impact saves first.</p>
    <p>Each partner gets a specific, actionable recommendation:</p>
    <div style="margin:16px 0;line-height:2.2">
      <div>🔴 <strong>Critical (70+):</strong> Executive check-in within 48 hours</div>
      <div>🟠 <strong>High (45-69):</strong> Personalized re-engagement offer this week</div>
      <div>🟡 <strong>Medium (25-44):</strong> Include in partner incentive campaign</div>
      <div>🟢 <strong>Low (0-24):</strong> Maintain regular cadence</div>
    </div>`
  },
  {
    title: '💰 Step 4: Measure the ROI',
    body: `<p>Recovery Radar quantifies the business case automatically:</p>
    <div class="stat-callout">If you recover just 30% of at-risk revenue, what's that worth?</div>
    <p>The dashboard shows your <span class="highlight">total revenue at risk</span>, projected recovery value at different win-back rates, and a clear case for investment in partner retention.</p>
    <p>No more guessing. No more surprises at quarter-end.</p>`
  },
  {
    title: '🚀 Ready to See It in Action?',
    body: `<p>You can either:</p>
    <div style="margin:16px 0;line-height:2.2">
      <div>📁 <strong>Upload your own CSV</strong> with real partner data</div>
      <div>⚡ <strong>Try Demo Mode</strong> with pre-loaded sample data to see the full experience instantly</div>
    </div>
    <p>Let's find out what's hiding in your partner portfolio.</p>
    <div class="stat-callout">Average time to first insight: 30 seconds</div>`
  }
];

let currentStep = 0;

function renderTutorialStep() {
  const step = tutorialSteps[currentStep];
  document.getElementById('tutorial-progress-bar').style.width = `${((currentStep + 1) / tutorialSteps.length) * 100}%`;
  document.getElementById('step-indicator').textContent = `Step ${currentStep + 1} of ${tutorialSteps.length}`;
  document.getElementById('tutorial-content').innerHTML = `<h2>${step.title}</h2>${step.body}`;
  document.getElementById('tutorial-back').style.visibility = currentStep === 0 ? 'hidden' : 'visible';
  const nextBtn = document.getElementById('tutorial-next');
  if (currentStep === tutorialSteps.length - 1) {
    nextBtn.innerHTML = '🚀 Launch Dashboard';
    nextBtn.className = 'btn btn-accent';
  } else {
    nextBtn.innerHTML = 'Next →';
    nextBtn.className = 'btn btn-primary';
  }
}

function tutorialNext() {
  if (currentStep < tutorialSteps.length - 1) {
    currentStep++;
    renderTutorialStep();
  } else {
    loadDemo();
  }
}

function tutorialBack() {
  if (currentStep > 0) {
    currentStep--;
    renderTutorialStep();
  }
}

function closeTutorial() {
  document.getElementById('tutorial-overlay').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}

function showTutorial() {
  currentStep = 0;
  renderTutorialStep();
  document.getElementById('tutorial-overlay').classList.remove('hidden');
}

// Init tutorial
renderTutorialStep();

// ===== DATA HANDLING =====
let allPartners = [];

function handleDrop(e) {
  e.preventDefault();
  e.target.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('csv-paste').value = e.target.result;
    analyzeCSV();
  };
  reader.readAsText(file);
}

async function analyzeCSV() {
  const csv = document.getElementById('csv-paste').value.trim();
  if (!csv) return alert('Please paste CSV data or upload a file');
  try {
    const res = await fetch('/api/upload-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv })
    });
    const data = await res.json();
    if (data.error) return alert(data.error);
    allPartners = data.partners;
    renderDashboard(data.partners, data.summary);
  } catch (e) {
    alert('Analysis failed: ' + e.message);
  }
}

async function loadDemo() {
  closeTutorial();
  try {
    const res = await fetch('/api/demo-data');
    const data = await res.json();
    allPartners = data.partners;
    renderDashboard(data.partners, data.summary);
  } catch (e) {
    alert('Failed to load demo data: ' + e.message);
  }
}

// ===== DASHBOARD RENDERING =====
function renderDashboard(partners, summary) {
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('upload-section').style.display = 'none';
  document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });

  // KPIs
  const fmt = (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card critical">
      <div class="kpi-label">Revenue at Risk</div>
      <div class="kpi-value" style="color:var(--critical)">${fmt(summary.total_at_risk_revenue)}</div>
      <div class="kpi-sub">From ${summary.critical + summary.high} at-risk partners</div>
    </div>
    <div class="kpi-card warn">
      <div class="kpi-label">Win-Back Candidates</div>
      <div class="kpi-value" style="color:var(--accent)">${summary.win_back_candidates}</div>
      <div class="kpi-sub">Critical + High risk partners</div>
    </div>
    <div class="kpi-card info">
      <div class="kpi-label">Avg Risk Score</div>
      <div class="kpi-value" style="color:var(--primary-hover)">${summary.avg_risk_score}<span style="font-size:16px;color:var(--text-muted)">/100</span></div>
      <div class="kpi-sub">Across ${summary.total_partners} partners</div>
    </div>
    <div class="kpi-card good">
      <div class="kpi-label">Quarterly Portfolio</div>
      <div class="kpi-value" style="color:var(--low)">${fmt(summary.total_quarterly_revenue)}</div>
      <div class="kpi-sub">Total estimated quarterly revenue</div>
    </div>
  `;

  // Risk bars
  const pct = (n) => Math.round((n / summary.total_partners) * 100);
  document.getElementById('risk-bars').innerHTML = `
    <div class="risk-bar-item">
      <div class="risk-bar-label"><span>🔴 Critical</span><span>${summary.critical} partners</span></div>
      <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${pct(summary.critical)}%;background:var(--critical)"></div></div>
    </div>
    <div class="risk-bar-item">
      <div class="risk-bar-label"><span>🟠 High</span><span>${summary.high} partners</span></div>
      <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${pct(summary.high)}%;background:var(--high)"></div></div>
    </div>
    <div class="risk-bar-item">
      <div class="risk-bar-label"><span>🟡 Medium</span><span>${summary.medium} partners</span></div>
      <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${pct(summary.medium)}%;background:var(--medium)"></div></div>
    </div>
    <div class="risk-bar-item">
      <div class="risk-bar-label"><span>🟢 Low</span><span>${summary.low} partners</span></div>
      <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${pct(summary.low)}%;background:var(--low)"></div></div>
    </div>
  `;

  // Table
  renderTable(partners);

  // Win-back list
  const winback = partners.filter(p => p.risk_score >= 45).sort((a, b) => b.est_lost_revenue - a.est_lost_revenue);
  document.getElementById('winback-list').innerHTML = winback.length === 0
    ? '<p style="color:var(--text-muted)">No at-risk partners detected — your portfolio looks healthy! 🎉</p>'
    : winback.map((p, i) => `
      <div class="winback-item">
        <div class="winback-rank">#${i + 1}</div>
        <div class="winback-info">
          <div class="winback-name">${p.partner_name}</div>
          <div class="winback-meta">${p.recommended_action}</div>
        </div>
        <div class="winback-revenue">
          <div class="winback-revenue-val">${fmt(p.est_lost_revenue)}</div>
          <div class="winback-revenue-label">est. recoverable</div>
        </div>
      </div>
    `).join('');

  // ROI
  const atRiskRev = summary.total_at_risk_revenue;
  document.getElementById('roi-grid').innerHTML = `
    <div class="roi-item">
      <div class="roi-label">20% Recovery Rate</div>
      <div class="roi-value green">${fmt(atRiskRev * 0.2)}</div>
    </div>
    <div class="roi-item">
      <div class="roi-label">30% Recovery Rate</div>
      <div class="roi-value gold">${fmt(atRiskRev * 0.3)}</div>
    </div>
    <div class="roi-item">
      <div class="roi-label">50% Recovery Rate</div>
      <div class="roi-value blue">${fmt(atRiskRev * 0.5)}</div>
    </div>
    <div class="roi-item">
      <div class="roi-label">Total at Risk</div>
      <div class="roi-value" style="color:var(--critical)">${fmt(atRiskRev)}</div>
    </div>
  `;
}

function renderTable(partners) {
  const fmt = (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const tierIcon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
  const tierColor = { critical: 'var(--critical)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)' };

  document.getElementById('partner-tbody').innerHTML = partners
    .sort((a, b) => b.risk_score - a.risk_score)
    .map(p => `
      <tr data-tier="${p.risk_tier}">
        <td><strong>${p.partner_name}</strong></td>
        <td>
          <strong>${p.risk_score}</strong>
          <span class="risk-score-bar"><span class="risk-score-fill" style="width:${p.risk_score}%;background:${tierColor[p.risk_tier]}"></span></span>
        </td>
        <td><span class="risk-badge ${p.risk_tier}">${tierIcon[p.risk_tier]} ${p.risk_tier}</span></td>
        <td>${p.deals_last_90d}</td>
        <td>${p.deals_prior_90d}</td>
        <td>${fmt(p.avg_deal_value)}</td>
        <td>${p.days_since_last_deal}d</td>
        <td style="color:var(--critical);font-weight:600">${fmt(p.est_lost_revenue)}</td>
        <td style="font-size:11px;max-width:200px">${p.recommended_action}</td>
      </tr>
    `).join('');
}

function filterTable(tier, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = tier === 'all' ? allPartners : allPartners.filter(p => p.risk_tier === tier);
  renderTable(filtered);
}
