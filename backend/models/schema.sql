-- Tabela de Usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL DEFAULT 'usuario', -- 'admin' ou 'usuario'
    token_confirmacao VARCHAR(255),
    reset_token VARCHAR(255),
    email_confirmado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Doadores
CREATE TABLE doadores (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo_sanguineo VARCHAR(5) NOT NULL,
    peso DECIMAL(5,2),
    altura DECIMAL(5,2),
    ultima_doacao DATE,
    apto_doar BOOLEAN DEFAULT TRUE,
    pontos INTEGER DEFAULT 0
);

-- Tabela de Eventos
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    data_evento TIMESTAMP NOT NULL,
    local VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Recompensas
CREATE TABLE recompensas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    pontos_necessarios INTEGER NOT NULL,
    quantidade_disponivel INTEGER DEFAULT -1,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela de Resgate de Recompensas
CREATE TABLE resgates (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    recompensa_id INTEGER REFERENCES recompensas(id),
    data_resgate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pontos_gastos INTEGER NOT NULL
);

-- Tabela de Alertas de Sangue
CREATE TABLE alertas_sangue (
    id SERIAL PRIMARY KEY,
    tipo_sanguineo VARCHAR(5) NOT NULL,
    mensagem TEXT NOT NULL,
    urgencia INTEGER DEFAULT 1, -- 1: baixa, 2: média, 3: alta
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela de Mensagens do Chatbot
CREATE TABLE chatbot_mensagens (
    id SERIAL PRIMARY KEY,
    pergunta TEXT NOT NULL,
    resposta TEXT NOT NULL,
    categoria VARCHAR(50) -- acessibilidade, duvidas, etc
);
