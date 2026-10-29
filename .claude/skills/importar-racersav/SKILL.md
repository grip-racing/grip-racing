---
name: importar-racersav
description: Confere e importa os resultados da Grip Racing na liga RacersAv (racersav.com.br) contra data/data-participacoes.csv, usando o site atual (Wix) e o Internet Archive (Wayback Machine) para o histórico. Use quando pedirem para atualizar, comparar ou achar o que falta nos resultados dos pilotos na liga RacersAv.
---

# Importar resultados da RacersAv

Fonte atual: https://www.racersav.com.br/ ("RAV Liga Racersav", site Wix).
Fonte histórica: Internet Archive (`web.archive.org`) — **cobre só 2017 e 2018** (ver seção 1).
Destino: `data/data-participacoes.csv` (linhas com a coluna Liga = `RacersAv`; note o "s" minúsculo e o "A" maiúsculo).

## Estado verificado em 29/10/2026 (leia antes de buscar qualquer coisa)

- O CSV já tem **437 linhas RacersAv**, de `2018-2` (F3) a `2024-1` (Sprint Race), 43 pilotos, vindas da planilha do dono. Não há linha de 2017 (a Grip não aparece em nenhuma página arquivada de 2017) nem de `2024-2` em diante.
- **Dois domínios.** `racersav.com.br` (WordPress) só tem captura até 20/09/2018 (e `sls.` até nov/2018). O Wix antigo era **`www.ligaracersav.com.br`**, com capturas de **2019 a nov/2025** (ver "Site antigo ligaracersav.com.br"). O Wix atual (`racersav.com.br`, 2026) não tem captura.
- **Em nenhuma das duas eras as tabelas de classificação foram salvas**: são imagens (`wp-content/uploads/...png` em 2017–2018; `static.wixstatic.com/media/...~mv2.*` em 2019–2025) e a CDX/replay não as têm (testado). O Archive guardou **texto**: notícias, regulamento com lista de inscritos (piloto – equipe), punições com nomes abreviados, calendários, o SLS de 2017 e 14 PDFs de classificação de 2023.
- No site atual os resultados **também são imagens** (Wix, `static.wixstatic.com/media/...~mv2.jpg`): `get_page_text` devolve só o título ("RESULTADO FINAL R5"). É preciso abrir o print e ler visualmente, e a tabela **não tem coluna de equipe** (identifique a Grip pelo nome do piloto).

Conclusão prática: esta skill serve para (a) **auditar** 2018 contra o texto arquivado, (b) levantar **2025+** a partir do site vivo e (c) montar a lista de pendências para o dono. Não prometa "só falta isso" para 2019–2024.

## 1. Internet Archive: como usar sem tomar bloqueio

- Índice: `https://web.archive.org/cdx/search/cdx?url=racersav.com.br&matchType=domain&output=txt&fl=timestamp,original,statuscode&collapse=urlkey&from=2018&to=2018`
  - Consultas grandes (domínio inteiro sem `from`/`to`) derrubam o serviço: responde um HTML "Internet Archive: Temporarily Offline" com status 200, ou `429 Too Many Requests`. **Sempre detecte isso no corpo** (`grep -q 'Temporarily Offline\|429 Too Many'`) e tente de novo após 20–30 s. Consulte por ano, com `limit`.
  - Resposta vazia (0 bytes) é resultado real "sem capturas", não erro.
  - `limit=-1` devolve a última captura (jeito rápido de achar o fim da cobertura de uma URL).
- Conteúdo: `https://web.archive.org/web/<timestamp>id_/<url-original>` (o `id_` devolve o HTML original, sem a barra do Wayback). Nas URLs antigas o original traz `:80` (`http://www.racersav.com.br:80/...`): remova.
- Em 2017–2018 o site era WordPress (tema fitcoach, plugin events-manager). Estrutura: `/campeonatos/AAAA-2/tN/<categoria>/` com subpáginas `classificacao/`, `race-control/`, `regulamento/`, `pre-briefing/`; notícias na raiz (`/<slug-da-noticia>/`); `/category/noticias/`. Para varrer: filtre a CDX tirando `wp-content|wp-includes|wp-admin|wc-ajax|\?p=|\?s=|/author/`.
- Script de download com retry (≈1 página a cada 4–20 s; as ~150 páginas de 2017–2018 levam ~10 min, rode em segundo plano):

