(() => {
  const cfg = window.GREMIO_CONFIG;
  let password = "";
  let editNumber = null;
  const state = { chapas: [] };
  const el = id => document.getElementById(id);

  async function api(payload) {
    const body = { ...payload, adminPassword: password };
    const response = await fetch(cfg.apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || "Operação não concluída.");
    return data;
  }

  function showLoginMessage(msg, good = false) {
    el("loginMessage").textContent = msg;
    el("loginMessage").style.color = good ? "#1d8a4a" : "#b23f39";
  }

  async function login() {
    const value = el("adminPassword").value.trim();
    if (!value) {
      showLoginMessage("Digite a senha.");
      return;
    }
    password = value;
    try {
      await api({ action: "adminStatus" });
      el("loginPanel").classList.add("hidden");
      el("dashboard").classList.remove("hidden");
      sessionStorage.setItem("gremio_admin", "1");
      await loadDashboard();
    } catch (err) {
      password = "";
      showLoginMessage(err.message);
    }
  }

  function logout() {
    password = "";
    sessionStorage.removeItem("gremio_admin");
    el("dashboard").classList.add("hidden");
    el("loginPanel").classList.remove("hidden");
    el("adminPassword").value = "";
  }

  async function loadDashboard() {
    try {
      const data = await api({ action: "adminDashboard" });
      renderDashboard(data);
    } catch (err) {
      alert(err.message);
    }
  }

  function renderDashboard(data) {
    el("schoolTitle").textContent = data.config?.escola || "Eleição do Grêmio";
    const open = Boolean(data.config?.eleicaoAberta);
    el("electionStatusText").textContent = open ? "Votação aberta e recebendo votos." : "Votação encerrada.";
    el("openElectionButton").disabled = open;
    el("closeElectionButton").disabled = !open;

    const eligible = Number(data.metrics?.eleitores || 0);
    const voted = Number(data.metrics?.votaram || 0);
    const remaining = Math.max(0, eligible - voted);
    const participation = eligible ? ((voted / eligible) * 100).toFixed(1) : "0.0";

    el("statEligible").textContent = eligible.toLocaleString("pt-BR");
    el("statVoted").textContent = voted.toLocaleString("pt-BR");
    el("statRemaining").textContent = remaining.toLocaleString("pt-BR");
    el("statParticipation").textContent = `${participation}%`;
    el("statVotes").textContent = Number(data.apuracao?.total || 0).toLocaleString("pt-BR");
    el("statLastVote").textContent = data.metrics?.ultimoRegistro ? new Date(data.metrics.ultimoRegistro).toLocaleTimeString("pt-BR") : "—";
    el("lastSync").textContent = `Última atualização: ${new Date().toLocaleTimeString("pt-BR")}`;

    renderResults(data.apuracao?.resultados || [], Number(data.apuracao?.total || 0));
    renderUrnas(data.urnas || []);
    state.chapas = data.chapas || [];
    renderChapas(state.chapas);

    el("cfgSchool").value = data.config?.escola || "";
    el("cfgElection").value = data.config?.eleicao || "";
  }

  function renderResults(results, total) {
    const box = el("resultsList");
    box.innerHTML = "";
    results.forEach(item => {
      const pct = total ? ((Number(item.votos) / total) * 100) : 0;
      const row = document.createElement("div");
      row.className = "result-row";
      row.innerHTML = `
        <div class="result-number">${escapeHtml(item.numero)}</div>
        <div>
          <div class="result-name">${escapeHtml(item.nome)}</div>
          <div class="result-bar"><div class="result-fill" style="width:${pct.toFixed(1)}%"></div></div>
        </div>
        <div class="result-count">${Number(item.votos).toLocaleString("pt-BR")}<br><small>${pct.toFixed(1)}%</small></div>
      `;
      box.appendChild(row);
    });
    if (!results.length) box.innerHTML = `<div class="empty-state">Nenhuma chapa cadastrada.</div>`;
  }

  function renderUrnas(urnas) {
    const box = el("urnasList");
    box.innerHTML = "";
    const now = Date.now();
    (urnas.length ? urnas : [{numero:"01", online:false}]).forEach(u => {
      const last = u.ultimoAcesso ? new Date(u.ultimoAcesso).getTime() : 0;
      const online = Boolean(last && (now - last < 90000));
      const row = document.createElement("div");
      row.className = "urna-status-row";
      row.innerHTML = `
        <strong>URNA ${escapeHtml(String(u.numero).padStart(2,"0"))}</strong>
        <span class="${online ? "online" : "offline"}">${online ? "● ONLINE" : "○ OFFLINE"}</span>
      `;
      box.appendChild(row);
    });
  }

  function renderChapas(chapas) {
    el("chapasTableBody").innerHTML = chapas.map(c => `
      <tr>
        <td><strong>${escapeHtml(c.numero)}</strong></td>
        <td>${escapeHtml(c.nome || "")}</td>
        <td>${escapeHtml(c.presidente || "")}</td>
        <td>${escapeHtml(c.vice || "")}</td>
        <td>${c.ativa ? '<span class="active-tag">ATIVA</span>' : '<span class="inactive-tag">INATIVA</span>'}</td>
        <td class="table-actions">
          <button class="small-btn" data-edit="${escapeAttr(c.numero)}">Editar</button>
          <button class="small-btn" data-delete="${escapeAttr(c.numero)}">Excluir</button>
        </td>
      </tr>
    `).join("");

    document.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => openEdit(btn.dataset.edit)));
    document.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => deleteChapa(btn.dataset.delete)));
  }

  function openNew() {
    editNumber = null;
    el("modalTitle").textContent = "Nova chapa";
    el("chapaNumero").value = "";
    el("chapaNome").value = "";
    el("chapaPresidente").value = "";
    el("chapaVice").value = "";
    el("chapaSlogan").value = "";
    el("chapaFoto").value = "";
    el("chapaAtiva").checked = true;
    el("chapaMessage").textContent = "";
    el("chapaModal").classList.remove("hidden");
  }

  function openEdit(numero) {
    const c = state.chapas.find(x => String(x.numero) === String(numero));
    if (!c) return;
    editNumber = numero;
    el("modalTitle").textContent = "Editar chapa";
    el("chapaNumero").value = c.numero;
    el("chapaNome").value = c.nome || "";
    el("chapaPresidente").value = c.presidente || "";
    el("chapaVice").value = c.vice || "";
    el("chapaSlogan").value = c.slogan || "";
    el("chapaFoto").value = c.fotoUrl || "";
    el("chapaAtiva").checked = Boolean(c.ativa);
    el("chapaMessage").textContent = "";
    el("chapaModal").classList.remove("hidden");
  }

  function closeModal() {
    el("chapaModal").classList.add("hidden");
  }

  async function saveChapa() {
    const payload = {
      action: editNumber ? "editarChapa" : "criarChapa",
      numero: el("chapaNumero").value.trim(),
      nome: el("chapaNome").value.trim(),
      presidente: el("chapaPresidente").value.trim(),
      vice: el("chapaVice").value.trim(),
      slogan: el("chapaSlogan").value.trim(),
      fotoUrl: normalizarFoto(el("chapaFoto").value.trim()),
      ativa: el("chapaAtiva").checked
    };
    try {
      await api(payload);
      closeModal();
      await loadDashboard();
    } catch (err) {
      el("chapaMessage").textContent = err.message;
    }
  }

  async function deleteChapa(numero) {
    if (!confirm(`Excluir a chapa ${numero}?`)) return;
    try {
      await api({ action: "excluirChapa", numero });
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  }

  async function setElection(open) {
    try {
      await api({ action: "definirEleicao", aberta: open });
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  }

  async function saveConfig() {
    try {
      await api({
        action: "salvarConfig",
        escola: el("cfgSchool").value.trim(),
        eleicao: el("cfgElection").value.trim()
      });
      el("configMessage").textContent = "Configuração salva.";
      el("configMessage").style.color = "#1d8a4a";
      await loadDashboard();
    } catch (err) {
      el("configMessage").textContent = err.message;
      el("configMessage").style.color = "#b23f39";
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
  }
  function escapeAttr(value) { return escapeHtml(value); }

  function normalizarFoto(url) {
    const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w1000`;
    const m2 = url.match(/[?&]id=([^&]+)/);
    if (m2 && url.includes("drive.google.com")) return `https://lh3.googleusercontent.com/d/${m2[1]}=w1000`;
    return url;
  }

  el("loginButton").addEventListener("click", login);
  el("adminPassword").addEventListener("keydown", e => { if (e.key === "Enter") login(); });
  el("logoutButton").addEventListener("click", logout);
  el("refreshButton").addEventListener("click", loadDashboard);
  el("openElectionButton").addEventListener("click", () => setElection(true));
  el("closeElectionButton").addEventListener("click", () => setElection(false));
  el("newChapaButton").addEventListener("click", openNew);
  el("closeModalButton").addEventListener("click", closeModal);
  el("cancelChapaButton").addEventListener("click", closeModal);
  el("saveChapaButton").addEventListener("click", saveChapa);
  el("saveConfigButton").addEventListener("click", saveConfig);

  if (sessionStorage.getItem("gremio_admin") === "1") {
    // Senha não fica persistida; o usuário terá que autenticar novamente ao recarregar.
    sessionStorage.removeItem("gremio_admin");
  }

  setInterval(() => {
    if (password) loadDashboard();
  }, cfg.pollingMs);
})();
