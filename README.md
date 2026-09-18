# Portal do Grêmio — versão correta e simples

## Estrutura

- `index.html` — página inicial
- `urna.html` — urna eletrônica
- `admin.html` — administrativo
- `css/style.css` — layout
- `js/config.js` — URL da API e senha simples
- `js/api.js` — comunicação JSONP
- `js/urna.js` — fluxo da urna
- `js/admin.js` — painel
- `google-apps-script/Code.gs` — API + Google Sheets

## Google Apps Script

A URL já configurada no `js/config.js` é:

`https://script.google.com/macros/s/AKfycby5x9z5zM_GSdwpWxnu3cTjp9HRCozITPsPVkvJ3OJsDbPbdLqdhVQ2ietvCjzuGNa7ig/exec`

No Apps Script:

1. Abra o `Code.gs`.
2. Coloque o ID da planilha em `SPREADSHEET_ID`.
3. Execute `prepararPlanilha()` uma vez.
4. Publique como **Aplicativo da Web**.
5. Use a mesma URL `/exec` configurada em `js/config.js`.

## Planilha

### Alunos
`RA | Nome | DataNascimento | JaVotou`

### Chapas
`Numero | Nome | Presidente | Vice | Slogan | FotoURL | Ativa`

### Votos
`Timestamp | Urna | NumeroChapa`

### Urnas
`Numero | UltimoAcesso | Status`

## Várias urnas

Use:

- `/urna.html?urna=01`
- `/urna.html?urna=02`
- `/urna.html?urna=03`
- `/urna.html?urna=04`

Todas registram na mesma planilha.

## Senha simples

A senha administrativa inicial é:

`gremio2026`

Ela aparece no `js/config.js` e também no `Code.gs`.

## Importante

Esta versão usa JSONP/GET porque foi projetada para rodar sem backend próprio no Vercel. Isso facilita a instalação, mas envia parâmetros da votação na URL da API. Para um processo eleitoral oficial com exigência de maior segurança e privacidade, deve-se substituir essa ponte simples por autenticação/backend seguro.