```bash
#!/bin/bash
# uso: fetch-wb.sh <lista "timestamp url"> <pasta destino>
while read -r ts url; do
  url=${url/:80\//\/}
  f="$2/$(echo "$url" | sed -E 's#https?://[^/]+/##; s#[^A-Za-z0-9]+#_#g').html"
  [ -s "$f" ] && continue
  for t in 1 2 3 4 5; do
    curl -s -m 90 "https://web.archive.org/web/${ts}id_/${url}" -o "$f"
    head -c 300 "$f" | grep -q 'Temporarily Offline\|429 Too Many' || break
    rm -f "$f"; sleep 20
  done
  sleep 3
done < "$1"
```

  Ambiente Windows/Git Bash: **não existe `pgrep`**; para esperar o término, conte arquivos na pasta de destino. Salve tudo no scratchpad, não no repo.
- SLS (`sls.racersav.com.br`, sistema de resultados do rFactor 1, "MaXyM"): só 2017 (IDseason 4, 5, 6) foi arquivado (`dest=standdrv`, `standteam`, `resevent`, `calendar`). Verificado: **nenhum piloto da Grip aparece**. Não vale revisitar.

## 2. Achar a Grip nas páginas arquivadas

1. Baixe as páginas e procure `grip` (equipe) **e** os nomes dos pilotos já usados no CSV RacersAv (lista abaixo). Limpe o HTML com `sed 's/<script.*<\/script>//g; s/<[^>]*>/ /g'` antes de procurar contexto.
2. Onde a equipe aparece de fato:
   - **Notícias de corrida** citam "Nome (Grip Racing)". Ex.: "Atuação de gala para Cristiano Bohessef em Interlagos" (F3 Interlagos, 2018): Charles Zimmermann (Grip Racing) 2º no pódio, João Augusto (Grip Racing) 4º, Fernando Horta (Grip Racing) citado; pole do Bohessef 1:27.010. Bate com as linhas `F3 / 2018-2` do CSV.
   - **Regulamento com lista de inscritos** (`.../regulamento/`) traz "NN- Nome – Equipe". Stock Car 2018 T1: **`18- Luiz Silva – Grip Racing`**. Luiz Silva **não está no CSV**; sem tabela de resultado não dá para saber se correu: vai como "a confirmar com o dono". No Montana Cup 2018 T1 Augusto Maia estava na "Akina Speed Stars" (depois aparece como Grip no CSV, `Montana / 2018-3`): mudança de equipe, não é erro.
   - Nome de equipe na RacersAv: `Grip Racing` (no CSV a coluna Equipe é `Grip Racing`).
3. Race-control (punições/protestos) não traz classificação; só serve para confirmar piloto/etapa/pista (ex.: Diego Acebedo, Stock Car 2018, etapas Cascavel e Velopark, aparece lá por outra equipe: MyP e-Sports).

## 3. Site atual (Wix): como levantar 2025+

- `https://www.racersav.com.br/pages-sitemap.xml` lista as páginas atuais (sem datas por corrida): `stockcar-t1-2026`, `rav-gt-challenge-t1-26`, `rav-gt3-challenge-t2-2026`, `rav-wec`, `rav-wec-t2-2026`, `wec-racersav-t3`, `imsa-brasil-t2-2026`, `stock-car-ams-2-t4-fase-3`, `classificação-<campeonato>` e `pilotos-<campeonato>`. `curl` na página já devolve o HTML do Wix (SSR), mas o conteúdo útil (classificação) é imagem.
- `/classificação-stockcar-t1-26` etc. mostra "RESULTADO FINAL Rn" + print da tabela (`Posição, Pilotos, Carro, Total, Descarte, pontos por etapa`). `pilotos-*` costuma estar "GRID EM FORMAÇÃO" (vazio). As páginas têm links do YouTube das transmissões (úteis para a coluna Link).
- **Imagens do Wix não baixam por `curl`**: `static.wixstatic.com/media/...~mv2.jpg` devolve 403 (com ou sem `/v1/fill/...`). Não tente contornar (UA/Referer falsos). Leia a imagem **pelo navegador do app**: `navigate` na página, `find` pela imagem, `scroll_to` e `zoom` na região da tabela (a imagem tem só ~673 px de largura; números pequenos podem ficar ambíguos, confira duas vezes). `get_page_text` só traz o título.
- URLs com acento precisam ir codificadas: `/classifica%C3%A7%C3%A3o-stockcar-t1-26` (sem codificar, o `curl` dá 404).
- O site vivo só tem **2026** (e páginas-modelo de inscrição, como `stock-car-ams-2-t4-fase-3`, com "Inscrições/Aguardem" e sem resultado). Não há páginas de 2024-2 nem de 2025: o conteúdo antigo foi substituído e o Archive não tem cópia. Para 2024-2 e 2025 só sobram o dono/planilha, o Discord da liga, o canal de YouTube das transmissões (os links estão nas páginas) e o Instagram `@racersav`; busca na web não indexa nada.
### Mapa de 2026 (levantado em 29/10/2026)

