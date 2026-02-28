let currentStep = 0;
const stepEls = [...document.querySelectorAll('#steps li')];
const nextStepBtn = document.getElementById('nextStep');
nextStepBtn.onclick = () => {
  stepEls[currentStep].classList.remove('active');
  currentStep = (currentStep + 1) % stepEls.length;
  stepEls[currentStep].classList.add('active');
};

document.getElementById('loadDemo').onclick = async () => {
  const res = await fetch('/api/demo-data');
  const data = await res.json();
  render(data);
};

document.getElementById('uploadCsv').onclick = async () => {
  const file = document.getElementById('csvFile').files[0];
  if (!file) return alert('Choose a CSV first');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload-csv', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.error) return alert(data.error);
  render(data);
};

function render({summary, partners}) {
  const cards = [
    ['Partners Tracked', summary.total_partners],
    ['Win-Back Candidates', summary.win_back_candidates],
    ['Avg Risk Score', summary.avg_risk_score],
    ['At-Risk Revenue', money(summary.total_at_risk_revenue)],
    ['Quarterly Referral Revenue', money(summary.total_quarterly_revenue)]
  ];
  document.getElementById('summary').innerHTML = cards.map(([k,v]) =>
    `<div class="metric"><div>${k}</div><h3>${v}</h3></div>`).join('');

  const tbody = document.querySelector('#partnersTable tbody');
  const sorted = [...partners].sort((a,b)=>b.risk_score-a.risk_score);
  tbody.innerHTML = sorted.map(p => `
    <tr>
      <td>${p.partner_name || p.name || 'Unknown'}</td>
      <td>${p.risk_score}</td>
      <td class="${p.risk_tier}">${p.risk_tier.toUpperCase()}</td>
      <td>${money(p.est_lost_revenue)}</td>
      <td>${p.recommended_action}</td>
    </tr>
  `).join('');
}

function money(v){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v||0); }
