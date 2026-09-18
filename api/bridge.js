export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método não permitido." });
  }

  const gasUrl = 'https://script.google.com/macros/s/AKfycby5x9z5zM_GSdwpWxnu3cTjp9HRCozITPsPVkvJ3OJsDbPbdLqdhVQ2ietvCjzuGNa7ig/exec';
  const gasToken = process.env.GAS_API_TOKEN;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!gasUrl || !gasToken || !adminPassword) {
    return res.status(500).json({
      ok: false,
      message: "API não configurada no Vercel. Verifique as variáveis de ambiente."
    });
  }

  try {
    const input = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { adminPassword: suppliedAdmin, ...payload } = input;

    const adminActions = new Set([
      "adminStatus", "adminDashboard", "definirEleicao",
      "criarChapa", "editarChapa", "excluirChapa", "salvarConfig"
    ]);

    if (adminActions.has(payload.action) && suppliedAdmin !== adminPassword) {
      return res.status(401).json({ ok: false, message: "Senha administrativa inválida." });
    }

    const gasResponse = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, token: gasToken })
    });

    const text = await gasResponse.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      return res.status(502).json({
        ok: false,
        message: "A API do Google Apps Script não retornou JSON válido."
      });
    }

    return res.status(gasResponse.ok ? 200 : 502).json(data);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Erro de comunicação com a API.",
      detail: String(error.message || error)
    });
  }
}
