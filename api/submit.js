const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = 'faida@faida.group';
const FROM = 'Faida Capital <onboarding@resend.dev>';

function row(label, value) {
  if (!value) return '';
  return `<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:8px 12px;font-size:13px;color:#16162a;font-weight:500">${value}</td></tr>`;
}

function table(rows) {
  return `<table style="width:100%;border-collapse:collapse;margin-top:16px">${rows}</table>`;
}

function emailWrap(title, color, body) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f9f8f5;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e8e8e8">
  <div style="background:${color};padding:28px 32px">
    <div style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:6px">Faida Capital</div>
    <div style="font-size:20px;font-weight:700;color:#fff">${title}</div>
  </div>
  <div style="padding:28px 32px">${body}</div>
  <div style="padding:16px 32px;border-top:1px solid #e8e8e8;font-size:11px;color:#aaa">Received via faida.group</div>
</div></body></html>`;
}

function investorEmail(d) {
  const body = table(
    row('Name', `${d.firstName} ${d.lastName}`) +
    row('Email', d.email) +
    row('Organization', d.org) +
    row('Investor profile', d.profile) +
    row('Investment ticket', d.ticket) +
    row('Country / Region', d.country) +
    row('Minerals of interest', d.minerals) +
    row('Geographies', d.geographies) +
    row('Message', d.message)
  );
  return emailWrap('New Investor Enquiry', '#031473', body);
}

function offtakerEmail(d) {
  const body = table(
    row('Name', `${d.firstName} ${d.lastName}`) +
    row('Email', d.email) +
    row('Company', d.company) +
    row('Company type', d.companyType) +
    row('Minerals needed', d.minerals) +
    row('Volume (annual)', d.volume) +
    row('Offtake horizon', d.horizon) +
    row('Country / Region', d.country) +
    row('Sourcing requirements', d.context)
  );
  return emailWrap('New Offtaker Enquiry', '#031473', body);
}

function mineEmail(d) {
  const body = table(
    row('Project name', d.projectName) +
    row('Asset type', d.assetType) +
    row('Country', d.country) +
    row('Region / State', d.region) +
    row('Minerals', d.minerals) +
    row('Capital sought', d.capital) +
    row('Use of funds', d.useOfFunds) +
    row('Permit status', d.permit) +
    row('Contact name', d.name) +
    row('Position', d.position) +
    row('Email', d.email) +
    row('Phone / WhatsApp', d.phone) +
    row('Project description', d.description)
  );
  return emailWrap('New Project Submission', '#031473', body);
}

function newsletterEmail(d) {
  const body = `<p style="font-size:14px;color:#16162a">New newsletter subscription:</p><p style="font-size:18px;font-weight:700;color:#031473">${d.email}</p>`;
  return emailWrap('Newsletter Subscription', '#020d52', body);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, data } = req.body || {};
  if (!type || !data) return res.status(400).json({ error: 'Missing type or data' });

  let subject, html;

  if (type === 'investor') {
    subject = `Investor Enquiry – ${data.firstName} ${data.lastName}${data.org ? ' · ' + data.org : ''}`;
    html = investorEmail(data);
  } else if (type === 'offtaker') {
    subject = `Offtaker Enquiry – ${data.firstName} ${data.lastName}${data.company ? ' · ' + data.company : ''}`;
    html = offtakerEmail(data);
  } else if (type === 'mine') {
    subject = `Project Submission – ${data.projectName || 'Unnamed'}${data.country ? ' · ' + data.country : ''}`;
    html = mineEmail(data);
  } else if (type === 'newsletter') {
    subject = `Newsletter – ${data.email}`;
    html = newsletterEmail(data);
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }

  try {
    await resend.emails.send({ from: FROM, to: TO, subject, html });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
