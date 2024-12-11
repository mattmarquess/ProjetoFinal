# Documentação dos Tipos de Dashboard

## 🎭 Tipos de Usuário

### 1. Doador
Usuário padrão que pode fazer doações e resgatar recompensas.

### 2. Administrador
Usuário com privilégios especiais para gerenciar o sistema.

## 📊 Dashboard do Doador

### Funcionalidades
1. **Perfil**
   - Visualizar/editar dados pessoais
   - Ver tipo sanguíneo
   - Atualizar informações de contato

2. **Doações**
   - Histórico de doações
   - Agendar nova doação
   - Ver status de agendamentos
   - Cancelar agendamentos

3. **Pontos e Recompensas**
   - Saldo de pontos
   - Catálogo de recompensas
   - Histórico de resgates
   - Resgatar nova recompensa

4. **Notificações**
   - Lembretes de doação
   - Campanhas ativas
   - Novas recompensas

## 🔑 Dashboard do Administrador

### Funcionalidades
1. **Gestão de Usuários**
   - Lista de doadores
   - Detalhes de cada doador
   - Ativar/desativar contas
   - Resetar senhas

2. **Gestão de Doações**
   - Aprovar agendamentos
   - Confirmar doações realizadas
   - Gerar relatórios
   - Ver estatísticas

3. **Gestão de Recompensas**
   - Adicionar recompensas
   - Editar/remover recompensas
   - Aprovar resgates
   - Controle de estoque

4. **Campanhas**
   - Criar campanhas
   - Gerenciar campanhas ativas
   - Enviar notificações
   - Ver métricas

## 🔒 Controle de Acesso

### Rotas Protegidas
```javascript
// Middleware de autenticação
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Não autorizado' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// Middleware de administrador
const adminMiddleware = (req, res, next) => {
    if (req.user.tipo !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
};
```

### Endpoints Específicos

#### Doador
```javascript
// Rotas do doador
router.get('/api/donations/my-history', authMiddleware, getDonationHistory);
router.post('/api/donations/schedule', authMiddleware, scheduleDonation);
router.get('/api/rewards/available', authMiddleware, getAvailableRewards);
```

#### Administrador
```javascript
// Rotas do administrador
router.get('/api/users/all', authMiddleware, adminMiddleware, getAllUsers);
router.post('/api/rewards/create', authMiddleware, adminMiddleware, createReward);
router.put('/api/donations/approve/:id', authMiddleware, adminMiddleware, approveDonation);
```

## 📱 Interface

### Dashboard Doador
```html
<div class="dashboard-doador">
    <!-- Perfil -->
    <section class="profile-section">
        <h2>Meu Perfil</h2>
        <!-- Dados do perfil -->
    </section>

    <!-- Doações -->
    <section class="donations-section">
        <h2>Minhas Doações</h2>
        <!-- Lista de doações -->
    </section>

    <!-- Recompensas -->
    <section class="rewards-section">
        <h2>Recompensas</h2>
        <!-- Catálogo de recompensas -->
    </section>
</div>
```

### Dashboard Administrador
```html
<div class="dashboard-admin">
    <!-- Gestão de Usuários -->
    <section class="users-section">
        <h2>Gestão de Usuários</h2>
        <!-- Lista de usuários -->
    </section>

    <!-- Gestão de Doações -->
    <section class="donations-management">
        <h2>Gestão de Doações</h2>
        <!-- Controles de doação -->
    </section>

    <!-- Gestão de Recompensas -->
    <section class="rewards-management">
        <h2>Gestão de Recompensas</h2>
        <!-- Controles de recompensas -->
    </section>
</div>
```

## 📊 Relatórios (Admin)

### 1. Relatórios de Doação
- Total de doações por período
- Doações por tipo sanguíneo
- Taxa de comparecimento
- Previsão de demanda

### 2. Relatórios de Usuários
- Novos cadastros
- Usuários ativos
- Ranking de doadores
- Análise demográfica

### 3. Relatórios de Recompensas
- Resgates por período
- Recompensas mais populares
- Custo x Benefício
- Estoque disponível

## 🔄 Fluxo de Trabalho

### Doador
1. Login no sistema
2. Redirecionamento para dashboard de doador
3. Acesso às funcionalidades específicas de doador
4. Sem acesso às funcionalidades administrativas

### Administrador
1. Login no sistema
2. Redirecionamento para dashboard administrativo
3. Acesso total às funcionalidades
4. Visualização de métricas e relatórios

## 📱 Responsividade

### Mobile
- Menus colapsáveis
- Cards adaptáveis
- Tabelas responsivas
- Touch-friendly

### Desktop
- Layout em grid
- Múltiplas colunas
- Dashboards expansivos
- Atalhos de teclado

## 🔔 Notificações

### Doador
- Lembretes de doação
- Novas recompensas
- Pontos adquiridos
- Campanhas

### Administrador
- Novos agendamentos
- Alertas de estoque
- Relatórios periódicos
- Atividades suspeitas
