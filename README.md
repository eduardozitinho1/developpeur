# Développeur

Plataforma de compartilhamento de snippets com React, Vite, Monaco Editor, FastAPI, SQLAlchemy e PostgreSQL no Supabase. A interface está em português, com busca e filtros locais, coleção salva, curtidas, autenticação, publicação de snippets e editor com syntax highlighting.

## Estrutura

- `frontend/`: aplicação React responsiva e editor Monaco.
- `backend/`: API FastAPI, autenticação JWT, hash Argon2, endpoints de snippets e persistência PostgreSQL.
- `backend/schema.sql`: esquema completo do banco Supabase, índices e trigger de atualização.
- `render.yaml`: blueprint de implantação da API e do frontend no Render.

## Rodar localmente

Requisitos: Node.js 20+, Python 3.12+ e um PostgreSQL acessível.

### 1. Banco Supabase

No painel Supabase, abra **SQL Editor**, crie uma query, cole o conteúdo de `backend/schema.sql` e execute. Em **Project Settings → Database**, copie a connection string PostgreSQL. Prefira a connection string de sessão/IPv4 quando o ambiente de destino não suportar IPv6. Substitua a senha e mantenha as credenciais fora do Git.

### 2. API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edite `backend/.env` com `DATABASE_URL`, `JWT_SECRET` e `FRONTEND_ORIGINS`. Gere um segredo forte com `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Para desenvolvimento, defina `ENVIRONMENT=development`. Inicie a API:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

A verificação de saúde fica em `http://localhost:8000/health`. A documentação OpenAPI fica em `http://localhost:8000/docs` apenas fora de produção.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Defina `VITE_API_URL=http://localhost:8000/api` em `frontend/.env` e abra `http://localhost:5173`.

## Implantar no Render

1. Envie esta pasta para um repositório Git.
2. No Render, selecione **New → Blueprint** e conecte o repositório que contém `render.yaml`.
3. No serviço `developpeur-api`, configure `DATABASE_URL` com a connection string PostgreSQL do Supabase. A aplicação aceita `postgresql://` e `postgres://` e normaliza o driver para psycopg 3.
4. Em `FRONTEND_ORIGINS`, informe a origem pública exata do frontend, por exemplo `https://developpeur-web.onrender.com`, sem barra final.
5. No serviço `developpeur-web`, configure `VITE_API_URL` como a URL pública da API seguida de `/api`, por exemplo `https://developpeur-api.onrender.com/api`.
6. Execute `backend/schema.sql` no SQL Editor do Supabase antes de testar as rotas. O segredo JWT é gerado pelo blueprint; não o publique.
7. Faça deploy e confira `/health` da API.

O frontend é uma aplicação estática e usa rewrite para suportar rotas do React Router. Variáveis `VITE_*` são embutidas durante o build, portanto a URL da API precisa estar configurada antes da compilação. Não coloque credenciais do banco ou segredos JWT no frontend.

## Recursos da API

| Método   | Rota                      | Acesso                            |
| -------- | ------------------------- | --------------------------------- |
| `GET`    | `/health`                 | Público                           |
| `POST`   | `/api/auth/register`      | Público                           |
| `POST`   | `/api/auth/login`         | Público                           |
| `GET`    | `/api/auth/me`            | Autenticado                       |
| `GET`    | `/api/snippets`           | Público, apenas snippets públicos |
| `POST`   | `/api/snippets`           | Autenticado                       |
| `GET`    | `/api/snippets/{id}`      | Público, apenas snippets públicos |
| `PATCH`  | `/api/snippets/{id}`      | Autor do snippet                  |
| `DELETE` | `/api/snippets/{id}`      | Autor do snippet                  |
| `POST`   | `/api/snippets/{id}/like` | Autenticado                       |
| `GET`    | `/api/users/{username}`   | Público                           |

A listagem aceita `q`, `language`, `tag`, `author`, `sort` (`trending`, `newest`, `popular`), `limit` e `offset`. Senhas são armazenadas com Argon2; tokens são JWT assinados com HS256; os endpoints de edição e exclusão validam a propriedade do snippet. Os limites de payload são validados por Pydantic.

## Notas operacionais

- Os cards de demonstração vistos ao abrir o site são conteúdo local de demonstração e não são gravados no PostgreSQL. A API retorna snippets reais assim que houver registros no banco.
- A coleção salva fica no navegador. As curtidas persistidas são registradas no banco quando a API está conectada; o estado visual local é otimista.
- O esquema usa recursos específicos do PostgreSQL (`VARCHAR[]`, GIN e `plpgsql`), compatíveis com Supabase.
- Configure limites de uso, proteção contra abuso e monitoramento antes de abrir inscrições publicamente em grande escala. O Render e o Supabase podem gerar custos conforme o plano e o uso.
