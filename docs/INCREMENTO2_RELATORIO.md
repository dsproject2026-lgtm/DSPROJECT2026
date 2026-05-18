# Relatorio do Segundo Incremento

## 1. Contexto

Este documento descreve as funcionalidades implementadas e corrigidas no segundo incremento do projecto SiVOUP. O foco principal foi tornar o sistema mais funcional com dados reais, corrigir permissões por perfil, melhorar a gestão eleitoral, criar a área do candidato, reforçar auditoria, ajustar dashboards e remover comportamentos estáticos do front-end.

## 2. Funcionalidades Implementadas

### 2.1 Gestão de faculdades e cursos

- O registo de faculdades e cursos foi transferido para o perfil de administrador.
- A comissão eleitoral deixou de ter o botão/área de gestão de faculdades.
- Foram adicionadas rotas e serviços para listar, criar faculdades e adicionar cursos.
- As eleições podem ser associadas a uma faculdade, permitindo restringir os eleitores elegíveis ao âmbito correcto.

### 2.2 Gestão de equipa eleitoral

- Foi criada a tabela `team` para guardar membros da equipa administrativa/eleitoral.
- A equipa passa a ser persistida na base de dados, em vez de ficar apenas no front-end.
- Foram contemplados os perfis:
  - Gestor eleitoral / comissão.
  - Fiscal / auditor.
- O código do membro é gerado automaticamente.
- A senha inicial é tratada por fluxo de primeiro acesso via email.
- O estado do membro pode ser activado ou desactivado.

### 2.3 Eleições

- A criação, edição e eliminação de eleições ficou restrita ao gestor eleitoral.
- O administrador apenas consulta eleições e os respectivos detalhes.
- A visualização de eleições da comissão voltou ao formato em tabela, com acções funcionais.
- O dashboard da comissão mantém os cards e mostra apenas eleições recentes.
- Foi criada uma página própria de consulta de eleições para o administrador.
- O detalhe da eleição no administrador ficou em modo somente leitura.
- A alteração automática do estado das eleições foi reforçada:
  - Programada para aberta quando chega o início da votação.
  - Aberta para concluída quando chega o fim da votação.
- Eleições abertas não podem ser editadas nem eliminadas.

### 2.4 Importação e gestão de eleitores

- A importação de eleitores por CSV foi ajustada para funcionar como upload/importação de dados.
- Foi criado um ficheiro de exemplo em `docs/exemplo-eleitores.csv`.
- Ao criar uma eleição com faculdade alvo, o sistema importa automaticamente apenas os estudantes dessa faculdade.
- A importação evita duplicações de eleitores já associados à eleição.
- Eleitores fora da faculdade seleccionada são rejeitados na importação.
- O login de primeiro acesso é enviado por email quando necessário.
- Caso o eleitor já tenha configurado a senha, o sistema não força novo primeiro acesso.

### 2.5 Candidatos

- Foi criada a tela própria do candidato.
- A tela só aparece para utilizadores com perfil de candidato.
- O candidato pode preencher e actualizar os seus dados de candidatura:
  - Foto.
  - Biografia.
  - Proposta / programa eleitoral.
  - Outros dados associados à candidatura.
- O nome completo não é alterável pelo candidato.
- O upload da foto do candidato foi suportado.
- A edição dos dados do candidato fica bloqueada quando o período de candidatura não está aberto.
- O candidato é associado a uma eleição, e a comissão não preenche esses dados por ele.

### 2.6 Votação e resultados

- Foi corrigido o problema de erro `403` ao consultar o estado de voto quando o utilizador não era elegível.
- A resposta de estado de voto passou a indicar se o utilizador é elegível.
- A página de resultados passou a ser reutilizada por diferentes perfis.
- Resultados funcionam para:
  - Comissão / gestor eleitoral.
  - Administrador.
  - Fiscal / auditor.
  - Eleitor / candidato.
- Na tela de resultados, o utilizador selecciona a eleição e vê os resultados dessa eleição.
- Os relatórios de resultados usam dados reais da API.

### 2.7 Auditoria

- Foi criada a API de auditoria.
- A auditoria passou a ler registos reais da base de dados.
- A página de auditoria do administrador é a mesma utilizada pelo fiscal.
- A auditoria permite seleccionar uma eleição e consultar apenas os registos associados.
- Foi adicionada exportação de logs em CSV.
- Foram registadas acções reais do sistema, incluindo:
  - Login concluído.
  - Primeiro acesso concluído.
  - Alteração/redefinição de senha.
  - Criação, actualização e eliminação de eleições.
  - Registo, actualização, aprovação, rejeição, suspensão e eliminação de candidatos.
  - Importação de eleitores.
  - Voto registado.
  - Criação e alteração de estado de membros da equipa.