Cada campeonato tem a página principal (regulamento + **calendário em texto**: pista e data de cada etapa) e, quando acabou, uma página `classificação-*` com o print da tabela. Pilotos "GRID EM FORMAÇÃO" e as páginas `categorias...` (iframe `wix-visual-data.appspot.com`, só legível por captura de tela rolando) listam nomes.

| Campeonato | Página | Etapas | Estado |
|---|---|---|---|
| RAV GT Challenge T1 (LMGT3 em Grupo A/B + LMP2 Oreca) | `rav-gt-challenge-t1-26` / `classificação-rav-gt-challenge` | Spa 20/05, Portimão 03/06, Monza 17/06, Interlagos 01/07, Sebring 15/07 | acabou; lido |
| RAV WEC T1 (Hypercars, Pro-Am, Am) | `rav-wec` / `classificação-rav-wec` | Le Mans 11/06, Interlagos 25/06, Monza 09/07, Imola 23/07, Spa 06/08 | acabou; **nenhum piloto do CSV** |
| RAV Stock Car T1 (AMS2, Cruze/Corolla 2023) | `stockcar-t1-2026` / `classificação-stockcar-t1-26` | Goiânia 16/07, Interlagos 30/07, Salvador 13/08, Brasília 27/08, Curitiba 10/09 | acabou; lido |
| RAV WEC T2 | `rav-wec-t2-2026` (+ cópia `cópia-rav-wec-t2-2026`) | Silverstone 24/09, Daytona 08/10, Fuji 22/10, Laguna Seca 05/11, Barcelona 19/11 | em andamento, sem classificação publicada |
| RAV GT3 Challenge T2 | `rav-gt3-challenge-t2-2026` | Silverstone 30/09, Daytona 14/10, Fuji 28/10, Laguna Seca 11/11, Barcelona 25/11 | em andamento, sem classificação |
| IMSA Brasil T2 | `imsa-brasil-t2-2026` | Santa Cruz 23/09, Jacarepaguá 07/10, Tarumã 21/10, Londrina 04/11, Velo Città 18/11 | em andamento, sem classificação |
| WEC Racersav T3 e Stock Car AMS2 T4 fase 3 | `wec-racersav-t3`, `stock-car-ams-2-t4-fase-3` | sem calendário | só inscrição ("Aguardem") |

Grip encontrada **só por nome** (as tabelas não têm equipe; o dono confirmou em 29/10/2026 que os 5 nomes abaixo são todos da Grip): GT Challenge T1: **Marcelo Eduardo** (Grupo A, 4º, Aston Martin), **Gustavo Sugari** (Grupo B, 2º, Aston Martin), **Robert Johen** (Grupo B, 5º, Aston Martin); Stock Car T1: **Ader Fernando** (2º) e **Robert Johen** (6º). As listas de categorias (IMSA T2 e Le Mans Ultimate) trazem os mesmos nomes (Ader Pro; Gustavo Pro-Am GT3; Marcelo e Robert Am GT3). Pedir confirmação ao dono de que são os da Grip.

