/**
 * PORTAL DO GRÊMIO — API GOOGLE APPS SCRIPT
 *
 * Abas criadas:
 * Config
 * Alunos
 * Chapas
 * Votos
 * Urnas
 *
 * A planilha deve ser criada no Google Drive e o ID colocado abaixo.
 * Não publique este arquivo com a URL da planilha em nenhum site público.
 */

const SPREADSHEET_ID = 'COLOQUE_AQUI_O_ID_DA_PLANILHA';
const API_TOKEN_PROPERTY = 'GREMIO_API_TOKEN';
const TIME_ZONE = Session.getScriptTimeZone() || 'America/Sao_Paulo';

function sheet_(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getToken_() {
  return PropertiesService.getScriptProperties().getProperty(API_TOKEN_PROPERTY) || '';
}

function auth_(p) {
  return p && p.token && p.token === getToken_();
}

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  if (p.action === 'statusPublic') {
    return statusPublic_();
  }
  return json_({ ok: true, service: 'Portal do Grêmio API', message: 'API ativa.' });
}

function doPost(e) {
  try {
    const p = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (!auth_(p)) {
      return json_({ ok: false, message: 'Token da API inválido.' });
    }

    switch (p.action) {
      case 'statusPublic': return statusPublic_();
      case 'buscarAluno': return buscarAluno_(p);
      case 'buscarChapa': return buscarChapa_(p);
      case 'registrarVoto': return registrarVoto_(p);
      case 'heartbeat': return heartbeat_(p);
      case 'adminStatus': return json_({ ok: true, message: 'Autenticado.' });
      case 'adminDashboard': return adminDashboard_();
      case 'definirEleicao': return definirEleicao_(p);
      case 'criarChapa': return criarChapa_(p);
      case 'editarChapa': return editarChapa_(p);
      case 'excluirChapa': return excluirChapa_(p);
      case 'salvarConfig': return salvarConfig_(p);
      default: return json_({ ok: false, message: 'Ação desconhecida.' });
    }
  } catch (err) {
    return json_({ ok: false, message: String(err.message || err) });
  }
}

function statusPublic_() {
  const config = readConfig_();
  return json_({
    ok: true,
    election: {
      aberta: config.eleicaoAberta
    }
  });
}

function buscarAluno_(p) {
  ensureElectionOpen_();
  const ra = normalize_(p.ra);
  if (!ra) throw new Error('Informe o RA.');

  const sh = sheet_('Alunos');
  const values = sh.getDataRange().getDisplayValues();
  const headers = values.shift().map(h => normalizeHeader_(h));

  const idx = {
    ra: headers.indexOf('ra'),
    nome: headers.indexOf('nome'),
    data: headers.indexOf('datadenascimento'),
    votou: headers.indexOf('javotou')
  };

  if (idx.ra < 0 || idx.nome < 0 || idx.data < 0 || idx.votou < 0) {
    throw new Error('A aba Alunos precisa ter: RA, Nome, DataNascimento, JaVotou.');
  }

  for (let i = 0; i < values.length; i++) {
    if (normalize_(values[i][idx.ra]) === ra) {
      return json_({
        ok: true,
        aluno: {
          nome: values[i][idx.nome],
          dataNascimento: values[i][idx.data],
          jaVotou: normalize_(values[i][idx.votou]) === 'sim'
        }
      });
    }
  }

  throw new Error('RA não encontrado na lista de eleitores.');
}

function buscarChapa_(p) {
  ensureElectionOpen_();
  const numero = normalize_(p.numero);
  if (!numero || numero === 'BRANCO') throw new Error('Número de chapa inválido.');

  const chapas = readChapas_();
  const chapa = chapas.find(c => normalize_(c.numero) === numero && c.ativa);
  if (!chapa) throw new Error('Chapa não encontrada ou inativa.');

  return json_({ ok: true, chapa: chapa });
}

