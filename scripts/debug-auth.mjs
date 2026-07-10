#!/usr/bin/env node
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const PASSWORD = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !ANON || !EMAIL || !PASSWORD) {
  console.error('Missing required env vars.');
  process.exit(2);
}

async function main(){
  console.log('Requesting token from Supabase...');
  const tokenRes = await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const tokenJson = await tokenRes.json();
  console.log('Token response status:', tokenRes.status);
  if (!tokenJson.access_token) { console.error('No access token', tokenJson); process.exit(3); }

  console.log('Posting to /api/auth/session...');
  const sessionRes = await fetch('http://127.0.0.1:3000/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: tokenJson.access_token, refresh_token: tokenJson.refresh_token }),
    redirect: 'manual',
  });
  console.log('/api/auth/session status:', sessionRes.status);
  const text = await sessionRes.text();
  console.log('/api/auth/session body:', text.slice(0,2000));
  console.log('/api/auth/session headers:');
  sessionRes.headers.forEach((v,k)=>console.log(k,':',v));

  // Try to access admin
  const cookies = sessionRes.headers.get('set-cookie') || '';
  console.log('Using cookie header:', cookies.split(';')[0]);
  const adminRes = await fetch('http://127.0.0.1:3000/admin', { headers: { cookie: cookies } });
  console.log('/admin status:', adminRes.status);
  const html = await adminRes.text();
  console.log('Received /admin length:', html.length);
}

main().catch(e=>{ console.error(e); process.exit(99); });
