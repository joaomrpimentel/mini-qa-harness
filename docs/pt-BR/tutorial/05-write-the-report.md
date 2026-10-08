# 5. Escreva o relato

Você tem um bug que reproduz 2 de 2 vezes e que conferiu contra o ambiente na página 4. Falta escrever de um jeito que o dev consiga reproduzir sem te perguntar nada.

## A ideia: cada campo responde uma pergunta que o dev faria

`templates/bug-report.md` é um formulário, e cada seção é uma pergunta que o dev faria a você se ela não estivesse ali. Quando desenvolvedores de Apache, Eclipse e Mozilla responderam o que faz um bom relato de bug, os passos para reproduzir saíram como o item mais pedido, e informação incompleta ou errada como o maior obstáculo ([Bettenburg et al., 2008](https://neverworkintheory.org/2011/08/30/what-makes-a-good-bug-report.html)). Três regras fazem do formulário um bom relato:

- **Requisito copiado letra por letra.** Paráfrase vira um requisito que ninguém combinou
- **Comportamento atual citado exatamente.** O texto que a tela mostrou, entre crases, mais método, rota e status tirados do `evidence.json`
- **Evidência: uma imagem por passo que prova alguma coisa**, cada uma com legenda dizendo para onde olhar

O frontmatter no topo (`case`, `reproduced`, `oracle`, `severity`) é para quem revisa o rascunho. A renderização tira ele antes de postar.

## Exemplo resolvido

Ponha o rascunho ao lado dos prints que ele usa:

```bash
mkdir -p bugs
cp evidence/delete-pinned/run-1/0*.png bugs/
cp templates/bug-report.md bugs/BUG-1.md
```

Esta é a seção Actual preenchida a partir do `run-1`. Todo valor vem da evidência, nenhum da memória:

```markdown
## Actual

The screen shows `Something went wrong. Please try again.` `DELETE /api/notes/{id}` returns `500` with an empty body. After reload the note is still listed.
```

O título diz o que falha, onde, e o que a pessoa vê, numa linha só: `# Deleting a pinned note returns 500 and the note stays in the list`. A seção Evidence aponta os três prints por caminho relativo, `![error](02-after-delete.png)`.

O template está em inglês, como os textos da demo. Num projeto seu, escreva o relato na língua do time.

## Prática guiada (você decide)

Preencha o resto do `bugs/BUG-1.md`. Dois campos pedem uma decisão sua, e as tabelas de [Verificação](../explanation/verification.md) ajudam:

- **oracle**: o que torna esse comportamento errado? Olhe o requisito da página 2
- **severity**: Blocker, High, Medium ou Low, mais uma frase sobre quem é afetado e o que deixa de conseguir fazer

Depois renderize, como faria antes de postar:

```bash
node bin/qa.mjs issue render bugs/BUG-1.md
```

> **Esperado:** `qa: images without uploaded URL: 01-pinned-note-created.png, 02-after-delete.png, 03-after-reload.png`, código de saída 1, e nenhum `body.md`. A recusa é de propósito. Issue com imagem apontando para o seu disco mostraria três figuras quebradas para o dev.

A renderização precisa de cada imagem já enviada ao GitHub. O `--upload owner/repo` faz isso, e [Postar um bug no GitHub](../how-to/post-to-github.md) mostra o caminho, com o login que ele pede. No tutorial, o rascunho é o resultado. O oráculo provavelmente é `Claim`, porque o requisito diz que um admin exclui *qualquer* nota. A gravidade é escolha sua, desde que a frase depois dela sustente a escolha.

Próxima: [6. Desafio](06-challenge.md)