function registrarVoto_(p) {
  ensureElectionOpen_();

  const ra = normalize_(p.ra);
  const birth = normalizeDate_(p.dataNascimento);
  const numero = normalize_(p.numero);
  const urna = normalize_(p.urna || '01');

  if (!ra) throw new Error('RA não informado.');
  if (!birth) throw new Error('Data de nascimento não informada.');
  if (!numero) throw new Error('Voto não informado.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const aluno = findAlunoRow_(ra);
    if (!aluno) throw new Error('Eleitor não encontrado.');
    if (normalizeDate_(aluno.dataNascimento) !== birth) {
      throw new Error('Os dados do eleitor não conferem.');
    }
    if (normalize_(aluno.jaVotou) === 'sim') {
      throw new Error('Este RA já possui um voto registrado.');
    }

    if (numero !== 'BRANCO') {
      const chapa = readChapas_().find(c => normalize_(c.numero) === numero && c.ativa);
      if (!chapa) throw new Error('Chapa inválida.');
    }

    // Importante: a aba Votos NÃO recebe RA.
    const votos = sheet_('Votos');
    votos.appendRow([
      new Date(),
      urna,
      numero,
      p.acao || 'registrarVoto'
    ]);

    const alunosSh = sheet_('Alunos');
    alunosSh.getRange(aluno.row, aluno.colVotou + 1).setValue('SIM');

    return json_({
      ok: true,
      message: 'Voto registrado com sucesso.'
    });
  } finally {
    lock.releaseLock();
  }
}

function heartbeat_(p) {
  const urna = normalize_(p.urna || '01');
  if (!urna) return json_({ ok: false, message: 'Urna inválida.' });

  const sh = sheet_('Urnas');
  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 1) return json_({ ok: true });

  for (let i = 1; i < values.length; i++) {
    if (normalize_(values[i][0]) === urna) {
      sh.getRange(i + 1, 2).setValue(new Date());
      sh.getRange(i + 1, 3).setValue('ONLINE');
      return json_({ ok: true });
    }
  }

  sh.appendRow([urna, new Date(), 'ONLINE']);
  return json_({ ok: true });
}

function adminDashboard_() {
  const config = readConfig_();
  const chapas = readChapas_();
  const alunos = sheet_('Alunos').getDataRange().getDisplayValues();

  let eleitores = Math.max(0, alunos.length - 1);
  let votaram = 0;
  if (alunos.length > 1) {
    const headers = alunos[0].map(h => normalizeHeader_(h));
    const idx = headers.indexOf('javotou');
    if (idx >= 0) {
      for (let i = 1; i < alunos.length; i++) {
        if (normalize_(alunos[i][idx]) === 'sim') votaram++;
      }
    }
  }

  const votos = sheet_('Votos').getDataRange().getDisplayValues();
  const apuracao = {};
  let total = 0;
  let ultimoRegistro = '';
  let brancos = 0;
  let nulos = 0;

  for (let i = 1; i < votos.length; i++) {
    const numero = normalize_(votos[i][2]);
    if (!numero) continue;
    total++;
    ultimoRegistro = votos[i][0] || ultimoRegistro;
    if (numero === 'BRANCO') brancos++;
    else if (numero === 'NULO') nulos++;
    else apuracao[numero] = (apuracao[numero] || 0) + 1;
  }

  const resultados = chapas
    .map(c => ({
      numero: c.numero,
      nome: c.nome,
      votos: apuracao[normalize_(c.numero)] || 0
    }))
    .sort((a, b) => String(a.numero).localeCompare(String(b.numero), undefined, { numeric: true }));

  resultados.push({ numero: 'BRANCO', nome: 'Votos em branco', votos: brancos });
  resultados.push({ numero: 'NULO', nome: 'Votos nulos', votos: nulos });

  return json_({
    ok: true,
    config: {
      escola: config.escola,
      eleicao: config.eleicao,
      eleicaoAberta: config.eleicaoAberta
    },
    metrics: {
      eleitores,
      votaram,
      ultimoRegistro: parseDateForClient_(ultimoRegistro)
    },
    apuracao: {
      total,
      resultados
    },
    chapas,
    urnas: readUrnas_()
  });
}

function definirEleicao_(p) {
  const aberta = Boolean(p.aberta);
  setConfigValue_('ELEICAO_ABERTA', aberta ? 'SIM' : 'NAO');
  return json_({ ok: true });
}

function salvarConfig_(p) {
  if (p.escola !== undefined) setConfigValue_('ESCOLA', String(p.escola || ''));
  if (p.eleicao !== undefined) setConfigValue_('ELEICAO', String(p.eleicao || ''));
  return json_({ ok: true });
}

function criarChapa_(p) {
  const numero = normalize_(p.numero);
  if (!/^\d{1,3}$/.test(numero)) throw new Error('Número de chapa inválido.');
  const sh = sheet_('Chapas');
  const existing = readChapas_().find(c => normalize_(c.numero) === numero);
  if (existing) throw new Error('Já existe uma chapa com esse número.');

  sh.appendRow([
    numero, p.nome || '', p.presidente || '', p.vice || '',
    p.slogan || '', p.fotoUrl || '', p.ativa ? 'SIM' : 'NAO'
  ]);
  return json_({ ok: true });
}

