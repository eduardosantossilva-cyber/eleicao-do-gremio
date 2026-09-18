# Portal do Grêmio Estudantil — Urna + Administrativo

Projeto em HTML/CSS/JavaScript para publicação no GitHub + Vercel, usando Google Apps Script + Google Sheets como banco/API.

## Arquitetura

```text
Navegador
   ↓
Vercel (site + /api/bridge)
   ↓
Google Apps Script
   ↓
Google Sheets
```

O Vercel funciona como uma ponte server-side para que a interface no navegador não precise acessar diretamente o Google Apps Script.

## Fluxo da urna

1. RA
2. Nome + data de nascimento
3. Confirmação do eleitor
4. Número da chapa
5. Foto + dados da chapa
6. CONFIRMA
7. FIM
8. VOLTAR AO INÍCIO

O RA é usado para validar o eleitor, mas não é gravado na aba `Votos`.

## 1. Google Sheets

Crie uma planilha no Google Drive.

No Apps Script, abra `google-apps-script/Code.gs` e informe o ID da planilha em:

```js
const SPREADSHEET_ID = 'COLOQUE_AQUI_O_ID_DA_PLANILHA';
```

Execute manualmente `prepararPlanilha()` uma vez.

Depois preencha:

### Alunos

```text
RA | Nome | DataNascimento | JaVotou
```

Exemplo:

```text
123456 | João da Silva | 10/05/2012 | 
123457 | Maria Souza | 25/08/2011 |
```

O sistema preencherá `SIM` em `JaVotou` após a confirmação do voto.

### Chapas

```text
Numero | Nome | Presidente | Vice | Slogan | FotoURL | Ativa
```

A foto deve ser uma URL pública. Para Google Drive, o painel tenta converter automaticamente links de arquivo para visualização.

### Votos

```text
Timestamp | Urna | NumeroChapa | TipoRegistro
```

A aba não recebe o RA do aluno.

## 2. API do Google Apps Script

No editor do Apps Script:

1. Vá em `Implantar` → `Nova implantação`.
2. Tipo: `Aplicativo da web`.
3. Executar como: sua conta.
4. Quem tem acesso: conforme a configuração da sua organização; para teste, use acesso por link.
5. Copie a URL `/exec`.

Em `Configurações do projeto` → `Propriedades do script`, crie:

```text
GREMIO_API_TOKEN = uma-chave-secreta-longa
```

Use a mesma chave como variável de ambiente no Vercel.

## 3. Vercel

No projeto do Vercel, configure somente os segredos:

```text
GAS_API_TOKEN=mesma-chave-do-Apps-Script
ADMIN_PASSWORD=uma-senha-forte-da-comissao
```

A URL pública do Google Apps Script já está gravada em `api/bridge.js`.

Não coloque essas chaves no GitHub.

Depois do deploy:

```text
/
    página inicial

/urna.html?urna=01
/urna.html?urna=02
/urna.html?urna=03
/admin.html
```

## 4. Várias urnas

Cada computador pode abrir a mesma URL com um número diferente:

```text
/urna.html?urna=01
/urna.html?urna=02
/urna.html?urna=03
/urna.html?urna=04
```

A API centraliza tudo.

O Apps Script usa `LockService` durante o registro do voto para evitar corrida entre duas urnas quando o mesmo RA tentar votar ao mesmo tempo.

## 5. Teste antes da eleição

Faça um teste com uma planilha de teste:

- 5 eleitores
- 2 chapas
- 2 computadores
- abra a votação
- vote com RAs diferentes
- tente repetir um RA
- verifique a apuração
- encerre a votação
- confirme que novas tentativas são bloqueadas

## Observação

Para uma eleição real, a escola deve controlar quem pode acessar a área administrativa e usar uma senha administrativa forte. A infraestrutura de hospedagem e as permissões do Google devem ser configuradas antes do uso oficial.
