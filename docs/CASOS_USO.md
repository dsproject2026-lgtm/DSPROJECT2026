# Diagrama de Casos de Uso
<img width="2480" height="2302" alt="UseCase_V2" src="https://github.com/user-attachments/assets/eb11e696-cfa8-4a6b-afef-1a650b2b2258" />


# Especificações Textuais dos Casos de Uso

---

## UC-01 — Autenticar no Sistema

**Nome:** Autenticar no Sistema  
**Actor Principal:** Estudante / Candidato / Administrador / Comissão Eleitoral / Fiscal

### Pré-condições
- O sistema está operacional e acessível.
- O utilizador possui conta registada no sistema.

### Pós-condições
- Sessão autenticada criada com sucesso.
- Utilizador redirecionado para o painel correspondente ao seu perfil.
- Acesso bloqueado registado no log após 3 tentativas falhadas (RF-14).

### Fluxo Principal
1. Utilizador acede à página de entrada do SiVOUP.
2. Sistema apresenta o formulário de autenticação (código/Nome do Utilizador e senha).
3. Utilizador insere o código/Nome do Utilizador de identificação e a senha.
4. Sistema valida as credenciais contra a base de dados.
5. Sistema verifica o perfil associado à conta.
6. Sistema inicia sessão e redireciona o utilizador para o painel do seu perfil.
7. Sistema regista o acesso no log de auditoria com timestamp e IP (RF-14).

### Fluxos Alternativos
**3a. Credenciais incorrectas (1.ª ou 2.ª tentativa):**
- Sistema exibe mensagem de erro genérica sem revelar qual campo está errado.
- Retorna ao passo 2.

**3b. 3.ª tentativa falhada:**
- Sistema bloqueia a conta temporariamente, exibe aviso e regista o evento no log.
- Caso de uso termina.

### Fluxos de Excepção
**4a. Base de dados indisponível:**
- Sistema exibe mensagem de erro técnico.
- Regista o erro no log. Caso de uso termina.

### Requisitos Não-Funcionais Relacionados
- **RNF-01:** Comunicação cifrada via SSL/TLS; senhas armazenadas com bcrypt.
- **RNF-03:** Autenticação concluída em menos de 2 segundos.
- **RNF-07:** Todos os acessos registados com timestamp, IP e identificação.

---

## UC-05 — Criar e Configurar Eleição

**Nome:** Criar e Configurar Eleição  
**Actor Principal:** Comissão Eleitoral da AEUP

### Pré-condições
- Membro da Comissão Eleitoral autenticado no sistema.
- Não existe eleição activa em curso para o mesmo período.

### Pós-condições
- Eleição criada e configurada com estado "Programada".
- Calendário eleitoral registado (datas de candidatura, edição e votação).
- Cargos em disputa definidos no sistema.
- Acção registada no log de auditoria.

### Fluxo Principal
1. Membro da Comissão Eleitoral acede ao menu "Gestão de Eleições".
2. Sistema apresenta o formulário de criação de eleição.
3. CE preenche: título da eleição, descrição, cargos em disputa.
4. CE define o calendário: datas de início e fim de candidatura, edição e votação.
5. CE confirma a criação.
6. Sistema valida os dados (datas não conflituantes, pelo menos um cargo definido).
7. Sistema cria a eleição com estado "Programada" e regista no log.
8. Sistema confirma a criação e apresenta o resumo da eleição.

### Fluxos Alternativos
**6a. Datas conflituantes ou inválidas (data de fim anterior à de início):**
- Sistema assinala o erro e solicita correcção.
- Retorna ao passo 4.

**6b. Nenhum cargo definido:**
- Sistema exibe aviso "Adicione pelo menos um cargo".
- Retorna ao passo 3.

### Fluxos de Excepção
**7a. Falha ao guardar na base de dados:**
- Sistema exibe mensagem de erro técnico.
- A eleição não é criada.
- Regista o erro no log.
- Caso de uso termina.

### Requisitos Não-Funcionais Relacionados
- **RNF-02:** Sistema disponível em 99,5% durante configuração de eleições.
- **RNF-03:** Gravação da eleição concluída em menos de 2 segundos.
- **RNF-07:** Auditoria completa de todas as acções de configuração.

