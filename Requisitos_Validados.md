# Requisitos Funcionais
| ID    | Requisito                                                                                                                                | Prioridade |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| RF-01 | O sistema deve permitir autenticação de estudantes da UP-Maputo através de número de estudante e senha.                                  | Alta       |
| RF-02 | O sistema deve permitir que membros da Comissão de Estudantes criem e configurem eleições definindo cargos e datas das fases eleitorais. | Alta       |
| RF-03 | O sistema deve permitir a submissão de candidaturas por estudantes durante o período de candidatura definido.                            | Alta       |
| RF-04 | O sistema deve permitir que membros da Comissão de Estudantes aprovem ou rejeitem candidaturas submetidas.                               | Alta       |
| RF-05 | O sistema deve permitir que candidatos editem foto, biografia e proposta durante o período permitido antes da eleição.                   | Média      |
| RF-06 | O sistema deve bloquear automaticamente a submissão de novas candidaturas após o prazo definido.                                         | Alta       |
| RF-07 | O sistema deve bloquear automaticamente a edição de propostas e informações dos candidatos após o período de edição.                     | Alta       |
| RF-08 | O sistema deve permitir que membros da Comissão importem a lista de estudantes elegíveis para votação através de ficheiro CSV.           | Alta       |
| RF-09 | O sistema deve apresentar aos estudantes a lista de candidatos e suas propostas antes da votação.                                        | Alta       |
| RF-10 | O sistema deve permitir que estudantes (incluindo candidatos) votem em candidatos para cada cargo disponível.                            | Alta       |
| RF-11 | O sistema deve garantir o anonimato do voto separando a identidade do votante da sua escolha.                                            | Alta       |
| RF-12 | O sistema deve impedir que um estudante vote mais de uma vez para o mesmo cargo.                                                         | Alta       |
| RF-13 | O sistema deve abrir automaticamente o período de votação nas datas configuradas pela Comissão de Estudantes.                            | Alta       |
| RF-14 | O sistema deve encerrar automaticamente o período de votação após o horário definido.                                                    | Alta       |
| RF-15 | O sistema deve realizar a apuração automática dos votos após o encerramento da eleição.                                                  | Alta       |
| RF-16 | O sistema deve apresentar os resultados da eleição aos estudantes após o encerramento da votação.                                        | Alta       |
| RF-17 | O sistema deve permitir que membros da Comissão exportem os resultados da eleição em formato PDF ou Excel.                               | Média      |
| RF-18 | O sistema deve manter registo de auditoria (logs) das ações realizadas no sistema com data, hora e utilizador.                           | Alta       |
| RF-19 | O sistema deve permitir que estudantes recuperem a senha da sua conta.                                                                   | Média      |
| RF-20 | O sistema deve permitir que membros da Comissão acompanhem estatísticas de participação durante a votação.                               | Média      |

# Requisitos Não-Funcionais
| ID     | Categoria                 | Métrica / Detalhe                                                                                                         |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| RNF-01 | Segurança                 | Senhas armazenadas com hashing seguro; proteção contra SQL Injection, XSS e CSRF.                                         |
| RNF-02 | Confidencialidade do Voto | A arquitetura do sistema deve garantir a separação entre identidade do votante e o voto registado.                        |
| RNF-03 | Disponibilidade           | O sistema deve ter disponibilidade mínima de **99,5%** durante períodos eleitorais.                                       |
| RNF-04 | Tempo de Resposta         | A página de votação deve carregar em menos de **3 segundos** e o registo de voto deve ocorrer em menos de **2 segundos**. |
| RNF-05 | Usabilidade               | Interface simples que permita a estudantes votar sem necessidade de formação prévia.                          |
| RNF-06 | Escalabilidade            | O sistema deve suportar até **1000 estudantes simultâneos** sem degradação significativa de desempenho.                 |
| RNF-07 | Backup e Recuperação      | Backup automático diário com **RPO máximo de 1 hora**.                                                                    |
| RNF-08 | Auditabilidade            | Todas as ações críticas devem ser registadas com **timestamp, IP e identificação do utilizador**.                         |
| RNF-09 | Portabilidade             | O sistema deve funcionar em navegadores modernos (Chrome, Firefox, Edge e Safari – últimas duas versões).                 |
| RNF-10 | Responsividade            | A interface deve ser compatível com dispositivos móveis (smartphones e tablets).                                          |
| RNF-11 | Manutenibilidade          | O sistema deve possuir arquitetura modular e código documentado para facilitar manutenção futura.                         |
| RNF-12 | Conformidade Legal        | O sistema deve cumprir a legislação de proteção de dados aplicável em Moçambique.                                         |


