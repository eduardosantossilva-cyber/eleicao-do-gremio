// ==========================================================
// URNA ELETRÔNICA - GRÊMIO ESTUDANTIL
// CARGOS + IDENTIFICAÇÃO AUTOMÁTICA DA URNA
// ==========================================================

(() => {

  // ==========================================================
  // UTILITÁRIO
  // ==========================================================

  const $ = id =>
    document.getElementById(id);


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
  // IDENTIFICADOR DO COMPUTADOR
  // ==========================================================

  const CHAVE_DISPOSITIVO =
    "gremio_dispositivo_id";


  function criarIdDispositivo() {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
      "function"
    ) {

      return window.crypto.randomUUID();

    }

    return (
      "disp-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 10)
    );

  }


  function obterDispositivoId() {

    let id =
      localStorage.getItem(
        CHAVE_DISPOSITIVO
      );

    if (!id) {

      id =
        criarIdDispositivo();

      localStorage.setItem(
        CHAVE_DISPOSITIVO,
        id
      );

    }

    return id;

  }


  const dispositivoId =
    obterDispositivoId();


  // ==========================================================
  // URNA
  // ==========================================================

  let urna =
    "";


  let heartbeatExecutando =
    false;


  // ==========================================================
  // ESTADO
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
  // STATUS
  // ==========================================================

  function setStatus(text) {

    if ($("status")) {

      $("status").textContent =
        text;

    }

  }


  // ==========================================================
  // MOSTRAR TELA
  // ==========================================================

  function showStep(id) {

    document
      .querySelectorAll(
        ".step"
      )
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

      return false;

    }


    tela.classList.add(
      "active"
    );

    state.step =
      id;


    return true;

  }


  // ==========================================================
  // BLOQUEAR / LIBERAR TECLADO
  // ==========================================================

  function disableKeys(value) {

    document
      .querySelectorAll(
        ".key"
      )
      .forEach(
        button => {

          button.disabled =
            value;

        }
      );

  }


  // ==========================================================
  // ATUALIZAR IDENTIFICAÇÃO DA URNA
  // ==========================================================

  function atualizarUrnaTela() {

    if (!urna) {

      return;

    }


    if ($("urnLabel")) {

      $("urnLabel").textContent =
        "URNA " + urna;

    }


    if ($("urnFooter")) {

      $("urnFooter").textContent =
        urna;

    }

  }


  // ==========================================================
  // ATUALIZAR TELA DO CARGO
  // ==========================================================

  function atualizarTextoCargo() {

    const telaCargo =
      $("stepChapa");

    if (!telaCargo) {

      return;

    }


    const titulo =
      telaCargo.querySelector(
        "h2"
      );

    const texto =
      telaCargo.querySelector(
        "p"
      );


    if (titulo) {

      titulo.textContent =
        CARGOS[
          state.cargoIndex
        ];

    }


    if (texto) {

      texto.textContent =
        "Digite o número do candidato.";

    }

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

      $("raView").textContent =
        "—";

    }


    if ($("raMsg")) {

      $("raMsg").textContent =
        "Pressione CONFIRMA depois de digitar.";

    }


    if ($("nomeAluno")) {

      $("nomeAluno").textContent =
        "—";

    }


    if ($("dataAluno")) {

      $("dataAluno").textContent =
        "—";

    }


    if ($("chapaNumero")) {

      $("chapaNumero").textContent =
        "—";

    }


    if ($("chapaNome")) {

      $("chapaNome").textContent =
        "—";

    }


    if ($("presidente")) {

      $("presidente").textContent =
        "";

    }


    if ($("vice")) {

      $("vice").textContent =
        "";

    }


    if ($("slogan")) {

      $("slogan").textContent =
        "";

    }


    if ($("voteMsg")) {

      $("voteMsg").textContent =
        "Digite o número do candidato.";

    }


    if ($("chapaCard")) {

      $("chapaCard")
        .classList.remove(
          "visible"
        );

    }


    if ($("photoBox")) {

      $("photoBox")
        .classList.remove(
          "has-image"
        );

    }


    if ($("foto")) {

      $("foto")
        .removeAttribute(
          "src"
        );

    }


    atualizarUrnaTela();

    showStep(
      "stepRA"
    );


    setStatus(
      urna
        ? "AGUARDANDO"
        : "IDENTIFICANDO URNA..."
    );


    disableKeys(
      !urna
    );

  }


  // ==========================================================
  // IDENTIFICAR URNA
  // ==========================================================

  async function heartbeat() {

    if (
      heartbeatExecutando
    ) {

      return;

    }


    heartbeatExecutando =
      true;


    try {

      const resposta =
        await GremioAPI.call({

          action:
            "heartbeat",

          dispositivoId:
            dispositivoId

        });


      if (
        !resposta ||
        resposta.ok !== true
      ) {

        throw new Error(
          "Não foi possível identificar a urna."
        );

      }


      urna =
        String(
          resposta.urna || ""
        )
          .replace(
            /\D/g,
            ""
          )
          .padStart(
            2,
            "0"
          );


      atualizarUrnaTela();


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


      if (
        state.step ===
        "stepRA"
      ) {

        disableKeys(
          false
        );

      }

    }

    catch (error) {

      if ($("sync")) {

        $("sync").textContent =
          "Urna: sem comunicação";

      }

    }

    finally {

      heartbeatExecutando =
        false;

    }

  }


  // ==========================================================
  // VERIFICAR ELEIÇÃO
  // ==========================================================

  async function checkElection() {

    // Não mexe na tela final
    if (
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
        data &&
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

        return;

      }


      showStep(
        "stepClosed"
      );

      setStatus(
        "ENCERRADA"
      );

      disableKeys(
        true
      );

    }

    catch (error) {

      setStatus(
        "SEM CONEXÃO"
      );

      if ($("sync")) {

        $("sync").textContent =
          urna
            ? "Urna " +
              urna +
              ": sem comunicação"
            : "Sem comunicação";

      }

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


    // --------------------------------------------------------
    // RA
    // --------------------------------------------------------

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


      if ($("raView")) {

        $("raView").textContent =
          state.ra;

      }


      return;

    }


    // --------------------------------------------------------
    // CANDIDATO
    // --------------------------------------------------------

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


      if ($("chapaNumero")) {

        $("chapaNumero").textContent =
          state.numero;

      }


      // Procura automaticamente após 2 números

      if (
        state.numero.length >=
        2
      ) {

        buscarCandidato();

      }

    }

  }


  // ==========================================================
  // LIMPAR CARD DO CANDIDATO
  // ==========================================================

  function limparCandidato() {

    state.candidato =
      null;


    if ($("chapaCard")) {

      $("chapaCard")
        .classList.remove(
          "visible"
        );

    }


    if ($("photoBox")) {

      $("photoBox")
        .classList.remove(
          "has-image"
        );

    }


    if ($("foto")) {

      $("foto")
        .removeAttribute(
          "src"
        );

    }


    if ($("chapaNome")) {

      $("chapaNome").textContent =
        "—";

    }


    if ($("presidente")) {

      $("presidente").textContent =
        "";

    }


    if ($("vice")) {

      $("vice").textContent =
        "";

    }


    if ($("slogan")) {

      $("slogan").textContent =
        "";

    }

  }


  // ==========================================================
  // PREPARAR CARGO
  // ==========================================================

  function prepararCargo() {

    state.numero =
      "";

    state.candidato =
      null;


    atualizarTextoCargo();


    if ($("chapaNumero")) {

      $("chapaNumero").textContent =
        "—";

    }


    if ($("voteMsg")) {

      $("voteMsg").textContent =
        "Digite o número do candidato.";

    }


    limparCandidato();

  }


  // ==========================================================
  // BUSCAR CANDIDATO
  // ==========================================================

  async function buscarCandidato() {

    if (
      state.busy ||
      state.step !==
      "stepChapa"
    ) {

      return;

    }


    if (
      state.numero.length <
      2
    ) {

      return;

    }


    state.busy =
      true;


    disableKeys(
      true
    );


    try {

      const data =
        await GremioAPI.call({

          action:
            "buscarCandidato",

          cargo:
            CARGOS[
              state.cargoIndex
            ],

          numero:
            state.numero

        });


      state.candidato =
        data.candidato;


      if ($("chapaNome")) {

        $("chapaNome").textContent =
          state.candidato.nome ||
          "";

      }


      if ($("chapaNumero")) {

        $("chapaNumero").textContent =
          state.candidato.numero ||
          state.numero;

      }


      if ($("slogan")) {

        $("slogan").textContent =
          state.candidato.slogan ||
          "";

      }


      // Campo antigo "presidente"
      // não será mais usado

      if ($("presidente")) {

        $("presidente").textContent =
          "";

      }


      if ($("vice")) {

        $("vice").textContent =
          "";

      }


      if (
        state.candidato.fotoUrl
      ) {

        if ($("foto")) {

          $("foto").src =
            state.candidato.fotoUrl;

        }


        if ($("photoBox")) {

          $("photoBox")
            .classList.add(
              "has-image"
            );

        }

      }


      else {

        if ($("foto")) {

          $("foto")
            .removeAttribute(
              "src"
            );

        }


        if ($("photoBox")) {

          $("photoBox")
            .classList.remove(
              "has-image"
            );

        }

      }


      if ($("chapaCard")) {

        $("chapaCard")
          .classList.add(
            "visible"
          );

      }


      if ($("voteMsg")) {

        $("voteMsg").textContent =
          "Confira o candidato e pressione CONFIRMA.";

      }


      setStatus(
        "CONFIRA O CANDIDATO"
      );

    }

    catch (error) {

      limparCandidato();

      if ($("voteMsg")) {

        $("voteMsg").textContent =
          error.message;

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
  // CONFIRMAR RA
  // ==========================================================

  async function confirmarRA() {

    if (
      !state.ra
    ) {

      if ($("raMsg")) {

        $("raMsg").textContent =
          "Digite o RA.";

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
          "Não foi possível localizar o eleitor."
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


      if ($("nomeAluno")) {

        $("nomeAluno").textContent =
          data.aluno.nome;

      }


      if ($("dataAluno")) {

        $("dataAluno").textContent =
          data.aluno.dataNascimento;

      }


      // =====================================================
      // AQUI ESTÁ A CORREÇÃO:
      // DEPOIS DO RA MOSTRA A CONFIRMAÇÃO
      // =====================================================

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

    }

    catch (error) {

      if ($("raMsg")) {

        $("raMsg").textContent =
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

  }


  // ==========================================================
  // SALVAR VOTO DO CARGO
  // ==========================================================

  function salvarVotoCargo(numero) {

    state.votos.push({

      cargo:
        CARGOS[
          state.cargoIndex
        ],

      numero:
        numero

    });

  }


  // ==========================================================
  // PASSAR PARA O PRÓXIMO CARGO
  // ==========================================================

  function proximoCargo() {

    if (
      state.cargoIndex >=
      CARGOS.length - 1
    ) {

      registrarVotos();

      return;

    }


    state.cargoIndex++;

    prepararCargo();

    showStep(
      "stepChapa"
    );

    setStatus(
      "DIGITE O CANDIDATO"
    );

  }


  // ==========================================================
  // REGISTRAR TODOS OS 8 VOTOS
  // ==========================================================

  async function registrarVotos() {

    if (
      state.busy
    ) {

      return;

    }


    state.busy =
      true;


    disableKeys(
      true
    );


    setStatus(
      "REGISTRANDO..."
    );


    let confirmado =
      false;


    try {

      // ------------------------------------------------------
      // ENVIA OS 8 CARGOS
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

            votos:
              JSON.stringify(
                state.votos
              ),

            dispositivoId:
              dispositivoId

          });


        if (
          resposta &&
          resposta.ok === true
        ) {

          confirmado =
            true;


          if (
            resposta.urna
          ) {

            urna =
              String(
                resposta.urna
              )
                .replace(
                  /\D/g,
                  ""
                )
                .padStart(
                  2,
                  "0"
                );

            atualizarUrnaTela();

          }

        }

      }

      catch (erroApi) {

        confirmado =
          false;

      }


      // ------------------------------------------------------
      // CASO A API REGISTRE MAS A RESPOSTA FALHE
      // ------------------------------------------------------

      if (
        !confirmado
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
            verificacao.aluno.jaVotou ===
            true
          ) {

            confirmado =
              true;

          }

        }

        catch (erroVerificacao) {

          confirmado =
            false;

        }

      }


      // ------------------------------------------------------
      // VOTO CONFIRMADO
      // ------------------------------------------------------

      if (
        confirmado
      ) {

        mostrarFim();

        return;

      }


      throw new Error(
        "Não foi possível confirmar o registro do voto."
      );

    }

    catch (error) {

      if ($("voteMsg")) {

        $("voteMsg").textContent =
          error.message;

      }

      setStatus(
        "NÃO REGISTRADO"
      );


      state.busy =
        false;


      disableKeys(
        false
      );

    }

  }


  // ==========================================================
  // TELA FINAL
  // ==========================================================

  function mostrarFim() {

    const fim =
      $("stepFim");


    if (!fim) {

      return;

    }


    document
      .querySelectorAll(
        ".step"
      )
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
        "Urna " +
        urna +
        ": VOTO REGISTRADO";

    }


    disableKeys(
      true
    );


    // SOM FINAL

    try {

      const audio =
        new Audio(
          "audio/som-urna-fim.mp3"
        );

      audio.volume =
        1;

      audio.play()
        .catch(
          () => {}
        );

    }

    catch (error) {}


    // Volta automaticamente

    setTimeout(
      function() {

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

      state.ra =
        "";


      if ($("raView")) {

        $("raView").textContent =
          "—";

      }


      if ($("raMsg")) {

        $("raMsg").textContent =
          "Número apagado.";

      }


      return;

    }


    // --------------------------------------------------------
    // CONFIRMAÇÃO DO ALUNO
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
      "stepChapa"
    ) {

      state.numero =
        "";

      limparCandidato();


      if ($("chapaNumero")) {

        $("chapaNumero").textContent =
          "—";

      }


      if ($("voteMsg")) {

        $("voteMsg").textContent =
          "Número apagado.";

      }


      setStatus(
        "DIGITE O CANDIDATO"
      );

    }

  }


  // ==========================================================
  // VOTO EM BRANCO
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


    salvarVotoCargo(
      "BRANCO"
    );


    if ($("voteMsg")) {

      $("voteMsg").textContent =
        "VOTO EM BRANCO REGISTRADO.";

    }


    setStatus(
      "BRANCO"
    );


    setTimeout(
      function() {

        proximoCargo();

      },
      500
    );

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
    // PRIMEIRA TELA: RA
    // --------------------------------------------------------

    if (
      state.step ===
      "stepRA"
    ) {

      await confirmarRA();

      return;

    }


    // --------------------------------------------------------
    // SEGUNDA TELA: DADOS DO ALUNO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepAluno"
    ) {

      state.cargoIndex =
        0;


      state.numero =
        "";

      state.candidato =
        null;


      prepararCargo();


      showStep(
        "stepChapa"
      );


      setStatus(
        "DIGITE O CANDIDATO"
      );


      return;

    }


    // --------------------------------------------------------
    // TELA DO CARGO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepChapa"
    ) {

      if (
        !state.numero
      ) {

        if ($("voteMsg")) {

          $("voteMsg").textContent =
            "Digite o número do candidato.";

        }

        return;

      }


      // ------------------------------------------------------
      // SE O CANDIDATO AINDA NÃO FOI ENCONTRADO
      // ------------------------------------------------------

      if (
        !state.candidato
      ) {

        state.busy =
          true;

        disableKeys(
          true
        );


        try {

          const data =
            await GremioAPI.call({

              action:
                "buscarCandidato",

              cargo:
                CARGOS[
                  state.cargoIndex
                ],

              numero:
                state.numero

            });


          state.candidato =
            data.candidato;

        }

        catch (error) {

          if ($("voteMsg")) {

            $("voteMsg").textContent =
              error.message;

          }

          setStatus(
            "NÚMERO INVÁLIDO"
          );


          state.busy =
            false;

          disableKeys(
            false
          );

          return;

        }


        state.busy =
          false;

        disableKeys(
          false
        );

      }


      salvarVotoCargo(
        state.numero
      );


      setStatus(
        "VOTO CONFIRMADO"
      );


      proximoCargo();

    }

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
          () => {

            digit(
              button.dataset.n
            );

          }
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
        function() {

          reset();

          checkElection();

          heartbeat();

        }
      );

  }


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

  heartbeat();

  checkElection();


  // Verifica eleição

  setInterval(
    checkElection,
    10000
  );


  // Mantém urna online

  setInterval(
    heartbeat,
    20000
  );

})();
