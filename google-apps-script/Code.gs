/**
 * PORTAL DO GRÊMIO — GOOGLE APPS SCRIPT
 *
 * Esta versão usa somente GET + JSONP para funcionar
 * diretamente em um site estático publicado no GitHub/Vercel.
 *
 * PASSOS:
 * 1. Coloque o ID da planilha em SPREADSHEET_ID.
 * 2. Execute prepararPlanilha() uma vez.
 * 3. Publique como Aplicativo da Web.
 *
 * OBSERVAÇÃO:
 * O modelo é simples. A senha administrativa abaixo também
 * aparece no JavaScript público do site. Para segurança maior,
 * será necessário um backend/autenticação real.
 */

const SPREADSHEET_ID =
  'COLOQUE_AQUI_O_ID_DA_SUA_PLANILHA';

const ADMIN_PASSWORD =
  'gremio2026';


function ss_() {
  return SpreadsheetApp.openById(
    SPREADSHEET_ID
  );
}


function sh_(name) {

  const sheet =
    ss_().getSheetByName(name);

  if (!sheet) {

    throw new Error(
      'Aba "' +
      name +
      '" não existe.'
    );
  }

  return sheet;
}


function output_(data, callback) {

  const json =
    JSON.stringify(data);

  if (
    callback &&
    /^[A-Za-z_$][0-9A-Za-z_$\\.]*$/.test(
      callback
    )
  ) {

    return ContentService
      .createTextOutput(
        callback +
        '(' +
        json +
        ')'
      )
      .setMimeType(
        ContentService.MimeType.JAVASCRIPT
      );
  }

  return ContentService
    .createTextOutput(
      json
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


function norm_(value) {

  return String(
    value === null ||
    value === undefined
      ? ''
      : value
  )
    .trim()
    .toLowerCase();
}


function header_(value) {

  return norm_(value)
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]/g,
      ''
    );
}


function dateNorm_(value) {

  const text =
    String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).trim();

  if (!text) {
    return '';
  }

  const parts =
    text.split(
      /[\\/.-]/
    );

  if (
    parts.length === 3 &&
    parts[2].length === 4
  ) {

    return (
      parts[2] +
      '-' +
      parts[1].padStart(
        2,
        '0'
      ) +
      '-' +
      parts[0].padStart(
        2,
        '0'
      )
    );
  }

  if (
    parts.length === 3 &&
    parts[0].length === 4
  ) {

    return (
      parts[0] +
      '-' +
      parts[1].padStart(
        2,
        '0'
      ) +
      '-' +
      parts[2].padStart(
        2,
        '0'
      )
    );
  }

  return text.toLowerCase();
}


function config_() {

  const data =
    sh_('Config')
      .getDataRange()
      .getDisplayValues();

  const result = {

    escola:
      'E.E. Professor Antônio Rosas da Silva Galvão',

    eleicao:
      'Eleição do Grêmio Estudantil',

    eleicaoAberta:
      false

  };

  for (
    let row = 1;
    row < data.length;
    row++
  ) {

    const key =
      norm_(data[row][0]);

    const value =
      data[row][1] || '';

    if (
      key === 'escola'
    ) {

      result.escola =
        value;
    }

    if (
      key === 'eleicao'
    ) {

      result.eleicao =
        value;
    }

    if (
      key === 'eleicao_aberta'
    ) {

      result.eleicaoAberta =
        norm_(value) === 'sim';
    }
  }

  return result;
}


function setConfig_(key, value) {

  const sheet =
    sh_('Config');

  const data =
    sheet
      .getDataRange()
      .getDisplayValues();

  for (
    let row = 1;
    row < data.length;
    row++
  ) {

    if (
      norm_(data[row][0]) ===
      norm_(key)
    ) {

      sheet
        .getRange(
          row + 1,
          2
        )
        .setValue(
          value
        );

      return;
    }
  }

  sheet.appendRow([
    key,
    value
  ]);
}


function requireAdmin_(params) {

  if (
    String(
      params.password || ''
    ) !==
    ADMIN_PASSWORD
  ) {

    throw new Error(
      'Acesso administrativo negado.'
    );
  }
}


