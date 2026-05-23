const BASE_URL = 'http://localhost:8000';

export async function simulateApi(params) {
  const resp = await fetch(`${BASE_URL}/api/v1/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}
