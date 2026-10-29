---
name: importar-racing-bears
description: Importa e confere os resultados da Grip Racing no Racing Bears TV (racingbearstv.com.br) contra data/data-participacoes.csv. Use quando pedirem para atualizar, comparar ou achar o que falta nos resultados dos pilotos na liga Racing Bears.
---

# Importar resultados do Racing Bears TV

Fonte: página da equipe https://www.racingbearstv.com.br/equipes/723bdc62-ad6e-4530-9b83-0589517c8098
Destino: `data/data-participacoes.csv` (linhas com a coluna Liga = `Racing Bears`).

O site só tem dados a partir da **23ª temporada (nov/2023)**. Nada anterior existe lá, então linhas antigas no CSV não são "erro".

## 1. Levantar a lista de resultados

1. Abra a página da equipe no navegador embutido (`mcp__Claude_Browser__*`) e clique em **"Ver todos os resultados da equipe"**. `get_page_text` devolve ~270 linhas: temporada, etapa, data, piloto, categoria (PRO/AM/P1..P3) e resultado.
2. Essa lista mostra a **posição na classe**, não a geral. Serve só para saber *o que existe*. Para lançar posição, use a classificação geral do evento (passo 2).
3. Os links `/eventos/<uuid>/resultados` ficam nos cards (`document.querySelectorAll('a[href*="/eventos/"]')`). Há um evento por temporada, com todas as etapas dentro.

## 2. Posição correta por evento

Regra do dono do site (Rodrigo):

- **Todo mundo no mesmo carro** (GT3, GT4, Sprint, DTM, Stock Car, G40, LMDh, F-Inter, Calhambeque): vale a **posição geral da pista**.
- **Classes com carros diferentes** (Protótipo P1/P2/P3): vale a **posição na classe**.

Na página do evento, a aba **"🌐 Classificação Geral da Corrida"** lista cada etapa com posição geral, categoria e equipe. Filtre `Grip Racing`. A aba **"🏁 Resultado da Corrida"** traz a **volta mais rápida** de cada etapa (nome + categoria). A aba **"🏆 Classificação do Evento"** traz o ranking final por categoria (botões PRO/AM ou P1/P2/P3) para achar campeões.

Os cliques nas abas são Radix/React: `element.click()` não funciona. Dispare pointer events:

```js
const w = iframe.contentWindow;
const click = b => { b.focus(); for (const t of ['pointerdown','mousedown','pointerup','mouseup','click'])
  b.dispatchEvent(new w.PointerEvent(t,{bubbles:true,cancelable:true,pointerType:'mouse',button:0,isPrimary:true,view:w})) };
```

Para varrer todos os eventos de uma vez, na aba do site crie um `<iframe>` same-origin por evento (`src='/eventos/<uuid>/resultados'`, posicionado fora da tela), espere carregar (~2 s), clique na aba e leia `iframe.contentDocument.body.innerText`. Cada linha de resultado é `posição, [iniciais do avatar], nome, categoria, equipe, pontos`. Cuidado: pilotos sem foto têm uma linha extra de iniciais (`SG`, `HB`) antes do nome. Se a leitura vier vazia, a página ainda não carregou: espere mais e repita.

## 3. Mapa de temporadas

O CSV usa `AAAA-N` (N = período do ano, não a numeração do site). Cortes deduzidos do histórico do git e de outras ligas:

| Período | Janela aproximada |
|---|---|
| `AAAA-1` | jan até meados de mar |
| `AAAA-2` | meados de mar até meados de ago |
| `AAAA-3` | meados de ago até dez |

Exemplos já lançados: 23ª Protótipo/DTM (nov–dez/2023) = `2023-3`; 24ª e 25ª = `2024-1`; 28ª = `2024-2`; 29ª e 30ª = `2024-3`; 31ª = `2025-1`; 32ª–35ª = `2025-2`; 36ª = `2025-3`; 39ª (fev–5/mar/2026) = `2026-1`; 40ª Stock Car (19/mar/2026) e 41ª GT4 = `2026-2`; 44ª DTM (out/2026) = `2026-3`. Anomalia existente: a Calhambeque da 32ª (jan/2025) está em `2025-2`; não mexer sem pedido.

Quando aparece uma temporada nova, crie a linha de cabeçalho `AAAA-N,,,,,,,,,,,,,,,,` (17 campos) antes das linhas dela.

## 4. Formato da linha

17 colunas: `Final,Categoria,Pista,Piloto,Equipe,Pole,Best Lap,Hat-Trick,Chelem,Piloto Campeao,Construtores,Liga,Temporada,Ano,Chave1,Chave2,Link`

```
8,DTM,Donington,Ader Fernando,,-,-,-,-,-,-,Racing Bears,2026-3,2026,DTM/Racing Bears/2026-3,DTM/Racing Bears/2026-3/Donington,#N/A
```