function requireOpenElection_() {

  if (
    !config_()
      .eleicaoAberta
  ) {

    throw new Error(
      'A votação está encerrada.'
    );
  }
}


function findStudent_(ra) {

  const sheet =
    sh_('Alunos');

  const data =
    sheet
      .getDataRange()
      .getDisplayValues();

  if (data.length < 2) {
    return null;
  }

  const headers =
    data[0].map(
      header_
    );

  const iRA =
    headers.indexOf(
      'ra'
    );

  const iName =
    headers.indexOf(
      'nome'
    );

  const iBirth =
    headers.indexOf(
      'datadenascimento'
    );

  const iVoted =
    headers.indexOf(
      'javotou'
    );

  if (
    iRA < 0 ||
    iName < 0 ||
    iBirth < 0 ||
    iVoted < 0
  ) {

    throw new Error(
      'Aba Alunos precisa ter RA, Nome, DataNascimento e JaVotou.'
    );
  }

  for (
    let row = 1;
    row < data.length;
    row++
  ) {

    if (
      norm_(
        data[row][iRA]
      ) ===
      norm_(ra)
    ) {

      return {

        row:
          row + 1,

        nome:
          data[row][iName],

        dataNascimento:
          data[row][iBirth],

        jaVotou:
          data[row][iVoted],

        colunaVotou:
          iVoted + 1
      };
    }
  }

  return null;
}


function chapas_() {

  const data =
    sh_('Chapas')
      .getDataRange()
      .getDisplayValues();

  if (data.length < 2) {
    return [];
  }

  return data
    .slice(1)
    .filter(
      row => row[0]
    )
    .map(
      row => ({

        numero:
          row[0],

        nome:
          row[1],

        presidente:
          row[2],

        vice:
          row[3],

        slogan:
          row[4],

        fotoUrl:
          row[5],

        ativa:
          norm_(row[6]) ===
          'sim'

      })
    );
}


function urnas_() {

  const data =
    sh_('Urnas')
      .getDataRange()
      .getDisplayValues();

  if (data.length < 2) {
    return [];
  }

  return data
    .slice(1)
    .filter(
      row => row[0]
    )
    .map(
      row => ({

        numero:
          row[0],

        ultimoAcesso:
          row[1],

        status:
          row[2]

      })
    );
}


