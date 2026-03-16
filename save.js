exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (event.headers['x-secret'] !== process.env.TRANSCRIPT_SECRET) return { statusCode: 401, body: 'Unauthorized' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { ticketId, html } = body;
  if (!ticketId || !html) return { statusCode: 400, body: 'Missing ticketId or html' };

  const key   = process.env.JSONBIN_KEY;
  const binId = process.env.JSONBIN_BIN_ID;

  try {
    // Read current bin
    const getRes  = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': key },
    });
    const current = getRes.ok ? (await getRes.json()).record : { transcripts: {} };
    if (!current.transcripts) current.transcripts = {};

    // Add transcript
    current.transcripts[ticketId] = html;

    // Write back
    const putRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': key },
      body: JSON.stringify(current),
    });

    if (!putRes.ok) return { statusCode: 502, body: await putRes.text() };

    return { statusCode: 200, body: JSON.stringify({ ok: true, ticketId }) };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
