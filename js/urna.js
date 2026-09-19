(() => {

  const $ = id => document.getElementById(id);

  const params = new URLSearchParams(
    window.location.search
  );

  const urna = String(
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


  $("urnLabel").textContent = "URNA " + urna;
  $("urnFooter").textContent = urna;


  // ==========================================================
  // STATUS VISUAL
  // ==========================================================

  function setStatus(text) {
    $("status").textContent = text;
  }


// ==========================================================
// ÁUDIO DA URNA
// ==========================================================

const somFim =
  new Audio("audio/som-urna-fim.mp3");

somFim.preload = "auto";

function prepararAudio() {

  // Apenas garante que o áudio esteja carregado.
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

      reproducao.catch(function(error) {

        console.log(
          "Não foi possível reproduzir o som:",
          error
        );

      });

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

    document
      .querySelectorAll(".key")
      .forEach(button => {

        button.disabled = value;

      });

  }


  // ==========================================================
  // RESET
  // ==========================================================

  function reset() {

    state.step = "stepRA";
    state.ra = "";
    state.aluno = null;
    state.numero = "";
    state.chapa = null;
    state.busy = false;


    $("raView").textContent = "—";

    $("raMsg").textContent =
      "Pressione CONFIRMA depois de digitar.";


    $("nomeAluno").textContent = "—";

    $("dataAluno").textContent = "—";

    $("chapaNumero").textContent = "—";


    $("chapaCard")
      .classList.remove("visible");


    $("photoBox")
      .classList.remove("has-image");


    $("foto")
      .removeAttribute("src");


    $("chapaNome").textContent = "—";

    $("presidente").textContent = "";

    $("vice").textContent = "";

    $("slogan").textContent = "";


    $("voteMsg").textContent =
      "Digite o número da chapa.";


    showStep("stepRA");

    setStatus("AGUARDANDO");

    disableKeys(false);

  }


  // ==========================================================
  // VERIFICAR ELEIÇÃO
  // ==========================================================

  async function checkElection() {

    if (state.step === "stepFim") {
      return;
    }


    try {

      const data =
        await GremioAPI.call({
          action: "statusPublic"
        });


      if (
        data.election &&
        data.election.aberta
      ) {

        if (state.step === "stepClosed") {
          reset();
        }


        if (state.step !== "stepFim") {
          setStatus("AGUARDANDO");
        }

      } else {

        if (state.step !== "stepFim") {

          showStep("stepClosed");

          setStatus("ENCERRADA");

        }

      }


      $("sync").textContent =
        "Conexão: " +
        new Date().toLocaleTimeString("pt-BR");

    } catch (error) {

      if (state.step !== "stepFim") {
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


      if (state.step !== "stepClosed") {

        $("sync").textContent =
          "Urna " +
          urna +
          ": ONLINE • " +
          new Date()
            .toLocaleTimeString("pt-BR");

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
    // CHAPA
    // --------------------------------------------------------

    if (state.step === "stepChapa") {

      if (state.numero.length >= 3) {
        return;
      }


      state.numero += number;


      $("chapaNumero").textContent =
        state.numero;


      if (state.numero.length >= 2) {
        buscarChapa();
      }

    }

  }


  // ==========================================================
  // BUSCAR CHAPA
  // ==========================================================

  async function buscarChapa() {

    state.busy = true;

    disableKeys(true);


    try {

      const data =
        await GremioAPI.call({

          action: "buscarChapa",

          numero: state.numero

        });


      state.chapa = data.chapa;


      $("chapaNome").textContent =
        state.chapa.nome || "";


      $("presidente").textContent =
        state.chapa.presidente
          ? "Presidente: " +
            state.chapa.presidente
          : "";


      $("vice").textContent =
        state.chapa.vice
          ? "Vice-presidente: " +
            state.chapa.vice
          : "";


      $("slogan").textContent =
        state.chapa.slogan || "";


      if (state.chapa.fotoUrl) {

        $("foto").src =
          state.chapa.fotoUrl;


        $("photoBox")
          .classList.add("has-image");

      } else {

        $("foto").removeAttribute("src");


        $("photoBox")
          .classList.remove("has-image");

      }


      $("chapaCard")
        .classList.add("visible");


      $("voteMsg").textContent =
        "Confira a chapa e pressione CONFIRMA.";


      setStatus("CONFIRA O VOTO");

    } catch (error) {

      state.chapa = null;


      $("chapaCard")
        .classList.remove("visible");


      $("voteMsg").textContent =
        error.message;


      setStatus("NÚMERO INVÁLIDO");

    } finally {

      state.busy = false;

      disableKeys(false);

    }

  }


  // ==========================================================
  // CONFIRMAR
  // ==========================================================

  async function confirm() {

    // Prepara o áudio durante a interação do usuário.
    prepararAudio();


    if (state.busy) {
      return;
    }


    // --------------------------------------------------------
    // CONFIRMAR RA
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

      state.numero = "";

      state.chapa = null;


      $("chapaNumero").textContent = "—";


      $("chapaCard")
        .classList.remove("visible");


      showStep("stepChapa");


      setStatus("DIGITE A CHAPA");

      return;

    }


    // --------------------------------------------------------
    // CONFIRMAR VOTO
    // --------------------------------------------------------

    if (state.step === "stepChapa") {

      if (!state.chapa) {

        $("voteMsg").textContent =
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

  async function registerVote(numero) {

    if (state.busy) {
      return;
    }


    state.busy = true;

    disableKeys(true);

    setStatus("REGISTRANDO...");


    try {

      let registroConfirmado = false;


      // ------------------------------------------------------
      // 1. ENVIA O VOTO
      // ------------------------------------------------------

      try {

        const resposta =
          await GremioAPI.call({

            action: "registrarVoto",

            ra: state.ra,

            dataNascimento:
              state.aluno.dataNascimento,

            numero: numero,

            urna: urna

          });


        if (
          resposta &&
          resposta.ok === true
        ) {

          registroConfirmado = true;

        }

      } catch (erroApi) {

        registroConfirmado = false;

      }


      // ------------------------------------------------------
      // 2. CONFERE NOVAMENTE O ELEITOR
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


      // ------------------------------------------------------
      // 3. MOSTRA TELA FIM
      // ------------------------------------------------------

      if (registroConfirmado) {

        const fim =
          $("stepFim");


        if (!fim) {

          throw new Error(
            "A tela final não foi encontrada."
          );

        }


        document
          .querySelectorAll(".step")
          .forEach(element => {

            element.classList.remove(
              "active"
            );

          });


        fim.classList.add("active");


        state.step = "stepFim";


        setStatus("VOTO REGISTRADO");


        // SOM DE FINALIZAÇÃO
        somFimUrna();


        disableKeys(true);


        $("sync").textContent =
          "Voto registrado • Urna " +
          urna;


        // ----------------------------------------------------
        // 4. NOVA VOTAÇÃO APÓS 5 SEGUNDOS
        // ----------------------------------------------------

        setTimeout(
          () => {

            reset();

            checkElection();

            heartbeat();

          },
          5000
        );


        return;

      }


      // ------------------------------------------------------
      // 5. NÃO FOI POSSÍVEL CONFIRMAR
      // ------------------------------------------------------

      throw new Error(
        "Não foi possível confirmar o registro do voto."
      );


    } catch (error) {

      $("voteMsg").textContent =
        error.message;


      setStatus("NÃO REGISTRADO");


      disableKeys(false);

    } finally {

      if (state.step !== "stepFim") {

        state.busy = false;

        disableKeys(false);

      }

    }

  }


  // ==========================================================
  // CORRIGIR
  // ==========================================================

  function correct() {

    if (state.busy) {
      return;
    }


    if (state.step === "stepRA") {

      state.ra = "";


      $("raView").textContent = "—";


      $("raMsg").textContent =
        "Número apagado.";

      return;

    }


    if (state.step === "stepAluno") {

      reset();

      return;

    }


    if (state.step === "stepChapa") {

      state.numero = "";

      state.chapa = null;


      $("chapaNumero").textContent =
        "—";


      $("chapaCard")
        .classList.remove("visible");


      $("voteMsg").textContent =
        "Número apagado.";


      setStatus("DIGITE A CHAPA");

    }

  }


  // ==========================================================
  // BRANCO
  // ==========================================================

  async function voteWhite() {

    if (state.step !== "stepChapa") {
      return;
    }


    if (state.busy) {
      return;
    }


    prepararAudio();


    await registerVote("BRANCO");

  }


  // ==========================================================
  // BOTÕES
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
        event.key === "Enter"
      ) {

        confirm();

      }


      if (
        event.key === "Backspace"
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


  // Atualiza o status da eleição
  setInterval(
    checkElection,
    10000
  );


  // Mantém a urna online
  setInterval(
    heartbeat,
    20000
  );

})();