---

## UC-08 — Registar Candidatura

**Nome:** Registar Candidatura  
**Actor Principal:** Comissão Eleitoral da AEUP

### Pré-condições
1. Membro da Comissão Eleitoral autenticado.
2. Existe uma eleição activa com período de candidatura aberto.
3. O candidato entregou a candidatura fora do sistema (presencialmente).

### Pós-condições
1. Candidatura registada no sistema com estado "Pendente".
2. Candidatura disponível para revisão e decisão pela Comissão Eleitoral.
3. Acção registada no log de auditoria com identificação do membro da Comissão Eleitoral.

### Fluxo Principal
1. Membro da Comissão Eleitoral acede ao painel de gestão de candidaturas da eleição activa.
2. Sistema apresenta a lista de candidaturas existentes e o botão "Registar nova candidatura".
3. Comissão Eleitoral clica em "Registar nova candidatura".
4. Sistema apresenta o formulário: nome completo, cargo, foto, biografia e proposta eleitoral.
5. Comissão Eleitoral preenche os dados do candidato conforme a candidatura física recebida.
6. Comissão Eleitoral submete o formulário.
7. Sistema valida os campos obrigatórios (todos preenchidos, foto presente).
8. Sistema regista a candidatura com estado "Pendente" e gera identificador único.
9. Sistema confirma o registo e actualiza a lista de candidaturas.
10. Sistema regista a acção no log de auditoria.

### Fluxos Alternativos
**7a. Campo obrigatório em falta:**
- Sistema assinala o campo em falta com mensagem clara.
- Retorna ao passo 5.

**7b. Candidato já registado para o mesmo cargo:**
- Sistema exibe aviso "Este candidato já tem candidatura para este cargo".
- Retorna ao passo 4.

**7c. Foto com formato inválido ou tamanho excedido:**
- Sistema informa o erro e solicita nova foto.
- Retorna ao passo 5.

### Fluxos de Excepção
**8a. Falha ao guardar na base de dados:**
- Sistema exibe mensagem de erro técnico.
- Candidatura não é registada.
- Regista o erro no log. Caso de uso termina.

### Requisitos Não-Funcionais Relacionados
- **RNF-01:** Dados dos candidatos armazenados de forma segura.
- **RNF-03:** Registo concluído em menos de 2 segundos.
- **RNF-07:** Todas as acções de registo auditadas com timestamp e identificação.

---

## UC-10 — Gerir Candidaturas (Comissão Eleitoral)

**Nome:** Gerir Candidaturas  
**Actor Principal:** Comissão Eleitoral da AEUP

### Pré-condições
- Membro da Comissão Eleitoral autenticado.
- Existe pelo menos uma candidatura registada no sistema.

### Pós-condições
- Estado da candidatura actualizado (aprovada, rejeitada ou suspensa).
- Candidaturas aprovadas visíveis aos estudantes na lista de votação.
- Candidaturas rejeitadas ou suspensas removidas da lista de votação.
- Cada decisão registada no log de auditoria.

### Fluxo Principal
1. Membro da Comissão Eleitoral acede ao painel de gestão de candidaturas.
2. Sistema apresenta a lista de candidaturas com estado: Pendente, Aprovada, Rejeitada ou Suspensa.
3. Comissão Eleitoral selecciona uma candidatura pendente para rever.
4. Sistema apresenta a prévia completa: foto, nome, cargo, biografia e proposta.
5. Comissão Eleitoral analisa os dados e decide: Aprovar ou Rejeitar.
6. Sistema actualiza o estado da candidatura.
7. Se aprovada: candidatura fica visível na lista pública de votação.
8. Se rejeitada: Comissão Eleitoral indica o motivo; candidatura bloqueada e não aparece na votação.
9. Sistema regista a decisão no log de auditoria com data, hora e identificação da Comissão Eleitoral.

### Fluxos Alternativos
**5a. Suspender candidatura já aprovada:**
- Comissão Eleitoral selecciona candidatura aprovada e escolhe "Suspender".
- Sistema remove a candidatura da lista de votação sem apagar os dados.
- Decisão registada no log. Retorna ao passo 2.

**5b. Nenhuma candidatura pendente:**
- Sistema exibe mensagem "Não existem candidaturas pendentes de revisão".
- Caso de uso termina.

