(() => {
  const cfg = window.GREMIO_CONFIG;
  const params = new URLSearchParams(location.search);
  const urn = String(params.get("urna") || "01").padStart(2, "0");

  const state = {
    step: "ra",
    ra: "",
    student: null,
    voteNumber: "",
    chapa: null,
    electionOpen: false,
    busy: false
  };

  const el = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  el("urnLabel").textContent = `URNA ${urn}`;
  el("footerUrn").textContent = urn;

  function setStatus(text) {
    el("machineStatus").textContent = text;
  }

  function showStep(stepId) {
    document.querySelectorAll(".screen-step").forEach(s => s.classList.remove("active"));
    el(stepId).classList.add("active");
    state.step = stepId.replace("step-", "");
  }

  function resetUI() {
    state.step = "ra";
    state.ra = "";
    state.student = null;
    state.voteNumber = "";
    state.chapa = null;
    state.busy = false;
    el("raDisplay").textContent = "—";
    el("raMessage").textContent = "Depois de digitar, pressione CONFIRMA.";
    el("studentName").textContent = "—";
    el("studentBirth").textContent = "—";
    el("voteNumber").textContent = "—";
    el("voteMessage").textContent = "Digite o número da chapa.";
    el("candidatePreview").classList.remove("visible");
    el("candidatePhoto").removeAttribute("src");
    el("candidatePhoto").parentElement.classList.remove("has-image");
    el("candidateName").textContent = "—";
    el("candidatePresident").textContent = "—";
    el("candidateVice").textContent = "—";
    el("candidateSlogan").textContent = "";
    showStep("step-ra");
    setStatus("AGUARDANDO");
  }

  function disableKeys(disabled) {
    document.querySelectorAll(".key").forEach(k => k.disabled = disabled);
  }

  async function api(payload, options = {}) {
    const response = await fetch(cfg.apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      ...options
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || "Não foi possível concluir a operação.");
    return data;
  }

  async function checkElection() {
    try {
      const data = await api({ action: "statusPublic" });
      state.electionOpen = Boolean(data.election?.aberta);
      if (!state.electionOpen) {
        showStep("step-closed");
        setStatus("ENCERRADA");
      } else if (state.step === "closed") {
        resetUI();
      }
      el("syncText").textContent = `Sincronização: ${new Date().toLocaleTimeString("pt-BR")}`;
    } catch (err) {
      setStatus("SEM CONEXÃO");
      el("syncText").textContent = "Sincronização: falhou";
    }
  }

  async function heartbeat() {
    if (!state.electionOpen || state.step === "fim") return;
    try {
      await api({ action: "heartbeat", urna: urn });
    } catch (_) {}
  }

  function numberKey(value) {
    if (state.busy) return;

    if (state.step === "ra") {
      if (state.ra.length >= 10) return;
      state.ra += value;
      el("raDisplay").textContent = state.ra;
      return;
    }

    if (state.step === "vote") {
      if (state.voteNumber.length >= 2) return;
      state.voteNumber += value;
      el("voteNumber").textContent = state.voteNumber;
      if (state.voteNumber.length === 2) loadChapa();
    }
  }

  async function loadChapa() {
    state.busy = true;
    disableKeys(true);
    try {
      const data = await api({ action: "buscarChapa", numero: state.voteNumber });
      state.chapa = data.chapa;
      el("candidateName").textContent = data.chapa.nome || "—";
      el("candidatePresident").textContent = data.chapa.presidente ? `Presidente: ${data.chapa.presidente}` : "";
      el("candidateVice").textContent = data.chapa.vice ? `Vice-presidente: ${data.chapa.vice}` : "";
      el("candidateSlogan").textContent = data.chapa.slogan || "";
      const photo = data.chapa.fotoUrl;
      if (photo) {
        el("candidatePhoto").src = photo;
        el("candidatePhoto").parentElement.classList.add("has-image");
      } else {
        el("candidatePhoto").removeAttribute("src");
        el("candidatePhoto").parentElement.classList.remove("has-image");
      }
      el("candidatePreview").classList.add("visible");
      el("voteMessage").textContent = "Confira os dados e pressione CONFIRMA.";
      setStatus("CONFIRA O VOTO");
    } catch (err) {
      state.chapa = null;
      el("candidatePreview").classList.remove("visible");
      el("voteMessage").textContent = "Número não cadastrado. Use CORRIGE ou escolha BRANCO.";
      setStatus("NÚMERO INVÁLIDO");
    } finally {
      state.busy = false;
      disableKeys(false);
    }
  }

  async function confirmRA() {
    if (!state.ra || state.busy) return;

    state.busy = true;
    disableKeys(true);
    setStatus("CONSULTANDO...");
    el("raMessage").textContent = "Consultando cadastro do eleitor...";

    try {
      const data = await api({ action: "buscarAluno", ra: state.ra });
      state.student = data.aluno;

      if (data.aluno.jaVotou) {
        throw new Error("Este RA já possui um voto registrado.");
      }

      el("studentName").textContent = data.aluno.nome;
      el("studentBirth").textContent = data.aluno.dataNascimento;
      showStep("step-confirm-student");
      setStatus("CONFIRA SEUS DADOS");
    } catch (err) {
      el("raMessage").textContent = err.message;
      setStatus("RA NÃO LOCALIZADO");
    } finally {
      state.busy = false;
      disableKeys(false);
    }
  }

  async function confirmStudent() {
    if (!state.student || state.busy) return;
    showStep("step-vote");
    setStatus("DIGITE A CHAPA");
    state.voteNumber = "";
    el("voteNumber").textContent = "—";
    el("voteMessage").textContent = "Digite o número da chapa.";
  }

  async function confirmVote() {
    if (state.busy) return;

    if (state.step === "ra") {
      await confirmRA();
      return;
    }

    if (state.step === "confirm-student") {
      await confirmStudent();
      return;
    }

    if (state.step !== "vote") return;

    if (!state.chapa) {
      el("voteMessage").textContent = "Digite um número de chapa válido ou pressione BRANCO.";
      return;
    }

    state.busy = true;
    disableKeys(true);
    setStatus("REGISTRANDO...");
    try {
      await api({
        action: "registrarVoto",
        ra: state.ra,
        dataNascimento: state.student.dataNascimento,
        numero: state.voteNumber,
        urna: urn
      });
      showStep("step-fim");
      setStatus("VOTO REGISTRADO");
      el("syncText").textContent = `Voto sincronizado às ${new Date().toLocaleTimeString("pt-BR")}`;
    } catch (err) {
      el("voteMessage").textContent = err.message;
      setStatus("NÃO REGISTRADO");
    } finally {
      state.busy = false;
      disableKeys(false);
    }
  }

  async function voteWhite() {
    if (state.step !== "vote" || state.busy) return;

    state.busy = true;
    disableKeys(true);
    setStatus("REGISTRANDO...");
    try {
      await api({
        action: "registrarVoto",
        ra: state.ra,
        dataNascimento: state.student.dataNascimento,
        numero: "BRANCO",
        urna: urn
      });
      showStep("step-fim");
      setStatus("VOTO REGISTRADO");
    } catch (err) {
      el("voteMessage").textContent = err.message;
      setStatus("NÃO REGISTRADO");
    } finally {
      state.busy = false;
      disableKeys(false);
    }
  }

  function correct() {
    if (state.busy) return;

    if (state.step === "ra") {
      state.ra = "";
      el("raDisplay").textContent = "—";
      el("raMessage").textContent = "Número apagado.";
      return;
    }

    if (state.step === "confirm-student") {
      resetUI();
      return;
    }

    if (state.step === "vote") {
      state.voteNumber = "";
      state.chapa = null;
      el("voteNumber").textContent = "—";
      el("candidatePreview").classList.remove("visible");
      el("voteMessage").textContent = "Número apagado. Digite novamente.";
      setStatus("DIGITE A CHAPA");
    }
  }

  document.querySelectorAll(".number-key").forEach(btn => {
    btn.addEventListener("click", () => numberKey(btn.dataset.key));
  });
  el("confirmButton").addEventListener("click", confirmVote);
  el("correctButton").addEventListener("click", correct);
  el("whiteButton").addEventListener("click", voteWhite);
  el("returnButton").addEventListener("click", async () => {
    resetUI();
    await checkElection();
  });

  window.addEventListener("keydown", e => {
    if (/^[0-9]$/.test(e.key)) numberKey(e.key);
    if (e.key === "Enter") confirmVote();
    if (e.key === "Backspace") correct();
  });

  resetUI();
  checkElection();
  setInterval(checkElection, 10000);
  setInterval(heartbeat, cfg.heartbeatMs);
  heartbeat();
})();
