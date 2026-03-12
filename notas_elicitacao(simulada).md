

| | |
|---|---|
| **Entrevistado** | Mércio dos Santos — Coordenador da AEUP |
| **Entrevistadora** | Ashley Malate — Desenvolvedora de Software |
| **Contexto** | Levantamento de requisitos para o SVOUP — Sistema de Votação Online da Universidade Pedagógica |

---

## 1. O Que o Utilizador Faz — Tarefas e Fluxos Principais

A partir da entrevista, foi possível mapear o fluxo actual que a AEUP segue para realizar uma eleição. Todo o processo é manual e envolve múltiplos actores, longos prazos e recursos físicos consideráveis.

### 1.1 Fluxo Actual da Eleição (Processo Manual)

| Fase | O que fazem hoje | Tempo gasto |
|---|---|---|
| **Preparação** | Planeamento, impressão de boletins, montagem de urnas físicas, organização da comitiva. | 1 a 1,5 meses |
| **Divulgação** | Informação aos estudantes por meios informais — presencial e cartazes. Sem canal digital. | Incluído na preparação |
| **Dia da votação** | Estudantes votam presencialmente depositando boletins em urnas. Comitiva gere o processo. | O dia todo |
| **Contagem** | Contagem manual dos boletins. Sem tempo definido — termina quando acabam os boletins. | Indefinido |
| **Publicação** | Anúncio verbal ou por cartaz. Sem registo digital dos resultados. | Após contagem |

---

### 1.2 Tarefas dos Actores Identificados

####  Coordenador / Administrador da AEUP
- Decide quando e como se realiza a eleição
- Organiza e coordena toda a logística do processo
- Define candidatos e cargos em disputa
- Supervisiona a contagem e valida os resultados
- Anuncia os resultados à comunidade estudantil

#### Estudante Votante
- Desloca-se ao local de votação no dia marcado
- Recebe o boletim, selecciona o candidato e deposita na urna
- Aguarda o anúncio dos resultados sem qualquer comprovativo

####  Membro da Comitiva (fiscal / apoio)
- Apoia na gestão do fluxo de votantes no dia
- Participa na contagem manual dos votos
- Não tem papel formal nem registo das suas acções

> *"Organizar levava-me cerca de uma semana... podemos dizer que em torno de um mês, um mês e meio só a organizar e o processo de votação geralmente levava o dia todo."*
> — Mércio dos Santos, Coordenador da AEUP

---

## 2. O Que o Sistema Precisa Suportar — Funcionalidades Necessárias

As funcionalidades abaixo foram derivadas directamente das necessidades expressas durante a entrevista. Cada item responde a uma dor ou expectativa concreta.

### 2.1 Funcionalidades Essenciais — `Must`

| Funcionalidade | Necessidade que responde | Origem na entrevista |
|---|---|---|
| Criação e configuração de eleições | Substituir o processo manual que demora 1 a 1,5 meses. | *"o processo é demorado, é custoso"* |
| Autenticação dos estudantes | Garantir que apenas estudantes elegíveis votam, sem presença física. | *"não era necessário estarem presentes"* |
| Votação anónima online | Votar a partir de qualquer lugar, eliminando deslocação e logística. | *"de casa as pessoas poderiam votar"* |
| Voto único por estudante | Impedir duplicação — hoje impossível de controlar manualmente. | *"falhas elaboradas... dar vantagem a um candidato"* |
| Apuração automática em tempo real | Eliminar a contagem manual sem tempo definido e sujeita a erros. | *"não tínhamos um tempo definido"* |
| Publicação imediata dos resultados | Resultados em menos de 1 hora após fecho — como viram na referência. | *"até as 19 já tinham resultados"* |
| Registo imutável de votos | Nenhum voto pode ser alterado após submissão — transparência total. | *"uma vez adicionadas, não podem ser alteradas"* |

---

### 2.2 Funcionalidades de Suporte — `Should` / `Could`

