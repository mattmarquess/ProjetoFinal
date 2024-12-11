# Banco de Sangue - Sistema de Gerenciamento de Doações

Sistema web para gerenciamento de doações de sangue, desenvolvido com Node.js e PostgreSQL.

## 🎨 Paleta de Cores
- Preto: #000000
- Vermelho: #C30000
- Branco: #FFFFFF

## 🚀 Funcionalidades

- Cadastro e autenticação de usuários
- Perfil de doador com tipo sanguíneo
- Sistema de pontos e recompensas
- Gerenciamento de eventos de doação
- Histórico de doações

## 🛠 Tecnologias

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Banco de Dados: PostgreSQL
- Autenticação: JWT

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- PostgreSQL (v12 ou superior)
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/banco-sangue.git
cd banco-sangue
```

2. Instale as dependências do backend
```bash
cd backend
npm install
```

3. Configure o banco de dados
- Crie um banco de dados PostgreSQL
- Execute o script SQL em `backend/models/schema.sql`

4. Configure as variáveis de ambiente
- Copie o arquivo `.env.example` para `.env`
- Preencha as variáveis com suas configurações

5. Inicie o servidor
```bash
npm run dev
```

6. Acesse o sistema
- Abra o arquivo `index.html` no navegador

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Adicione suas mudanças (`git add .`)
4. Comite suas mudanças (`git commit -m 'Add some AmazingFeature'`)
5. Faça o Push da Branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request