- `Final`: número, `DNF`, `DNS` ou `DQ`. DNS conta como linha (já existe precedente).
- `Equipe` fica vazia nas linhas do Racing Bears recentes.
- Marcações `SIM`/`-` em Pole, Best Lap, Hat-Trick, Chelem, Piloto Campeao, Construtores.
- Chave1 = `Categoria/Liga/Temporada`; Chave2 = Chave1 + `/Pista`.
- Link = `#N/A` quando não há transmissão.
- Nome de pista: sem sufixos do site (`Donington GP` → `Donington`, `Spa Francorchamps (Histórica 1993)` → `Spa Francorchamps`; use sempre `Spa Francorchamps` para o Racing Bears recente, `Thermas de Rio Hondo`, `Interlagos`).
- Insira cada linha junto do bloco da mesma temporada/liga. O arquivo **não termina com quebra de linha**: ao dar `>>` adicione `printf '\n'` antes.

## 5. Nomes de pilotos

- "Rodrigo Sousa" e "Rodrigo de Sousa" = `Rodrigo de Sousa`.
- "Fred Quintão (Fred Quintão)" = `Fred Quintao` (sem acento no CSV).
- **"Henrique Baltazar" = `Henrique Bettega`** (confirmado indiretamente pelo dono; ele já aparece no CSV em 2023 e 2025).
- Fernando Melo e outros que correm pela Grip no CSV podem aparecer no site sem equipe ou com 0 corridas: não é erro nosso.
- Pilotos que o site lista só como histórico (Isabel Costa, Alexandre Ruiz, Victor Ribeiro...) continuam valendo.

## 6. Voltas rápidas, campeão, hat-trick, pole

- **Best Lap (VR)**: sai da aba "Resultado da Corrida" (um piloto por etapa, com a categoria dele). Marque `SIM` na linha do piloto. Confira com os totais de VR da página da equipe (Luis 3, Saliba 2, Henrique 1, Rodrigo 1 no período 23ª–44ª).
- **Piloto Campeao**: ranking final em "Classificação do Evento". Ele é marcado em **uma** linha do piloto no evento; confira se já existe antes de duplicar.
- **Hat-Trick / Chelem**: só se pole + VR + vitória na mesma corrida (chelem = e liderou todas as voltas). Pole não é publicada, então raramente dá para afirmar.
- **Pole**: **o site não publica**. O Live Timing só mostra corridas ao vivo. Pergunte ao usuário se há outra fonte; senão deixe `-`.
- **Construtores**: não verificado.

## 7. Conferência (obrigatória antes de dizer "só falta isso")

1. Para cada evento, liste as linhas `Grip Racing` do site (passo 2) e compare com `awk -F, '$12=="Racing Bears" && $13=="AAAA-N"'` por pista, piloto e posição. Não compare com a lista da página da equipe: ela traz posição de classe e mascara divergências.
2. Confira presença (piloto × pista) e valor de `Final`.
3. Confira VRs e campeões contra o site.
4. Se o dono já definiu a regra de posição (passo 2), siga-a sem perguntar.

## 7b. CSV de pendências

Quando o usuário pedir "o CSV do que falta", gere um arquivo com o **mesmo cabeçalho e as mesmas 17 colunas** de `data-participacoes.csv`, uma linha completa por pendência (já com o valor correto), e acrescente uma 18ª coluna final `Acao` com `NOVA` (linha que não existe no CSV) ou `AJUSTE (campo: antigo -> novo)` (linha que já existe e muda).

## 8. Depois de editar

As edições vão primeiro no Google Sheets; `.Pdate-data.ps1` baixa os 3 CSVs, incrementa `DATA_VERSION` (não faça bump manual antes) e regenera `assets/pilotos/manifest.json`.

- Bump de `DATA_VERSION` em `js/piloto-detalhes.js` e `js/piloto-detalhes-v2.js` (hoje `1.0.33`). Sem isso o navegador usa cache.
- `data/data-pilotos.csv` e `data/data-stats.csv` são agregados mantidos à mão. Corridas, Podios, P1/P2/P3, Abandonos, Ultima e as razões (`Etapas por ...` = Corridas ÷ valor) batem com contagem direta das participações. `Top 5`/`Top 10` **não** batem com contagem simples; valide a lógica antes de recalcular. `data-stats.csv` tem totais por temporada e por liga.
- Ambiente Windows: não há `python` nem `node` no shell. Use `awk`/`sed`/`grep` (Git Bash) ou PowerShell. O arquivo é LF; o Git avisa sobre CRLF, ignorar.
- Não commite sem o usuário pedir.

## Registro do que já foi importado

Importado em 29/10/2026: 23ª DTM (Henrique, Sandro Jerez), 34ª (Saliba Interlagos/Monza), 35ª (Robert), 39ª (Robert Spa), 40ª, 41ª e 44ª. As pendências restantes (VR Saliba G40 Silverstone, VR Henrique Adelaide, Pablo Watkins Glen = 3) já foram aplicadas na planilha e baixadas com `update-data.ps1`. 4FUN Formula 3 foi **removido** a pedido do usuário; não reimportar.
