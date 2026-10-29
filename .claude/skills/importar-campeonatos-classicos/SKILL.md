---
name: importar-campeonatos-classicos
description: Confere e importa os resultados da Grip Racing no site Campeonatos Clássicos (campeonatosclassicos.com.br) contra data/data-participacoes.csv. Use quando pedirem para atualizar, comparar ou achar o que falta nos resultados dos pilotos na liga Campeonatos Classicos.
---

# Importar resultados do Campeonatos Clássicos

Fonte: https://campeonatosclassicos.com.br/eventos (aba Campeonatos; Especiais também contam).
Destino: `data/data-participacoes.csv` (linhas com a coluna Liga = `Campeonatos Classicos`).

## Data de corte (não rebusque o que já foi conferido)

**Conferido por inteiro em 29/10/2026**: os 51 campeonatos listados (T1 2019 até T4 2026), 386 corridas, mais o especial BPR Brasil 1996 etapa 1. Última corrida com dado: **28/10/2026** (Chevette Turbo, etapa 6, Londrina).

- Qualquer campeonato cuja última etapa seja **até 28/10/2026** já está feito: pule, a menos que o dono diga que corrigiu algo no site.
- O que olhar numa próxima rodada: etapas do **Chevette Turbo T4 2026** a partir da 7 (próxima em 04/11/2026), **BPR Brasil 1996 etapa 2 (Brasília)** (inscrições abertas em 29/10, sem resultado), e **campeonatos novos** no fim da lista (a lista é da data mais nova para a mais velha).
- O corte só vale depois que o dono aplicar `pendencias-campeonatos-classicos.csv` na planilha. Antes disso, as linhas dele ainda aparecem como pendência.
- Ao concluir uma nova rodada, atualize esta seção com a nova data de corte e o registro no fim.

## 1. Como o site é montado (tudo HTML estático, sem login)

- `/eventos` lista campeonatos (`/campeonatos/<slug>/`), especiais (`/eventos/<slug>/`), time trial e 4fun. `a[href^="/campeonatos/"]` dá os 51 slugs.
- `/campeonatos/<slug>/race-N` (N = 1, 2, … até dar 404) é a página de cada etapa, com abas Classificatório e Corrida. Use `fetch` same-origin e `DOMParser`; não precisa clicar.
  - A tabela da corrida é a que tem `Largada` no cabeçalho: `Pos, Piloto, Largada, Variação, Pts, Melhor Volta, Tempo Total, Voltas, Voltas Lideradas, Incidentes`. A primeira tabela é a do classificatório; ignore.
  - `Pts` traz as bonificações: `49+1 Pole`, `47+1 VR`, `46+1 VR+1 Pole`. **Pts = 0** vira `DNF` no CSV (Rodrigo no Interlagos e Brasília de 2026: 0 pts → `DNF`).
  - `.award-text` (`.label` / `.value`) traz Vencedor, Pole Position, Melhor Volta, **Hat Trick** e **Grand Chelem**. Pontuação 60 para o vencedor (em vez de 50/51) também indica Grand Chelem.
  - O `h1` é a pista; o texto do pai traz `Etapa N · dd/mm/aaaa`. Em campeonatos antigos (2019–2022) a data vem **vazia** e Largada = Pos, Tempo 0:00:00: só a classificação foi cadastrada.
  - Campeonatos multiclasse (Girusbag 2021 tem C, GT-PRO e GT-AM; BPR tem GT1 e GT2) trazem **uma tabela por classe**, cada uma começando em 1: vale a posição na classe.
- `/pilotos/<slug>` mostra só as ~10 últimas corridas (não serve para conferência). `/membros` lista os 169 pilotos; só ~11 também estão no nosso CSV: Rodrigo de Sousa, Flavio Felicio, Victor Ribeiro, Fernando Passos, Felipe Faria, Matheus Araujo, Charles Zimmermann, Isabel Costa, Luiza Biesus, Joao Augusto, Elizeu Filho. Procure por nome (o site não tem equipe).
- Para varrer tudo: 51 campeonatos × ~8 etapas, ~1,5 min com 6 `fetch` em paralelo. Dispare sem `await` (promise guardada em `window`) e consulte depois (`javascript_tool` estoura em 45 s). Navegar apaga o `window`.

## 2. Posição

Mesmo carro: posição geral da tabela. Classes com carros diferentes: posição na classe (cada tabela de classe já começa em 1). O especial BPR é GT1/GT2: vale a classe; Flavio venceu a GT2.

## 3. Mapa de temporadas (AAAA-N do CSV, não o "Tn" do site)

Mesmo corte do Racing Bears/VORC: `AAAA-1` jan–meados de mar; `AAAA-2` meados de mar–meados de ago; `AAAA-3` meados de ago–dez. Exemplos já no CSV: Stock Car 2007 "T1 2026" (18/03–20/05/2026) = `2026-2`; Chevette Turbo "T4 2026" (23/09–28/10) = `2026-3`; C.S. MX5 "T3 2023" (27/06–07/08/2023) = `2023-2`. Para os antigos sem data: Velozes e Charmosas e Endurance 1960 (2020) = `2020-3`; Girusbag, Funcup USA e Taça Caio (2021) = `2021-3`; Kings DTM e Alpine (2022) = `2022-1`. Um campeonato nunca é dividido em duas temporadas.

