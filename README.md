# Radar Parlamentar

Aplicação web para acompanhar deputados federais e senadores: votações, perfil temático, indicadores do estado, notícias e dados eleitorais.

Trabalho II — Sistemas Distribuídos · Sistemas de Informação · FURG
Prof. Bruno Lopes Dalmazo · Aluno: Renan Nunes Borges (matrícula 155549)

## Como rodar

Requisito: Node.js 20 ou superior.

```bash
npm install
cp .env.example .env    # opcional: preencha as chaves
npm run dev             # http://localhost:3000
```

Variáveis de ambiente (ambas opcionais):

| Variável | Uso |
|---|---|
| `GROQ_API_KEY` | explicação das votações em linguagem simples |
| `WORLD_NEWS_API` | fonte adicional de notícias |

Sem as chaves, a aplicação continua funcionando com as demais fontes.

## Publicação

O projeto está pronto para a Vercel (`vercel.json` e pasta `api/`). Cadastre as variáveis acima em **Settings → Environment Variables** e faça o deploy.