Como ler a tabela do print: cada etapa tem `Rn` (posição) e `PTS`; célula azul = etapa descartada ou ausente (`0`); vermelho = punição em pontos (ex.: Gustavo Sugari no Spa, 4º, 27 pts = 37 − 10). Fecha a conta: some os PTS menos o descarte e compare com `Total`. No GT Challenge **a posição `Rn` é a da classe LMGT3 inteira** (Grupo A e B correm juntos; 1…15 sem repetir), então vale como `Final` (não a posição dentro do grupo). Escala de pontos vista: 1º 50, 2º 44, 3º 40, 4º 37 (GT) / 36 (Stock), 5º 34/32, 6º 32/30.

Campeonato que cruza a divisão de temporada (Stock Car T1: 16/07–10/09, a divisa é meados de agosto): lançado como `2026-2` por começar em julho e ter 3 de 5 etapas até 13/08; **o dono decide** se prefere `2026-3`.

**Histórico no menu CORRIDAS** (uma transmissão do YouTube por campeonato; só título, o YouTube não entrega descrição/resultado): 2024 Sprint Race, iRacing GT3, **IMSA (etapa 05 da 1ª temporada, Mount Panorama)**; 2025 **Stock Car (T2/2025, etapa 2 em Interlagos)**, **iRacing GT3**, **Le Mans Ultimate**. Mostram que existiram campeonatos em 2024-2 e 2025 sem página de resultados: só o dono/planilha.

### 2024-2 e 2025: só calendário (YouTube CRAV TV), sem resultado

O canal **CRAV TV** (`https://www.youtube.com/@CRAVTVOFICIAL`, "RACERSAV" é uma playlist de 50 vídeos) transmite todas as etapas; título e descrição trazem campeonato, etapa, pista e data ("Hoje dia 08 de Setembro de 2025 a partir das 21:40, vamos transmitir a 4º Etapa..."), **mas nunca resultado nem lista de pilotos** (o título do vídeo é o único dado; a descrição é só convite). `WebFetch` no YouTube devolve só o título. Para listar tudo: abra `/@CRAVTVOFICIAL/search` no navegador do app (a página demora ~10 s para carregar), rode um script que rola a página (`window.scrollTo`) a cada 1,5 s e junte `ytd-video-renderer #video-title` + `#metadata-line` (~85 vídeos em ~40 s). `get_page_text` sozinho traz só os primeiros.

Equivalências com o CSV: o "Sprint Race 2024" do menu do site = **E-Stock Car 2024** (pré-temporada Tarumã; etapas Velocitta, Interlagos, Cascavel, Curitiba, Goiânia, mais Buenos Aires) e já está no CSV como `2024-1`. O resto não está:

| Campeonato (título do YouTube) | Etapas / pistas (data quando conhecida) |
|---|---|
| Audi TT RS (2024) | 1 Spa, 2 Road America, 3 Imola |
| GT3 T2 (2024) | 1 Zolder, 2 Red Bull Ring, 3 COTA, 4 Brands Hatch, 5 Spa, 6 Oulton Park, 7 Imola |
| GT3 T3 (2024) | 1 Paul Ricard, 2 Spa, 3 Zandvoort, 4 Nürburgring, 5 Monza |
| IMSA 2024 (menu do site) | "etapa 05 da 1ª temporada 2024", Mount Panorama |
| Stock Car T2/2025 | 1 Cascavel, 2 Interlagos (19/05), 3 Londrina, 4 Velo Città (16/06), 5 Goiânia (30/06) |
| GT3 Oficial Cup T2/2025 | 1 Road America, 2 Road Atlanta, 3 Sebring (22/05), 4 Monza |
| Stock Car T3/2025 | 1 Termas de Río Hondo, 2 Curitiba (11/08), 3 Jacarepaguá (25/08), 4 Goiânia Ext (08/09), 5 Guaporé |
| GT3 Oficial Cup T3/2025 | 1 Virginia (24/07), 2 Interlagos (07/08), 3 Road America (21/08), 4 Nürburgring (04/09), 5 Daytona (18/09) |
| iRacing GT3 2025 e Le Mans Ultimate 2025 (menu do site) | sem título de etapa no canal levantado |

Não há como saber quais pilotos da Grip correram: o dono precisa informar (ou passar os prints/planilha dessas etapas) para montar as linhas. Os "T1/2025" não apareceram no canal. Datas de 2024 não foram abertas (YouTube só diz "há 2 anos"): abrir o vídeo para ver a data se for necessário definir a temporada.

