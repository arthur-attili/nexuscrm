# NexusCRM

CRM customizável com automações, campos personalizáveis e integração com n8n.

---

## Stack

| Camada | Tecnologia |
|---|---|
| **Backend** | Python 3.12 + FastAPI |
| **Banco de dados** | PostgreSQL (via Supabase) |
| **Autenticação** | Supabase Auth (JWT) |
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **Estilização** | Tailwind CSS |
| **Arquitetura** | DDD (Domain-Driven Design) no backend |

---

## Estrutura do Projeto

```
CRM/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── core/               # Configuração, banco, autenticação
│   │   ├── domains/            # Cada domínio do negócio
│   │   │   ├── profiles/       # Perfis de usuário
│   │   │   ├── pipelines/      # Pipelines + Stages (funil)
│   │   │   ├── leads/          # Leads
│   │   │   ├── deals/          # Negócios
│   │   │   ├── custom_fields/  # Campos customizáveis
│   │   │   └── api_keys/       # Chaves de API (a implementar)
│   │   └── shared/             # Código compartilhado
│   ├── requirements.txt
│   └── .env                    # NÃO vai pro Git (criar manualmente)
│
└── frontend/                   # Interface Next.js
    ├── src/
    │   ├── app/
    │   │   ├── (dashboard)/    # Rotas protegidas (com sidebar)
    │   │   │   ├── page.tsx        # Dashboard
    │   │   │   ├── leads/          # /leads
    │   │   │   ├── deals/          # /deals
    │   │   │   ├── pipelines/      # /pipelines
    │   │   │   └── settings/       # /settings
    │   │   ├── login/          # /login
    │   │   └── layout.tsx      # Layout raiz
    │   ├── components/         # Componentes React
    │   ├── lib/
    │   │   ├── api/            # Cliente HTTP para o backend
    │   │   └── supabase/       # Clientes Supabase (browser/server)
    │   └── middleware.ts       # Proteção de rotas
    └── .env.local              # NÃO vai pro Git (criar manualmente)
```

---

## Setup em um novo PC

### Pré-requisitos

Instale, se ainda não tiver:

- **Python 3.12** → https://www.python.org/downloads/release/python-3129/
  - Marque **"Add Python to PATH"** durante a instalação
- **Node.js 20+** → https://nodejs.org/
- **Git** → https://git-scm.com/download/win

Confirme:

```powershell
python --version    # deve mostrar 3.12.x
node -v             # deve mostrar v20 ou maior
git --version
```

### 1. Clonar o repositório

```powershell
cd C:\Users\SEU_USUARIO\Documents\
git clone https://github.com/SEU_USUARIO/nexuscrm.git
cd nexuscrm
```

### 2. Criar os arquivos de ambiente

Esses arquivos **não estão no Git** por segurança. Você precisa recriá-los.

#### `backend/.env`

```env
SUPABASE_URL=https://abcdefghijklmnopqrs.supabase.co
SUPABASE_SERVICE_KEY=<cole_aqui_a_service_role_key_do_supabase>
```

> A `SERVICE_ROLE_KEY` está em: **Supabase Dashboard → Settings → API → Project API keys → service_role**.
> **Nunca** commite essa chave.

#### `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnopqrs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<cole_aqui_a_anon_key_do_supabase>
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

> A `ANON_KEY` está em: **Supabase Dashboard → Settings → API → Project API keys → anon public**.

### 3. Rodar o backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1     # Windows
# source venv/bin/activate       # Linux/Mac

