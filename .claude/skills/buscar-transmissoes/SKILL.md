---
name: buscar-transmissoes
description: Encontra e confere links de transmissões e reprises para a coluna Link Transmissao da base da Grip Racing. Use para preencher links ausentes ou corrigir links de etapas de automobilismo virtual.
---

# Buscar transmissões das etapas

## Identificar o que falta

- Use `data/data-participacoes.csv` e filtre pelo recorte pedido. Para preencher lacunas, procure `Link Transmissao` vazio ou `#N/A`. Para corrigir links, confira as linhas indicadas e preserve os links existentes que correspondem à prova.
- Agrupe a busca por liga, temporada interna, categoria e pista. Confirme a data, o número da etapa e a bateria ou grid quando houver mais de um. Pistas com sufixo `2` podem representar outra etapa ou bateria. A temporada interna segue o trimestre de início do campeonato e pode diferir do número da temporada no título do vídeo.
- Comece pelos links existentes nas outras linhas da mesma etapa. Um link pode servir para vários pilotos ou baterias quando a transmissão cobre todos eles. Se houver transmissões separadas de PRO e AM, use a do grid correspondente a cada piloto.

## Buscar nas fontes da liga

| Liga | Por onde começar |
|---|---|
| Campeonatos Clássicos | Abra a etapa ou especial em [Eventos](https://campeonatosclassicos.com.br/eventos) e procure **Assistir Transmissão**. Por exemplo, o botão aparece na [etapa 8 do Chevette Turbo em Interlagos](https://campeonatosclassicos.com.br/campeonatos/copa-chevette-turbo/race-8). |
| Racing Bears | Use [Eventos](https://www.racingbearstv.com.br/eventos) para identificar etapa, data e grid. Procure a data e a pista na aba **Ao vivo** do [canal Racing Bears TV](https://www.youtube.com/@RacingBearsTV/streams). |
| VORC Series | Abra o campeonato no analisador indicado na [skill da VORC](../importar-vorc-series/SKILL.md) e use o autódromo e a data do relatório. O nome no seletor de etapas pode divergir do autódromo real. Confira as notícias da etapa no [site da VORC](https://www.vorcseries.com.br/), que pode incorporar a reprise, e busque pelo título oficial, incluindo o patrocinador. As etapas de Suzuka e Okayama da Super Formula 2026/5 foram transmitidas pela [ellevenTV](https://www.youtube.com/@ellevenTV/streams). |
| RacersAv | Confira os vídeos nas páginas de classificação e procure a etapa no [canal CRAV TV](https://www.youtube.com/@CRAVTVOFICIAL). Consulte a [skill da RacersAv](../importar-racersav/SKILL.md) para localizar páginas e campeonatos. |
| F1BC | Para campeonatos a partir de 2020, comece pela [ellevenTV](https://www.youtube.com/@ellevenTV/streams). Confira também o [canal oficial F1BC Esports](https://www.youtube.com/@F1BCesports/streams), sobretudo para especiais e temporadas antigas, e o [Acervo F1BC](https://www.f1bc.com/legacy), onde a matéria da etapa pode trazer um vídeo incorporado. Se o título ou o vídeo da matéria divergir do calendário, confirme a etapa antes de usar o link. |

Para outras ligas, comece pela página oficial do campeonato e pelo canal indicado pela organização. Se a etapa não tiver link, busque pelo nome oficial do campeonato, pista, número da etapa e data. Priorize a transmissão completa da liga ou da emissora indicada por ela. Destaques, treinos, anúncios e transmissões de outro grid ficam fora, salvo pedido específico.

## Confirmar e registrar

1. Abra o vídeo e confira título, descrição e data da prova. Quando o título for genérico, use o link publicado na página oficial da etapa ou evidência na própria gravação. Se os indícios forem insuficientes, registre o candidato à parte e mantenha a linha como está.
2. Grave a URL direta do vídeo. Para YouTube, prefira `https://www.youtube.com/watch?v=ID`, sem parâmetros de rastreamento. Se a mesma prova foi transmitida em partes, junte as URLs na ordem da transmissão com `||`, como nos especiais do F1BC. Um link de canal, playlist ou resultado da corrida pode servir de fonte para a busca.
3. Registre a transmissão uma vez por chave de corrida na aba `Corrida Transmissao` da planilha Grip Todas Etapas. A chave segue `Categoria/Liga/Temporada/Pista`. Confira se ela já existe para atualizar o link na linha correspondente. Para inclusões, preencha `B:F` na ordem `Liga,Categoria,Pista,Temporada,Transmissao` e preserve a fórmula da coluna `A`, que gera a chave. Se a tarefa for só de levantamento, entregue `pendencias-transmissoes.csv` com essas cinco colunas e uma linha por chave.
4. Na aba `Etapas`, a coluna `Q` (`Link Transmissao`) usa `VLOOKUP` com a chave de `P`. Ao aplicar links na planilha, confira se as linhas afetadas têm a fórmula. Se houver `#N/A` fixo em `Q`, será preciso restaurar o lookup nas linhas afetadas (por exemplo, `=VLOOKUP(P3,'Corrida Transmissao'!A:F,6,FALSE)`, ajustando a linha). Se uma chave corresponder a grids com vídeos diferentes, confira se a base distingue os grids por categoria ou pista antes de propor a alteração.
5. Informe as etapas confirmadas, as fontes usadas e as lacunas que sobraram. Aplique as alterações na planilha ou sincronize os dados do site conforme o pedido do usuário.
