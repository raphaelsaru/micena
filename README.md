# Micena Piscinas - Sistema de Gestão

Sistema completo para gestão de serviços de piscina, incluindo clientes, serviços, rotas e integração com Google Calendar.

## 🚀 Getting Started

### Pré-requisitos
- Node.js 18+
- npm/yarn/pnpm
- Conta Supabase
- Conta Google (para Calendar API)

### 1. Instalação

Clone o repositório e instale as dependências:

```bash
git clone [URL_DO_REPOSITORIO]
cd micena-piscinas
npm install
```

### 2. Configuração das Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp env.local.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico_aqui

# Google Calendar API
GOOGLE_CLIENT_ID=seu_client_id_google_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_google_aqui
GOOGLE_REDIRECT_URI=https://micena.vercel.app/api/auth/google/callback

# App Configuration
NEXT_PUBLIC_APP_URL=https://micena.vercel.app
NODE_ENV=production
```

### 3. Configuração do Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá para **APIs & Services** → **Credentials**
3. Clique no seu OAuth 2.0 Client ID
4. Em **Authorized redirect URIs**, adicione:
   - `https://micena.vercel.app/api/auth/google/callback` (produção)

### 4. Executar o Projeto

```bash
npm run dev
```

Open [https://micena.vercel.app](https://micena.vercel.app) with your browser to see the result.

## ✨ Funcionalidades

- **Gestão de Clientes**: Cadastro completo com histórico
- **Serviços**: Controle de serviços prestados com itens e materiais
- **Rotas**: Organização de rotas por dia da semana com drag & drop
- **Google Calendar**: Sincronização automática de próximos serviços
- **Mensalistas**: Controle de pagamentos mensais com data de início personalizada
- **Relatórios**: Ordens de serviço e relatórios financeiros precisos

## 🛠️ Scripts Disponíveis

- **`npm run dev`** - Servidor de desenvolvimento
- **`npm run build`** - Build de produção
- **`npm run start`** - Servidor de produção
- **`npm run lint`** - Verificação de código
- **`npm run migrate:dev`** - Aplicar migrações no ambiente de desenvolvimento

## 📚 Documentação

Consulte a pasta `docs/` para documentação detalhada de cada funcionalidade.

## 🔒 Segurança

- Autenticação via Supabase Auth
- Controle de acesso baseado em roles
- Integração OAuth 2.0 com Google
- Validação de dados com Zod

## 📱 Deploy

O projeto está configurado para deploy na Vercel com integração automática com Supabase.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [https://micena.vercel.app](https://micena.vercel.app) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## 📚 Learn More

Para mais informações sobre as tecnologias utilizadas:

- [Next.js Documentation](https://nextjs.org/docs) - recursos e API do Next.js
- [Supabase Documentation](https://supabase.com/docs) - banco de dados e autenticação
- [Google Calendar API](https://developers.google.com/calendar) - integração com calendário