### Site antigo `ligaracersav.com.br` no Internet Archive (2019–2025): é aqui que está o histórico

**Correção do que consta na seção 1/Estado:** o Wix antigo da liga ficava em **`www.ligaracersav.com.br`** (não `racersav.com.br`) e **tem capturas de 2019 a 2025** (398 URLs 200; 106 de 2024, 69 de 2025; última de nov/2025). O domínio `racersav.com.br` só foi capturado até 2018, e o `ligaracersav` até 2025-11. O Wix novo (`racersav.com.br`) não tem captura.

- Índice: `cdx/search/cdx?url=ligaracersav.com.br&matchType=domain&output=txt&fl=timestamp,original,statuscode,mimetype&collapse=urlkey&filter=statuscode:200&limit=3000` (uma chamada deu 398 linhas; use `limit` alto, sem `from/to`, com retry).
- Páginas por campeonato: `classificação-<camp>`, `pilotos-<camp>`, `<camp>` (regulamento/calendário) e menu superior com os campeonatos ativos de cada época (ex.: "AUTOMOBILISTA 2 STOCK CAR - 2024", "IMSA - T2 - 2024", "ASSETTO CORSA AUDI TT RS - T2 - 2024", "IRACING GT3 - T2 - 2024", "ASSETTO COMPETIZIONE GT3 - T2 - 2024", "GRID 2 - GT3 - T2", encerrados T1-2024: GT3 iRacing, GT3 ACC, IMSA, Sprint Race). Slugs 2025: `classificação-t1-25-gt3-acc`, `classificação-gt3-oficial-cupt1-2025`, `classificação-imsa-t1-2025`, `classificação-stockcar-t2`, `classificação-stock-car-t3`, `classificação-wec-t2`, `classificação-gt3-fixedcup-t2`, `classificação-gt3-ir-t3`, `t3-classificação-lmgt3`, `gt3-oficial-cup-t4`, `lm-gt3-cup-t4`, `elms-ams-2-t4`, `stock-car-ams-2-t4-fase-3`, `f1-automobilista2-t4-2025`, `mini-challenge-ams-2-t4`.
- **A tabela de classificação é imagem Wix (`static.wixstatic.com/media/b11d49_*~mv2.*`) e NÃO foi arquivada** (CDX vazio; replay devolve 404; só existem miniaturas de 2022). O HTML guarda o **texto** da página: o bloco **PUNIÇÕES / PENALIZAÇÕES APLICADAS** com "Piloto Acusado / Lance com / Volta / Punição", em abreviação (`R.Johen`, `G.Sugari`, `P.Cenjor`, `M.Costa`). Regex para achar a Grip: `(^|[^A-Za-z])(<Inicial>\.? ?<Sobrenome>|<Nome> <Sobrenome>)([^A-Za-z]|$)` sobre o texto limpo (remover `<script>`/`<style>`/tags e decodificar `&ccedil;` etc.).
- **PDFs** (`_files/ugd/b11d49_*.pdf`, 14 arquivos, capturas mai/2024–mai/2025): são **classificações de 2023 e início de 2024** como imagem dentro do PDF (a camada de texto só tem rótulos). Conteúdo visto: Stock Car T2 2023 R6 Goiânia (Visamundo GRIP Racing: Luis Almeida 387 pts, Pablo Cenjor 335, Gustavo Sugari 309, Rubens Algazi 265; Robert Johen aparece por "Go Mifune Racing"), GT3 iRacing RacersAv Interlagos Final (Pablo Cenjor e Rene Melo "Visamundo Grip Racing", Lucas Ripke "Grip Racing"), GT3 ACC T2 2023 Valencia (R6 GRD 1 e G2 R5), GT3 iRacing T3 2023 R6, GT3 ACC T3 R6. Todos da era já no CSV: servem para **conferir**, não para o que falta. Cuidado: em 2023 a equipe era **"Visamundo Grip Racing"** (e "Grip Racing") — o CSV usa `Grip Racing`.
- **Como ler PDF aqui** (sem `pdftoppm`/Python/Node; `pdftotext` só dá os rótulos; `Read` com `pages` falha; o navegador do app **baixa** o PDF em vez de mostrar): baixe o PDF em `<scratch>/liga/pdf/`, crie `viewer.html` com **pdf.js 3.11.174 do cdnjs** (renderiza cada página num `<canvas>`; título da aba vira `done N` ao terminar), suba um servidor mínimo em PowerShell (`System.Net.HttpListener` em `http://localhost:8765/`, tipo `application/pdf`) em segundo plano e navegue `http://localhost:8765/viewer.html?f=<arquivo>&s=1.4`; leia com `computer screenshot`/`zoom` (e `scroll`). Encerre o servidor depois (`TaskStop`).

