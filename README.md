# SITE MQM - Hub de Produtos

Site estatico do **MQM** estruturado como hub de produtos:

- **Comunidade MQM**
- **Manual do Exito - Cripto**
- **Mentoria Completa**

O foco do site e organizar a jornada de quem quer aprender Bitcoin, autocustodia, P2P, DeFi consciente, cartao crypto e soberania financeira.

## Visao geral

- Home curta em `index.html`, no estilo hub de produtos
- Paginas individuais de venda para cada produto
- Conteudo em portugues brasileiro
- HTML e CSS customizado, sem build
- Build simples para Vercel copiando os arquivos estaticos para `dist/`
- Font Awesome via CDN para icones
- Imagens locais em `public/`
- Botao de checkout da Comunidade MQM apontando para LastLink
- Botao de checkout do Manual do Exito - Cripto apontando para LastLink
- Mentoria Completa com botao direto para o WhatsApp do MQM

## Estrutura

```text
SITE MQM/
├── index.html
├── comunidade.html
├── manual.html
├── mentoria.html
├── package.json
├── README.md
├── vercel.json
├── .gitignore
├── assets/
│   └── site.css
├── scripts/
│   └── build.mjs
└── public/
    ├── home-community.png
    ├── community-hero.png
    ├── home-manual.png
    ├── home-mentoria.png
    ├── module-1.png ... module-5.png
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
- Checkout Manual do Exito: busque por `https://lastlink.com/p/C7C86F42F/checkout-payment`
- WhatsApp Mentoria: busque por `https://wa.me/5511977486383`
- Redes sociais: busque por `mqmcrypto`, `mQmcrypto` e `mqm_racional`
- Home/hub: edite `index.html`
- Pagina da Comunidade: edite `comunidade.html`
- Pagina do Manual: edite `manual.html`
- Pagina da Mentoria: edite `mentoria.html`
- Estilos globais: edite `assets/site.css`

## Observacoes para producao

- As imagens locais tem cerca de 1.8 MB cada. Vale comprimir/exportar em WebP para melhorar velocidade em conexoes moveis.
- O site ainda nao tem analytics, pixel de conversao ou eventos de funil. Esses pontos sao importantes se a pagina for usada para trafego pago.