function doGet(e) {

  const params =
    e && e.parameter
      ? e.parameter
      : {};

  const callback =
    params.callback || '';

  try {

    const action =
      params.action || '';


    if (
      action ===
      'statusPublic'
    ) {

      return output_({

        ok: true,

        election: {

          aberta:
            config_()
              .eleicaoAberta

        }

      }, callback);

    }


    if (
      action ===
      'buscarAluno'
    ) {

      requireOpenElection_();

      const ra =
        norm_(params.ra);

      if (!ra) {

        throw new Error(
          'Informe o RA.'
        );
      }

      const aluno =
        findStudent_(ra);

      if (!aluno) {

        throw new Error(
          'RA não encontrado na lista de eleitores.'
        );
      }

      return output_({

        ok: true,

        aluno: {

          nome:
            aluno.nome,

          dataNascimento:
            aluno.dataNascimento,

          jaVotou:
            norm_(
              aluno.jaVotou
            ) === 'sim'

        }

      }, callback);

    }


    if (
      action ===
      'buscarChapa'
    ) {

      requireOpenElection_();

      const numero =
        norm_(
          params.numero
        );

      const chapa =
        chapas_()
          .find(
            item =>
              norm_(
                item.numero
              ) ===
              numero &&
              item.ativa
          );

      if (!chapa) {

        throw new Error(
          'Chapa não encontrada ou inativa.'
        );
      }

      return output_({

        ok: true,

        chapa:
          chapa

      }, callback);

    }


    if (
      action ===
      'registrarVoto'
    ) {

      requireOpenElection_();

      const ra =
        norm_(params.ra);

      const birth =
        dateNorm_(
          params.dataNascimento
        );

      const numero =
        norm_(params.numero);

      const urna =
        norm_(
          params.urna ||
          '01'
        );


      if (
        !ra ||
        !birth ||
        !numero
      ) {

        throw new Error(
          'Dados do voto incompletos.'
        );
      }


      const lock =
        LockService
          .getScriptLock();

      lock.waitLock(
        30000
      );


      try {

        const aluno =
          findStudent_(ra);

        if (!aluno) {

          throw new Error(
            'Eleitor não encontrado.'
          );
        }


        if (
          dateNorm_(
            aluno.dataNascimento
          ) !==
          birth
        ) {

          throw new Error(
            'Os dados do eleitor não conferem.'
          );
        }


        if (
          norm_(
            aluno.jaVotou
          ) === 'sim'
        ) {

          throw new Error(
            'Este RA já possui um voto registrado.'
          );
        }


        if (
          numero !==
          'branco'
        ) {

          const chapa =
            chapas_()
              .find(
                item =>
                  norm_(
                    item.numero
                  ) ===
                  numero &&
                  item.ativa
              );

          if (!chapa) {

            throw new Error(
              'Chapa inválida.'
            );
          }
        }


        // O RA NÃO é gravado na aba Votos.
        sh_('Votos')
          .appendRow([

            new Date(),

            urna,

            numero.toUpperCase()

          ]);


        sh_('Alunos')
          .getRange(
            aluno.row,
            aluno.colunaVotou
          )
          .setValue(
            'SIM'
          );


        return output_({

          ok: true,

          message:
            'Voto registrado com sucesso.'

        }, callback);


      } finally {

        lock.releaseLock();
      }

    }


    if (
      action ===
      'heartbeat'
    ) {

      const urna =
        norm_(
          params.urna ||
          '01'
        );

      const sheet =
        sh_('Urnas');

      const data =
        sheet
          .getDataRange()
          .getDisplayValues();

      for (
        let row = 1;
        row < data.length;
        row++
      ) {

        if (
          norm_(
            data[row][0]
          ) === urna
        ) {

          sheet
            .getRange(
              row + 1,
              2
            )
            .setValue(
              new Date()
            );

          sheet
            .getRange(
              row + 1,
              3
            )
            .setValue(
              'ONLINE'
            );

          return output_({
            ok: true
          }, callback);
        }
      }

      sheet.appendRow([
        urna,
        new Date(),
        'ONLINE'
      ]);

      return output_({
        ok: true
      }, callback);
    }


    // ---------------- ADMIN ----------------

    requireAdmin_(params);


    if (
      action ===
      'adminStatus'
    ) {

      return output_({
        ok: true
      }, callback);
    }


    if (
      action ===
      'adminDashboard'
    ) {

      const alunos =
        sh_('Alunos')
          .getDataRange()
          .getDisplayValues();

      const headers =
        alunos[0]
          .map(
            header_
          );

      const iVoted =
        headers.indexOf(
          'javotou'
        );

      let voted =
        0;

      for (
        let row = 1;
        row < alunos.length;
        row++
      ) {

        if (
          iVoted >= 0 &&
          norm_(
            alunos[row][iVoted]
          ) === 'sim'
        ) {

          voted++;
        }
      }


      const votos =
        sh_('Votos')
          .getDataRange()
          .getDisplayValues();

      const count = {};
      let total = 0;

      for (
        let row = 1;
        row < votos.length;
        row++
      ) {

        const numero =
          norm_(
            votos[row][2]
          );

        if (!numero) {
          continue;
        }

        total++;

        count[numero] =
          (
            count[numero] ||
            0
          ) + 1;
      }


      const resultados =
        chapas_()
          .map(
            chapa => ({

              numero:
                chapa.numero,

              nome:
                chapa.nome,

              votos:
                count[
                  norm_(
                    chapa.numero
                  )
                ] || 0

            })
          );


      resultados.push({

        numero:
          'BRANCO',

        nome:
          'Votos em branco',

        votos:
          count.branco || 0

      });


      return output_({

        ok: true,

        config:
          config_(),

        metrics: {

          eleitores:
            Math.max(
              0,
              alunos.length - 1
            ),

          votaram:
            voted

        },

        apuracao: {

          total:
            total,

          resultados:
            resultados

        },

        chapas:
          chapas_(),

        urnas:
          urnas_()

      }, callback);

    }


    if (
      action ===
      'definirEleicao'
    ) {

      setConfig_(
        'ELEICAO_ABERTA',
        String(
          params.aberta
        ) === 'true'
          ? 'SIM'
          : 'NAO'
      );

      return output_({
        ok: true
      }, callback);
    }


    if (
      action ===
      'criarChapa'
    ) {

      const numero =
        norm_(
          params.numero
        );

      if (
        !/^\d{1,3}$/.test(
          numero
        )
      ) {

        throw new Error(
          'Número de chapa inválido.'
        );
      }

      if (
        chapas_()
          .some(
            chapa =>
              norm_(
                chapa.numero
              ) === numero
          )
      ) {

        throw new Error(
          'Esse número já está sendo usado.'
        );
      }

      sh_('Chapas')
        .appendRow([

          numero,

          params.nome || '',

          params.presidente || '',

          params.vice || '',

          params.slogan || '',

          params.fotoUrl || '',

          String(
            params.ativa
          ) === 'true'
            ? 'SIM'
            : 'NAO'

        ]);

      return output_({
        ok: true
      }, callback);
    }


    if (
      action ===
      'editarChapa'
    ) {

      const numero =
        norm_(
          params.numero
        );

      const sheet =
        sh_('Chapas');

      const data =
        sheet
          .getDataRange()
          .getDisplayValues();

      for (
        let row = 1;
        row < data.length;
        row++
      ) {

        if (
          norm_(
            data[row][0]
          ) === numero
        ) {

          sheet
            .getRange(
              row + 1,
              1,
              1,
              7
            )
            .setValues([

              [

                numero,

                params.nome || '',

                params.presidente || '',

                params.vice || '',

                params.slogan || '',

                params.fotoUrl || '',

                String(
                  params.ativa
                ) === 'true'
                  ? 'SIM'
                  : 'NAO'

              ]

            ]);

          return output_({
            ok: true
          }, callback);
        }
      }

      throw new Error(
        'Chapa não encontrada.'
      );
    }


    if (
      action ===
      'excluirChapa'
    ) {

      const numero =
        norm_(
          params.numero
        );

      const sheet =
        sh_('Chapas');

      const data =
        sheet
          .getDataRange()
          .getDisplayValues();

      for (
        let row =
          data.length - 1;
        row >= 1;
        row--
      ) {

        if (
          norm_(
            data[row][0]
          ) === numero
        ) {

          sheet.deleteRow(
            row + 1
          );

          return output_({
            ok: true
          }, callback);
        }
      }

      throw new Error(
        'Chapa não encontrada.'
      );
    }


    throw new Error(
      'Ação administrativa desconhecida.'
    );


  } catch (error) {

    return output_({

      ok: false,

      message:
        String(
          error.message ||
          error
        )

    }, callback);

  }
}


