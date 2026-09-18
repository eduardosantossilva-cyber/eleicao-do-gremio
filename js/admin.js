(() => {
  const $ = id => document.getElementById(id);

  let logged = false;
  let editingNumber = null;
  let chapas = [];

  function api(params) {

    return GremioAPI.call({
      ...params,
      password:
        window.GREMIO_CONFIG.ADMIN_PASSWORD
    });

  }

  async function login() {

    const password =
      $("senha").value;

    if (
      password !==
      window.GREMIO_CONFIG.ADMIN_PASSWORD
    ) {

      $("loginMsg").textContent =
        "Senha incorreta.";

      return;
    }

    try {

      await api({
        action: "adminStatus"
      });

      logged = true;

      $("loginBox")
        .classList.add("hidden");

      $("dash")
        .classList.remove("hidden");

      $("loginMsg").textContent = "";

      await loadDashboard();

    } catch (error) {

      $("loginMsg").textContent =
        error.message;

    }
  }

  async function loadDashboard() {

    if (!logged) return;

    try {

      const data =
        await api({
          action: "adminDashboard"
        });

      $("eleicaoTitle").textContent =
        data.config.eleicao ||
        "Eleição do Grêmio";

      const open =
        Boolean(
          data.config.eleicaoAberta
        );

      $("eleicaoStatus").textContent =
        open
          ? "Votação aberta."
          : "Votação encerrada.";

      $("abrir").disabled =
        open;

      $("fechar").disabled =
        !open;

      const eleitores =
        Number(
          data.metrics.eleitores || 0
        );

      const votaram =
        Number(
          data.metrics.votaram || 0
        );

      $("mEleitores").textContent =
        eleitores;

      $("mVotaram").textContent =
        votaram;

      $("mRestantes").textContent =
        Math.max(
          eleitores - votaram,
          0
        );

      $("mPart").textContent =
        (
          eleitores
            ? (votaram / eleitores) * 100
            : 0
        ).toFixed(1) + "%";

      const total =
        Number(
          data.apuracao.total || 0
        );

      $("resultados").innerHTML =
        (data.apuracao.resultados || [])
          .map(item => {

            const pct =
              total
                ? (Number(item.votos) / total) * 100
                : 0;

            return `
              <div class="result-row">
                <b>${escapeHtml(item.numero)}</b>
                <div>
                  <strong>${escapeHtml(item.nome)}</strong>
                  <div class="bar">
                    <i style="width:${pct.toFixed(1)}%"></i>
                  </div>
                </div>
                <b>
                  ${Number(item.votos).toLocaleString("pt-BR")}
                  (${pct.toFixed(1)}%)
                </b>
              </div>
            `;
          })
          .join("") ||
        "<p>Nenhum voto ainda.</p>";

      $("urnas").innerHTML =
        (data.urnas || [])
          .map(urna => {

            const online =
              urna.ultimoAcesso &&
              Date.now() -
                Date.parse(
                  urna.ultimoAcesso
                ) <
                90000;

            return `
              <div class="urna-row">
                <b>URNA ${escapeHtml(
                  String(urna.numero).padStart(2, "0")
                )}</b>
                <span class="${online ? "online" : "offline"}">
                  ${online ? "● ONLINE" : "○ OFFLINE"}
                </span>
              </div>
            `;
          })
          .join("") ||
        "<p>Nenhuma urna conectada.</p>";

      chapas =
        data.chapas || [];

      $("chapaTable").innerHTML =
        chapas
          .map(chapa => {

            return `
              <tr>
                <td>${escapeHtml(chapa.numero)}</td>
                <td>${escapeHtml(chapa.nome)}</td>
                <td>${escapeHtml(chapa.presidente)}</td>
                <td>${escapeHtml(chapa.vice)}</td>
                <td>${chapa.ativa ? "SIM" : "NÃO"}</td>
                <td>
                  <button class="small-btn"
                    data-edit="${escapeHtml(chapa.numero)}">
                    Editar
                  </button>
                  <button class="small-btn"
                    data-delete="${escapeHtml(chapa.numero)}">
                    Excluir
                  </button>
                </td>
              </tr>
            `;

          })
          .join("");

      document
        .querySelectorAll("[data-edit]")
        .forEach(button => {

          button.onclick =
            () =>
              openEdit(
                button.dataset.edit
              );
        });

      document
        .querySelectorAll("[data-delete]")
        .forEach(button => {

          button.onclick =
            () =>
              deleteChapa(
                button.dataset.delete
              );
        });

    } catch (error) {

      alert(error.message);

    }
  }

  function openNew() {

    editingNumber = null;

    $("modalTitle").textContent =
      "Nova chapa";

    [
      "cNum",
      "cNome",
      "cPres",
      "cVice",
      "cSlogan",
      "cFoto"
    ].forEach(id => {
      $(id).value = "";
    });

    $("cAtiva").checked =
      true;

    $("modal")
      .classList.remove("hidden");
  }

  function openEdit(numero) {

    const chapa =
      chapas.find(
        item =>
          String(item.numero) ===
          String(numero)
      );

    if (!chapa) return;

    editingNumber = numero;

    $("modalTitle").textContent =
      "Editar chapa";

    $("cNum").value =
      chapa.numero;

    $("cNome").value =
      chapa.nome || "";

    $("cPres").value =
      chapa.presidente || "";

    $("cVice").value =
      chapa.vice || "";

    $("cSlogan").value =
      chapa.slogan || "";

    $("cFoto").value =
      chapa.fotoUrl || "";

    $("cAtiva").checked =
      Boolean(chapa.ativa);

    $("cMsg").textContent = "";

    $("modal")
      .classList.remove("hidden");
  }

  async function saveChapa() {

    const payload = {

      action:
        editingNumber
          ? "editarChapa"
          : "criarChapa",

      numero:
        $("cNum").value.trim(),

      nome:
        $("cNome").value.trim(),

      presidente:
        $("cPres").value.trim(),

      vice:
        $("cVice").value.trim(),

      slogan:
        $("cSlogan").value.trim(),

      fotoUrl:
        $("cFoto").value.trim(),

      ativa:
        $("cAtiva").checked
    };

    try {

      await api(payload);

      closeModal();

      await loadDashboard();

    } catch (error) {

      $("cMsg").textContent =
        error.message;
    }
  }

  async function deleteChapa(numero) {

    if (
      !confirm(
        "Excluir a chapa " +
        numero +
        "?"
      )
    ) {

      return;
    }

    try {

      await api({
        action: "excluirChapa",
        numero
      });

      await loadDashboard();

    } catch (error) {

      alert(error.message);
    }
  }

  async function setElection(open) {

    try {

      await api({
        action: "definirEleicao",
        aberta: open
      });

      await loadDashboard();

    } catch (error) {

      alert(error.message);
    }
  }

  function closeModal() {
    $("modal")
      .classList.add("hidden");
  }

  function escapeHtml(value) {

    return String(value ?? "")
      .replace(
        /[&<>"']/g,
        char =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
          }[char])
      );
  }

  $("entrar")
    .addEventListener(
      "click",
      login
    );

  $("senha")
    .addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          login();
        }
      }
    );

  $("refresh")
    .addEventListener(
      "click",
      loadDashboard
    );

  $("abrir")
    .addEventListener(
      "click",
      () => setElection(true)
    );

  $("fechar")
    .addEventListener(
      "click",
      () => setElection(false)
    );

  $("novaChapa")
    .addEventListener(
      "click",
      openNew
    );

  $("closeModal")
    .addEventListener(
      "click",
      closeModal
    );

  $("cancel")
    .addEventListener(
      "click",
      closeModal
    );

  $("salvar")
    .addEventListener(
      "click",
      saveChapa
    );

  setInterval(
    loadDashboard,
    window.GREMIO_CONFIG.POLL_MS
  );
})();