**Participação da Grip em 2024–2025 comprovada só pelo texto de punições** (sem posições; o dono precisa passar os prints/planilha):

| Piloto | Onde aparece | Captura | No CSV? |
|---|---|---|---|
| Marcelo Eduardo | `classificação-stock-2024-1` (Stock Car 2024, AMS2): punição Grave 2 (−4 pts) em lance com T. Gomes, volta 31 | 20/06/2024 | não |
| Robert Johen | `classificação-imsa-t1-24` (IMSA T1 2024): punição de bandeira azul em lance com T. Gomes, volta 11 | 21/04/2024 | não |
| Gustavo Sugari | `classificação-t1-25-gt3-acc` (GT3 ACC T1 2025, R2): vítima de incidentes com E. Rodrigues (volta 2) e R. Lopes (volta 7) | 08/02/2025 | não |
| ~~Diego Acebedo~~ | `classificação-gt3-ir-t3` (iRacing GT3 T3 2025, R2): punido −7 pts | 13/08/2025 | **descartado: o dono confirmou (29/10/2026) que o Diego de 2025 não correu pela Grip** (ver regra abaixo) |
| Pablo Cenjor, Robert Johen | `classificação-stock` (capturada 03/2024; Sprint/E-Stock Car), Felipe Faria em `classificação-sprint-t1-24` | 03/2024 | sim (`2024-1` Sprint Race) |

**Regra:** casar só pelo nome **não basta** em 2024–2025 (nome de piloto do CSV pode ser de quem saiu da equipe ou de homônimo; Diego Acebedo foi o caso). Só vale como "da Grip" o piloto que o dono confirmar, ou com equipe Grip escrita na fonte. Status em 29/10/2026: o dono **não tem prints nem planilha** de 2024-2/2025, então esse período fica **sem lançamento**; Marcelo Eduardo (Stock Car 2024), Robert Johen (IMSA T1 2024) e Gustavo Sugari (GT3 ACC T1 2025) seguem como "participou, sem posição".

Nenhum outro piloto do CSV aparece nas ~145 páginas de 2024–2025 (buscados por nome completo e por inicial+sobrenome). Isso **não prova ausência**: só quem foi punido ou envolvido em incidente aparece no texto. Páginas `pilotos-*` são imagem.

### Tentativas que NÃO funcionam para 2024-2/2025 (não repetir)

- **Imagens Wix no Archive**: só 34 imagens de `b11d49_*` de 2024+ (logos/ícones). Nenhuma tabela. Replay das URLs da página devolve 404.
- **PDFs**: os 14 arquivados são de 2023.
- **Vídeo do CRAV TV**: testado no Stock Car T3/2025 etapa 5 (Guaporé, 1h30). Dá para pular no tempo pelo navegador (`document.querySelector('video').currentTime = ...`; `duration` disponível), mas o fim do vídeo é só carros do pódio + entrevistas, e a única tabela na tela é o HUD do jogo com **9 posições e nomes abreviados** (`I. Soares[A]`, `T. Gomes[A]`). Não mostra a classificação completa nem equipe: só serviria para piloto que termine no top 9, e exige muitas capturas por etapa. Não compensa.
- **Busca na web / Instagram**: nada indexado.
- Fontes realistas: **Discord/WhatsApp da liga** (os resultados e a "TABELA PDF" são postados lá), o e-mail da liga `racersav01@gmail.com` e os próprios pilotos da Grip que correram (prints de classificação).

## Data de corte