/**
 * Execute UMA VEZ.
 * Não apaga dados existentes.
 */
function prepararPlanilha() {

  const ss =
    ss_();

  const defs = {

    Config: [

      ['CHAVE', 'VALOR'],

      [
        'ESCOLA',
        'E.E. Professor Antônio Rosas da Silva Galvão'
      ],

      [
        'ELEICAO',
        'Eleição do Grêmio Estudantil'
      ],

      [
        'ELEICAO_ABERTA',
        'NAO'
      ]

    ],

    Alunos: [
      [
        'RA',
        'Nome',
        'DataNascimento',
        'JaVotou'
      ]
    ],

    Chapas: [
      [
        'Numero',
        'Nome',
        'Presidente',
        'Vice',
        'Slogan',
        'FotoURL',
        'Ativa'
      ]
    ],

    Votos: [
      [
        'Timestamp',
        'Urna',
        'NumeroChapa'
      ]
    ],

    Urnas: [
      [
        'Numero',
        'UltimoAcesso',
        'Status'
      ]
    ]

  };


  Object.keys(
    defs
  ).forEach(
    name => {

      let sheet =
        ss.getSheetByName(
          name
        );

      if (!sheet) {

        sheet =
          ss.insertSheet(
            name
          );

      }

      if (
        sheet.getLastRow() === 0
      ) {

        const values =
          defs[name];

        sheet
          .getRange(
            1,
            1,
            values.length,
            values[0].length
          )
          .setValues(
            values
          );

        sheet.setFrozenRows(
          1
        );
      }
    }
  );

}
