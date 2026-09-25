// ==========================================================
// URNA ELETRÔNICA - GRÊMIO ESTUDANTIL
// VOTAÇÃO POR CARGO
// IDENTIFICAÇÃO AUTOMÁTICA DA URNA
// ==========================================================

(() => {

  // ==========================================================
  // FUNÇÃO AUXILIAR
  // ==========================================================

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
  // IDENTIFICAÇÃO DO DISPOSITIVO
  // ==========================================================

  const CHAVE_DISPOSITIVO = "gremio_dispositivo_id";


  function obterDispositivoId() {

    let id = localStorage.getItem(
      CHAVE_DISPOSITIVO
    );

    if (id) {
      return id;
    }

    try {

      if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
      ) {

        id = window.crypto.randomUUID();

      } else {

        id =
          "disp-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .substring(2, 10);

      }

    } catch (error) {

      id =
        "disp-" +
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 10);

    }


    localStorage.setItem(
      CHAVE_DISPOSITIVO,
      id
    );

    return id;
  }


  const dispositivoId =
    obterDispositivoId();


  // ==========================================================
  // ESTADO DA URNA
  // ==========================================================

  const state = {

    step: "stepRA",

    ra: "",

    aluno: null,

    cargoIndex: 0,

    numero: "",

    candidato: null,

    votos: [],

    busy: false

  };


  // Número da urna recebido do servidor.
  let urna = "—";


  // ==========================================================
  // LABEL DA URNA
  // ==========================================================

  function atualizarNumeroUrna(numero) {

    if (!numero) {
      return;
    }

    urna =
      String(numero)
        .replace(/\D/g, "")
        .padStart(2, "0");


    const label = $("urnLabel");

    if (label) {

      label.textContent =
        "URNA " + urna;

    }


    const footer = $("urnFooter");

    if (footer) {

      footer.textContent =
        urna;

    }

  }


  // ==========================================================
  // STATUS
  // ==========================================================

  function setStatus(text) {

    const status = $("status");

    if (status) {
      status.textContent = text;
    }

  }


  // ==========================================================
  // ÁUDIO DE FINALIZAÇÃO
  // ==========================================================

  const somFim =
    new Audio(
      "audio/som-urna-fim.mp3"
    );

  somFim.preload = "auto";


  function prepararAudio() {

    try {

      somFim.load();

    } catch (error) {

      console.log(
        "Não foi possível carregar o áudio:",
        error
      );

    }

  }


  function somFimUrna() {

    try {

      somFim.currentTime = 0;

      const reproducao =
        somFim.play();

      if (reproducao) {

        reproducao.catch(
          error => {

            console.log(
              "Não foi possível reproduzir o som:",
              error
            );

          }
        );

      }

    } catch (error) {

      console.log(
        "Erro ao reproduzir o som:",
        error
      );

    }

  }


  // ==========================================================
  // TROCAR TELA
  // ==========================================================

  function showStep(id) {

    document
      .querySelectorAll(".step")
      .forEach(element => {

        element.classList.remove(
          "active"
        );

      });


    const tela = $(id);


    if (!tela) {

      console.error(
        'Tela "' +
        id +
        '" não encontrada no urna.html.'
      );

      return false;

    }


    tela.classList.add(
      "active"
    );


    state.step = id;

    return true;

  }


  // ==========================================================
  // BLOQUEAR / LIBERAR TECLADO
  // ==========================================================

  function disableKeys(value) {

    document
      .querySelectorAll(".key")
      .forEach(button => {

        button.disabled = value;

      });

  }


  // ==========================================================
  // LIMPAR CARGO
  // ==========================================================

  function limparCargo() {

    state.numero = "";

    state.candidato = null;


    const numero =
      $("candidatoNumero");

    if (numero) {
      numero.textContent = "—";
    }


    const card =
      $("candidatoCard");

    if (card) {
      card.classList.remove(
        "visible"
      );
    }


    const photoBox =
      $("candidatoPhotoBox");

    if (photoBox) {
      photoBox.classList.remove(
        "has-image"
      );
    }


    const foto =
      $("candidatoFoto");

    if (foto) {
      foto.removeAttribute(
        "src"
      );
    }


    const nome =
      $("candidatoNome");

    if (nome) {
      nome.textContent = "—";
    }


    const slogan =
      $("candidatoSlogan");

    if (slogan) {
      slogan.textContent = "";
    }


    const mensagem =
      $("cargoMsg");

    if (mensagem) {

      mensagem.textContent =
        "Digite o número do candidato.";

    }


    setStatus(
      "DIGITE O CANDIDATO"
    );

  }


  // ==========================================================
  // MOSTRAR CARGO ATUAL
  // ==========================================================

  function mostrarCargoAtual() {

    const cargo =
      CARGOS[state.cargoIndex];


    if (!cargo) {
      return;
    }


    const progresso =
      $("cargoProgress");

    if (progresso) {

      progresso.textContent =
        "CARGO " +
        (state.cargoIndex + 1) +
        " DE " +
        CARGOS.length;

    }


    const nomeCargo =
      $("cargoNome");

    if (nomeCargo) {

      nomeCargo.textContent =
        cargo.toUpperCase();

    }


    limparCargo();


    showStep(
      "stepCargo"
    );

  }


  // ==========================================================
  // RESET COMPLETO
  // ==========================================================

  function reset() {

    state.step =
      "stepRA";

    state.ra =
      "";

    state.aluno =
      null;

    state.cargoIndex =
      0;

    state.numero =
      "";

    state.candidato =
      null;

    state.votos =
      [];

    state.busy =
      false;


    const raView =
      $("raView");

    if (raView) {
      raView.textContent =
        "—";
    }


    const raMsg =
      $("raMsg");

    if (raMsg) {

      raMsg.textContent =
        "Pressione CONFIRMA depois de digitar.";

    }


    const nomeAluno =
      $("nomeAluno");

    if (nomeAluno) {
      nomeAluno.textContent =
        "—";
    }


    const dataAluno =
      $("dataAluno");

    if (dataAluno) {
      dataAluno.textContent =
        "—";
    }


    const progresso =
      $("cargoProgress");

    if (progresso) {

      progresso.textContent =
        "CARGO 1 DE " +
        CARGOS.length;

    }


    const cargoNome =
      $("cargoNome");

    if (cargoNome) {

      cargoNome.textContent =
        CARGOS[0].toUpperCase();

    }


    const candidatoNumero =
      $("candidatoNumero");

    if (candidatoNumero) {
      candidatoNumero.textContent =
        "—";
    }


    const card =
      $("candidatoCard");

    if (card) {
      card.classList.remove(
        "visible"
      );
    }


    const photoBox =
      $("candidatoPhotoBox");

    if (photoBox) {

      photoBox.classList.remove(
        "has-image"
      );

    }


    const foto =
      $("candidatoFoto");

    if (foto) {
      foto.removeAttribute(
        "src"
      );
    }


    const candidatoNome =
      $("candidatoNome");

    if (candidatoNome) {

      candidatoNome.textContent =
        "—";

    }


    const slogan =
      $("candidatoSlogan");

    if (slogan) {

      slogan.textContent =
        "";

    }


    const cargoMsg =
      $("cargoMsg");

    if (cargoMsg) {

      cargoMsg.textContent =
        "Digite o número do candidato.";

    }


    showStep(
      "stepRA"
    );

    setStatus(
      "AGUARDANDO"
    );

    disableKeys(
      false
    );

  }


  // ==========================================================
  // VERIFICAR SITUAÇÃO DA ELEIÇÃO
  // ==========================================================

  async function checkElection() {

    if (
      state.busy ||
      state.step === "stepAluno" ||
      state.step === "stepCargo" ||
      state.step === "stepFim"
    ) {

      return;

    }


    try {

      const data =
        await GremioAPI.call({

          action:
            "statusPublic"

        });


      if (
        data &&
        data.election &&
        data.election.aberta
      ) {

        if (
          state.step === "stepClosed"
        ) {

          reset();

        }


        if (
          state.step !== "stepFim"
        ) {

          setStatus(
            "AGUARDANDO"
          );

        }

      } else {

        showStep(
          "stepClosed"
        );

        setStatus(
          "ENCERRADA"
        );

      }


      const sync =
        $("sync");

      if (sync) {

        sync.textContent =
          "Conexão: " +
          new Date()
            .toLocaleTimeString(
              "pt-BR"
            );

      }

    } catch (error) {

      if (
        state.step !== "stepFim"
      ) {

        setStatus(
          "SEM CONEXÃO"
        );

      }


      const sync =
        $("sync");

      if (sync) {

        sync.textContent =
          "Conexão: falhou";

      }

    }

  }


  // ==========================================================
  // HEARTBEAT / IDENTIFICAÇÃO AUTOMÁTICA DA URNA
  // ==========================================================

  async function heartbeat() {

    try {

      const resposta =
        await GremioAPI.call({

          action:
            "heartbeat",

          dispositivoId:
            dispositivoId,

          urna:
            urna !== "—"
              ? urna
              : ""

        });


      if (
        resposta &&
        resposta.urna
      ) {

        atualizarNumeroUrna(
          resposta.urna
        );

      }


      const numeroExibido =
        urna !== "—"
          ? urna
          : "—";


      const sync =
        $("sync");

      if (sync) {

        sync.textContent =
          "Urna " +
          numeroExibido +
          ": ONLINE • " +
          new Date()
            .toLocaleTimeString(
              "pt-BR"
            );

      }

    } catch (error) {

      const sync =
        $("sync");

      if (sync) {

        sync.textContent =
          "Urna " +
          (
            urna !== "—"
              ? urna
              : "—"
          ) +
          ": sem comunicação";

      }

      console.log(
        "Heartbeat:",
        error
      );

    }

  }


  // ==========================================================
  // DIGITAR
  // ==========================================================

  let buscaCandidatoTimer = null;


  function digit(number) {

    if (state.busy) {
      return;
    }


    // --------------------------------------------------------
    // RA
    // --------------------------------------------------------

    if (
      state.step ===
      "stepRA"
    ) {

      if (
        state.ra.length >= 9
      ) {

        return;

      }


      state.ra +=
        String(number);


      const raView =
        $("raView");

      if (raView) {

        raView.textContent =
          state.ra;

      }


      return;

    }


    // --------------------------------------------------------
    // CANDIDATO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepCargo"
    ) {

      if (
        state.numero.length >= 3
      ) {

        return;

      }


      state.numero +=
        String(number);


      const numero =
        $("candidatoNumero");

      if (numero) {

        numero.textContent =
          state.numero;

      }


      state.candidato =
        null;


      const card =
        $("candidatoCard");

      if (card) {

        card.classList.remove(
          "visible"
        );

      }


      const mensagem =
        $("cargoMsg");

      if (mensagem) {

        mensagem.textContent =
          "Consultando candidato...";

      }


      // Cancela consulta anterior.

      clearTimeout(
        buscaCandidatoTimer
      );


      // Espera o usuário terminar
      // de digitar antes de consultar.

      buscaCandidatoTimer =
        setTimeout(
          () => {

            if (
              state.step === "stepCargo" &&
              state.numero
            ) {

              buscarCandidato(
                state.numero
              );

            }

          },
          400
        );

    }

  }


  // ==========================================================
  // BUSCAR CANDIDATO
  // ==========================================================

  let contadorBusca =
    0;


  async function buscarCandidato(numeroConsultado) {

    const cargo =
      CARGOS[state.cargoIndex];


    if (!cargo) {
      return;
    }


    const buscaAtual =
      ++contadorBusca;


    try {

      const data =
        await GremioAPI.call({

          action:
            "buscarCandidato",

          cargo:
            cargo,

          numero:
            numeroConsultado

        });


      // Ignora resposta antiga.

      if (
        buscaAtual !==
        contadorBusca
      ) {

        return;

      }


      if (
        state.step !==
        "stepCargo"
      ) {

        return;

      }


      if (
        state.numero !==
        String(numeroConsultado)
      ) {

        return;

      }


      if (
        !data ||
        !data.candidato
      ) {

        throw new Error(
          "Candidato não encontrado."
        );

      }


      state.candidato =
        data.candidato;


      // ------------------------------------------------------
      // NOME
      // ------------------------------------------------------

      const nome =
        $("candidatoNome");

      if (nome) {

        nome.textContent =
          state.candidato.nome ||
          "";

      }


      // ------------------------------------------------------
      // SLOGAN
      // ------------------------------------------------------

      const slogan =
        $("candidatoSlogan");

      if (slogan) {

        slogan.textContent =
          state.candidato.slogan ||
          "";

      }


      // ------------------------------------------------------
      // FOTO
      // ------------------------------------------------------

      const foto =
        $("candidatoFoto");

      const photoBox =
        $("candidatoPhotoBox");


      if (
        state.candidato.fotoUrl
      ) {

        if (foto) {

          foto.src =
            state.candidato.fotoUrl;

        }


        if (photoBox) {

          photoBox.classList.add(
            "has-image"
          );

        }

      } else {

        if (foto) {

          foto.removeAttribute(
            "src"
          );

        }


        if (photoBox) {

          photoBox.classList.remove(
            "has-image"
          );

        }

      }


      // ------------------------------------------------------
      // CARD
      // ------------------------------------------------------

      const card =
        $("candidatoCard");

      if (card) {

        card.classList.add(
          "visible"
        );

      }


      const mensagem =
        $("cargoMsg");

      if (mensagem) {

        mensagem.textContent =
          "Confira o candidato e pressione CONFIRMA.";

      }


      setStatus(
        "CONFIRA O VOTO"
      );


    } catch (error) {

      // Não mostra erro de uma consulta antiga.

      if (
        buscaAtual !==
        contadorBusca
      ) {

        return;

      }


      state.candidato =
        null;


      const card =
        $("candidatoCard");

      if (card) {

        card.classList.remove(
          "visible"
        );

      }


      const mensagem =
        $("cargoMsg");

      if (mensagem) {

        mensagem.textContent =
          error &&
          error.message
            ? error.message
            : "Candidato não encontrado.";

      }


      setStatus(
        "NÚMERO INVÁLIDO"
      );

    }

  }


  // ==========================================================
  // GUARDAR VOTO DO CARGO
  // ==========================================================

  function guardarVotoCargo(numero) {

    const cargo =
      CARGOS[state.cargoIndex];


    state.votos.push({

      cargo:
        cargo,

      numero:
        String(numero)
          .toUpperCase()

    });

  }


  // ==========================================================
  // AVANÇAR PARA O PRÓXIMO CARGO
  // ==========================================================

  async function confirmarCargo(numero) {

    guardarVotoCargo(
      numero
    );


    state.cargoIndex++;


    if (
      state.cargoIndex >=
      CARGOS.length
    ) {

      await registrarTodosVotos();

      return;

    }


    mostrarCargoAtual();

  }


  // ==========================================================
  // CONFIRMAR
  // ==========================================================

  async function confirm() {

    prepararAudio();


    if (state.busy) {
      return;
    }


    // ======================================================
    // CONFIRMAR RA
    // ======================================================

    if (
      state.step ===
      "stepRA"
    ) {

      if (
        state.ra.length !==
        9
      ) {

        const raMsg =
          $("raMsg");

        if (raMsg) {

          raMsg.textContent =
            "Digite o RA completo com 9 números.";

        }

        return;

      }


      state.busy =
        true;

      disableKeys(
        true
      );

      setStatus(
        "CONSULTANDO..."
      );


      try {

        const data =
          await GremioAPI.call({

            action:
              "buscarAluno",

            ra:
              state.ra

          });


        if (
          !data ||
          !data.aluno
        ) {

          throw new Error(
            "Eleitor não encontrado."
          );

        }


        if (
          data.aluno.jaVotou
        ) {

          throw new Error(
            "Este RA já possui um voto registrado."
          );

        }


        state.aluno =
          data.aluno;


        const nomeAluno =
          $("nomeAluno");

        if (nomeAluno) {

          nomeAluno.textContent =
            data.aluno.nome ||
            "";

        }


        const dataAluno =
          $("dataAluno");

        if (dataAluno) {

          dataAluno.textContent =
            data.aluno.dataNascimento ||
            "";

        }


        // IMPORTANTE:
        // Aqui abre a confirmação do aluno.

        const abriu =
          showStep(
            "stepAluno"
          );


        if (!abriu) {

          throw new Error(
            'A tela "stepAluno" não foi encontrada no urna.html.'
          );

        }


        setStatus(
          "CONFIRA SEUS DADOS"
        );


      } catch (error) {

        const raMsg =
          $("raMsg");

        if (raMsg) {

          raMsg.textContent =
            error &&
            error.message
              ? error.message
              : "Erro ao consultar o RA.";

        }


        setStatus(
          "RA NÃO LOCALIZADO"
        );


      } finally {

        state.busy =
          false;

        disableKeys(
          false
        );

      }


      return;

    }


    // ======================================================
    // CONFIRMAR DADOS DO ALUNO
    // ======================================================

    if (
      state.step ===
      "stepAluno"
    ) {

      if (!state.aluno) {

        reset();

        return;

      }


      state.cargoIndex =
        0;

      state.numero =
        "";

      state.candidato =
        null;

      state.votos =
        [];


      mostrarCargoAtual();

      return;

    }


    // ======================================================
    // CONFIRMAR CANDIDATO
    // ======================================================

    if (
      state.step ===
      "stepCargo"
    ) {

      if (
        !state.numero
      ) {

        const cargoMsg =
          $("cargoMsg");

        if (cargoMsg) {

          cargoMsg.textContent =
            "Digite o número do candidato.";

        }

        return;

      }


      if (
        !state.candidato
      ) {

        const cargoMsg =
          $("cargoMsg");

        if (cargoMsg) {

          cargoMsg.textContent =
            "Digite um candidato válido ou pressione BRANCO.";

        }

        return;

      }


      await confirmarCargo(
        state.numero
      );

    }

  }


  // ==========================================================
  // REGISTRAR TODOS OS VOTOS
  // ==========================================================

  async function registrarTodosVotos() {

    state.busy =
      true;

    disableKeys(
      true
    );

    setStatus(
      "REGISTRANDO VOTOS..."
    );


    try {

      // Tenta garantir que a urna
      // já esteja identificada.

      if (
        urna === "—"
      ) {

        try {

          await heartbeat();

        } catch (erroHeartbeat) {

          console.log(
            "Não foi possível atualizar a urna:",
            erroHeartbeat
          );

        }

      }


      const payload = {

        action:
          "registrarVotos",

        ra:
          state.ra,

        dataNascimento:
          state.aluno.dataNascimento,

        dispositivoId:
          dispositivoId,

        urna:
          urna !== "—"
            ? urna
            : "",

        votos:
          JSON.stringify(
            state.votos
          )

      };


      let registroConfirmado =
        false;


      // ====================================================
      // ENVIO PRINCIPAL
      // ====================================================

      try {

        const resposta =
          await GremioAPI.call(
            payload
          );


        if (
          resposta &&
          resposta.ok === true
        ) {

          registroConfirmado =
            true;


          if (
            resposta.urna
          ) {

            atualizarNumeroUrna(
              resposta.urna
            );

          }

        }

      } catch (erroApi) {

        console.log(
          "Erro no registro principal:",
          erroApi
        );

      }


      // ====================================================
      // VERIFICAÇÃO
      // ====================================================

      if (
        !registroConfirmado
      ) {

        try {

          const verificacao =
            await GremioAPI.call({

              action:
                "buscarAluno",

              ra:
                state.ra

            });


          if (
            verificacao &&
            verificacao.aluno &&
            verificacao.aluno.jaVotou === true
          ) {

            registroConfirmado =
              true;

          }

        } catch (erroVerificacao) {

          console.log(
            "Erro na verificação:",
            erroVerificacao
          );

        }

      }


      // ====================================================
      // SUCESSO
      // ====================================================

      if (
        !registroConfirmado
      ) {

        throw new Error(
          "Não foi possível confirmar o registro dos votos."
        );

      }


      mostrarTelaFim();


    } catch (error) {

      // Volta para o último cargo
      // para permitir nova tentativa.

      state.cargoIndex =
        CARGOS.length - 1;


      mostrarCargoAtual();


      const cargoMsg =
        $("cargoMsg");

      if (cargoMsg) {

        cargoMsg.textContent =
          error &&
          error.message
            ? error.message
            : "Não foi possível registrar os votos.";

      }


      setStatus(
        "NÃO REGISTRADO"
      );

      disableKeys(
        false
      );


    } finally {

      state.busy =
        false;

    }

  }


  // ==========================================================
  // TELA FINAL
  // ==========================================================

  function mostrarTelaFim() {

    const fim =
      $("stepFim");


    if (!fim) {

      throw new Error(
        'A tela "stepFim" não foi encontrada.'
      );

    }


    document
      .querySelectorAll(".step")
      .forEach(element => {

        element.classList.remove(
          "active"
        );

      });


    fim.classList.add(
      "active"
    );


    state.step =
      "stepFim";


    setStatus(
      "VOTO REGISTRADO"
    );


    const sync =
      $("sync");

    if (sync) {

      sync.textContent =
        "Votos registrados • Urna " +
        (
          urna !== "—"
            ? urna
            : "??"
        );

    }


    somFimUrna();


    // Mantém teclado bloqueado
    // enquanto aparece FIM.

    disableKeys(
      true
    );


    // Volta automaticamente
    // para a identificação.

    setTimeout(
      () => {

        reset();

        checkElection();

        heartbeat();

      },
      5000
    );

  }


  // ==========================================================
  // CORRIGE
  // ==========================================================

  function correct() {

    if (state.busy) {
      return;
    }


    // --------------------------------------------------------
    // RA
    // --------------------------------------------------------

    if (
      state.step ===
      "stepRA"
    ) {

      state.ra =
        "";


      const raView =
        $("raView");

      if (raView) {

        raView.textContent =
          "—";

      }


      const raMsg =
        $("raMsg");

      if (raMsg) {

        raMsg.textContent =
          "Número apagado.";

      }


      return;

    }


    // --------------------------------------------------------
    // DADOS DO ALUNO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepAluno"
    ) {

      reset();

      return;

    }


    // --------------------------------------------------------
    // CARGO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepCargo"
    ) {

      clearTimeout(
        buscaCandidatoTimer
      );


      contadorBusca++;


      state.numero =
        "";

      state.candidato =
        null;


      const numero =
        $("candidatoNumero");

      if (numero) {

        numero.textContent =
          "—";

      }


      const card =
        $("candidatoCard");

      if (card) {

        card.classList.remove(
          "visible"
        );

      }


      const photoBox =
        $("candidatoPhotoBox");

      if (photoBox) {

        photoBox.classList.remove(
          "has-image"
        );

      }


      const foto =
        $("candidatoFoto");

      if (foto) {

        foto.removeAttribute(
          "src"
        );

      }


      const nome =
        $("candidatoNome");

      if (nome) {

        nome.textContent =
          "—";

      }


      const slogan =
        $("candidatoSlogan");

      if (slogan) {

        slogan.textContent =
          "";

      }


      const mensagem =
        $("cargoMsg");

      if (mensagem) {

        mensagem.textContent =
          "Número apagado. Digite novamente.";

      }


      setStatus(
        "DIGITE O CANDIDATO"
      );

    }

  }


  // ==========================================================
  // BRANCO
  // ==========================================================

  async function voteWhite() {

    if (
      state.step !==
      "stepCargo"
    ) {

      return;

    }


    if (
      state.busy
    ) {

      return;

    }


    prepararAudio();


    await confirmarCargo(
      "BRANCO"
    );

  }


  // ==========================================================
  // BOTÕES NUMÉRICOS
  // ==========================================================

  document
    .querySelectorAll(".num")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          digit(
            button.dataset.n
          );

        }
      );

    });


  // ==========================================================
  // BOTÃO CONFIRMA
  // ==========================================================

  const botaoConfirma =
    $("confirma");

  if (botaoConfirma) {

    botaoConfirma.addEventListener(
      "click",
      confirm
    );

  }


  // ==========================================================
  // BOTÃO CORRIGE
  // ==========================================================

  const botaoCorrige =
    $("corrige");

  if (botaoCorrige) {

    botaoCorrige.addEventListener(
      "click",
      correct
    );

  }


  // ==========================================================
  // BOTÃO BRANCO
  // ==========================================================

  const botaoBranco =
    $("branco");

  if (botaoBranco) {

    botaoBranco.addEventListener(
      "click",
      voteWhite
    );

  }


  // ==========================================================
  // BOTÃO REINICIAR
  // ==========================================================

  const botaoRestart =
    $("restart");

  if (botaoRestart) {

    botaoRestart.addEventListener(
      "click",
      () => {

        reset();

        checkElection();

        heartbeat();

      }
    );

  }


  // ==========================================================
  // TECLADO FÍSICO
  // ==========================================================

  document.addEventListener(
    "keydown",
    event => {

      const key =
        event.key;


      // NÚMEROS

      if (
        /^\d$/.test(key)
      ) {

        event.preventDefault();

        digit(key);

        return;

      }


      // ENTER

      if (
        key === "Enter"
      ) {

        event.preventDefault();

        confirm();

        return;

      }


      // ESC

      if (
        key === "Escape"
      ) {

        event.preventDefault();

        correct();

        return;

      }

    }
  );


  // ==========================================================
  // INICIALIZAÇÃO
  // ==========================================================

  prepararAudio();

  checkElection();

  heartbeat();


  // Atualiza o status da urna
  // a cada 20 segundos.

  setInterval(
    () => {

      heartbeat();

    },
    20000
  );


  // Verifica abertura/encerramento
  // da eleição a cada 5 segundos.

  setInterval(
    () => {

      checkElection();

    },
    5000
  );


})();