pip install -r requirements.txt
uvicorn app.main:app --reload
```

O backend estará em: **http://127.0.0.1:8000**
Documentação interativa (Swagger): **http://127.0.0.1:8000/docs**

### 4. Rodar o frontend (outro terminal)

```powershell
cd frontend
npm install
npm run dev
```

O frontend estará em: **http://localhost:3000**

### 5. Login de teste

| Usuário | Email | Senha |
|---|---|---|
| Vendedor | `teste@nexuscrm.com` | `Teste@123` |
| Admin | `admin@nexuscrm.com` | `Admin@123` |

---

## Como o projeto funciona

### Fluxo de autenticação

```
1. Usuário faz login na tela /login
2. Next.js chama Supabase Auth → recebe JWT
3. JWT é armazenado em cookies (via @supabase/ssr)
4. Middleware (src/middleware.ts) valida o JWT em toda rota
5. Se válido, o frontend chama o backend com Authorization: Bearer <token>
6. Backend valida o JWT via Supabase (auth_supabase) e extrai o user_id
```

### Fluxo de uma requisição autenticada

```
Browser → Next.js Server Component → apiFetch() → FastAPI → Supabase → resposta
```

O `apiFetch` (em `frontend/src/lib/api/client.ts`) injeta o JWT automaticamente.

### Arquitetura DDD do backend

Cada domínio (`leads`, `deals`, etc.) tem a mesma estrutura:

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| **Entities** | `entities.py` | Modelos Pydantic (entrada/saída da API) |
| **Repository** | `repository.py` | Acesso ao banco (Supabase) |
| **Service** | `service.py` | Regras de negócio |
| **Router** | `router.py` | Endpoints HTTP |

### Controle de acesso

- **Vendedor** — vê e edita apenas os próprios leads/deals
- **Gerente** — vê e edita todos
- **Admin** — vê tudo + gerencia usuários e campos customizáveis

---

## Status do desenvolvimento

### Backend (FastAPI)

| Domínio | Status |
|---|---|
| `profiles` | Completo |
| `pipelines` + `stages` | Completo |
| `leads` | Completo |
| `deals` | Completo |
| `custom_fields` | Completo |
| `api_keys` | Pendente |
| Automações (n8n) | Pendente |

### Frontend (Next.js)

| Tela | Status |
|---|---|
| Login / Logout | Completo |
| Layout (sidebar + header) | Completo |
| Dashboard | Placeholder |
| Leads — listagem | Completo |
| Leads — criar | Em andamento |
| Leads — busca e paginação | Pendente |
| Leads — detalhes | Pendente |
| Deals (Kanban) | Pendente |
| Pipelines | Pendente |
| Configurações | Pendente |

---

## Estrutura do banco de dados

Principais tabelas no Supabase:

| Tabela | Descrição |
|---|---|
| `profiles` | Perfis de usuário (ligados ao `auth.users`) |
| `pipelines` | Funis de venda |
| `stages` | Etapas do funil (com `is_won` / `is_lost`) |
| `leads` | Contatos/oportunidades iniciais |
| `deals` | Negócios em andamento |
| `custom_fields` | Definição de campos customizáveis |
| `activities` | Tarefas e atividades (não implementado na API) |
| `notes` | Anotações (não implementado na API) |
| `notifications` | Notificações (não implementado na API) |

Campos JSONB importantes:
- `leads.contact_info` — telefone, email, WhatsApp, etc.
- `leads.custom_values` — valores dos campos customizáveis
- `deals.custom_values` — idem

---

## Segurança

### Arquivos que **NUNCA** vão para o Git

- `backend/.env` — contém a `SERVICE_ROLE_KEY` (acesso total ao banco)
- `frontend/.env.local` — contém as chaves do Supabase
- `venv/` — ambiente Python
- `node_modules/` — dependências Node

### Boas práticas

- A `SERVICE_ROLE_KEY` **só** é usada no backend
- O frontend usa apenas a `ANON_KEY` (protegida por RLS)
- Todo endpoint é protegido por JWT (exceto `/health`)
- RLS do Supabase está ativo como camada extra

---

## Comandos úteis

### Backend

```powershell
# Ativar ambiente virtual
.\venv\Scripts\Activate.ps1

# Rodar servidor com reload automático
uvicorn app.main:app --reload

# Instalar nova dependência
pip install <pacote>
pip freeze > requirements.txt
```

### Frontend

```powershell
# Rodar dev server
npm run dev

# Build de produção
npm run build
npm start

# Instalar dependência
npm install <pacote>
```

### Git

```powershell
git add .
git commit -m "mensagem"
git push
```

---

## Notas de desenvolvimento

### Erros comuns

**`ModuleNotFoundError: No module named 'app'`**
- Você está rodando o comando de fora da pasta `backend/`. Ative o venv e entre em `backend/`.

**`pydantic-core` falha ao instalar**
- Verifique se está usando Python 3.12 (não 3.13+).

**`Token inválido ou expirado`**
- O JWT expira em 1 hora. Faça login novamente.

**`Gateway Timeout` do Supabase**
- Instabilidade momentânea do provedor. Aguarde alguns segundos e tente de novo.

---

## Decisões de design

- **Backend em Python + FastAPI** para integração fácil com **n8n** (automações)
- **Frontend em Next.js** com App Router + Server Components (menos JS no cliente)
- **Supabase Auth** no frontend, com validação do JWT no backend
- **`contact_info` e `custom_values` como JSONB** para máxima flexibilidade
- **Service_role key só no backend**, garantindo operações administrativas controladas
- **`status` de deals**: `open` → `won`/`lost` (finais). Stage e probability são atualizados automaticamente.

---

## Roadmap

- [x] Autenticação com Supabase
- [x] CRUD de perfis
- [x] CRUD de pipelines + stages
- [x] CRUD de leads
- [x] CRUD de deals
- [x] CRUD de campos customizáveis
- [ ] CRUD de API keys
- [ ] Integração com n8n (webhooks)
- [ ] Tela de Leads completa (busca, paginação, detalhes)
- [ ] Kanban de deals (drag-and-drop)
- [ ] Tela de configurações (perfil, campos, pipelines)
- [ ] Sistema de notificações
- [ ] Sistema de atividades e notas

---

## Suporte

Este projeto está em desenvolvimento ativo. Para dúvidas ou bugs, abra uma issue no repositório.