| Funcionalidade | Necessidade que responde | Prioridade |
|---|---|---|
| Painel de gestão para o administrador | Controlo centralizado sobre o processo eleitoral. | `Should` |
| Notificações aos estudantes | Divulgação automática — hoje feita de forma informal. | `Should` |
| Exportação de relatórios (PDF / Excel) | Registo oficial dos resultados para arquivo institucional. | `Should` |
| Fiscais com acesso de leitura | Substituir a comitiva física por fiscais digitais remotos. | `Should` |
| Interface simples para utilizadores sem experiência digital | O coordenador pediu explicitamente — *"fácil integração para os nossos trabalhadores"*. | `Must` |
| Comprovativo de voto para o estudante | Dar confiança ao votante de que o seu voto foi registado. | `Could` |

> *"Espero que o sistema seja adaptável à nossa realidade e que a mudança analógica possa ser de fácil integração para os nossos trabalhadores."*
> — Mércio dos Santos, Coordenador da AEUP

---

## 3. Restrições e Excepções — Regras de Negócio e Casos Especiais

### 3.1 Restrições de Negócio

| Restrição | Descrição | Impacto no sistema |
|---|---|---|
| Voto único e irreversível | Cada estudante vota uma vez por cargo. Após submissão, não pode alterar nem cancelar. | Controlo de voto duplicado obrigatório; registo imutável. |
| Anonimato garantido | Ninguém — incluindo o administrador — pode saber em quem um estudante votou. | Separação técnica entre identidade do votante e conteúdo do voto. |
| Acesso restrito por eleição activa | Só é possível votar dentro do período definido. Fora desse período, o sistema bloqueia. | Controlo automático de abertura e encerramento por data/hora. |
| Apenas estudantes elegíveis | Só estudantes da UP-Maputo com registo activo podem votar. | Lista de elegíveis importada e validada antes da eleição. |
| Resultados só após encerramento | Resultados não visíveis durante a votação para não influenciar escolhas. | Publicação automática apenas após encerramento oficial. |
| Sem integração com sistemas externos | A AEUP não opera qualquer sistema digital. O SVOUP deve funcionar de forma autónoma. | Sistema independente, sem dependência de infraestrutura existente. |

---

### 3.2 Excepções e Casos Especiais

| Excepção | Cenário | Como o sistema deve responder |
|---|---|---|
| Estudante esquece a senha | Estudante não consegue aceder à votação. | Fluxo de recuperação por e-mail ou código com prazo de expiração. |
| Eleição encerrada antes de votar | Estudante tenta votar depois do prazo. | Mensagem clara a informar o encerramento e a data de publicação dos resultados. |
| Tentativas de acesso falhadas repetidamente | Alguém tenta adivinhar a senha de outro estudante. | Bloqueio após 3 tentativas falhadas; notificação ao administrador. |
| Empate entre candidatos | Dois ou mais candidatos com o mesmo número de votos. | Sistema sinaliza o empate. Desempate é responsabilidade da AEUP — fora do escopo do SVOUP. |
| Falha técnica durante a votação | Sistema indisponível durante o período eleitoral. | Logs preservados; retoma possível sem perda de votos já registados. |
| Candidato desiste após abertura | Candidato retira-se depois de a eleição já ter começado. | Administrador pode encerrar e reconfigurar a eleição. Procedimento a definir pela AEUP. |

---

### 3.3 Restrições Técnicas Identificadas

- A AEUP parte do **zero** — nenhum sistema digital existe actualmente. O SVOUP será a primeira ferramenta digital da organização.
- Os utilizadores têm **pouca ou nenhuma experiência** com sistemas informáticos — a interface deve ser extremamente simples.
- Desconhece-se o nível de acesso à internet dos estudantes — o sistema deve funcionar bem em **ligações lentas e smartphones de gama baixa**.
- Não há equipa de TI na AEUP — o sistema deve ser fácil de manter com o **mínimo de intervenção técnica** pós-entrega.

> *"Falhas não propositadas ou falhas elaboradas... nem para injustiçar ou dar vantagem a um candidato."*
> — Mércio dos Santos — sobre o risco de manipulação na contagem manual

---

## 4. Síntese — O que a AEUP Precisa

O coordenador Mércio dos Santos resumiu as expectativas de forma clara. O SVOUP precisa ser:

|  Rápido |  Honesto |  Barato | Fácil |
|---|---|---|---|
| Acabar com meses de organização e horas de contagem. | Votos imutáveis, resultados inquestionáveis. | Sem papel, sem urnas, sem custo de logística. | Qualquer membro da AEUP consegue usar sem formação. |
