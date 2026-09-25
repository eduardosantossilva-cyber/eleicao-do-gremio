(() => {

  const $ = id => document.getElementById(id);


  // ==========================================================
  // IDENTIFICAÇÃO DA URNA
  // ==========================================================

  const params =
    new URLSearchParams(
      window.location.search
    );


  const urna =
    String(
      params.get("urna") || "01"
    )
      .replace(/\D/g, "")
      .padStart(2, "0");


  // ==========================================================
  // CARGOS DA ELEIÇÃO
  // ==========================================================

  const CARGOS = [

    "Presidente",

    "Vice-Presidente",

    "Secretário(a)",

    "Tesoureiro(a)",

    "Diretor(a) de Comunicação",

    "Diretor(a) de Cultura",

    "Diretor(a) de Esportes"

  ];


  // ==========================================================
  // ESTADO DA URNA
  // ==========================================================

  const state = {

    step:
      "stepRA",

    ra:
      "",

    aluno:
      null,

    cargoIndex:
      0,

    numero:
      "",

    candidato:
      null,

    votos:
      [],

    busy:
      false

  };


  // ==========================================================
  // IDENTIFICAÇÃO VISUAL
  // ==========================================================

  if ($("urnLabel")) {

    $("urnLabel").textContent =
      "URNA " + urna;

  }


  if ($("urnFooter")) {

    $("urnFooter").textContent =
      urna;

  }


  // ==========================================================
  // STATUS VISUAL
  // ==========================================================

  function setStatus(text) {

    if ($("status")) {

      $("status").textContent =
        text;

    }

  }


  // ==========================================================
  // ÁUDIO DE FINALIZAÇÃO
  // ==========================================================

  const somFim =
    new Audio(
      "audio/som-urna-fim.mp3"
    );


  somFim.preload =
    "auto";


  function prepararAudio() {

    try {

      somFim.load();

    }

    catch (error) {

      console.log(
        "Não foi possível carregar o áudio:",
        error
      );

    }

  }


  function somFimUrna() {

    try {

      somFim.currentTime =
        0;


      const reproducao =
        somFim.play();


      if (reproducao) {

        reproducao.catch(
          function(error) {

            console.log(
              "Não foi possível reproduzir o som:",
              error
            );

          }
        );

      }

    }

    catch (error) {

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
      .forEach(
        element => {

          element.classList.remove(
            "active"
          );

        }
      );


    const tela =
      $(id);


    if (!tela) {

      return;

    }


    tela.classList.add(
      "active"
    );


    state.step =
      id;

  }


  // ==========================================================
  // BLOQUEAR TECLADO
  // ==========================================================

  function disableKeys(value) {

    document
      .querySelectorAll(".key")
      .forEach(
        button => {

          button.disabled =
            value;

        }
      );

  }


  // ==========================================================
  // LIMPAR CARGO
  // ==========================================================

  function limparCargo() {

    state.numero =
      "";

    state.candidato =
      null;


    if ($("candidatoNumero")) {

      $("candidatoNumero")
        .textContent =
        "—";

    }


    if ($("candidatoCard")) {

      $("candidatoCard")
        .classList.remove(
          "visible"
        );

    }


    if ($("candidatoPhotoBox")) {

      $("candidatoPhotoBox")
        .classList.remove(
          "has-image"
        );

    }


    if ($("candidatoFoto")) {

      $("candidatoFoto")
        .removeAttribute(
          "src"
        );

    }


    if ($("candidatoNome")) {

      $("candidatoNome")
        .textContent =
        "—";

    }


    if ($("candidatoSlogan")) {

      $("candidatoSlogan")
        .textContent =
        "";

    }


    if ($("cargoMsg")) {

      $("cargoMsg")
        .textContent =
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
      CARGOS[
        state.cargoIndex
      ];


    if ($("cargoProgress")) {

      $("cargoProgress")
        .textContent =
        "CARGO " +
        (state.cargoIndex + 1) +
        " DE " +
        CARGOS.length;

    }


    if ($("cargoNome")) {

      $("cargoNome")
        .textContent =
        cargo.toUpperCase();

    }


    limparCargo();


    showStep(
      "stepCargo"
    );

  }


  // ==========================================================
  // RESET
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


    if ($("raView")) {

      $("raView")
        .textContent =
        "—";

    }


    if ($("raMsg")) {

      $("raMsg")
        .textContent =
        "Pressione CONFIRMA depois de digitar.";

    }


    if ($("nomeAluno")) {

      $("nomeAluno")
        .textContent =
        "—";

    }


    if ($("dataAluno")) {

      $("dataAluno")
        .textContent =
        "—";

    }


    if ($("cargoProgress")) {

      $("cargoProgress")
        .textContent =
        "CARGO 1 DE " +
        CARGOS.length;

    }


    if ($("cargoNome")) {

      $("cargoNome")
        .textContent =
        CARGOS[0].toUpperCase();

    }


    if ($("candidatoNumero")) {

      $("candidatoNumero")
        .textContent =
        "—";

    }


    if ($("candidatoCard")) {

      $("candidatoCard")
        .classList.remove(
          "visible"
        );

    }


    if ($("candidatoPhotoBox")) {

      $("candidatoPhotoBox")
        .classList.remove(
          "has-image"
        );

    }


    if ($("candidatoFoto")) {

      $("candidatoFoto")
        .removeAttribute(
          "src"
        );

    }


    if ($("candidatoNome")) {

      $("candidatoNome")
        .textContent =
        "—";

    }


    if ($("candidatoSlogan")) {

      $("candidatoSlogan")
        .textContent =
        "";

    }


    if ($("cargoMsg")) {

      $("cargoMsg")
        .textContent =
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
  // VERIFICAR ELEIÇÃO
  // ==========================================================

  async function checkElection() {

    // Não interrompe um voto em andamento.

    if (

      state.busy ||

      state.step ===
        "stepAluno" ||

      state.step ===
        "stepCargo" ||

      state.step ===
        "stepFim"

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

        data.election &&

        data.election.aberta

      ) {

        if (

          state.step ===
          "stepClosed"

        ) {

          reset();

        }


        setStatus(
          "AGUARDANDO"
        );


      }

      else {

        showStep(
          "stepClosed"
        );

        setStatus(
          "ENCERRADA"
        );

      }


      if ($("sync")) {

        $("sync").textContent =
          "Conexão: " +
          new Date()
            .toLocaleTimeString(
              "pt-BR"
            );

      }

    }


    catch (error) {

      if (!state.busy) {

        setStatus(
          "SEM CONEXÃO"
        );

      }


      if ($("sync")) {

        $("sync").textContent =
          "Conexão: falhou";

      }

    }

  }


  // ==========================================================
  // HEARTBEAT
  // ==========================================================

  async function heartbeat() {

    try {

      await GremioAPI.call({

        action:
          "heartbeat",

        urna:
          urna

      });


      if ($("sync")) {

        $("sync").textContent =

          "Urna " +
          urna +
          ": ONLINE • " +

          new Date()
            .toLocaleTimeString(
              "pt-BR"
            );

      }

    }

    catch (error) {

      if ($("sync")) {

        $("sync").textContent =

          "Urna " +
          urna +
          ": sem comunicação";

      }

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

    if (
      state.step ===
      "stepRA"
    ) {

      if (
        state.ra.length >=
        9
      ) {

        return;

      }


      state.ra +=
        number;


      if ($("raView")) {

        $("raView")
          .textContent =
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
        state.numero.length >=
        3
      ) {

        return;

      }


      state.numero +=
        number;


      if ($("candidatoNumero")) {

        $("candidatoNumero")
          .textContent =
          state.numero;

      }


      /*
       * Consulta automaticamente
       * a partir de 2 dígitos.
       */

      if (
        state.numero.length >=
        2
      ) {

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


    state.busy =
      true;


    disableKeys(
      true
    );


    const cargo =
      CARGOS[
        state.cargoIndex
      ];


    try {

      const data =
        await GremioAPI.call({

          action:
            "buscarCandidato",

          cargo:
            cargo,

          numero:
            state.numero

        });


      state.candidato =
        data.candidato;


      // ------------------------------------------------------
      // NOME
      // ------------------------------------------------------

      if ($("candidatoNome")) {

        $("candidatoNome")
          .textContent =
          state.candidato.nome ||
          "";

      }


      // ------------------------------------------------------
      // SLOGAN
      // ------------------------------------------------------

      if ($("candidatoSlogan")) {

        $("candidatoSlogan")
          .textContent =
          state.candidato.slogan ||
          "";

      }


      // ------------------------------------------------------
      // FOTO
      // ------------------------------------------------------

      if (
        state.candidato.fotoUrl
      ) {

        if ($("candidatoFoto")) {

          $("candidatoFoto")
            .src =
            state.candidato.fotoUrl;

        }


        if ($("candidatoPhotoBox")) {

          $("candidatoPhotoBox")
            .classList.add(
              "has-image"
            );

        }

      }

      else {

        if ($("candidatoFoto")) {

          $("candidatoFoto")
            .removeAttribute(
              "src"
            );

        }


        if ($("candidatoPhotoBox")) {

          $("candidatoPhotoBox")
            .classList.remove(
              "has-image"
            );

        }

      }


      // ------------------------------------------------------
      // MOSTRA CARD
      // ------------------------------------------------------

      if ($("candidatoCard")) {

        $("candidatoCard")
          .classList.add(
            "visible"
          );

      }


      if ($("cargoMsg")) {

        $("cargoMsg")
          .textContent =
          "Confira o candidato e pressione CONFIRMA.";

      }


      setStatus(
        "CONFIRA O VOTO"
      );

    }


    catch (error) {

      state.candidato =
        null;


      if ($("candidatoCard")) {

        $("candidatoCard")
          .classList.remove(
            "visible"
          );

      }


      if ($("cargoMsg")) {

        $("cargoMsg")
          .textContent =
          error.message ||
          "Candidato não encontrado.";

      }


      setStatus(
        "NÚMERO INVÁLIDO"
      );

    }


    finally {

      state.busy =
        false;


      disableKeys(
        false
      );

    }

  }


  // ==========================================================
  // GUARDAR VOTO DO CARGO
  // ==========================================================

  function guardarVotoCargo(numero) {

    const cargo =
      CARGOS[
        state.cargoIndex
      ];


    state.votos.push({

      cargo:
        cargo,

      numero:
        String(
          numero
        ).toUpperCase()

    });

  }


  // ==========================================================
  // IR PARA O PRÓXIMO CARGO
  // ==========================================================

  async function confirmarCargo(numero) {

    guardarVotoCargo(
      numero
    );


    state.cargoIndex++;


    // --------------------------------------------------------
    // TODOS OS CARGOS FINALIZADOS
    // --------------------------------------------------------

    if (
      state.cargoIndex >=
      CARGOS.length
    ) {

      await registrarTodosVotos();

      return;

    }


    // --------------------------------------------------------
    // PRÓXIMO CARGO
    // --------------------------------------------------------

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

    if (
      state.step ===
      "stepRA"
    ) {

      if (
        state.ra.length !==
        9
      ) {

        if ($("raMsg")) {

          $("raMsg")
            .textContent =
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
          data.aluno.jaVotou
        ) {

          throw new Error(
            "Este RA já possui um voto registrado."
          );

        }


        state.aluno =
          data.aluno;


        if ($("nomeAluno")) {

          $("nomeAluno")
            .textContent =
            data.aluno.nome;

        }


        if ($("dataAluno")) {

          $("dataAluno")
            .textContent =
            data.aluno.dataNascimento;

        }


        showStep(
          "stepAluno"
        );


        setStatus(
          "CONFIRA SEUS DADOS"
        );

      }


      catch (error) {

        if ($("raMsg")) {

          $("raMsg")
            .textContent =
            error.message;

        }


        setStatus(
          "RA NÃO LOCALIZADO"
        );

      }


      finally {

        state.busy =
          false;


        disableKeys(
          false
        );

      }


      return;

    }


    // --------------------------------------------------------
    // CONFIRMAR ALUNO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepAluno"
    ) {

      state.cargoIndex =
        0;


      state.votos =
        [];


      mostrarCargoAtual();


      return;

    }


    // --------------------------------------------------------
    // CONFIRMAR CANDIDATO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepCargo"
    ) {

      if (
        !state.numero
      ) {

        if ($("cargoMsg")) {

          $("cargoMsg")
            .textContent =
            "Digite o número do candidato.";

        }


        return;

      }


      if (
        !state.candidato
      ) {

        if ($("cargoMsg")) {

          $("cargoMsg")
            .textContent =
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

      let registroConfirmado =
        false;


      // ------------------------------------------------------
      // ENVIA TODOS OS VOTOS
      // ------------------------------------------------------

      try {

        const resposta =
          await GremioAPI.call({

            action:
              "registrarVotos",

            ra:
              state.ra,

            dataNascimento:
              state.aluno.dataNascimento,

            urna:
              urna,

            votos:
              JSON.stringify(
                state.votos
              )

          });


        registroConfirmado =

          resposta &&
          resposta.ok === true;

      }


      catch (erroApi) {

        registroConfirmado =
          false;

      }


      // ------------------------------------------------------
      // CONFIRMAÇÃO ALTERNATIVA
      // ------------------------------------------------------

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

        }


        catch (erroVerificacao) {

          registroConfirmado =
            false;

        }

      }


      // ------------------------------------------------------
      // SE NÃO CONFIRMOU
      // ------------------------------------------------------

      if (
        !registroConfirmado
      ) {

        throw new Error(
          "Não foi possível confirmar o registro dos votos."
        );

      }


      // ------------------------------------------------------
      // SUCESSO
      // ------------------------------------------------------

      mostrarTelaFim();

    }


    catch (error) {

      /*
       * Retorna para o último cargo
       * sem apagar os votos já preparados.
       */

      state.cargoIndex =
        CARGOS.length - 1;


      if ($("cargoMsg")) {

        $("cargoMsg")
          .textContent =
          error.message;

      }


      showStep(
        "stepCargo"
      );


      setStatus(
        "NÃO REGISTRADO"
      );


      disableKeys(
        false
      );

    }


    finally {

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
        "A tela final não foi encontrada."
      );

    }


    document
      .querySelectorAll(".step")
      .forEach(
        element => {

          element.classList.remove(
            "active"
          );

        }
      );


    fim.classList.add(
      "active"
    );


    state.step =
      "stepFim";


    setStatus(
      "VOTO REGISTRADO"
    );


    if ($("sync")) {

      $("sync").textContent =

        "Votos registrados • Urna " +
        urna;

    }


    somFimUrna();


    disableKeys(
      true
    );


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
  // CORRIGIR
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


      if ($("raView")) {

        $("raView")
          .textContent =
          "—";

      }


      if ($("raMsg")) {

        $("raMsg")
          .textContent =
          "Número apagado.";

      }


      return;

    }


    // --------------------------------------------------------
    // ALUNO
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

      state.numero =
        "";

      state.candidato =
        null;


      if ($("candidatoNumero")) {

        $("candidatoNumero")
          .textContent =
          "—";

      }


      if ($("candidatoCard")) {

        $("candidatoCard")
          .classList.remove(
            "visible"
          );

      }


      if ($("candidatoPhotoBox")) {

        $("candidatoPhotoBox")
          .classList.remove(
            "has-image"
          );

      }


      if ($("candidatoFoto")) {

        $("candidatoFoto")
          .removeAttribute(
            "src"
          );

      }


      if ($("candidatoNome")) {

        $("candidatoNome")
          .textContent =
          "—";

      }


      if ($("candidatoSlogan")) {

        $("candidatoSlogan")
          .textContent =
          "";

      }


      if ($("cargoMsg")) {

        $("cargoMsg")
          .textContent =
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
        "stepCargo" ||

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
  // BOTÕES
  // ==========================================================

  document
    .querySelectorAll(".num")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            digit(
              button.dataset.n
            )
        );

      }
    );


  if ($("confirma")) {

    $("confirma")
      .addEventListener(
        "click",
        confirm
      );

  }


  if ($("corrige")) {

    $("corrige")
      .addEventListener(
        "click",
        correct
      );

  }


  if ($("branco")) {

    $("branco")
      .addEventListener(
        "click",
        voteWhite
      );

  }


  if ($("restart")) {

    $("restart")
      .addEventListener(
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


      // Números

      if (
        /^\d$/.test(key)
      ) {

        event.preventDefault();

        digit(key);

        return;

      }


      // Enter = CONFIRMA

      if (
        key ===
        "Enter"
      ) {

        event.preventDefault();

        confirm();

        return;

      }


      // Escape = CORRIGE

      if (
        key ===
        "Escape"
      ) {

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


  // Heartbeat a cada 20 segundos

  setInterval(
    () => {

      heartbeat();

    },
    20000
  );


  // Verificação da eleição a cada 5 segundos

  setInterval(
    () => {

      checkElection();

    },
    5000
  );


})();
