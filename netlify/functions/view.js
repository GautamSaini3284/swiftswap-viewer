exports.handler = async (event) => {
  const ticketId = event.queryStringParameters?.id;
  if (!ticketId) return { statusCode: 400, body: 'Missing id' };

  const key   = process.env.JSONBIN_KEY;
  const binId = process.env.JSONBIN_BIN_ID;

  try {
    const res  = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': key },
    });
    if (!res.ok) return { statusCode: 502, body: 'Could not reach storage' };

    const data = await res.json();
    const html = data.record?.transcripts?.[ticketId];

    if (!html) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html' },
        body: `<html><body style="background:#1e1f22;color:#ed4245;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px;text-align:center"><h2>⚠️ Transcript #${ticketId} not found</h2><p style="color:#a3a6aa;margin-top:8px">This ticket has no stored transcript.</p></body></html>`,
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html,
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
