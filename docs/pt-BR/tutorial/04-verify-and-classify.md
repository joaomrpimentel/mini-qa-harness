# 4. Bug ou ambiente?

Na página 3 a exclusão da nota fixada falhou 2 de 2 vezes, em sessões novas. Só que reproduzível não quer dizer bug na feature. Ambiente de teste quebra do jeito dele: serviço que nunca subiu, migration que ninguém rodou, permissão que existe em produção e não existe ali. Relato que culpa a feature por qualquer um desses custa uma tarde de um dev.

## A ideia: quem decide é a evidência, não o status

Requisição que falha e mensagem vermelha na tela têm a mesma cara, seja qual for a causa. O que separa uma da outra está na evidência: o corpo da resposta, a rota, o que o resto do app faz. O harness tem três vereditos justamente para que um caso que não deu para testar não precise fingir:

| Veredito | Quer dizer |
|---|---|
| `OK` | o requisito se manteve |
| `BUG` | o requisito falhou, e a causa está no que se está testando |
| `NOT_TESTED` + `reason` | não deu para julgar o caso aqui: `env-down`, `missing-data`, `no-access`, `blocked-by-other-bug` ou `script-error` |

`NOT_TESTED` é resultado, e entra no relato para o time. Ele diz que um critério continua em aberto, e por quê.

## Exemplo resolvido: duas falhas lado a lado

Rode o caso do requisito "An admin can export all notes as CSV" (um admin consegue exportar todas as notas em CSV):

```bash
node examples/export-csv.mjs
```

```text
BUG 2/2
  run 1: screen said ["Export failed."]; GET /api/export -> 503 {"error":"export-service unavailable","hint":"not deployed in this environment"}
  run 2: screen said ["Export failed."]; GET /api/export -> 503 {"error":"export-service unavailable","hint":"not deployed in this environment"}
```

Deu `BUG 2/2` por causa da regra no topo do arquivo, que você lê inteira aqui:

```js
function classify(call) {
  if (call.status >= 400) return { verdict: 'BUG' };
  return { verdict: 'OK' };
}
```

Ponha as duas falhas uma do lado da outra:

| | Excluir nota fixada (página 3) | Exportar |
|---|---|---|
| Status | `500` | `503` |
| Corpo | vazio (`"body": null` no `evidence.json`) | `export-service unavailable`, `not deployed in this environment` |
| O que o app está dizendo | algo quebrou ao tratar uma requisição válida | o serviço por trás deste botão não existe aqui |

A regra trata as duas igual. Você não pode.

## Prática guiada (você decide)

Decida qual veredito e qual motivo o caso da exportação merece. Copie o exemplo para `cases/export-csv.mjs` e mude o `classify` para que um `503` devolva esse veredito com o motivo, e os outros erros continuem `BUG`. Depois rode `node cases/export-csv.mjs`.

> **Esperado:** o resumo é `NOT_TESTED 2/2` e cada linha `run` termina com `(reason: env-down)`. Se ainda vier `BUG 2/2`, a sua condição nova está depois da linha do `>= 400`, que pega o `503` primeiro.

Antes de dar o `NOT_TESTED` como certo, quem verifica ainda confirma que a dica é verdade: o serviço de exportação está na lista de deploys deste ambiente? O checklist completo está em [Verificação](../explanation/verification.md).

Próxima: [5. Escreva o relato](05-write-the-report.md)
