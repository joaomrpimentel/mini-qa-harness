# Como rodar uma rodada de QA com o Claude Code

A skill `mini-qa` põe uma sessão do Claude Code para coordenar a rodada de teste: ela solta os agentes testadores, verifica o que eles relatam e escreve os rascunhos de bug. Quem decide o que é postado continua sendo você.

## Antes de começar

- O harness está instalado no projeto de onde você vai testar (`npm install mini-qa-harness`, ou um clone deste repo) e o `npx qa smoke` loga com todos os perfis que você precisa. Ver [configurar auth](configure-auth.md).
- O ambiente testado responde a partir da sua máquina.

## 1. Instale a skill

Copie `skill/mini-qa/` para um dos lugares de onde o Claude Code lê skills:

```bash
# para você, em todo projeto
cp -r node_modules/mini-qa-harness/skill/mini-qa ~/.claude/skills/

# só neste projeto (versione, e o time recebe junto)
mkdir -p .claude/skills && cp -r node_modules/mini-qa-harness/skill/mini-qa .claude/skills/
```

Num clone deste repo, a origem é `skill/mini-qa/`. A cópia não se atualiza sozinha: quando puxar versão nova do harness, copie de novo.

## 2. Comece a rodada

No Claude Code, a partir da pasta do projeto:

```text
/mini-qa testa a issue #123 no staging. Os critérios estão na issue.
```

Qualquer pedido para testar, fazer QA ou validar uma feature num ambiente rodando também carrega a skill. A sessão abre um todolist com as oito fases do `SKILL.md`: intake, conferir o ambiente, subir o harness, soltar os testadores, verificar, gravar, rascunhar e entregar, limpar.

## 3. Responda o que só você sabe

A sessão vai perguntar, ou você já diz de saída:

- qual ambiente e qual build estão sob teste, e onde conferir o que está no ar
- qual perfil corresponde a qual papel dos critérios
- se o registro que o teste precisa existe, ou se tem que ser criado com o `dataPrefix`
- para onde vão os bugs (repo de cada serviço, labels, assignee, campos de projeto)

## 4. Deixe os testadores rodarem

A sessão preenche `skill/mini-qa/references/tester-prompt.md` uma vez por charter e solta vários agentes em paralelo, dois ou três casos cada, com prazo de 15 minutos. Um modelo menor (Sonnet) basta para testar. Duas regras que a sessão cobra, e que você confere se escrever o charter na mão:

- dois agentes nunca editam o mesmo registro, senão um reporta a edição do outro como bug
- todo agente testa só pela tela; se um começar a ler código ou chamar a API, a sessão manda mensagem corrigindo o rumo

Cada agente devolve um relatório da sessão (por caso: passos, esperado, observado, pasta de evidência, veredito) e, para cada `BUG 2/2`, um rascunho em `bugs/BUG-<n>.md`.

## 5. A sessão verifica

Para cada achado, a sessão principal abre os screenshots, o `evidence.json` e o `trace.zip` em vez de confiar no resumo do agente, descarta o ambiente (deploy velho, migration faltando, permissão ou dado ausente) e diz qual oráculo o comportamento contradiz. Aqui, diferente dos testadores, ela pode ler código, chamar a API e ler log. O checklist está em `skill/mini-qa/references/verify.md`, e o porquê em [verificação](../explanation/verification.md).

O resultado é um destes: BUG (o rascunho vem para você), NOT_TESTED com motivo, observação, ou nada.

## 6. Revise e dê a ordem

Leia cada rascunho. Edite se quiser; a sessão posta o seu texto, não o dela. Nada vai para o GitHub sem você mandar. Depois siga [postar no GitHub](post-to-github.md), ou deixe a sessão rodar esses comandos.

## 7. Limpe

Peça à sessão para conferir pela tela que não sobrou registro com o `dataPrefix` e para apagar a evidência local dos bugs já postados.

## Relacionados

- [Gravar com o Jam](record-with-jam.md), [escrever um ajudante de tela](write-a-screen-helper.md)
- [Como funciona](../explanation/how-it-works.md)