### Fluxos de Excepção
**6a. Falha ao actualizar estado na base de dados:**
- Sistema exibe erro técnico.
- Estado não é alterado. Regista o erro no log.
- Caso de uso termina.

### Requisitos Não-Funcionais Relacionados
- **RNF-03:** Actualização de estado concluída em menos de 2 segundos.
- **RNF-07:** Todas as decisões auditadas com timestamp, IP e identificação.

---

## UC-11 — Consultar Candidatos

**Nome:** Consultar Candidatos  
**Actor Principal:** Estudante

### Pré-condições
- Estudante autenticado no sistema.
- Existe uma eleição activa com candidaturas aprovadas.

### Pós-condições
- Lista de candidatos aprovados apresentada ao estudante.
- Estudante informado sobre as opções disponíveis antes de votar.

### Fluxo Principal
1. Estudante acede ao menu "Candidatos" da eleição activa.
2. Sistema apresenta a lista de candidatos aprovados, organizada por cargo.
3. Para cada candidato, o sistema exibe: foto, nome, cargo e resumo da proposta.
4. Estudante selecciona um candidato para ver o perfil completo.
5. Sistema apresenta: foto, biografia completa e proposta eleitoral detalhada.
6. Estudante navega entre candidatos à sua escolha.

### Fluxos Alternativos
**2a. Nenhum candidato aprovado ainda:**
- Sistema exibe mensagem "Nenhum candidato disponível neste momento".
- Caso de uso termina.

**4a. Estudante decide votar directamente:**
- Sistema disponibiliza botão de acesso ao UC-12 Votar.

### Fluxos de Excepção
**2a. Falha ao carregar a lista:**
- Sistema exibe mensagem de erro técnico.
- Regista o erro no log. Caso de uso termina.

### Requisitos Não-Funcionais Relacionados
- **RNF-03:** Página de candidatos carrega em menos de 3 segundos.
- **RNF-04:** Interface acessível e legível em smartphone e computador.
- **RNF-08:** Compatível com Chrome, Firefox, Safari e Edge (últimas 2 versões).

---

## UC-12 — Votar

**Nome:** Votar  
**Actor Principal:** Estudante

### Pré-condições
- Estudante autenticado no sistema.
- Estudante consta na lista de elegíveis importada.
- O período de votação está aberto.
- Estudante ainda não votou neste cargo nesta eleição.

### Pós-condições
- Voto registado de forma anónima na base de dados.
- Identidade do votante separada da escolha — anonimato garantido.
- Estudante impossibilitado de votar novamente no mesmo cargo.
- Comprovativo digital gerado automaticamente.
- Acção registada no log com timestamp, sem revelar a escolha.

### Fluxo Principal
1. Estudante acede ao menu "Votar" da eleição activa.
2. Sistema verifica elegibilidade e confirma que o estudante ainda não votou.
3. Sistema apresenta os candidatos disponíveis para o cargo em votação.
4. Estudante selecciona o candidato da sua preferência.
5. Sistema apresenta ecrã de confirmação com o nome do candidato seleccionado.
6. Estudante confirma o voto.
7. Sistema regista o voto de forma anónima, separando identidade e escolha.
8. Sistema marca o estudante como "já votou" para este cargo.
9. Sistema gera automaticamente o comprovativo digital.
10. Sistema regista a participação no log de auditoria sem revelar a escolha.

### Fluxos Alternativos
**2a. Estudante não consta na lista de elegíveis:**
- Sistema exibe mensagem "Não está registado como elegível para esta eleição".
- Caso de uso termina.

**2b. Estudante já votou neste cargo:**
- Sistema exibe mensagem "Já exerceu o seu direito de voto neste cargo".
- Caso de uso termina.

**4a. Estudante cancela antes de confirmar:**
- Sistema retorna à lista de candidatos. Nenhum voto é registado.
- Retorna ao passo 3.

### Fluxos de Excepção
**7a. Falha ao registar o voto na base de dados:**
- Sistema exibe mensagem de erro técnico.
- O voto não é contabilizado. Estudante pode tentar novamente.
- Regista o erro no log.

