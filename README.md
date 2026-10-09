# NexusCRM

CRM customizável com automações, campos personalizáveis e integração com n8n.

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| **Backend** | Python 3.12 + FastAPI |
| **Banco de dados** | PostgreSQL (via Supabase) |
| **Autenticação** | Supabase Auth (JWT) + API Keys |
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **Estilização** | Tailwind CSS |
| **Arquitetura** | DDD (Domain-Driven Design) no backend |

---

## 📁 Estrutura do Projeto

```
CRM/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── core/               # Configuração, banco, auth, logging, rate limit
│   │   ├── domains/            # Cada domínio do negócio
│   │   │   ├── profiles/       # Perfis de usuário
│   │   │   ├── pipelines/      # Pipelines + Stages
│   │   │   ├── leads/          # Leads
│   │   │   ├── deals/          # Negócios
│   │   │   ├── custom_fields/  # Campos customizáveis + validação
│   │   │   ├── notes/          # Notas (polimórfico lead/deal)
│   │   │   ├── activities/     # Atividades (polimórfico lead/deal)
│   │   │   ├── dashboard/      # Métricas agregadas
│   │   │   ├── api_keys/       # Chaves de API
│   │   │   └── webhooks/       # Webhooks outbound (n8n)
│   │   └── shared/             # Código compartilhado
│   ├── requirements.txt
│   └── .env                    # ⚠️ NÃO vai pro Git (criar manualmente)
│
└── frontend/                   # Interface Next.js
    ├── src/
    │   ├── app/
    │   │   ├── (dashboard)/    # Rotas protegidas
    │   │   │   ├── page.tsx        # Dashboard
    │   │   │   ├── leads/          # Lista + detalhe + notas + atividades
    │   │   │   ├── deals/          # Kanban + detalhe
    │   │   │   ├── pipelines/      # Lista + kanban por pipeline
    │   │   │   └── settings/       # Perfil, campos, pipelines, api-keys, webhooks
    │   │   ├── login/          # /login
    │   │   └── layout.tsx      # Layout raiz
    │   ├── components/         # Componentes reutilizáveis
    │   ├── lib/
    │   │   ├── api/            # Cliente HTTP para o backend
    │   │   ├── actions/        # Server Actions reutilizáveis
    │   │   ├── forms/          # Helpers de forms
    │   │   └── supabase/       # Clientes Supabase (browser/server)
    │   └── middleware.ts       # Proteção de rotas
    └── .env.local              # ⚠️ NÃO vai pro Git (criar manualmente)
```

---

## 🚀 Setup Local

### Pré-requisitos

- **Python 3.12** → https://www.python.org/downloads/release/python-3129/
  - ⚠️ Marque **"Add Python to PATH"** durante a instalação
- **Node.js 20+** → https://nodejs.org/
- **Git** → https://git-scm.com/download/win

### 1. Clonar o repositório

```bash
git clone https://github.com/arthur-attili/nexuscrm.git
cd nexuscrm
```

### 2. Criar os arquivos de ambiente

#### `backend/.env`

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=cole_aqui_a_service_role_key

ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=INFO

CORS_ORIGINS=http://localhost:3000
```

#### `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=cole_aqui_a_anon_key

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 3. Rodar o backend