function editarChapa_(p) {
  const numero = normalize_(p.numero);
  const sh = sheet_('Chapas');
  const values = sh.getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    if (normalize_(values[i][0]) === numero) {
      sh.getRange(i + 1, 1, 1, 7).setValues([[
        numero, p.nome || '', p.presidente || '', p.vice || '',
        p.slogan || '', p.fotoUrl || '', p.ativa ? 'SIM' : 'NAO'
      ]]);
      return json_({ ok: true });
    }
  }
  throw new Error('Chapa não encontrada.');
}

function excluirChapa_(p) {
  const numero = normalize_(p.numero);
  const sh = sheet_('Chapas');
  const values = sh.getDataRange().getDisplayValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (normalize_(values[i][0]) === numero) {
      sh.deleteRow(i + 1);
      return json_({ ok: true });
    }
  }
  throw new Error('Chapa não encontrada.');
}

function findAlunoRow_(ra) {
  const sh = sheet_('Alunos');
  const values = sh.getDataRange().getDisplayValues();
  const headers = values[0].map(h => normalizeHeader_(h));
  const idxRa = headers.indexOf('ra');
  const idxNome = headers.indexOf('nome');
  const idxData = headers.indexOf('datadenascimento');
  const idxVotou = headers.indexOf('javotou');

  if ([idxRa, idxNome, idxData, idxVotou].some(x => x < 0)) {
    throw new Error('Aba Alunos com cabeçalhos incompletos.');
  }

  for (let i = 1; i < values.length; i++) {
    if (normalize_(values[i][idxRa]) === ra) {
      return {
        row: i + 1,
        nome: values[i][idxNome],
        dataNascimento: values[i][idxData],
        jaVotou: values[i][idxVotou],
        colVotou: idxVotou
      };
    }
  }
  return null;
}

function readConfig_() {
  const sh = sheet_('Config');
  const values = sh.getDataRange().getDisplayValues();
  const obj = {};
  for (let i = 1; i < values.length; i++) {
    const k = normalize_(values[i][0]);
    const v = values[i][1] || '';
    if (k === 'escola') obj.escola = v;
    if (k === 'eleicao') obj.eleicao = v;
    if (k === 'eleicao_aberta') obj.eleicaoAberta = normalize_(v) === 'sim';
  }
  return {
    escola: obj.escola || 'Escola',
    eleicao: obj.eleicao || 'Eleição do Grêmio Estudantil',
    eleicaoAberta: obj.eleicaoAberta || false
  };
}

function setConfigValue_(key, value) {
  const sh = sheet_('Config');
  const values = sh.getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    if (normalize_(values[i][0]) === normalize_(key)) {
      sh.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sh.appendRow([key, value]);
}

function readChapas_() {
  const sh = sheet_('Chapas');
  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  return values.slice(1).filter(r => r[0]).map(r => ({
    numero: r[0],
    nome: r[1],
    presidente: r[2],
    vice: r[3],
    slogan: r[4],
    fotoUrl: r[5],
    ativa: normalize_(r[6]) === 'sim'
  }));
}

function readUrnas_() {
  const sh = sheet_('Urnas');
  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  return values.slice(1).filter(r => r[0]).map(r => ({
    numero: r[0],
    ultimoAcesso: parseDateForClient_(r[1]),
    status: r[2] || ''
  }));
}

function ensureElectionOpen_() {
  if (!readConfig_().eleicaoAberta) throw new Error('A votação está encerrada.');
}

function parseDateForClient_(value) {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toISOString();
}

function normalize_(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeHeader_(value) {
  return normalize_(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeDate_(value) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  const parts = s.split(/[\/.-]/);
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  }
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
  }
  return s.toLowerCase();
}

/**
 * Execute UMA VEZ manualmente depois de criar a planilha.
 * Se preferir, você também pode criar as abas com esses cabeçalhos manualmente.
 */
function prepararPlanilha() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const definitions = {
    'Config': [['CHAVE','VALOR'],['ESCOLA','E.E. Professor Antônio Rosas da Silva Galvão'],['ELEICAO','Eleição do Grêmio Estudantil'],['ELEICAO_ABERTA','NAO']],
    'Alunos': [['RA','Nome','DataNascimento','JaVotou']],
    'Chapas': [['Numero','Nome','Presidente','Vice','Slogan','FotoURL','Ativa']],
    'Votos': [['Timestamp','Urna','NumeroChapa','TipoRegistro']],
    'Urnas': [['Numero','UltimoAcesso','Status']]
  };

  Object.keys(definitions).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    sh.clear();
    const data = definitions[name];
    sh.getRange(1,1,data.length,data[0].length).setValues(data);
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, data[0].length);
  });
}