**Levantado em 29/10/2026**: tudo o que o site publica de 2026 (GT Challenge T1, WEC T1, Stock Car T1). As 23 linhas NOVA geradas já foram **aplicadas na planilha pelo dono e baixadas** (v1.0.36; RacersAv 437 → 460 linhas; categorias `GT Challenge`/`Stock Car` e `2026-2` aceitas). Não regerar essas linhas. Próxima rodada: T2 de 2026 (WEC, GT3 Challenge, IMSA) quando saírem as classificações (WEC 19/11, GT3 25/11, IMSA 18/11) e campeonatos novos; 2024-2 e 2025 dependem do dono.

## 4. Pilotos já no CSV (RacersAv), por nº de linhas

Pablo Cenjor 38, Marcelo Eduardo 38, Matheus Saliba 25, Rodrigo de Sousa 22, Gustavo Sugari 21, Augusto Maia 20, Fred Quintao 18, Lucas Ripke 17, Luis Almeida 16, Carlos Quintao 16, Joao Augusto 15, Alex Comerlato 15, Charles Zimmermann 14, Rubens Algazi 12, Eliezer Meletti 12, Bidu Fiel 11, Rene Eskudeiro 10, Flavio Felicio 10, Fernando Horta 8, Arthur Argenta 8, Hiago Cosmann 7, Felipe Fargnolli 7, Diego Acebedo 7, Robert Johen 6, Matheus Beraldo 6, Helder Cunha 6, Fabio Soga 6, Silas Viana 5, Juliano Flores 5, Felipe Faria 5, Alexandre Ruiz 5, Alexandre Reys 4, Ader Fernando 4, Walisson Oliveira 3, Rademax Barbosa 3, Tiago Oleinki 2, Rodrigo Sugari 2, Paulo Galvao 2, Gilberto Zago 2, Victor Ribeiro 1. (Regerar com `awk -F, '$12=="RacersAv"{print $4}' data/data-participacoes.csv | sort | uniq -c | sort -rn`.)

Nomes no CSV vão **sem acento**.

## 5. Temporadas já usadas no CSV (RacersAv)

`2018-2` F3 (31 linhas); `2018-3` AJR, Boxer, Lancer, Mini, Montana (Interlagos); `2019-1` Opala 86; `2019-2` 300km Goiania, Classic, GT3; `2019-3` 250 KM Interlagos (Boxer/Lancer/Marcas/Mini/Montana); `2020-1` GT Challenge Light/Rookie, Stock Car Light, WTCC; `2020-2` WTCC; `2020-3` Evento anual, GT3, GT3 ACC, Stock Car, TCR; `2021-1` 2 Horas Brasilia; `2021-2` Z4 Cup; `2021-3` DTM, Fanatic GT3 Series, GT3; `2022-2` IRB Touring Cars, RacersAv GT Challenge; `2022-3` GTE Challenge; `2022-4` Mini Challenge; `2023-1` Mini Challenge AM/PRO; `2023-2` GT3 Iracing, Stock Car; `2024-1` Sprint Race.

Regra de temporada igual às outras ligas (`AAAA-1` jan–meados de mar; `-2` meados de mar–meados de ago; `-3` meados de ago–dez). Atenção: o site antigo usa `campeonatos/2018-2/t1|t2|t3` com **outro** sentido (semestre/temporada da liga) — não copie esse "2018-2" para a coluna Temporada, calcule pela data da corrida. O CSV tem uma temporada `2022-4`, então a regra não é rígida: confirme com o dono em caso de dúvida.

## 6. Formato da linha

17 colunas: `Final,Categoria,Pista,Piloto,Equipe,Pole,Best Lap,Hat-Trick,Chelem,Piloto Campeao,Construtores,Liga,Temporada,Ano,Chave1,Chave2,Link`

```
2,F3,Interlagos,Charles Zimmermann,Grip Racing,-,-,-,-,-,-,RacersAv,2018-2,2018,F3/RacersAv/2018-2,F3/RacersAv/2018-2/Interlagos,#N/A
```

