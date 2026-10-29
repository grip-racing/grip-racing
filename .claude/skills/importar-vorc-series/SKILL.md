---
name: importar-vorc-series
description: Confere e importa os resultados da Grip Racing no site da VORC Series (rFactor 2 Log Analyzer, 177.74.174.79:10000) contra data/data-participacoes.csv. Use quando pedirem para atualizar, comparar ou achar o que falta nos resultados dos pilotos na liga VORC Series.
---

# Importar resultados da VORC Series

Fonte: http://177.74.174.79:10000/championships (rFactor 2 Log Analyzer, "r2la").
Destino: `data/data-participacoes.csv` (linhas com a coluna Liga = `VORC Series`).

Diferente do Racing Bears, **não existe página da equipe**: é preciso varrer os campeonatos. O site tem dados desde 2021 (cid 1), mas a Grip só aparece em 2023 (Marcas) e a partir de 2026.

## Data de corte (não rebusque o que já foi importado)

**Importado e conferido em 29/10/2026**: todos os campeonatos com `cid` até **151** (144 campeonatos, 626 corridas). Última corrida com dado: **23/10/2026** (Spa Francorchamps, M7 Help Volantes). As pendências já foram aplicadas na planilha e baixadas.

- Pule qualquer campeonato com `cid <= 151` cuja última etapa seja até 23/10/2026, a menos que o dono diga que o site foi corrigido.
- O que olhar numa próxima rodada: etapas que faltavam ao fim do corte (Texas do M7 Help Volantes; Sepang do Endurance Series Asia; Auto Club 500 e 3h de Monza já feitos) e campeonatos **novos, com `cid` maior que 151**. O topo de `/championships` mostra os em andamento; os novos aparecem lá.
- Ao concluir uma nova rodada, atualize esta seção com a nova data/`cid` de corte.

## 1. Como o site é montado

- `/championships` lista tudo ("AAAA Tn - nome", com data). O bloco do topo são campeonatos **em andamento**; abaixo vem "Finished championships". `a[href*="cid="]` dá o `cid` de cada um.
- `/championships/championship?cid=N` carrega a página, mas **tabelas e resultados vêm por AJAX**: `fetch` do HTML puro não traz a tabela. Use os dois endpoints abaixo (funcionam com `fetch` same-origin na aba do site, sem login).
- `/championships/export_standings_json.json?cid=N`: classificação por classe (`Class Overall`, `Class GT3`...). Em `Driver Standings.drivers` cada piloto tem `positions` (posição de chegada por etapa, `""` = não foi) e `points` (texto: número, `DNF`, `Acc`, `Sus`, `Eng`, `Fue`, `-`). Em `Team Standings.teams` vem `team_name` + `team_drivers` abreviados ("R. Sousa, F. Faria"). Campeonatos de corrida única não têm times.
- Resultado de cada corrida: pegue os `li.race_selector` da página do campeonato (atributos `race_id`, `file_name`, `race_name`) e faça `fetch('/report/report.load?cid=N&file_name=<encoded>&rid=R')`. Devolve HTML com `table.r2la_table`: `Pos, Up, [Cat], Driver, Team, Car, Laps, Time/Gap, Qual Time, Best Lap, Led, Pits, Tires, PTS`. Em corridas multiclasse `Cat` vem como `GTE|5` (classe|posição na classe); no Red Bull Ring o time e o piloto vêm juntos ("Grip Racing V. Ribeiro").
- O cabeçalho do relatório traz o autódromo real e a **data** ("Race results 25 Minutes 16 January 2026"). O `race_name` às vezes está errado: cid 150 (3h de Monza) tem a corrida chamada "Nordschleife" e cid 132 (GP Cascavel) chama "Buenos Aires"; vale o autódromo do cabeçalho.
- O servidor é lento (~1 s por requisição). Varrer os ~144 campeonatos / ~630 corridas leva uns 3–5 min: dispare sem `await` (promise guardada em `window`) e consulte depois, senão o `javascript_tool` estoura 45 s. Navegar para outra página apaga o que ficou em `window`.

## 2. Achar a Grip

1. Não há filtro de equipe: varra `Team Standings` de todos os `cid` procurando `grip` em `team_name`/`team_drivers`, e depois as páginas de corrida (coluna Team) para os campeonatos sem times (ovais e provas únicas).
2. Equipes da Grip: `Grip Racing`, `Grip Racing 2`, `Grip Racing 3`, `Grip Racing 4` e, em 2023, `Visamundo Grip Racing`.
3. Só lance piloto com **equipe Grip na corrida**. Fernando Passos, por exemplo, corre pela CBR Team no Stock Car 2026 T1/T2 e só aparece como Grip a partir do Michigan (ago/2026).
4. Estado verificado em 29/10/2026 (144 campeonatos, 626 corridas): equipe Grip só em cid 36 (Marcas 2023 T2), 123 (Stock Car 2026 T1), 130 (Stock Car Sudam 2026 T2), 132, 134, 138, 139, 144, 146, 148, 150, 151. Nada em 2021, 2022, 2024 e 2025.