### 2.8 Dashboards com dados reais

- O painel de controlo do administrador deixou de usar dados fixos.
- O painel do administrador mostra dados reais de:
  - Eleições.
  - Eleições abertas.
  - Equipa activa.
  - Registos de auditoria.
  - Eleições recentes.
- O painel de controlo do fiscal deixou de usar dados fixos.
- O painel do fiscal mostra dados reais de:
  - Eleições.
  - Eleições em curso.
  - Votos registados.
  - Registos de auditoria.
  - Auditoria recente.

### 2.9 Permissões por perfil

- O administrador pode gerir faculdades, cursos, cargos, equipa e consultar eleições.
- O administrador não cria, edita nem elimina eleições.
- O gestor eleitoral cria, edita e elimina eleições quando permitido.
- O gestor eleitoral gere candidatos e eleitores elegíveis.
- O auditor/fiscal consulta auditoria, relatórios e resultados.
- O eleitor vota e consulta resultados.
- O candidato tem acesso à sua própria área de candidatura.

### 2.10 Reutilização de páginas e rotas

- Páginas repetidas entre administrador e comissão foram reduzidas.
- As páginas de candidatos e eleitores do administrador passaram a reutilizar as páginas da comissão.
- Os separadores de `Registar` e `Visualizar` passaram a respeitar o contexto da rota:
  - `/admin/...` quando o utilizador está no painel de administrador.
  - `/comissao/...` quando o utilizador está no painel da comissão.
- Foi corrigido o problema em que clicar em eleições no administrador podia redireccionar para login por navegação incorrecta.

### 2.11 Layout e responsividade

- O layout do eleitor foi melhorado para computador.
- Foi reduzida a duplicação visual de logótipo entre header e sidebar no modo desktop.
- O conteúdo principal do eleitor recebeu melhor organização em ecrãs maiores.
- A área de candidatura do candidato foi reorganizada para desktop.
- A lista de eleições no painel do eleitor foi adaptada para melhor uso do espaço.

## 3. Principais Areas Alteradas

### Backend

- Modelos e migrations Prisma:
  - Faculdades e cursos.
  - Escopo de eleição por faculdade.
  - Equipa (`team`).
  - Candidato associado ao utilizador.
  - Auditoria.
- Controllers:
  - Autenticação.
  - Eleições.
  - Candidatos.
  - Eleitores elegíveis.
  - Votação.
  - Auditoria.
  - Faculdades.
  - Equipa.
- Services e repositories:
  - Regras de negócio para eleições.
  - Importação automática de eleitores.
  - Persistência de membros da equipa.
  - Registo e consulta de auditoria.

### Frontend

- Novas/alteradas páginas de:
  - Dashboard do administrador.
  - Eleições do administrador.
  - Dashboard do fiscal.
  - Auditoria.
  - Relatórios.
  - Resultados.
  - Tela do candidato.
  - Lista de eleições da comissão.
  - Detalhe de eleição.
  - Faculdades e cursos.
- API client actualizado para:
  - Auditoria.
  - Equipa.
  - Faculdades.
  - Candidaturas do candidato.
  - Eleições e resultados.

## 4. Correcções de Erros

- Corrigido erro TypeScript entre `CreateElectionInput` e `UpdateElectionInput`.
- Corrigido erro `403 Forbidden` em consulta de estado de voto.
- Corrigido erro na consulta de resultados.
- Corrigido redireccionamento indevido para login ao navegar em rotas do administrador.
- Corrigidas páginas com dados estáticos em dashboards.
- Corrigidas permissões inconsistentes entre perfis.
- Corrigidos problemas de navegação em separadores reutilizados.
- Corrigidos erros de build e typecheck após as alterações.

## 5. Validação Técnica

Foram executadas as seguintes verificações:

```bash
npm.cmd run typecheck
```

Executado no frontend com sucesso.

```bash
npm.cmd run build
```

Executado no backend com sucesso.

## 6. Resultado do Incremento

O segundo incremento deixou o sistema mais próximo de um fluxo completo e funcional:

- Dados reais substituíram dados estáticos nos pontos críticos.
- Os perfis têm permissões mais coerentes.
- Auditoria e relatórios passaram a ter base real.
- Candidatos, eleitores, eleições e resultados ficaram integrados.
- O administrador, comissão, fiscal, eleitor e candidato têm rotas e responsabilidades mais bem separadas.
- O projecto ficou preparado para validação funcional com base de dados real e cenários de teste.

