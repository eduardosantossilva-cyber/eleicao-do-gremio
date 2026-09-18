(() => {

  const $ = id =>
    document.getElementById(id);


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


  const state = {

    step: "stepRA",

    ra: "",

    aluno: null,

    numero: "",

    chapa: null,

    busy: false

  };


  $("urnLabel").textContent =
    "URNA " + urna;


  $("urnFooter").textContent =
    urna;


  // ==========================================================
  // STATUS VISUAL
  // ==========================================================

  function setStatus(text) {

    $("status").textContent =
      text;

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


    $(id)
      .classList.add(
        "active"
      );


    state.step = id;

  }


  // ==========================================================
  // BLOQUEAR TECLADO
  // ==========================================================

  function disableKeys(value) {

    document
      .querySelectorAll(".key")
      .forEach(button => {

        button.disabled =
          value;

      });

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

    state.numero =
      "";

    state.chapa =
      null;

    state.busy =
      false;


    $("raView").textContent =
      "—";


    $("raMsg").textContent =
      "Pressione CONFIRMA depois de digitar.";


    $("nomeAluno").textContent =
      "—";


    $("dataAluno").textContent =
      "—";


    $("chapaNumero").textContent =
      "—";


    $("chapaCard")
      .classList.remove(
        "visible"
      );


    $("photoBox")
      .classList.remove(
        "has-image"
      );


    $("foto")
      .removeAttribute(
        "src"
      );


    $("chapaNome").textContent =
      "—";


    $("presidente").textContent =
      "";


    $("vice").textContent =
      "";


    $("slogan").textContent =
      "";


    $("voteMsg").textContent =
      "Digite o número da chapa.";


    showStep(
      "stepRA"
    );


    setStatus(
      "AGUARDANDO"
    );

  }


  // ==========================================================
  // VERIFICAR ELEIÇÃO
  // ==========================================================

  async function checkElection() {

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

      } else {

        showStep(
          "stepClosed"
        );

        setStatus(
          "ENCERRADA"
        );

      }


      $("sync").textContent =
        "Conexão: " +
        new Date()
          .toLocaleTimeString(
            "pt-BR"
          );

    } catch (error) {

      setStatus(
        "SEM CONEXÃO"
      );


      $("sync").textContent =
        "Conexão: falhou";

    }

  }


  // ==========================================================
  // HEARTBEAT
  // ==========================================================
  //
  // É isso que estava faltando.
  // A cada 20 segundos a urna avisa
  // ao administrativo que está online.
  //

  async function heartbeat() {

    try {

      await GremioAPI.call({

        action:
          "heartbeat",

        urna:
          urna

      });

      // Só mostra online se a eleição
      // estiver aberta e a urna estiver
      // funcionando.

      if (
        state.step !==
        "stepClosed"
      ) {

        $("sync").textContent =
          "Urna " +
          urna +
          ": ONLINE • " +
          new Date()
            .toLocaleTimeString(
              "pt-BR"
            );

      }

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

    if (
      state.busy
    ) {

      return;

    }


    if (
      state.step ===
      "stepRA"
    ) {

      if (
        state.ra.length >=
        12
      ) {

        return;

      }


      state.ra +=
        number;


      $("raView")
        .textContent =
        state.ra;


      return;

    }


    if (
      state.step ===
      "stepChapa"
    ) {

      if (
        state.numero.length >=
        3
      ) {

        return;

      }


      state.numero +=
        number;


      $("chapaNumero")
        .textContent =
        state.numero;


      if (
        state.numero.length >=
        2
      ) {

        buscarChapa();

      }

    }

  }


  // ==========================================================
  // BUSCAR CHAPA
  // ==========================================================

  async function buscarChapa() {

    state.busy =
      true;


    disableKeys(
      true
    );


    try {

      const data =
        await GremioAPI.call({

          action:
            "buscarChapa",

          numero:
            state.numero

        });


      state.chapa =
        data.chapa;


      $("chapaNome")
        .textContent =
        state.chapa.nome ||
        "";


      $("presidente")
        .textContent =
        state.chapa.presidente
          ? "Presidente: " +
            state.chapa.presidente
          : "";


      $("vice")
        .textContent =
        state.chapa.vice
          ? "Vice-presidente: " +
            state.chapa.vice
          : "";


      $("slogan")
        .textContent =
        state.chapa.slogan ||
        "";


      if (
        state.chapa.fotoUrl
      ) {

        $("foto")
          .src =
          state.chapa.fotoUrl;


        $("photoBox")
          .classList.add(
            "has-image"
          );

      } else {

        $("foto")
          .removeAttribute(
            "src"
          );


        $("photoBox")
          .classList.remove(
            "has-image"
          );

      }


      $("chapaCard")
        .classList.add(
          "visible"
        );


      $("voteMsg")
        .textContent =
        "Confira a chapa e pressione CONFIRMA.";


      setStatus(
        "CONFIRA O VOTO"
      );

    } catch (error) {

      state.chapa =
        null;


      $("chapaCard")
        .classList.remove(
          "visible"
        );


      $("voteMsg")
        .textContent =
        error.message;


      setStatus(
        "NÚMERO INVÁLIDO"
      );

    } finally {

      state.busy =
        false;


      disableKeys(
        false
      );

    }

  }


  // ==========================================================
  // CONFIRMAR
  // ==========================================================

  async function confirm() {

    if (
      state.busy
    ) {

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
        !state.ra
      ) {

        $("raMsg")
          .textContent =
          "Digite o RA.";

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


        $("nomeAluno")
          .textContent =
          data.aluno.nome;


        $("dataAluno")
          .textContent =
          data.aluno.dataNascimento;


        showStep(
          "stepAluno"
        );


        setStatus(
          "CONFIRA SEUS DADOS"
        );

      } catch (error) {

        $("raMsg")
          .textContent =
          error.message;


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


    // --------------------------------------------------------
    // CONFIRMAR ALUNO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepAluno"
    ) {

      state.numero =
        "";


      state.chapa =
        null;


      $("chapaNumero")
        .textContent =
        "—";


      showStep(
        "stepChapa"
      );


      setStatus(
        "DIGITE A CHAPA"
      );


      return;

    }


    // --------------------------------------------------------
    // VOTO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepChapa"
    ) {

      if (
        !state.chapa
      ) {

        $("voteMsg")
          .textContent =
          "Digite uma chapa válida ou pressione BRANCO.";

        return;

      }


      await registerVote(
        state.numero
      );

    }

  }


  // ==========================================================
  // REGISTRAR VOTO
  // ==========================================================

  async function registerVote(
    numero
  ) {

    state.busy =
      true;


    disableKeys(
      true
    );


    setStatus(
      "REGISTRANDO..."
    );


    try {

      await GremioAPI.call({

        action:
          "registrarVoto",

        ra:
          state.ra,

        dataNascimento:
          state.aluno.dataNascimento,

        numero:
          numero,

        urna:
          urna

      });


      showStep(
        "stepFim"
      );


      setStatus(
        "VOTO REGISTRADO"
      );


    } catch (error) {

      $("voteMsg")
        .textContent =
        error.message;


      setStatus(
        "NÃO REGISTRADO"
      );

    } finally {

      state.busy =
        false;


      disableKeys(
        false
      );

    }

  }


  // ==========================================================
  // CORRIGIR
  // ==========================================================

  function correct() {

    if (
      state.busy
    ) {

      return;

    }


    if (
      state.step ===
      "stepRA"
    ) {

      state.ra =
        "";


      $("raView")
        .textContent =
        "—";


      $("raMsg")
        .textContent =
        "Número apagado.";

      return;

    }


    if (
      state.step ===
      "stepAluno"
    ) {

      reset();

      return;

    }


    if (
      state.step ===
      "stepChapa"
    ) {

      state.numero =
        "";


      state.chapa =
        null;


      $("chapaNumero")
        .textContent =
        "—";


      $("chapaCard")
        .classList.remove(
          "visible"
        );


      $("voteMsg")
        .textContent =
        "Número apagado.";


      setStatus(
        "DIGITE A CHAPA"
      );

    }

  }


  // ==========================================================
  // BRANCO
  // ==========================================================

  async function voteWhite() {

    if (
      state.step !==
      "stepChapa"
    ) {

      return;

    }


    if (
      state.busy
    ) {

      return;

    }


    await registerVote(
      "BRANCO"
    );

  }


  // ==========================================================
  // BOTÕES
  // ==========================================================

  document
    .querySelectorAll(
      ".num"
    )
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

  window.addEventListener(
    "keydown",
    event => {

      if (
        /^[0-9]$/.test(
          event.key
        )
      ) {

        digit(
          event.key
        );

      }


      if (
        event.key ===
        "Enter"
      ) {

        confirm();

      }


      if (
        event.key ===
        "Backspace"
      ) {

        correct();

      }

    }
  );


  // ==========================================================
  // INICIALIZAÇÃO
  // ==========================================================

  reset();

  checkElection();

  heartbeat();


  /*
   * Atualiza o status da eleição.
   */

  setInterval(
    checkElection,
    10000
  );


  /*
   * Avisa a API que esta urna
   * continua conectada.
   */

  setInterval(
    heartbeat,
    20000
  );

})();
