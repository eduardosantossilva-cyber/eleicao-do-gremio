// ==========================================================
// URNA ELETRÔNICA - GRÊMIO ESTUDANTIL
// IDENTIFICAÇÃO AUTOMÁTICA DAS URNAS
// ==========================================================

(() => {

  // ==========================================================
  // UTILITÁRIO
  // ==========================================================

  const $ = id =>
    document.getElementById(id);


  // ==========================================================
  // CARGOS
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
  // IDENTIFICAÇÃO DO COMPUTADOR
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
        .substring(
          2,
          10
        )

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


  let heartbeatEmAndamento =
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

      return;

    }

    tela.classList.add(
      "active"
    );

    state.step =
      id;

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
  // ATUALIZA NÚMERO DA URNA NA TELA
  // ==========================================================

  function atualizarUrnaNaTela() {

    if (
      !urna
    ) {

      return;

    }


    if (
      $("urnLabel")
    ) {

      $("urnLabel").textContent =
        "URNA " + urna;

    }


    if (
      $("urnFooter")
    ) {

      $("urnFooter").textContent =
        urna;

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


    if (
      $("raView")
    ) {

      $("raView").textContent =
        "—";

    }


    if (
      $("raMsg")
    ) {

      $("raMsg").textContent =
        "Pressione CONFIRMA depois de digitar.";

    }


    if (
      $("nomeAluno")
    ) {

      $("nomeAluno").textContent =
        "—";

    }


    if (
      $("dataAluno")
    ) {

      $("dataAluno").textContent =
        "—";

    }


    if (
      $("cargoProgress")
    ) {

      $("cargoProgress").textContent =
        "1 de " +
        CARGOS.length;

    }


    if (
      $("cargoNome")
    ) {

      $("cargoNome").textContent =
        CARGOS[0];

    }


    if (
      $("candidatoNumero")
    ) {

      $("candidatoNumero").textContent =
        "—";

    }


    if (
      $("candidatoCard")
    ) {

      $("candidatoCard")
        .classList.remove(
          "visible"
        );

    }


    if (
      $("candidatoPhotoBox")
    ) {

      $("candidatoPhotoBox")
        .classList.remove(
          "has-image"
        );

    }


    if (
      $("candidatoFoto")
    ) {

      $("candidatoFoto")
        .removeAttribute(
          "src"
        );

    }


    if (
      $("candidatoNome")
    ) {

      $("candidatoNome").textContent =
        "—";

    }


    if (
      $("candidatoSlogan")
    ) {

      $("candidatoSlogan").textContent =
        "";

    }


    if (
      $("cargoMsg")
    ) {

      $("cargoMsg").textContent =
        "Digite o número do candidato.";

    }


    if (
      $("sync")
    ) {

      if (
        urna
      ) {

        $("sync").textContent =
          "Urna " +
          urna +
          ": aguardando";

      }

      else {

        $("sync").textContent =
          "Identificando urna...";

      }

    }


    showStep(
      "stepRA"
    );


    setStatus(
      urna
        ? "AGUARDANDO"
        : "IDENTIFICANDO URNA..."
    );


    if (
      urna
    ) {

      disableKeys(
        false
      );

    }

    else {

      disableKeys(
        true
      );

    }

  }


  // ==========================================================
  // HEARTBEAT / IDENTIFICAÇÃO DA URNA
  // ==========================================================

  async function heartbeat() {

    if (
      heartbeatEmAndamento
    ) {

      return;

    }

    heartbeatEmAndamento =
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


      atualizarUrnaNaTela();


      if (
        state.step !==
        "stepClosed"
      ) {

        if (
          $("sync")
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


        if (
          state.step ===
          "stepRA"
        ) {

          disableKeys(
            false
          );

        }

      }

    }

    catch (error) {

      if (
        $("sync")
      ) {

        $("sync").textContent =
          "Urna: sem comunicação";

      }

    }

    finally {

      heartbeatEmAndamento =
        false;

    }

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

      }

      else {

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


      if (
        $("sync")
      ) {

        $("sync").textContent =
          urna
            ? "Urna " +
              urna +
              ": conexão " +
              new Date()
                .toLocaleTimeString(
                  "pt-BR"
                )

            : "Identificando urna...";

      }

    }

    catch (error) {

      if (
        $("sync")
      ) {

        $("sync").textContent =
          urna
            ? "Urna " +
              urna +
              ": sem comunicação"

            : "Sem comunicação com a API";

      }

    }

  }


  // ==========================================================
  // DIGITAR
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

      if (
        $("raView")
      ) {

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

      if (
        $("candidatoNumero")
      ) {

        $("candidatoNumero").textContent =
          state.numero;

      }


      if (
        state.numero.length >=
        2
      ) {

        buscarCandidato();

      }

    }

  }


  // ==========================================================
  // LIMPAR CANDIDATO NA TELA
  // ==========================================================

  function limparCandidato() {

    state.candidato =
      null;


    if (
      $("candidatoCard")
    ) {

      $("candidatoCard")
        .classList.remove(
          "visible"
        );

    }


    if (
      $("candidatoPhotoBox")
    ) {

      $("candidatoPhotoBox")
        .classList.remove(
          "has-image"
        );

    }


    if (
      $("candidatoFoto")
    ) {

      $("candidatoFoto")
        .removeAttribute(
          "src"
        );

    }


    if (
      $("candidatoNome")
    ) {

      $("candidatoNome").textContent =
        "—";

    }


    if (
      $("candidatoSlogan")
    ) {

      $("candidatoSlogan").textContent =
        "";

    }

  }


  // ==========================================================
  // ATUALIZAR TELA DO CARGO
  // ==========================================================

  function prepararCargo() {

    state.numero =
      "";

    state.candidato =
      null;


    if (
      $("cargoProgress")
    ) {

      $("cargoProgress").textContent =
        (
          state.cargoIndex + 1
        ) +
        " de " +
        CARGOS.length;

    }


    if (
      $("cargoNome")
    ) {

      $("cargoNome").textContent =
        CARGOS[
          state.cargoIndex
        ];

    }


    if (
      $("candidatoNumero")
    ) {

      $("candidatoNumero").textContent =
        "—";

    }


    if (
      $("cargoMsg")
    ) {

      $("cargoMsg").textContent =
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
      "stepCargo"
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


      if (
        $("candidatoNome")
      ) {

        $("candidatoNome").textContent =
          state.candidato.nome ||
          "";

      }


      if (
        $("candidatoSlogan")
      ) {

        $("candidatoSlogan").textContent =
          state.candidato.slogan ||
          "";

      }


      if (
        $("candidatoNumero")
      ) {

        $("candidatoNumero").textContent =
          state.candidato.numero ||
          state.numero;

      }


      if (
        state.candidato.fotoUrl
      ) {

        if (
          $("candidatoFoto")
        ) {

          $("candidatoFoto").src =
            state.candidato.fotoUrl;

        }

        if (
          $("candidatoPhotoBox")
        ) {

          $("candidatoPhotoBox")
            .classList.add(
              "has-image"
            );

        }

      }

      else {

        if (
          $("candidatoFoto")
        ) {

          $("candidatoFoto")
            .removeAttribute(
              "src"
            );

        }

        if (
          $("candidatoPhotoBox")
        ) {

          $("candidatoPhotoBox")
            .classList.remove(
              "has-image"
            );

        }

      }


      if (
        $("candidatoCard")
      ) {

        $("candidatoCard")
          .classList.add(
            "visible"
          );

      }


      if (
        $("cargoMsg")
      ) {

        $("cargoMsg").textContent =
          "Confira o candidato e pressione CONFIRMA.";

      }


      setStatus(
        "CONFIRA O CANDIDATO"
      );

    }

    catch (error) {

      limparCandidato();

      if (
        $("cargoMsg")
      ) {

        $("cargoMsg").textContent =
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
  // CONFIRMAR ALUNO
  // ==========================================================

  async function confirmarAluno() {

    if (
      !state.ra
    ) {

      if (
        $("raMsg")
      ) {

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
        data.aluno.jaVotou
      ) {

        throw new Error(
          "Este RA já possui um voto registrado."
        );

      }


      state.aluno =
        data.aluno;


      if (
        $("nomeAluno")
      ) {

        $("nomeAluno").textContent =
          data.aluno.nome;

      }


      if (
        $("dataAluno")
      ) {

        $("dataAluno").textContent =
          data.aluno.dataNascimento;

      }


      state.cargoIndex =
        0;

      prepararCargo();

      showStep(
        "stepCargo"
      );

      setStatus(
        "DIGITE O CANDIDATO"
      );

    }

    catch (error) {

      if (
        $("raMsg")
      ) {

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

      if (
        urna
      ) {

        disableKeys(
          false
        );

      }

    }

  }


  // ==========================================================
  // SALVAR ESCOLHA DO CARGO
  // ==========================================================

  function salvarEscolhaCargo(numero) {

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
  // PRÓXIMO CARGO
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
      "stepCargo"
    );

    setStatus(
      "DIGITE O CANDIDATO"
    );

  }


  // ==========================================================
  // REGISTRAR TODOS OS VOTOS
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
      "REGISTRANDO VOTO..."
    );


    let registroConfirmado =
      false;


    try {

      // ------------------------------------------------------
      // ENVIA O VOTO
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

          registroConfirmado =
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

            atualizarUrnaNaTela();

          }

        }

      }

      catch (erroApi) {

        registroConfirmado =
          false;

      }


      // ------------------------------------------------------
      // SE A RESPOSTA FALHAR,
      // VERIFICA SE O RA JÁ FOI MARCADO COMO VOTANTE
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
            verificacao.aluno.jaVotou ===
            true
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
      // MOSTRA FIM
      // ------------------------------------------------------

      if (
        registroConfirmado
      ) {

        mostrarFim();

        return;

      }


      throw new Error(
        "Não foi possível confirmar o registro do voto."
      );

    }

    catch (error) {

      if (
        $("cargoMsg")
      ) {

        $("cargoMsg").textContent =
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
  // MOSTRAR FIM
  // ==========================================================

  function mostrarFim() {

    const telaFim =
      $("stepFim");


    if (
      !telaFim
    ) {

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


    telaFim.classList.add(
      "active"
    );


    state.step =
      "stepFim";


    setStatus(
      "VOTO REGISTRADO"
    );


    if (
      $("sync")
    ) {

      $("sync").textContent =
        urna
          ? "Urna " +
            urna +
            ": voto registrado"

          : "Voto registrado";

    }


    disableKeys(
      true
    );


    // Som final da urna

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


    // --------------------------------------------------------
    // DEPOIS DE 5 SEGUNDOS
    // --------------------------------------------------------

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

      if (
        $("raView")
      ) {

        $("raView").textContent =
          "—";

      }

      if (
        $("raMsg")
      ) {

        $("raMsg").textContent =
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

      limparCandidato();

      if (
        $("candidatoNumero")
      ) {

        $("candidatoNumero").textContent =
          "—";

      }

      if (
        $("cargoMsg")
      ) {

        $("cargoMsg").textContent =
          "Número apagado.";

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


    salvarEscolhaCargo(
      "BRANCO"
    );


    if (
      $("cargoMsg")
    ) {

      $("cargoMsg").textContent =
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
    // RA
    // --------------------------------------------------------

    if (
      state.step ===
      "stepRA"
    ) {

      await confirmarAluno();

      return;

    }


    // --------------------------------------------------------
    // ALUNO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepAluno"
    ) {

      state.cargoIndex =
        0;

      prepararCargo();

      showStep(
        "stepCargo"
      );

      setStatus(
        "DIGITE O CANDIDATO"
      );

      return;

    }


    // --------------------------------------------------------
    // CARGO
    // --------------------------------------------------------

    if (
      state.step ===
      "stepCargo"
    ) {

      if (
        !state.numero
      ) {

        if (
          $("cargoMsg")
        ) {

          $("cargoMsg").textContent =
            "Digite o número do candidato.";

        }

        return;

      }


      // Se ainda não carregou o candidato,
      // consulta agora.

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

          if (
            $("cargoMsg")
          ) {

            $("cargoMsg").textContent =
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


      salvarEscolhaCargo(
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


  if (
    $("confirma")
  ) {

    $("confirma")
      .addEventListener(
        "click",
        confirm
      );

  }


  if (
    $("corrige")
  ) {

    $("corrige")
      .addEventListener(
        "click",
        correct
      );

  }


  if (
    $("branco")
  ) {

    $("branco")
      .addEventListener(
        "click",
        voteWhite
      );

  }


  if (
    $("restart")
  ) {

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


  // Atualiza eleição

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
