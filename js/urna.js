(() => {

  const $ = id => document.getElementById(id);

  const params = new URLSearchParams(window.location.search);

  const urna = String(params.get("urna") || "01")
    .replace(/\D/g, "")
    .padStart(2, "0");

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


  $("urnLabel").textContent = "URNA " + urna;
  $("urnFooter").textContent = urna;


  // ==========================================================
  // STATUS VISUAL
  // ==========================================================

  function setStatus(text) {
    $("status").textContent = text;
  }


  // ==========================================================
  // ÁUDIO DE FINALIZAÇÃO
  // ==========================================================

  const somFim = new Audio("audio/som-urna-fim.mp3");
  somFim.preload = "auto";


  function prepararAudio() {
    try {
      somFim.load();
    } catch (error) {
      console.log("Não foi possível carregar o áudio:", error);
    }
  }


  function somFimUrna() {
    try {
      somFim.currentTime = 0;

      const reproducao = somFim.play();

      if (reproducao) {
        reproducao.catch(function(error) {
          console.log("Não foi possível reproduzir o som:", error);
        });
      }

    } catch (error) {
      console.log("Erro ao reproduzir o som:", error);
    }
  }


  // ==========================================================
  // TROCAR TELA
  // ==========================================================

  function showStep(id) {

    document.querySelectorAll(".step").forEach(element => {
      element.classList.remove("active");
    });

    const tela = $(id);

    if (!tela) {
      return;
    }

    tela.classList.add("active");
    state.step = id;
  }


  // ==========================================================
  // BLOQUEAR TECLADO
  // ==========================================================

  function disableKeys(value) {

    document.querySelectorAll(".key").forEach(button => {
      button.disabled = value;
    });

  }


  // ==========================================================
  // LIMPAR TELA DO CARGO
  // ==========================================================

  function limparCargo() {

    state.numero = "";
    state.candidato = null;

    $("candidatoNumero").textContent = "—";

    $("candidatoCard").classList.remove("visible");

    $("candidatoPhotoBox").classList.remove("has-image");

    $("candidatoFoto").removeAttribute("src");

    $("candidatoNome").textContent = "—";

    $("candidatoSlogan").textContent = "";

    $("cargoMsg").textContent =
      "Digite o número do candidato.";

    setStatus("DIGITE O CANDIDATO");

  }


  // ==========================================================
  // MOSTRAR CARGO ATUAL
  // ==========================================================

  function mostrarCargoAtual() {

    const cargo = CARGOS[state.cargoIndex];

    $("cargoProgress").textContent =
      "CARGO " +
      (state.cargoIndex + 1) +
      " DE " +
      CARGOS.length;

    $("cargoNome").textContent =
      cargo.toUpperCase();

    limparCargo();

    showStep("stepCargo");

  }


  // ==========================================================
  // RESET
  // ==========================================================

  function reset() {

    state.step = "stepRA";

    state.ra = "";

    state.aluno = null;

    state.cargoIndex = 0;

    state.numero = "";

    state.candidato = null;

    state.votos = [];

    state.busy = false;


    $("raView").textContent = "—";

    $("raMsg").textContent =
      "Pressione CONFIRMA depois de digitar.";


    $("nomeAluno").textContent = "—";

    $("dataAluno").textContent = "—";


    $("cargoProgress").textContent =
      "CARGO 1 DE " + CARGOS.length;

    $("cargoNome").textContent =
      CARGOS[0].toUpperCase();


    $("candidatoNumero").textContent = "—";

    $("candidatoCard").classList.remove("visible");

    $("candidatoPhotoBox").classList.remove("has-image");

    $("candidatoFoto").removeAttribute("src");

    $("candidatoNome").textContent = "—";

    $("candidatoSlogan").textContent = "";

    $("cargoMsg").textContent =
      "Digite o número do candidato.";


    showStep("stepRA");

    setStatus("AGUARDANDO");

    disableKeys(false);

  }


  // ==========================================================
  // VERIFICAR ELEIÇÃO
  // ==========================================================

  async function checkElection() {

    // Não interrompe um voto em andamento.

    if (
      state.busy ||
      state.step === "stepAluno" ||
      state.step === "stepCargo" ||
      state.step === "stepFim"
    ) {
      return;
    }


    try {

      const data = await GremioAPI.call({
        action: "statusPublic"
      });


      if (
        data.election &&
        data.election.aberta
      ) {

        if (state.step === "stepClosed") {
          reset();
        }

        setStatus("AGUARDANDO");

      } else {

        showStep("stepClosed");

        setStatus("ENCERRADA");

      }


      $("sync").textContent =
        "Conexão: " +
        new Date().toLocaleTimeString("pt-BR");


    } catch (error) {

      if (!state.busy) {
        setStatus("SEM CONEXÃO");
      }

      $("sync").textContent =
        "Conexão: falhou";

    }

  }


  // ==========================================================
  // HEARTBEAT
  // ==========================================================

  async function heartbeat() {

    try {

      await GremioAPI.call({
        action: "heartbeat",
        urna: urna
      });


      $("sync").textContent =
        "Urna " +
        urna +
        ": ONLINE • " +
        new Date().toLocaleTimeString("pt-BR");


    } catch (error) {

      $("sync").textContent =
        "Urna " +
        urna +
        ": sem comunicação";

    }

  }


  // ==========================================================
  // DIGITAR NÚMERO
  // ==========================================================

  function digit(number) {

    if (state.busy) {
      return;
    }


    // --------------------------------------------------------
    // RA
    // --------------------------------------------------------

    if (state.step === "stepRA") {

      if (state.ra.length >= 9) {
        return;
      }


      state.ra += number;

      $("raView").textContent =
        state.ra;

      return;

    }


    // --------------------------------------------------------
    // CANDIDATO DO CARGO
    // --------------------------------------------------------

    if (state.step === "stepCargo") {

      if (state.numero.length >= 3) {
        return;
      }


      state.numero += number;

      $("candidatoNumero").textContent =
        state.numero;


      // Consulta com 2 ou 3 dígitos.

      if (state.numero.length >= 2) {
        buscarCandidato();
      }

    }

  }


  // ==========================================================
  // BUSCAR CANDIDATO
  // ==========================================================

  async function buscarCandidato() {

    if (state.busy) {
      return;
    }


    state.busy = true;

    disableKeys(true);


    const cargo =
      CARGOS[state.cargoIndex];


    try {

      const data =
        await GremioAPI.call({

          action: "buscarCandidato",

          cargo: cargo,

          numero: state.numero

        });


      state.candidato =
        data.candidato;


      $("candidatoNome").textContent =
        state.candidato.nome || "";


      $("candidatoSlogan").textContent =
        state.candidato.slogan || "";


      if (state.candidato.fotoUrl) {

        $("candidatoFoto").src =
          state.candidato.fotoUrl;

        $("candidatoPhotoBox")
          .classList
          .add("has-image");

      } else {

        $("candidatoFoto")
          .removeAttribute("src");

        $("candidatoPhotoBox")
          .classList
          .remove("has-image");

      }


      $("candidatoCard")
        .classList
        .add("visible");


      $("cargoMsg").textContent =
        "Confira o candidato e pressione CONFIRMA.";


      setStatus("CONFIRA O VOTO");


    } catch (error) {

      state.candidato = null;


      $("candidatoCard")
        .classList
        .remove("visible");


      $("cargoMsg").textContent =
        error.message ||
        "Candidato não encontrado.";


      setStatus("NÚMERO INVÁLIDO");


    } finally {

      state.busy = false;

      disableKeys(false);

    }

  }


  // ==========================================================
  // GUARDAR VOTO DO CARGO
  // ==========================================================

  function guardarVotoCargo(numero) {

    const cargo =
      CARGOS[state.cargoIndex];


    state.votos.push({

      cargo: cargo,

      numero:
        String(numero).toUpperCase()

    });

  }


  // ==========================================================
  // AVANÇAR PARA O PRÓXIMO CARGO
  // ==========================================================

  async function confirmarCargo(numero) {

    guardarVotoCargo(numero);


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


    // --------------------------------------------------------
    // RA
    // --------------------------------------------------------

    if (state.step === "stepRA") {

      if (state.ra.length !== 9) {

        $("raMsg").textContent =
          "Digite o RA completo com 9 números.";

        return;

      }


      state.busy = true;

      disableKeys(true);

      setStatus("CONSULTANDO...");


      try {

        const data =
          await GremioAPI.call({

            action: "buscarAluno",

            ra: state.ra

          });


        if (data.aluno.jaVotou) {

          throw new Error(
            "Este RA já possui um voto registrado."
          );

        }


        state.aluno =
          data.aluno;


        $("nomeAluno").textContent =
          data.aluno.nome;


        $("dataAluno").textContent =
          data.aluno.dataNascimento;


        showStep("stepAluno");


        setStatus("CONFIRA SEUS DADOS");


      } catch (error) {

        $("raMsg").textContent =
          error.message;


        setStatus("RA NÃO LOCALIZADO");


      } finally {

        state.busy = false;

        disableKeys(false);

      }


      return;

    }


    // --------------------------------------------------------
    // CONFIRMAR ALUNO
    // --------------------------------------------------------

    if (state.step === "stepAluno") {

      state.cargoIndex = 0;

      state.votos = [];

      mostrarCargoAtual();

      return;

    }


    // --------------------------------------------------------
    // CONFIRMAR CANDIDATO
    // --------------------------------------------------------

    if (state.step === "stepCargo") {

      if (!state.numero) {

        $("cargoMsg").textContent =
          "Digite o número do candidato.";

        return;

      }


      if (!state.candidato) {

        $("cargoMsg").textContent =
          "Digite um candidato válido ou pressione BRANCO.";

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

    state.busy = true;

    disableKeys(true);

    setStatus("REGISTRANDO VOTOS...");


    try {

      let registroConfirmado = false;


      try {

        const resposta =
          await GremioAPI.call({

            action: "registrarVotos",

            ra: state.ra,

            dataNascimento:
              state.aluno.dataNascimento,

            urna: urna,

            votos:
              JSON.stringify(state.votos)

          });


        registroConfirmado =
          resposta &&
          resposta.ok === true;


      } catch (erroApi) {

        registroConfirmado = false;

      }


      // ------------------------------------------------------
      // Se a resposta se perdeu, verifica se o voto foi salvo.
      // ------------------------------------------------------

      if (!registroConfirmado) {

        try {

          const verificacao =
            await GremioAPI.call({

              action: "buscarAluno",

              ra: state.ra

            });


          if (
            verificacao &&
            verificacao.aluno &&
            verificacao.aluno.jaVotou === true
          ) {

            registroConfirmado = true;

          }


        } catch (erroVerificacao) {

          registroConfirmado = false;

        }

      }


      if (!registroConfirmado) {

        throw new Error(
          "Não foi possível confirmar o registro dos votos."
        );

      }


      mostrarTelaFim();


    } catch (error) {

      state.cargoIndex =
        CARGOS.length - 1;


      $("cargoMsg").textContent =
        error.message;


      showStep("stepCargo");


      setStatus("NÃO REGISTRADO");


      disableKeys(false);


    } finally {

      state.busy = false;

    }

  }


  // ==========================================================
  // TELA FINAL
  // ==========================================================

  function mostrarTelaFim() {

    const fim = $("stepFim");


    if (!fim) {

      throw new Error(
        "A tela final não foi encontrada."
      );

    }


    document.querySelectorAll(".step")
      .forEach(element => {

        element.classList.remove("active");

      });


    fim.classList.add("active");


    state.step = "stepFim";


    setStatus("VOTO REGISTRADO");


    $("sync").textContent =
      "Votos registrados • Urna " +
      urna;


    somFimUrna();

    disableKeys(true);


    setTimeout(() => {

      reset();

      checkElection();

      heartbeat();

    }, 5000);

  }


  // ==========================================================
  // CORRIGIR
  // ==========================================================

  function correct() {

    if (state.busy) {
      return;
    }


    // --------------------------------------------------------
    // CORRIGIR RA
    // --------------------------------------------------------

    if (state.step === "stepRA") {

      state.ra = "";

      $("raView").textContent =
        "—";

      $("raMsg").textContent =
        "Número apagado.";

      return;

    }


    // --------------------------------------------------------
    // VOLTAR DOS DADOS DO ALUNO
    // --------------------------------------------------------

    if (state.step === "stepAluno") {

      reset();

      return;

    }


    // --------------------------------------------------------
    // CORRIGIR NÚMERO DO CANDIDATO
    // --------------------------------------------------------

    if (state.step === "stepCargo") {

      state.numero = "";

      state.candidato = null;


      $("candidatoNumero").textContent =
        "—";


      $("candidatoCard")
        .classList
        .remove("visible");


      $("candidatoPhotoBox")
        .classList
        .remove("has-image");


      $("candidatoFoto")
        .removeAttribute("src");


      $("candidatoNome").textContent =
        "—";


      $("candidatoSlogan").textContent =
        "";


      $("cargoMsg").textContent =
        "Número apagado. Digite novamente.";


      setStatus("DIGITE O CANDIDATO");

    }

  }


  // ==========================================================
  // BRANCO — PARA O CARGO ATUAL
  // ==========================================================

  async function voteWhite() {

    if (
      state.step !== "stepCargo" ||
      state.busy
    ) {

      return;

    }


    prepararAudio();


    await confirmarCargo("BRANCO");

  }


  // ==========================================================
  // BOTÕES
  // ==========================================================

  document.querySelectorAll(".num")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => digit(button.dataset.n)
      );

    });


  $("confirma")
    .addEventListener(
      "click",
      confirm
    );


  $("corrige")
    .addEventListener(
      "click",
      correct
    );


  $("branco")
    .addEventListener(
      "click",
      voteWhite
    );


  $("restart")
    .addEventListener(
      "click",
      () => {

        reset();

        checkElection();

        heartbeat();

      }
    );


  // ==========================================================
  // TECLADO FÍSICO
  // ==========================================================

  document.addEventListener(
    "keydown",
    event => {

      const key = event.key;


      if (/^\d$/.test(key)) {

        event.preventDefault();

        digit(key);

        return;

      }


      if (key === "Enter") {

        event.preventDefault();

        confirm();

        return;

      }


      if (key === "Escape") {

        event.preventDefault();

        correct();

      }

    }
  );


  // ==========================================================
  // INÍCIO
  // ==========================================================

  prepararAudio();

  checkElection();

  heartbeat();


  setInterval(
    () => {
      heartbeat();
    },
    20000
  );


  setInterval(
    () => {
      checkElection();
    },
    5000
  );


})();