**7b. Período de votação encerrado durante o processo:**
- Sistema informa que a votação foi encerrada.
- O voto não é registado. Caso de uso termina.

### Requisitos Não-Funcionais Relacionados
- **RNF-01:** Anonimato do voto garantido por separação criptográfica de identidade e escolha.
- **RNF-03:** Submissão e confirmação do voto em menos de 2 segundos.
- **RNF-04:** Processo de votação completo em menos de 3 minutos sem formação prévia.
- **RNF-05:** Suportar até 10.000 estudantes simultâneos sem degradação.

---

## UC-13 — Receber Comprovativo Digital de Voto

**Nome:** Receber Comprovativo Digital de Voto  
**Actor Principal:** Estudante
**Actores Secundários:** Sistema (geração automática)

### Pré-condições
- Voto registado com sucesso.
- Estudante autenticado e na sessão activa.

### Pós-condições
- Comprovativo digital exibido ao estudante.
- Comprovativo confirma a participação sem revelar a escolha.
- Código único de verificação gerado e associado ao comprovativo.

### Fluxo Principal
1. Imediatamente após o registo do voto, o sistema gera o comprovativo.
2. Sistema cria um código único de verificação associado à participação do estudante.
3. Sistema exibe o comprovativo com: nome do estudante, eleição, cargo, data/hora e código de verificação.
4. Sistema apresenta opção de imprimir ou guardar o comprovativo.
5. Estudante visualiza ou descarrega o comprovativo.
6. Sistema exibe mensagem: "O seu voto foi registado. Não pode ser repetido."

### Fluxos Alternativos
**4a. Estudante opta por não guardar:**
- Sistema mantém o comprovativo acessível enquanto a sessão estiver activa.

### Fluxos de Excepção
**2a. Falha na geração do comprovativo:**
- Sistema informa que o voto foi registado mas o comprovativo não pôde ser gerado.
- Estudante pode solicitar nova geração.
- O voto permanece válido.

### Requisitos Não-Funcionais Relacionados
- **RNF-01:** Comprovativo não revela a escolha do votante — anonimato preservado.
- **RNF-03:** Geração do comprovativo em menos de 2 segundos após o voto.
- **RNF-08:** Comprovativo visualizável em qualquer navegador moderno.

---

## UC-17 — Consultar Logs de Auditoria

**Nome:** Consultar Logs de Auditoria  
**Actor Principal:** Fiscal / Auditor

### Pré-condições
- Fiscal autenticado no sistema.
- Fiscal possui permissão exclusiva de leitura — não pode alterar dados.
- Existem registos de auditoria no sistema.

### Pós-condições
- Logs de auditoria apresentados ao fiscal.
- Nenhum dado foi alterado — acesso apenas de leitura.
- Acesso do fiscal ao log registado no próprio log de auditoria.

### Fluxo Principal
1. Fiscal acede ao menu "Auditoria" no painel do sistema.
2. Sistema apresenta a lista de eventos registados com filtros disponíveis.
3. Fiscal aplica filtros: por data, por tipo de evento ou por utilizador.
4. Sistema retorna a lista filtrada de eventos com: data/hora, tipo de acção, identificação do utilizador e endereço IP.
5. Fiscal selecciona um evento para ver os detalhes completos.
6. Sistema apresenta o detalhe do evento sem opções de edição.
7. Fiscal pode exportar os logs para revisão externa.

### Fluxos Alternativos
**3a. Nenhum resultado com os filtros aplicados:**
- Sistema exibe "Nenhum evento encontrado para os critérios seleccionados".
- Fiscal pode limpar os filtros e tentar novamente.

**7a. Exportação dos logs:**
- Sistema gera ficheiro com os registos filtrados.
- Fiscal descarrega o ficheiro.
- Exportação registada no log.

### Fluxos de Excepção
**4a. Falha ao carregar os logs:**
- Sistema exibe mensagem de erro técnico.
- Regista o erro internamente.
- Caso de uso termina.

### Requisitos Não-Funcionais Relacionados
- **RNF-07:** Todos os eventos registados com timestamp, IP e identificação — imutáveis.
- **RNF-02:** Logs acessíveis em 99,5% do tempo durante períodos eleitorais.
- **RNF-03:** Lista de logs carregada em menos de 3 segundos.