```bash
cd backend
python -m venv ../venv
# Windows:
..\venv\Scripts\Activate.ps1
# Linux/Mac:
source ../venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend em: **http://127.0.0.1:8000**
Swagger: **http://127.0.0.1:8000/docs**

### 4. Rodar o frontend (outro terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend em: **http://localhost:3000**

---

## 🔐 Segurança

### Arquivos que NUNCA vão para o Git

- `backend/.env` — contém a `SERVICE_ROLE_KEY` (acesso total ao banco)
- `frontend/.env.local` — contém as chaves do Supabase
- `venv/`, `node_modules/`

### Camadas de proteção

- **Supabase RLS** ativo como camada extra
- **JWT do Supabase** validado em todos os endpoints
- **API Keys** (`nxk_...`) geradas com hash SHA-256 (só o hash vai pro banco)
- **Rate limiting** de 200 req/min por IP (excluindo `/health`)
- **CORS** parametrizado por env var
- **Exception handlers** que nunca vazam stacktrace para o cliente

### Controle de acesso

| Role | Vê leads/deals | Gerencia campos | Gerencia pipelines | Gerencia webhooks |
|---|---|---|---|---|
| **Vendedor** | Só os seus | ❌ | ❌ | ❌ |
| **Gerente** | Todos | ❌ | ❌ | ❌ |
| **Admin** | Todos | ✅ | ✅ | ✅ |

---

## 🔗 Integrações

### Webhooks Outbound

Quando eventos acontecem no CRM, disparamos POSTs para URLs externas (n8n, Zapier, etc.).

**Eventos disponíveis:**
- `lead.created`, `lead.updated`
- `deal.created`, `deal.updated`, `deal.status_changed`
- `note.created`

**Payload:**
```json
{
  "event": "lead.created",
  "timestamp": "2026-10-09T14:32:11Z",
  "data": { "id": "...", "name": "...", "status": "new" }
}
```

**Headers:**
- `X-Nexus-Event`: tipo do evento
- `X-Nexus-Signature`: `sha256=<hmac>` do body com o secret do webhook
- `X-Nexus-Webhook-Id`: ID do webhook

**Entrega:**
- Assíncrona (não bloqueia a API)
- Retry de 3 tentativas com backoff exponencial (1s, 3s, 9s)
- Log de cada tentativa na tabela `webhook_deliveries`

### API Keys

Chaves no formato `nxk_...` para integrações externas. Envie no header:

```
Authorization: Bearer nxk_xxxxxxxxxxxxxxxxxxxxx
```

Funciona em **todos** os endpoints da API.

---

## 🗄️ Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `profiles` | Perfis de usuário (ligados ao `auth.users`) |
| `pipelines` | Funis de venda |
| `stages` | Etapas do funil |
| `leads` | Contatos/oportunidades |
| `deals` | Negócios em andamento |
| `custom_fields` | Definição de campos customizáveis |
| `notes` | Notas (polimórfico) |
| `activities` | Atividades (polimórfico) |
| `api_keys` | Chaves de API |
| `webhooks` | Webhooks configurados |
| `webhook_deliveries` | Log de entregas de webhooks |

### Campos JSONB importantes

- `leads.contact_info` — telefone, email, WhatsApp, etc.
- `leads.custom_values` / `deals.custom_values` — valores dos campos customizáveis

---

## 📚 Endpoints da API

| Domínio | Prefixo | Recursos |
|---|---|---|
| Health | `/health` | Health check |
| Profiles | `/profiles` | Perfil do usuário |
| Pipelines | `/pipelines` | CRUD + stages |
| Leads | `/leads` | CRUD + filtros + paginação |
| Custom Fields | `/custom-fields` | CRUD (admin) |
| Deals | `/deals` | CRUD + status transitions |
| Dashboard | `/dashboard/metrics` | Métricas agregadas |
| Notes | `/notes` | CRUD (polimórfico) |
| Activities | `/activities` | CRUD (polimórfico) |
| API Keys | `/api-keys` | CRUD + rotação |
| Webhooks | `/webhooks` | CRUD + deliveries |

**Documentação interativa:** `/docs` (disponível apenas em `ENVIRONMENT=development`).

---

## 🎯 Roadmap

- [x] Autenticação (JWT + API Keys)
- [x] Perfis com controle de acesso (admin/gerente/vendedor)
- [x] Pipelines e stages
- [x] Leads com campos customizáveis
- [x] Deals com kanban drag-and-drop
- [x] Notas e atividades
- [x] Dashboard com métricas
- [x] Webhooks outbound (n8n)
- [ ] Notificações in-app
- [ ] Busca global (leads + deals + notas)
- [ ] Exportar CSV
- [ ] Deploy em produção

---

## 📝 Convenções

### Backend (DDD)

Cada domínio em `app/domains/<nome>/` tem:
- `entities.py` — Modelos Pydantic (entrada/saída)
- `repository.py` — Acesso ao banco
- `service.py` — Regras de negócio
- `router.py` — Endpoints HTTP

### Frontend (Next.js App Router)

- **Server Components** por padrão
- **Client Components** só quando precisa de interatividade (`"use client"`)
- **Server Actions** para mutações (`app/**/actions.ts`)
- **`apiFetch`** injeta o JWT do Supabase automaticamente

---

## 🐛 Troubleshooting

**`ModuleNotFoundError: No module named 'app'`**
- Você está fora de `backend/`. Ative o venv e entre em `backend/`.

**`pydantic-core` falha ao instalar**
- Verifique se está usando Python 3.12 (não 3.13+).

**`Token inválido ou expirado`**
- O JWT expira em 1 hora. Faça login novamente.

**`Gateway Timeout` do Supabase**
- Instabilidade momentânea. Aguarde alguns segundos.

**Frontend não consegue chamar o backend**
- Confirme `NEXT_PUBLIC_API_URL` no `.env.local`.
- Confirme que o backend está rodando.

---

## 📄 Licença

Projeto privado — todos os direitos reservados.