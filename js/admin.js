(() => {

  const $ = id => document.getElementById(id);

  // ==========================================================
  // CARGOS DA ELEIÇÃO
  // ==========================================================

  const CARGOS = [
    "Coordenador-Geral",
    "Coordenador Comunitário",
    "Coordenador de Convivência Escolar",
    "Vice-Coordenador-Geral",
    "Coordenador Artístico",
    "Coordenador Desportivo",
    "Coordenador de Saúde e Sustentabilidade",
    "Coordenador de Comunicação"
  ];


  // ==========================================================
  // ESTADO
  // ==========================================================

  let logged = false;

  let candidatos = [];

  let apuracaoCargos = [];

  let cargoResultadoAtual = CARGOS[0];

  let cargoFiltroAtual = CARGOS[0];

  let editing = null;


  // ==========================================================
  // API
  // ==========================================================

  function api(params) {

    return GremioAPI.call({

      ...params,

      password:
        window.GREMIO_CONFIG.ADMIN_PASSWORD

    });

  }


  // ==========================================================
  // MENSAGENS
  // ==========================================================

  function setMessage(
    id,
    message
  ) {

    const node = $(id);

    if (node) {

      node.textContent =
        message || "";

    }

  }


  // ==========================================================
  // LOGIN
  // ==========================================================

  function login() {

    const senha =
      $("senha").value.trim();


    if (!senha) {

      setMessage(
        "loginMsg",
        "Digite a senha."
      );

      return;

    }


    api({

      action:
        "adminStatus"

    })

      .then(() => {

        logged = true;


        $("loginBox")
          .classList
          .add("hidden");


        $("dash")
          .classList
          .remove("hidden");


        setMessage(
          "loginMsg",
          ""
        );


        carregarDashboard();

      })

      .catch(error => {

        setMessage(
          "loginMsg",
          error.message ||
          "Senha incorreta."
        );

      });

  }


  // ==========================================================
  // SAIR
  // ==========================================================

  function logout() {

    logged = false;


    $("dash")
      .classList
      .add("hidden");


    $("loginBox")
      .classList
      .remove("hidden");


    $("senha").value = "";

  }


  // ==========================================================
  // CARREGAR DASHBOARD
  // ==========================================================

  async function carregarDashboard() {

    if (!logged) {
      return;
    }


    try {

      const data =
        await api({

          action:
            "adminDashboard"

        });


      const config =
        data.config || {};


      const metrics =
        data.metrics || {};


      const apuracao =
        data.apuracao || {};


      // ------------------------------------------------------
      // CONFIGURAÇÃO
      // ------------------------------------------------------

      $("eleicaoTitle").textContent =
        config.eleicao ||
        "Eleição do Grêmio Estudantil";


      const aberta =
        Boolean(
          config.eleicaoAberta
        );


      $("eleicaoStatus").textContent =
        aberta
          ? "Votação aberta e recebendo votos."
          : "Votação encerrada.";


      $("abrir").disabled =
        aberta;


      $("fechar").disabled =
        !aberta;


      // ------------------------------------------------------
      // MÉTRICAS
      // ------------------------------------------------------

      const eleitores =
        Number(
          metrics.eleitores || 0
        );


      const votaram =
        Number(
          metrics.votaram || 0
        );


      $("mEleitores").textContent =
        eleitores.toLocaleString(
          "pt-BR"
        );


      $("mVotaram").textContent =
        votaram.toLocaleString(
          "pt-BR"
        );


      $("mRestantes").textContent =
        Math.max(
          0,
          eleitores - votaram
        ).toLocaleString(
          "pt-BR"
        );


      $("mPart").textContent =
        (
          eleitores
            ? (
                votaram /
                eleitores
              ) * 100
            : 0
        ).toFixed(1) +
        "%";


      // ------------------------------------------------------
      // APURAÇÃO POR CARGO
      // ------------------------------------------------------

      apuracaoCargos =
        Array.isArray(
          apuracao.cargos
        )
          ? apuracao.cargos
          : [];


      candidatos =
        Array.isArray(
          data.candidatos
        )
          ? data.candidatos
          : [];


      renderCargoTabs();

      renderCargoResultado();

      renderFiltroCargos();

      renderCandidatos();

      renderUrnas(
        data.urnas || []
      );


      // ------------------------------------------------------
      // CONFIGURAÇÕES
      // ------------------------------------------------------

      $("cfgEscola").value =
        config.escola || "";


      $("cfgEleicao").value =
        config.eleicao || "";


      $("configMsg").textContent =
        "";


    } catch (error) {

      alert(
        error.message ||
        "Não foi possível carregar o painel."
      );

    }

  }


  // ==========================================================
  // ABAS DE CARGOS DA APURAÇÃO
  // ==========================================================

  function renderCargoTabs() {

    const box =
      $("cargoTabs");


    if (!box) {
      return;
    }


    box.innerHTML =
      CARGOS.map(
        cargo => `
          <button
            type="button"
            class="${
              cargo ===
              cargoResultadoAtual
                ? "active"
                : ""
            }"
            data-result-cargo="${escapeAttr(cargo)}"
          >
            ${escapeHtml(cargo)}
          </button>
        `
      ).join("");


    box
      .querySelectorAll(
        "[data-result-cargo]"
      )
      .forEach(
        btn => {

          btn.addEventListener(
            "click",
            () => {

              cargoResultadoAtual =
                btn.dataset.resultCargo;


              renderCargoTabs();

              renderCargoResultado();

            }
          );

        }
      );

  }


  // ==========================================================
  // RESULTADO DO CARGO
  // ==========================================================

  function renderCargoResultado() {

    const cargoData =
      apuracaoCargos.find(
        c =>
          normalize(c.cargo) ===
          normalize(
            cargoResultadoAtual
          )
      );


    const box =
      $("cargoResultado");


    if (!box) {
      return;
    }


    if (!cargoData) {

      box.innerHTML = `
        <div class="empty">
          Nenhum dado de apuração para este cargo.
        </div>
      `;

      return;

    }


    const total =
      Number(
        cargoData.total || 0
      );


    let html = `
      <div class="cargo-result-title">
        ${escapeHtml(
          cargoData.cargo
        )}
      </div>

      <div class="result-meta">

        ${total.toLocaleString(
          "pt-BR"
        )}
        voto(s) registrado(s) para este cargo

        •
        ${Number(
          cargoData.validos || 0
        ).toLocaleString(
          "pt-BR"
        )}
        válido(s)

        •
        ${Number(
          cargoData.brancos || 0
        ).toLocaleString(
          "pt-BR"
        )}
        branco(s)

        •
        ${Number(
          cargoData.nulos || 0
        ).toLocaleString(
          "pt-BR"
        )}
        nulo(s)

      </div>
    `;


    const resultados =
      Array.isArray(
        cargoData.resultados
      )
        ? cargoData.resultados
        : [];


    if (!resultados.length) {

      html += `
        <div class="empty">
          Nenhum candidato cadastrado para este cargo.
        </div>
      `;


      box.innerHTML =
        html;


      return;

    }


    html +=
      resultados.map(
        item => {

          const votos =
            Number(
              item.votos || 0
            );


          const pct =
            total
              ? (
                  votos /
                  total
                ) * 100
              : 0;


          const especial =
            item.especial === "branco" ||
            item.especial === "nulo";


          const numero =
            escapeHtml(
              item.numero
            );


          const nome =
            escapeHtml(
              item.nome
            );


          return `
            <div class="result-row">

              <b>
                ${numero}
              </b>

              <div>

                <strong>
                  ${nome}
                </strong>

                ${
                  item.ativa === false &&
                  !especial
                    ? `
                      <span class="candidate-status inactive">
                        INATIVO
                      </span>
                    `
                    : ""
                }

                <div class="bar">
                  <i
                    style="
                      width:${pct.toFixed(1)}%
                    "
                  ></i>
                </div>

              </div>

              <b>

                ${votos.toLocaleString(
                  "pt-BR"
                )}

                <br>

                <small>
                  ${pct.toFixed(1)}%
                </small>

              </b>

            </div>
          `;

        }
      ).join("");


    box.innerHTML =
      html;

  }


  // ==========================================================
  // STATUS DAS URNAS
  // ==========================================================

  function renderUrnas(
    urnas
  ) {

    const box =
      $("urnas");


    if (!box) {
      return;
    }


    if (!urnas.length) {

      box.innerHTML = `
        <div class="empty">
          Nenhuma urna conectada.
        </div>
      `;

      return;

    }


    const now =
      Date.now();


    box.innerHTML =
      urnas.map(
        urna => {

          const last =
            urna.ultimoAcesso
              ? Date.parse(
                  urna.ultimoAcesso
                )
              : 0;


          const online =
            Boolean(
              last &&
              now - last < 90000
            );


          return `
            <div class="urna-row">

              <b>
                URNA
                ${
                  escapeHtml(
                    String(
                      urna.numero
                    ).padStart(
                      2,
                      "0"
                    )
                  )
                }
              </b>

              <span
                class="${
                  online
                    ? "online"
                    : "offline"
                }"
              >

                ${
                  online
                    ? "● ONLINE"
                    : "○ OFFLINE"
                }

              </span>

            </div>
          `;

        }
      ).join("");

  }


  // ==========================================================
  // FILTRO DE CARGOS
  // ==========================================================

  function renderFiltroCargos() {

    const select =
      $("filtroCargo");


    if (!select) {
      return;
    }


    select.innerHTML =
      CARGOS.map(
        cargo => `
          <option
            value="${escapeAttr(cargo)}"
            ${
              cargo ===
              cargoFiltroAtual
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(cargo)}
          </option>
        `
      ).join("");


    select.onchange =
      () => {

        cargoFiltroAtual =
          select.value;


        renderCandidatos();

      };

  }


  // ==========================================================
  // LISTAR CANDIDATOS
  // ==========================================================

  function renderCandidatos() {

    const tbody =
      $("candidatoTable");


    if (!tbody) {
      return;
    }


    const lista =
      candidatos

        .filter(
          c =>
            normalize(
              c.cargo
            ) ===
            normalize(
              cargoFiltroAtual
            )
        )

        .sort(
          (a, b) =>
            Number(a.numero) -
            Number(b.numero)
        );


    if (!lista.length) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="empty"
          >
            Nenhum candidato cadastrado neste cargo.
          </td>
        </tr>
      `;

      return;

    }


    tbody.innerHTML =
      lista.map(
        c => `

          <tr>

            <td>
              <strong>
                ${escapeHtml(
                  c.numero
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                c.cargo
              )}
            </td>

            <td>
              ${escapeHtml(
                c.nome || ""
              )}
            </td>

            <td>
              ${escapeHtml(
                c.slogan || ""
              )}
            </td>

            <td>

              <span
                class="candidate-status ${
                  c.ativa
                    ? "active"
                    : "inactive"
                }"
              >
                ${
                  c.ativa
                    ? "ATIVA"
                    : "INATIVA"
                }
              </span>

            </td>

            <td class="candidate-actions">

              <button
                class="small-btn"
                data-edit-candidato="${escapeAttr(c.cargo)}"
                data-edit-numero="${escapeAttr(c.numero)}"
              >
                Editar
              </button>

              ${
                c.ativa
                  ? `
                    <button
                      class="
                        small-btn
                        danger-small
                      "
                      data-delete-candidato="${escapeAttr(c.cargo)}"
                      data-delete-numero="${escapeAttr(c.numero)}"
                    >
                      Inativar
                    </button>
                  `
                  : ""
              }

            </td>

          </tr>

        `
      ).join("");


    // --------------------------------------------------------
    // EDITAR
    // --------------------------------------------------------

    tbody
      .querySelectorAll(
        "[data-edit-candidato]"
      )
      .forEach(
        btn => {

          btn.addEventListener(
            "click",
            () => {

              abrirEdicao(
                btn.dataset.editCandidato,
                btn.dataset.editNumero
              );

            }
          );

        }
      );


    // --------------------------------------------------------
    // INATIVAR
    // --------------------------------------------------------

    tbody
      .querySelectorAll(
        "[data-delete-candidato]"
      )
      .forEach(
        btn => {

          btn.addEventListener(
            "click",
            () => {

              inativarCandidato(
                btn.dataset.deleteCandidato,
                btn.dataset.deleteNumero
              );

            }
          );

        }
      );

  }


  // ==========================================================
  // PREENCHER SELECT DE CARGO
  // ==========================================================

  function preencherSelectCargo(
    id,
    selecionado
  ) {

    const select =
      $(id);


    if (!select) {
      return;
    }


    select.innerHTML =
      CARGOS.map(
        cargo => `
          <option
            value="${escapeAttr(cargo)}"
            ${
              cargo ===
              selecionado
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(cargo)}
          </option>
        `
      ).join("");

  }


  // ==========================================================
  // NOVO CANDIDATO
  // ==========================================================

  function abrirNovo() {

    editing = null;


    $("modalTitle").textContent =
      "Novo candidato";


    preencherSelectCargo(
      "cCargo",
      cargoFiltroAtual
    );


    $("cNum").value =
      "";


    $("cNome").value =
      "";


    $("cSlogan").value =
      "";


    $("cFoto").value =
      "";


    $("cAtiva").checked =
      true;


    setMessage(
      "cMsg",
      ""
    );


    $("modal")
      .classList
      .remove("hidden");

  }


  // ==========================================================
  // EDITAR CANDIDATO
  // ==========================================================

  function abrirEdicao(
    cargo,
    numero
  ) {

    const candidato =
      candidatos.find(
        c =>
          normalize(
            c.cargo
          ) ===
          normalize(
            cargo
          ) &&
          normalize(
            c.numero
          ) ===
          normalize(
            numero
          )
      );


    if (!candidato) {
      return;
    }


    editing = {

      cargo:
        candidato.cargo,

      numero:
        candidato.numero

    };


    $("modalTitle").textContent =
      "Editar candidato";


    preencherSelectCargo(
      "cCargo",
      candidato.cargo
    );


    $("cNum").value =
      candidato.numero ||
      "";


    $("cNome").value =
      candidato.nome ||
      "";


    $("cSlogan").value =
      candidato.slogan ||
      "";


    $("cFoto").value =
      candidato.fotoUrl ||
      "";


    $("cAtiva").checked =
      Boolean(
        candidato.ativa
      );


    setMessage(
      "cMsg",
      ""
    );


    $("modal")
      .classList
      .remove("hidden");

  }


  // ==========================================================
  // FECHAR MODAL
  // ==========================================================

  function fecharModal() {

    $("modal")
      .classList
      .add("hidden");

  }


  // ==========================================================
  // SALVAR CANDIDATO
  // ==========================================================

  async function salvarCandidato() {

    const cargo =
      $("cCargo")
        .value
        .trim();


    const numero =
      $("cNum")
        .value
        .trim();


    const nome =
      $("cNome")
        .value
        .trim();


    const slogan =
      $("cSlogan")
        .value
        .trim();


    const fotoUrl =
      normalizarFoto(
        $("cFoto")
          .value
          .trim()
      );


    const ativa =
      $("cAtiva")
        .checked;


    if (
      !cargo ||
      !numero ||
      !nome
    ) {

      setMessage(
        "cMsg",
        "Preencha cargo, número e nome."
      );

      return;

    }


    const payload =
      editing

        ? {

            action:
              "editarCandidato",

            origemCargo:
              editing.cargo,

            origemNumero:
              editing.numero,

            cargo:
              cargo,

            numero:
              numero,

            nome:
              nome,

            slogan:
              slogan,

            fotoUrl:
              fotoUrl,

            ativa:
              ativa

          }

        : {

            action:
              "criarCandidato",

            cargo:
              cargo,

            numero:
              numero,

            nome:
              nome,

            slogan:
              slogan,

            fotoUrl:
              fotoUrl,

            ativa:
              ativa

          };


    try {

      await api(
        payload
      );


      fecharModal();


      cargoFiltroAtual =
        cargo;


      await carregarDashboard();


    } catch (error) {

      setMessage(
        "cMsg",
        error.message ||
        "Não foi possível salvar o candidato."
      );

    }

  }


  // ==========================================================
  // INATIVAR CANDIDATO
  // ==========================================================

  async function inativarCandidato(
    cargo,
    numero
  ) {

    if (
      !confirm(
        `Inativar o candidato ${numero} do cargo ${cargo}?`
      )
    ) {

      return;

    }


    try {

      await api({

        action:
          "excluirCandidato",

        cargo:
          cargo,

        numero:
          numero

      });


      await carregarDashboard();


    } catch (error) {

      alert(
        error.message ||
        "Não foi possível inativar o candidato."
      );

    }

  }


  // ==========================================================
  // ABRIR / FECHAR ELEIÇÃO
  // ==========================================================

  async function setElection(
    aberta
  ) {

    try {

      await api({

        action:
          "definirEleicao",

        aberta:
          aberta

      });


      await carregarDashboard();


    } catch (error) {

      alert(
        error.message ||
        "Não foi possível alterar a eleição."
      );

    }

  }


  // ==========================================================
  // SALVAR CONFIGURAÇÃO
  // ==========================================================

  async function salvarConfig() {

    try {

      await api({

        action:
          "salvarConfig",

        escola:
          $("cfgEscola")
            .value
            .trim(),

        eleicao:
          $("cfgEleicao")
            .value
            .trim()

      });


      setMessage(
        "configMsg",
        "Configuração salva com sucesso."
      );


      await carregarDashboard();


    } catch (error) {

      setMessage(
        "configMsg",
        error.message ||
        "Não foi possível salvar a configuração."
      );

    }

  }


  // ==========================================================
  // NORMALIZAR FOTO DO GOOGLE DRIVE
  // ==========================================================

  function normalizarFoto(
    url
  ) {

    if (!url) {
      return "";
    }


    const m =
      url.match(
        /drive\.google\.com\/file\/d\/([^/]+)/
      );


    if (m) {

      return (
        `https://lh3.googleusercontent.com/d/${m[1]}=w1000`
      );

    }


    const m2 =
      url.match(
        /[?&]id=([^&]+)/
      );


    if (
      m2 &&
      url.includes(
        "drive.google.com"
      )
    ) {

      return (
        `https://lh3.googleusercontent.com/d/${m2[1]}=w1000`
      );

    }


    return url;

  }


  // ==========================================================
  // NORMALIZAÇÃO
  // ==========================================================

  function normalize(
    value
  ) {

    return String(
      value ?? ""
    )
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  }


  // ==========================================================
  // SEGURANÇA HTML
  // ==========================================================

  function escapeHtml(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /[&<>"']/g,
        char => ({

          "&":
            "&amp;",

          "<":
            "&lt;",

          ">":
            "&gt;",

          '"':
            "&quot;",

          "'":
            "&#039;"

        }[char])
      );

  }


  function escapeAttr(
    value
  ) {

    return escapeHtml(
      value
    );

  }


  // ==========================================================
  // EVENTOS
  // ==========================================================

  $("entrar")
    .addEventListener(
      "click",
      login
    );


  $("senha")
    .addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          login();

        }

      }
    );


  $("refresh")
    .addEventListener(
      "click",
      carregarDashboard
    );


  $("sair")
    .addEventListener(
      "click",
      logout
    );


  $("abrir")
    .addEventListener(
      "click",
      () =>
        setElection(true)
    );


  $("fechar")
    .addEventListener(
      "click",
      () =>
        setElection(false)
    );


  $("novoCandidato")
    .addEventListener(
      "click",
      abrirNovo
    );


  $("closeModal")
    .addEventListener(
      "click",
      fecharModal
    );


  $("cancel")
    .addEventListener(
      "click",
      fecharModal
    );


  $("salvar")
    .addEventListener(
      "click",
      salvarCandidato
    );


  $("salvarConfig")
    .addEventListener(
      "click",
      salvarConfig
    );


  // ==========================================================
  // ATUALIZAÇÃO AUTOMÁTICA
  // ==========================================================

  setInterval(
    () => {

      if (logged) {

        carregarDashboard();

      }

    },
    Number(
      window.GREMIO_CONFIG.POLL_MS ||
      5000
    )
  );

})();