Pistas repetidas na mesma temporada/categoria: sufixo ` 2` (`Interlagos 2`). Nomes sem acento (`Taruma`, `Jacarepagua`, `Goiania`, `Brasilia`).

## 4. Formato da linha

17 colunas: `Final,Categoria,Pista,Piloto,Equipe,Pole,Best Lap,Hat-Trick,Chelem,Piloto Campeao,Construtores,Liga,Temporada,Ano,Chave1,Chave2,Link`

```
1,Stock Car,Campo Grande,Flavio Felicio,,-,-,-,-,-,-,Campeonatos Classicos,2026-2,2026,Stock Car/Campeonatos Classicos/2026-2,Stock Car/Campeonatos Classicos/2026-2/Campo Grande,https://www.youtube.com/watch?v=nzZff1pOU08
```

- Categoria: nome do campeonato **sem patrocinador** ("Chevette Turbo, by Bolotas Auto Parts" → `Chevette Turbo`; "Copa Enfoque Odontologia"...). Já usadas: `Stock Car`, `Chevette Turbo`, `GT2` (BPR), `MX5`, `GT3`, `For Gretta`, `Taca Caio Wohnrath`, `Endurance Series`, `Velozes e Charmosas`, `Wohnrath FunCup`, `Alpine`, `DTM`. Confirme com o dono as novas.
- Grand Chelem ⇒ marque Pole, Best Lap, Hat-Trick e Chelem como `SIM` (precedente: Santa Cruz do Sul, Stock Car 2007). Só Hat Trick: sem Chelem.
- `Link` = `#N/A` quando não há transmissão. Os links do YouTube do Stock Car existem por pista; o dono preenche.
- O arquivo **não termina com quebra de linha**: ao dar `>>` adicione `printf '\n'` antes.

## 5. Piloto campeão e construtores

Classificação final em `/campeonatos/<slug>/`. Nenhum piloto nosso foi campeão em 2026 (Stock Car 2007: Rafael Iwata; Chevette ainda em andamento, Flavio é 2º com 252 pts). `Construtores` não verificado.

## 6. Cuidados do que já aconteceu

- Linhas da **VORC Series** (Stock Car Sudam: Buenos Aires e La Chutana) estavam lançadas aqui por engano e duplicadas; o CSV de pendências pede a remoção (`REMOVER`).
- No Girusbag/Funcup/Alpine/DTM (2020–2022) o site e o CSV divergem em ~13 posições por um ponto (provável reclassificação posterior no site). Foram listadas como `AJUSTE` para o dono decidir; pilotos que abandonaram (`DNF`) não aparecem no site e foram mantidos.
- `Luiza Biesus | Velozes e Charmosas | Interlagos | 4` não tem correspondente no site (a Isabel fez 4º; a Luiza fez 7º). Não foi mexida; vale perguntar.

## 7. Conferência (obrigatória antes de dizer "só falta isso")

1. Compare por categoria/pista/piloto/posição o CSV (`awk -F, '$12=="Campeonatos Classicos"'`) com a tabela de cada etapa (todas as tabelas de classe).
2. Confira pole, VR, Hat Trick e Chelem pelos `.award-text` e pelo `Pts`.
3. Não verificado em 29/10/2026: pilotos da Grip que não estejam nos 11 nomes acima; eventos Time Trial e 4fun (fora de escopo: no Racing Bears o dono mandou tirar o 4fun); poles e VR dos campeonatos 2019–2022 (o site não publica); Chevette Turbo etapas 7 e 8; BPR etapa 2.

## 8. CSV de pendências

Mesmo cabeçalho de 17 colunas (as duas de chave em branco: `...,Ano,,,Link Transmissao`) mais `Acao`: `NOVA`, `AJUSTE (campo: antigo -> novo)` ou `REMOVER (motivo)`. Arquivo: `pendencias-campeonatos-classicos.csv` na raiz. Não edite `data/*.csv`, não rode `update-data.ps1`, não commite: o dono atualiza o Google Sheets e avisa.

## 9. Depois de editar (quando o dono pedir)

Igual às outras skills: `update-data.ps1` baixa os 3 CSVs, incrementa `DATA_VERSION` e regenera `assets/pilotos/manifest.json`. Windows sem `python`/`node`: use `awk`/`sed`/`grep` (Git Bash) ou PowerShell. `fetch` do navegador para `127.0.0.1` é bloqueado, então traga os dados de volta como texto.

## Registro

29/10/2026: levantamento completo; `pendencias-campeonatos-classicos.csv` gerado (36 linhas novas, 1 ajuste de Chelem, 8 remoções, 13 ajustes históricos). Ainda não aplicado.
