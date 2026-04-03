# Arquitetura do Sistema de Votação Online 

## RF Seleccionados para o MVP

| RF ID | Nome do RF                             | Justificativa para MVP                                                                                                                 |
| ----- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| RF01  | Autenticação de Utilizadores           | Essencial para garantir que apenas estudantes elegíveis tenham acesso ao sistema e possam participar na votação.                       |
| RF02  | Criação e Configuração de Eleições     | Permite à Comissão Eleitoral definir cargos e datas da eleição, tornando possível organizar o processo eleitoral dentro da plataforma. |
| RF06  | Visualização de Candidatos e Propostas | Necessário para que os estudantes conheçam os candidatos e as suas propostas antes de exercer o voto.                                  |
| RF07  | Registo de Voto                        | Representa a funcionalidade central do sistema, permitindo que os estudantes votem nos candidatos para cada cargo disponível.          |
| RF09  | Prevenção de Voto Duplicado            | Garante a integridade e a justiça do processo eleitoral, impedindo que um estudante vote mais de uma vez.                              |
| RF12  | Apuração Automática dos Votos          | Permite calcular os resultados da eleição de forma rápida e automática após o encerramento da votação.                                 |

---

## Padrão Arquitectónico

Padrão: **Arquitectura em Camadas (Layered Architecture)**.
---

## Stack Tecnológica

| Camada/Componente | Tecnologia Escolhida | Justificativa                                                                                        |
| ----------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| Frontend          | React.js             | Interface reactiva com componentes reutilizáveis; equipa já domina, reduzindo curva de aprendizagem. |
| Backend           | Node.js + Express    | Mesma linguagem do frontend (JavaScript), leve, simples e com grande comunidade.                     |
| Base de Dados     | PostgreSQL           | Robusto, relacional, garante integridade e consistência dos votos.                                   |
| Autenticação      | JWT + bcrypt         | Segurança moderna com sessões stateless e hashing seguro de palavras-passe.                          |
| Tempo Real        | Socket.IO            | Actualização de resultados em tempo real sem reload.                                                 |
| Relatórios        | PDFKit + ExcelJS     | Geração de relatórios directamente no servidor.                                                      |
| Hosting/Deploy    | Servidor do CIUP     | Sistema interno da Universidade Pedagógica de Maputo.                                                |



## 🖼️ Diagrama da Arquitectura

![Arquitectura](./arquitetura.png)



## 🖼️ Diagrama de Casos de Uso

![Casos de Uso](./casos_de_uso.png)



## 💡 Justificativa das Escolhas

O sistema adopta uma arquitectura em camadas, pois este padrão permite organizar o sistema em níveis bem definidos, facilitando a separação de responsabilidades e a manutenção do código. Permite implementar de forma clara funcionalidades essenciais do MVP, como autenticação de utilizadores (RF-01), configuração de eleições pela comissão eleitoral (RF-02), visualização de candidatos (RF-06), votação online (RF-07), garantia de anonimato do voto (RF-08), prevenção de voto duplicado (RF-09) e apuração automática dos votos com actualização em tempo real (RF-12).
A escolha deste padrão também considera as competências da equipa, que já domina as tecnologias seleccionadas, nomeadamente React.js, Node.js, Express, PostgreSQL e Socket.IO, reduzindo a curva de aprendizagem e permitindo um desenvolvimento mais eficiente. Além disso, a arquitectura em camadas facilita a divisão de tarefas entre os membros da equipa, o que ajuda a cumprir o cronograma do projecto. Por fim, esta solução contribui para mitigar alguns riscos identificados, como R02 (tecnologia complexa para a equipa), R03 (atrasos no desenvolvimento), R05 (falta de experiência da equipa) e R07 (perda de código), através do uso de tecnologias bem documentadas e da utilização do GitHub para controlo de versões e backup do código.