- `Equipe` = `Grip Racing` (diferente do VORC, que deixa vazio). `Liga` = `RacersAv`. Chave1 = `Categoria/Liga/Temporada`; Chave2 = Chave1 + `/Pista`. `Link` = `#N/A` sem transmissão.
- Pista sem acento, e com sufixo ` 2` quando repete na temporada/categoria. O arquivo **não termina com quebra de linha**: ao dar `>>`, faça `printf '\n'` antes.
- Final = posição de chegada (use a classe quando houver carros diferentes). Sem resultado confiável: **não invente posição**; registre como pendência "a confirmar".
- Pole/Best Lap/Hat-Trick/Chelem/Piloto Campeao/Construtores: só marque `SIM` com fonte (notícia do site, tabela). Na dúvida, `-` e avise o dono.

## 7. Conferência

1. Para cada campeonato/temporada, compare as linhas do CSV (`awk -F, '$12=="RacersAv" && $13=="AAAA-N"'`) com a fonte (notícia, lista de inscritos ou print de classificação) por pista, piloto e posição.
2. Verificado em 29/10/2026 contra o Archive: F3 `2018-2` Interlagos bate com a notícia (Charles e João Augusto no top 5, Fernando Horta no grid). **Felipe Fargnolli tem 1 linha em Interlagos F3 enquanto os outros três têm 2** (uma por bateria): conferir com o dono se ele correu só uma bateria.
3. Pendências levantadas: **Luiz Silva (Grip Racing, Stock Car 2018 T1)** a confirmar; **2025–2026** não levantados.
4. Não verificável pelo Archive: qualquer resultado de 2019–2024 e todas as posições finais de 2018 (as imagens de classificação não foram arquivadas).

## 8. CSV de pendências

Mesmo cabeçalho de 17 colunas do `data-participacoes.csv` (`...,Ano,,,Link Transmissao`) mais a 18ª coluna `Acao`: `NOVA` ou `AJUSTE (campo: antigo -> novo)`, uma linha completa por pendência com o valor final; itens duvidosos ficam fora do CSV e vão na resposta ao dono. Gerar em `pendencias-racersav.csv` na raiz. Não edite `data/*.csv`, não rode `update-data.ps1`, não commite: o dono atualiza o Google Sheets e avisa.

## 9. Depois de editar (quando o dono pedir)

Igual às outras ligas: `update-data.ps1` baixa os 3 CSVs, incrementa `DATA_VERSION` e regenera `assets/pilotos/manifest.json`; `data-pilotos.csv` e `data-stats.csv` são agregados mantidos à mão (a linha `RacersAv` de `data-stats.csv` tem os totais da liga). Sem `python`/`node` no shell: use `awk`/`sed`/`grep` (Git Bash) ou PowerShell.

## Registro

29/10/2026: skill criada. Levantamento do Archive: domínio capturado só de 03/2017 a 09/2018 (+ `sls.` até 11/2018); ~150 páginas de texto baixadas e cruzadas com os 43 pilotos do CSV; achados: notícia do F3 Interlagos (confere) e Luiz Silva (Grip, Stock Car 2018 T1, não está no CSV). Nenhuma pendência aplicada na planilha.

29/10/2026 (2ª passada): checado 2024-2 em diante. Archive: nada. Site vivo: só 2026. Busca na web: nada. Lido o Stock Car T1 2026 (Ader Fernando e Robert Johen no top 6, a confirmar). Resto de 2026 não aberto.

29/10/2026 (3ª passada): 2026 inteiro levantado (ver "Mapa de 2026"). `pendencias-racersav.csv` com 23 linhas NOVA (GT Challenge T1: Marcelo Eduardo 5, Gustavo Sugari 5, Robert Johen 4; Stock Car T1: Ader Fernando 5, Robert Johen 4), todas com Pole/VR/campeão `-` (as tabelas não trazem) e Link `#N/A`. Categoria usada: `GT Challenge` e `Stock Car` (dono confirma o nome).

29/10/2026 (fechamento): pendências de 2026 aplicadas na planilha e baixadas com `update-data.ps1` (v1.0.36). RacersAv: 460 linhas (2026-2: GT Challenge 14, Stock Car 9). 2024-2 e 2025 seguem sem lançamento (sem fonte: ver "Tentativas que NÃO funcionam"). Próximas rodadas: T2 de 2026 (WEC, GT3 Challenge, IMSA) depois de 19–25/11/2026.