## 3. Posição correta

- **Todo mundo no mesmo carro** (Stock Car Peugeot/Chevrolet, Dallara IR18, Marcas): posição **geral**.
- **Classes com carros diferentes** (M7 Help GT Series: GT3 e GTE; Endurance: LMP2/GTE/LMP3; Le Mans: HYP): posição **na classe** (`Cat` = `GTE|5` → 5). A classe vira a `Categoria` (GT3, GTE).
- **DNF**: siga o texto da coluna `points` do JSON (ou `PTS` da corrida). Número → posição; `DNF`/`Acc`/`Sus`/`Eng`/`Fue` → `DNF`. `DQ` na coluna Time/Gap → `DQ`. Precedente do CSV: Tarumã R1 Flavio terminou "11" com status Engine porque o site pontuou.
  - Cuidado: no site, retirantes às vezes pontuam (Ibarra: Felipe/Victor; Red Bull Ring: Rodrigo; M7 Volantes). O que vale é o que a grade de classificação mostra, mas avise o dono nesses casos.

## 4. Mapa de temporadas (AAAA-N do CSV, não o "Tn" do site)

Mesmo corte do Racing Bears: `AAAA-1` jan até meados de mar; `AAAA-2` meados de mar até meados de ago; `AAAA-3` meados de ago até dez. Validado com o histórico:

| Site | Datas | CSV |
|---|---|---|
| 2023 T2 Marcas Brasil | 25/mai e 8/jun/2023 | `2023-2` |
| 2026 T1 Stock Car | 16/jan–27/fev/2026 | `2026-1` |
| 2026 T2 Stock Car Sudam, GP Cascavel, Indy 500, GT Series, Le Mans 2h | 27/mar–11/ago/2026 | `2026-2` |
| 2026 T3 Michigan (22/ago) e todos os "T4" (set–out) | | `2026-3` |

Pontos de borda: Algarve (GT Series) foi em 11/ago e Michigan em 22/ago. Se o cabeçalho `2026-3,,,,,,,,,,,,,,,,` ainda não existir no CSV, é preciso criá-lo.

Corridas repetidas na pista: o CSV usa sufixo ` 2` na pista, **sem acento** (`Interlagos`/`Interlagos 2`, `Velo Citta`/`Velo Citta 2`, `Taruma 2`). Corrida R1/R2 do site = pista e pista 2.

## 5. Formato da linha

17 colunas: `Final,Categoria,Pista,Piloto,Equipe,Pole,Best Lap,Hat-Trick,Chelem,Piloto Campeao,Construtores,Liga,Temporada,Ano,Chave1,Chave2,Link`

```
5,Stock Car,Interlagos,Rodrigo de Sousa,,-,-,-,-,-,-,VORC Series,2026-1,2026,Stock Car/VORC Series/2026-1,Stock Car/VORC Series/2026-1/Interlagos,https://www.youtube.com/watch?v=jBtPvatovS4
```

- `Liga` = `VORC Series`. Chave1 = `Categoria/Liga/Temporada`; Chave2 = Chave1 + `/Pista`. `Equipe` vazia. `Link` = `#N/A` quando não há transmissão (o Stock Car 2026-1 tem links do YouTube por pista, repetidos nas duas corridas).
- Categorias usadas até agora: `Stock Car`, `Marcas`. Para o resto, o CSV costuma usar o nome do evento (`Daytona 500`, `Indy 500`, `2 Horas Brasilia`) ou da classe (`GT3`, `GTE`). **Nomes de patrocinador não entram na categoria** ("M7 Help", "Cisco Air", "HV Studio Design", "Unipró"...): o dono lançou o "M7 Help Volantes" (Dallara IR18) como `Indy Series`. Já confirmados no CSV: `GP Cascavel`, `Indy 500`, `GT3`, `GTE`, `2h de Le Mans`, `Michigan US500`, `3h de Monza`, `Auto Club 500`, `Endurance Series`, `Indy Series`.
- Nomes de pista sem acento e sem sufixo do site (`Velo Città R1` → `Velo Citta`, `Tarumã` → `Taruma`, `Tocancipá` → `Tocancipa`, `Goiânia` → `Goiania`, `LausitzRing Oval` → `Lausitzring`).
- O arquivo **não termina com quebra de linha**: ao dar `>>` adicione `printf '\n'` antes.

