# SITE mQm - Hub de Produtos

Site estatico do **mQm Crypto** estruturado como hub de produtos:

- **Comunidade mQm**
- **Pool Party** (pools de liquidez / DeFi)
- **Mentoria Personalizada** (card da home leva direto ao WhatsApp do mQm)
- **MQMp2p** (bloco na home apontando para https://mqmp2p.com/, compra de cripto com PIX)

O foco do site e organizar a jornada de quem quer aprender Bitcoin, autocustodia, P2P, DeFi consciente, cartao crypto e soberania financeira.

## Visao geral

- Home curta em `index.html`, no estilo hub de produtos
- Paginas individuais de venda para cada produto
- Conteudo em portugues brasileiro
- HTML e CSS customizado, sem build
- Build simples para Vercel copiando os arquivos estaticos para `dist/`
- Analytics proprio para visitas, visitantes, origem e cliques
- Dashboard privado em `/dashboard.html`
- Font Awesome via CDN para icones
- Imagens locais em `public/`
- Botao de checkout da Comunidade mQm apontando para LastLink
- Pool Party com botao direto para o WhatsApp do mQm
- Mentoria Personalizada: card da home abre o WhatsApp do mQm com mensagem pronta
- Bloco MQMp2p na home, abaixo dos cards de produto
- Galeria coverflow de provas e carrossel 3D de feedbacks (ports Originkit em `assets/originkit.js`)

## Estrutura

```text
SITE MQM/
├── index.html
├── comunidade.html
├── poolparty.html
├── package.json
├── README.md
├── vercel.json
├── .gitignore
├── assets/
│   ├── site.css
│   └── originkit.js
├── scripts/
│   └── build.mjs
└── public/
    ├── home-community.png
    ├── community-hero.png
    ├── home-virada.jpg  (foto do card Mentoria Personalizada)
    ├── poolparty/  (mascote, provas proof-1..7, feedbacks 01..16)
    ├── mqm-logo-header.png
    ├── mqm-logo.png
    ├── mqm.png
    └── mqm-2.png
```

## Como visualizar

Rode um servidor local:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Depois acesse:

```text
http://127.0.0.1:8000/
```

Para gerar a saida usada no Vercel:

```powershell
npm run build
```

## Pontos principais para editar

- Checkout Comunidade: busque por `https://lastlink.com/p/C9020FF58/checkout-payment/`
- WhatsApp Pool Party e Mentoria: busque por `https://wa.me/5511977486383`
- Link do MQMp2p: busque por `https://mqmp2p.com/` em `index.html`
- Redes sociais: busque por `mqmcrypto`, `mQmcrypto` e `mqm_racional`
- Home/hub: edite `index.html`
- Pagina da Comunidade: edite `comunidade.html`
- Pagina do Pool Party: edite `poolparty.html` (slides das provas e feedbacks no script no fim do arquivo)
- Estilos globais: edite `assets/site.css`

## Analytics e dashboard

O site passa a coletar dados a partir da publicacao desta versao. Nao e possivel
recuperar acessos anteriores porque nenhum analytics estava instalado.

Para ativar a coleta na Vercel:

1. Adicione uma integracao Redis/Upstash ao projeto.
2. Confirme que ela criou `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ou as
   equivalentes `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`).
3. Crie `ANALYTICS_DASHBOARD_TOKEN` com a senha escolhida para o dashboard.
4. Crie `ANALYTICS_HASH_SECRET` com outro valor aleatorio e longo.
5. Publique novamente o projeto.

O dashboard fica em `https://www.mqmcrypto.com/dashboard.html`. A opcao
"Visualizar demonstracao" usa numeros ilustrativos e nunca se mistura aos dados
reais.

Os dados diarios expiram depois de 120 dias. O rastreador respeita a opcao
`Do Not Track`, nao salva IP bruto e usa um identificador anonimizado para
estimar visitantes unicos.

## Observacoes para producao

- As imagens locais tem cerca de 1.8 MB cada. Vale comprimir/exportar em WebP para melhorar velocidade em conexoes moveis.
- O dashboard mede navegacao no site e cliques, mas nao confirma compras feitas
  na LastLink. Para medir vendas, sera necessario integrar o checkout ou receber
  webhooks da plataforma.
