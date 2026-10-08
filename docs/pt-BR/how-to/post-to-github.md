# Como postar um bug verificado no GitHub

Só depois que a pessoa dona da rodada leu o rascunho e deu a ordem. Se ela editou, poste a versão dela.

## Antes de começar

- `gh` instalado e logado (`gh auth status`).
- O rascunho começa com uma linha `# Título` e aponta as imagens por caminho relativo, como em `templates/bug-report.md`.

## 1. Logue no GitHub no browser do harness, uma vez

```bash
npx qa gh login
```

Abre uma janela em `github.com/login`. Logue; a janela fecha sozinha quando a página mostra um usuário logado (desiste depois de 15 minutos). A sessão fica em `.qa/gh-profile`. O `gh` não sobe anexo, e é essa sessão de browser que sobe as imagens.

## 2. Monte o corpo da issue subindo as imagens

```bash
TITULO=$(npx qa issue render bugs/BUG-1.md --upload acme/notes-api --out body.md)
```

Sobe para `acme/notes-api` toda imagem local que o rascunho referencia (solta cada uma na caixa de texto de uma issue nova e nunca submete), grava `body.md` com as URLs `user-attachments` no lugar dos caminhos locais e imprime o título. O frontmatter sai. Se sobrar imagem sem URL, para com `images without uploaded URL: ...` e não grava nada.

Use o repo onde a issue vai nascer: anexo subido por um repo é para ser mostrado naquele repo.

Para subir sem montar o corpo, `npx qa gh upload acme/notes-api a.png b.png` imprime `{ "a.png": "https://github.com/user-attachments/..." }`.

## 3. Crie a issue e confira as imagens

```bash
gh issue create -R acme/notes-api --title "$TITULO" --body-file body.md
npx qa gh check https://github.com/acme/notes-api/issues/42
```

O `qa gh check` imprime `images N, loaded M` e sai com código 1 quando `M < N`. Conserte imagem quebrada antes que alguém leia a issue.

Abra a issue no repo do serviço que tem o bug, e cite a issue da feature pelo nome completo (`acme/product#123`). Para o `#123` solto do rascunho virar nome completo, configure `github.issueRefRepo: 'acme/product'` no `qa.config.mjs`.

## 4. Comente na issue da feature

Escreva `comentario.md`:

```markdown
Testado no staging em 2026-10-08, pela tela (Notes).

| Critério | Resultado |
|---|---|
| O admin exclui qualquer nota | Bug: acme/notes-api#42 |
| Viewer lê as notas mas não exclui | OK |
| Export CSV baixa todas as notas | Não testado: serviço de exportação não está no ar no staging |
```

```bash
gh issue comment 123 -R acme/product --body-file comentario.md
```

Quando nada foi encontrado, diga o que foi testado e que nada foi encontrado.

## Relacionados

- [Referência da CLI](../reference/cli.md), [referência do bug report](../reference/bug-report.md)
- [Gravar com o Jam](record-with-jam.md)
