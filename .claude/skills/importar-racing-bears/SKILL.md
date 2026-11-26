---
name: importar-racing-bears
description: Confere resultados da Grip Racing na Racing Bears TV e prepara inclusões e correções para a base do site. Use para atualizar ou investigar resultados de campeonatos e especiais da Racing Bears.
---

# Importar resultados da Racing Bears

## Encontrar os resultados

1. Comece em [Eventos](https://www.racingbearstv.com.br/eventos) e consulte também **Últimos resultados** na [página inicial](https://www.racingbearstv.com.br/). Confira campeonatos e especiais dentro do período pedido. Deixe os 4FUN de fora, salvo pedido explícito.
2. Na página de resultados do evento, abra **Resultado da Corrida**, selecione a etapa e confira todos os grids ou classes disponíveis, inclusive PRO e AM. Use a tabela da corrida para posição e status. **Classificação do Evento** mostra o ranking acumulado e a pontuação por etapa. Ela pode confirmar um status explícito como DNF, mas o número ao lado do piloto é a posição no ranking acumulado.
3. Procure as grafias `Grip Racing` e `Visamundo Grip Racing`. Use a página da equipe, quando acessível, e os perfis oficiais de pilotos conhecidos como pistas para encontrar provas que a busca por equipe não trouxe. Cruze as ocorrências com o resultado da etapa para confirmar a participação e a equipe naquela corrida.
4. Se a página carregar só o menu ou a busca mostrar uma tabela parcial, tente navegar pelo evento e consultar os perfis públicos ou a transmissão oficial. Registre quais etapas ou grids ficaram sem acesso. Um nome ausente de uma tabela parcial pode aparecer em outro grid.

## Comparar com a base

- Filtre `data/data-participacoes.csv` por `Liga = Racing Bears`. Compare temporada, categoria, pista e piloto antes de lançar uma linha. Reutilize a grafia e a categoria da base para o mesmo campeonato.
- Use a data de início do campeonato para definir `Temporada` no formato `AAAA-N`: janeiro a março = `AAAA-1`, abril a junho = `AAAA-2`, julho a setembro = `AAAA-3` e outubro a dezembro = `AAAA-4`. Mantenha o mesmo código em todas as etapas, mesmo quando o campeonato atravessa outro trimestre.
- Se já houver outro campeonato com o mesmo nome na mesma liga e temporada, use `Nome do Campeonato 2` no campo `Categoria` para o segundo campeonato e mantenha esse nome em todas as suas etapas.
- Registre a posição oficial da corrida no grid ou na classe correspondente ao cadastro. Preserve status explícitos como `DNF`, `DNS` e `DQ` quando confirmados. Confira pole, volta mais rápida e demais marcas na fonte da etapa. Se a participação estiver confirmada, mas faltar a posição ou o status, deixe o caso como pendência de conferência no registro.
- Prepare `pendencias-racing-bears.csv` na raiz do projeto com o mesmo cabeçalho de `data/data-participacoes.csv` mais `Acao`. Deixe as duas colunas de chave vazias. Use `NOVA` ou `AJUSTE (campo: antigo -> novo)` e `#N/A` quando não houver um link de transmissão confirmado. Preserve as pendências anteriores que ainda precisem ser aplicadas.
- Os arquivos em `data/` são cópias da planilha. Depois de aplicar as linhas na planilha, use `update-data.ps1` para sincronizar o site quando for solicitado.

## Registro de 26/11/2026

- A 45ª Temporada GT3 começou em Imola em 19/11 e pertence a `2026-4`. Matheus Saliba e Ader Fernando foram DNF nessa etapa. O dono confirmou a aplicação dos ajustes. [Resultados da 45ª Temporada](https://racingbearstv.com.br/eventos/0f6dcf05-64ef-4329-9dfa-298012cd3692/resultados)
- Retome pelos resultados das etapas seguintes da 45ª Temporada. O levantamento de 26/11 foi parcial.
