# Requisitos Funcionais e Não-Funcionais — SiVOUP
**Sistema de Votação Online da Universidade Pedagógica · AEUP · UP-Maputo · 2026**

---

## Requisitos Funcionais (RF)

| ID | Requisito | Prioridade |
|---|---|---|
| **RF-01** | O sistema deve permitir autenticação de estudantes da UP-Maputo através de número de estudante e senha. | Alta |
| **RF-02** | O sistema deve permitir que membros da Comissão Eleitoral da AEUP criem e configurem eleições, definindo cargos e datas das fases eleitorais. | Alta |
| **RF-03** | O sistema deve permitir que candidatos editem foto, biografia e proposta durante o período permitido antes da eleição. | Média |
| **RF-04** | O sistema deve bloquear automaticamente a edição de propostas e informações dos candidatos após o período de edição. | Alta |
| **RF-05** | O sistema deve permitir que o Administrador importe a lista de estudantes elegíveis para votação através de ficheiro CSV. | Alta |
| **RF-06** | O sistema deve apresentar aos estudantes a lista de candidatos e as suas propostas antes da votação. | Alta |
| **RF-07** | O sistema deve permitir que estudantes votem em candidatos para cada cargo disponível. | Alta |
| **RF-08** | O sistema deve garantir o anonimato do voto, separando a identidade do votante da sua escolha. | Alta |
| **RF-09** | O sistema deve impedir que um estudante vote mais de uma vez. | Alta |
| **RF-10** | O sistema deve abrir automaticamente o período de votação nas datas configuradas pela Comissão Eleitoral da AEUP. | Alta |
| **RF-11** | O sistema deve encerrar automaticamente o período de votação após o horário definido. | Alta |
| **RF-12** | O sistema deve realizar a apuração automática dos votos após o encerramento da eleição. | Alta |
| **RF-13** | O sistema deve permitir que membros da Comissão Eleitoral exportem os resultados da eleição em formato PDF ou Excel. | Média |
| **RF-14** | O sistema deve manter registo de auditoria (logs) das acções realizadas no sistema com data, hora e identificação do utilizador. | Alta |
| **RF-15** | O sistema deve permitir que estudantes recuperem a senha da sua conta. | Média |
| **RF-16** | O sistema deve permitir que membros da Comissão Eleitoral acompanhem estatísticas de participação durante a votação. | Média |
| **RF-17** | O sistema deve permitir que o Administrador crie conta dos fiscais e membros da Comissão Eleitoral. | Alta |
| **RF-18** | O sistema deve gerar comprovativo digital de votação. | Média |
---

## Requisitos Não-Funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| **RNF-01** | Segurança | Comunicação cifrada via SSL/TLS; senhas armazenadas com hashing bcrypt (mínimo 12 rounds); protecção obrigatória contra SQL injection, XSS e CSRF. |
| **RNF-02** | Disponibilidade | 99,5% de disponibilidade durante períodos eleitorais activos; manutenção programada fora do horário eleitoral com aviso mínimo de 24 horas. |
| **RNF-03** | Tempo de resposta | Página de votação carrega em menos de 3 segundos; submissão e confirmação de voto concluídas em menos de 2 segundos em condições normais de rede. |
| **RNF-04** | Usabilidade | Qualquer estudante da UP-Maputo deve conseguir completar o processo de votação em menos de 3 minutos, sem ajuda e sem formação prévia; texto legível com cores contrastantes; erros em linguagem simples e clara; interface funcional tanto em smartphone como em computador. |
| **RNF-05** | Escalabilidade | Suportar até 10.000 estudantes simultâneos da UP-Maputo sem degradação de performance. |
| **RNF-06** | Backup e recuperação | Backup automático diário; RPO (Recovery Point Objective) de 1 hora. |
| **RNF-07** | Auditabilidade | Todos os eventos registados com timestamp, IP e identificação do utilizador. |
| **RNF-08** | Portabilidade | Funcionamento nos navegadores modernos (Chrome, Firefox, Safari, Edge — últimas 2 versões). |
| **RNF-09** | Manutenibilidade | Código documentado, arquitectura modular, cobertura mínima de 70% por testes automatizados. |

---