## 6. Pole, volta rápida, campeão

- **Pole**: o relatório traz `Qual Time`. A pole é o **menor `Qual Time` da corrida R1** (a R2 não tem classificação, grade invertida). Nas multiclasse a pole é por classe e a Grip não teve nenhuma.
- **Best Lap (VR)**: menor `Best Lap` da corrida; marque `SIM` na linha do piloto. Em corrida multiclasse use a melhor volta da classe (só ocorreu com Felipe no Zandvoort/GT3: decisão do dono).
- **Piloto Campeao**: topo da classificação do campeonato (JSON). Marque em **uma** linha do piloto, na última etapa. Único caso Grip: Victor Ribeiro no Stock Car Sudam 2026 T2 (196 x 194 do Regatieri).
- **Construtores**: o JSON traz o campeão por equipe (`Team Standings`, `points_sum`). A Grip Racing venceu a classe GT3 da M7 Help GT Series (cid 138, 223 pts; equipe "Grip Racing" = R. Sousa + F. Faria). **O dono confirmou (29/10/2026) que vale**: marcar só a **última etapa** do campeonato (Algarve, `2026-2`) com `SIM` no piloto que mais pontuou pela equipe (Felipe Faria, 154 pts) e `TIME` no outro (Rodrigo de Sousa, 69 pts), igual às outras ligas. **Matheus Araujo corre pela "Grip Racing 2" (11ª, 97 pts), fora do título: fica `-`.** Antes de marcar um título, confira no `Team Standings` qual equipe/pilotos o compõem (`team_drivers`) e some `points_sum` individual. Pendência gerada em `pendencias-vorc-series.csv` (2 linhas AJUSTE).
- **Hat-Trick / Chelem**: pole + VR + vitória na mesma corrida. Não ocorreu.

## 7. Nomes de pilotos

O site usa o nome do jogo; confira com os do CSV. Casos confirmados: "Rodrigo de Sousa", "Felipe Faria", "Flavio Felicio", "Victor Ribeiro", "Gustavo Sugari", "Matheus Araujo", "Marcelo Eduardo", "Fernando Passos", "Robert Johen" batem igual ao CSV. No JSON os times trazem abreviações ("R. Sousa", "F. Felicio"). Outros homônimos de nome (Pedro de Oliveira, Alex Pereira...) aparecem no site sem ser Grip: sem equipe Grip, não lance.

## 8. Conferência (obrigatória antes de dizer "só falta isso")

1. Para cada campeonato com Grip, compare `positions` do JSON e a tabela da corrida com `awk -F, '$12=="VORC Series" && $13=="AAAA-N"'` por pista, piloto e posição.
2. Confira presença (piloto × pista × temporada), `Final`, VR, pole e campeão.
3. Confirmado em 29/10/2026: Marcas 2023-2 (8 linhas) e Stock Car 2026-1 (23 linhas) batem em presença e posição. Único erro: **Flavio Felicio, Taruma 2, Best Lap** (`-` no CSV, deveria ser `SIM`).
4. Não verificado: pilotos da Grip correndo por outra equipe no site (ex.: Fernando Passos na CBR Team); campeonatos sem relatório de corrida; qualificação de provas multiclasse (a pole por classe não foi lançada).

## 9. CSV de pendências

Mesmo cabeçalho de 17 colunas do `data-participacoes.csv` (com as duas colunas de chave em branco: `...,Ano,,,Link Transmissao`) mais a 18ª `Acao`: `NOVA` ou `AJUSTE (campo: antigo -> novo)`. Uma linha completa por pendência, já com o valor final. Gerado em `pendencias-vorc-series.csv` na raiz. Não edite `data/*.csv`, não rode `update-data.ps1`, não commite: o dono atualiza o Google Sheets e avisa.

## 10. Depois de editar (quando o dono pedir)

Igual ao Racing Bears: `update-data.ps1` baixa os 3 CSVs, incrementa `DATA_VERSION` e regenera `assets/pilotos/manifest.json`; `data-pilotos.csv` e `data-stats.csv` são agregados mantidos à mão (a linha `VORC Series` de `data-stats.csv` tem os totais da liga). Ambiente Windows: sem `python`/`node` no shell; use `awk`/`sed`/`grep` (Git Bash) ou PowerShell.

## Registro

29/10/2026: levantamento feito, `pendencias-vorc-series.csv` (1 ajuste + 82 linhas novas) aplicado na planilha e baixado com `update-data.ps1` (v1.0.33). O M7 Help Volantes ficou como `Indy Series` (sem nome de patrocinador). VORC Series: 113 linhas (2023-2: 8, 2026-1: 23, 2026-2: 45, 2026-3: 37).
