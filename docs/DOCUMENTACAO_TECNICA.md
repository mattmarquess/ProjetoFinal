# Documentação Técnica - Sistema de Banco de Sangue

## 🔧 Arquitetura do Sistema

### 1. Visão Geral
O sistema utiliza uma arquitetura cliente-servidor com as seguintes tecnologias:
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: Node.js com Express
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (JSON Web Tokens)

### 2. Estrutura do Projeto

```
projeto/
├── assets/
│   ├── css/
│   ├── js/
│   └── img/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── docs/
└── pages/
```

### 3. Componentes Principais

#### 3.1 Backend (Node.js + Express)

##### Dependências Principais
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

##### Estrutura do Banco de Dados
```sql
-- Principais Tabelas
usuarios
doadores
eventos
recompensas
resgates
```

##### APIs Disponíveis

###### Autenticação
- POST /api/users/register
- POST /api/users/login
- GET /api/users/profile
- PUT /api/users/profile

###### Doações
- POST /api/donations/schedule
- GET /api/donations/history
- PUT /api/donations/confirm

###### Recompensas
- GET /api/rewards
- POST /api/rewards/redeem
- GET /api/rewards/history

### 4. Configuração do Ambiente

#### 4.1 Requisitos
- Node.js 14+
- PostgreSQL 12+
- npm ou yarn

#### 4.2 Variáveis de Ambiente (.env)
```env
PORT=5000
DB_USER=usuario_postgres
DB_HOST=localhost
DB_NAME=banco_sangue
DB_PASSWORD=senha_postgres
DB_PORT=5432
JWT_SECRET=chave_secreta
```

#### 4.3 Instalação
```bash
# Instalar dependências
cd backend
npm install

# Configurar banco de dados
psql -U postgres
CREATE DATABASE banco_sangue;
\c banco_sangue
\i models/schema.sql

# Iniciar servidor
npm run dev
```

### 5. Segurança

#### 5.1 Autenticação
- JWT para gerenciamento de sessões
- Senhas criptografadas com bcrypt
- Middleware de autenticação para rotas protegidas

#### 5.2 Banco de Dados
- Prepared Statements para prevenção de SQL Injection
- Validação de dados de entrada
- Transações para operações críticas

### 6. Frontend

#### 6.1 Estrutura
- HTML5 semântico
- CSS3 com flexbox/grid
- JavaScript modular
- API REST para comunicação com backend

#### 6.2 Responsividade
- Design adaptativo para diferentes dispositivos
- Breakpoints principais: 768px, 1024px
- Imagens otimizadas

### 7. Manutenção

#### 7.1 Logs
- Winston para logging no backend
- Registros de erros e atividades importantes
- Rotação de logs configurada

#### 7.2 Backup
- Backup diário do banco de dados
- Retenção de 30 dias
- Procedimento de restauração documentado

### 8. Performance

#### 8.1 Backend
- Conexão pooling com banco de dados
- Caching de consultas frequentes
- Compressão gzip ativada

#### 8.2 Frontend
- Minificação de assets
- Lazy loading de imagens
- Cache de API configurado

### 9. Monitoramento

#### 9.1 Métricas
- Tempo de resposta das APIs
- Taxa de erro
- Uso de recursos do servidor

#### 9.2 Alertas
- Notificação por email para erros críticos
- Monitoramento de disponibilidade
- Alertas de segurança

### 10. Testes

#### 10.1 Backend
```bash
# Executar testes
npm run test

# Cobertura de código
npm run coverage
```

#### 10.2 Frontend
- Testes de integração
- Testes de responsividade
- Testes de usabilidade

### 11. Deploy

#### 11.1 Produção
```bash
# Build
npm run build

# Start
npm start
```

#### 11.2 Ambiente
- Node.js em modo produção
- PM2 para gerenciamento de processos
- Nginx como proxy reverso

### 12. Suporte

#### 12.1 Contatos
- Suporte Técnico: suporte@bancosangue.com
- Emergência: (11) 99999-9999

#### 12.2 SLA
- Tempo de resposta: 2 horas
- Resolução de problemas críticos: 4 horas
- Disponibilidade: 99.9%
