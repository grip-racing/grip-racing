# 📊 Google Analytics 4 - Eventos Rastreados

## Configuração Implementada

✅ **analytics-events.js** adicionado em todas as páginas
✅ Rastreamento automático de eventos personalizados
✅ Console logs para debug (pode ser removido em produção)

---

## 🎯 Eventos Rastreados

### 1. **Navegação e Comportamento Geral**

| Evento | Parâmetros | Quando Dispara |
|--------|-----------|----------------|
| `page_view` | page_title, page_path | Ao carregar qualquer página |
| `navigation_click` | page_name, destination, link_text | Clique em item do menu |
| `theme_change` | theme (light/dark) | Alternar tema claro/escuro |
| `external_link` | destination, link_text, url | Clique em link externo (YouTube, Discord, etc) |
| `scroll_depth` | depth (25%, 50%, 75%, 100%) | Rolagem da página |
| `time_on_page` | seconds, page_path | A cada minuto na página |

---

### 2. **Página de Pilotos** (`pilotos.html`)

| Evento | Parâmetros | Quando Dispara |
|--------|-----------|----------------|
| `pilot_search` | search_term, results_count | Busca com 3+ caracteres |
| `pilot_filter` | filter_type, is_active | Clique em filtro (Campeões, etc) |
| `column_sort` | column_name, sort_direction | Ordenação de coluna |
| `pilot_view` | pilot_name | Clique em linha de piloto |
| `load_more_pilots` | current_count | Clique em "Carregar Mais" |
| `leader_view` | stat_type | Clique em card de estatística |

**Análises Possíveis:**
- Pilotos mais visualizados
- Termos de busca mais comuns
- Filtros mais utilizados
- Colunas mais ordenadas
- Taxa de uso do "Carregar Mais"

---

### 3. **Página de Detalhes do Piloto** (`piloto-detalhes.html`)

| Evento | Parâmetros | Quando Dispara |
|--------|-----------|----------------|
| `stat_detail_toggle` | stat_name, action (expand/collapse) | Expandir/colapsar estatística |
| `race_view` | season | Clique em corrida específica |
| `back_to_pilots` | source | Clique em "Voltar aos Pilotos" |
| `leader_view` | stat_type | Clique em card de estatística |

**Análises Possíveis:**
- Estatísticas mais visualizadas
- Temporadas mais consultadas
- Taxa de retorno à lista
- Tempo médio na página de detalhes

---

### 4. **Página de Vídeos** (`videos.html`)

| Evento | Parâmetros | Quando Dispara |
|--------|-----------|----------------|
| `video_click` | video_title, video_url | Clique em vídeo |

**Análises Possíveis:**
- Vídeos mais clicados
- Taxa de cliques em vídeos
- Preferências de conteúdo

---

### 5. **Página de Inscrições** (`inscricoes.html`)

| Evento | Parâmetros | Quando Dispara |
|--------|-----------|----------------|
| `inscription_click` | button_text, destination | Clique em botão de inscrição/social |

**Análises Possíveis:**
- Taxa de conversão para Discord
- Canais preferidos de contato
- Interesse em inscrições

---

## 📈 Como Visualizar no Google Analytics

### 1. **Eventos em Tempo Real**
- Acesse: **Relatórios** → **Tempo Real** → **Visualização de eventos**
- Veja eventos acontecendo agora

### 2. **Relatório de Eventos**
- Acesse: **Relatórios** → **Engajamento** → **Eventos**
- Veja todos os eventos rastreados

### 3. **Criar Relatórios Personalizados**

#### Exemplo: Pilotos Mais Visualizados
1. Vá em **Explorar** → **Criar novo**
2. Adicione dimensão: `event_name` = `pilot_view`
3. Adicione dimensão: `pilot_name`
4. Métrica: Contagem de eventos

#### Exemplo: Taxa de Uso de Filtros
1. Vá em **Explorar** → **Criar novo**
2. Adicione dimensão: `event_name` = `pilot_filter`
3. Adicione dimensão: `filter_type`
4. Métrica: Contagem de eventos

#### Exemplo: Funil de Navegação
1. Vá em **Explorar** → **Análise de funil**
2. Etapa 1: `page_view` (index.html)
3. Etapa 2: `navigation_click` (pilotos)
4. Etapa 3: `pilot_view`
5. Etapa 4: Ver detalhes

---

## 🎯 Conversões Importantes

### Configure estas conversões no GA4:

1. **Inscrição no Discord**
   - Evento: `inscription_click`
   - Condição: `destination` contém "discord"

2. **Visualização de Piloto**
   - Evento: `pilot_view`

3. **Uso Profundo do Site** (engajamento alto)
   - Evento: `scroll_depth`
   - Condição: `depth` = 100

4. **Tempo Significativo no Site**
   - Evento: `time_on_page`
   - Condição: `seconds` ≥ 120

---

## 🔍 Insights que Você Pode Obter

### Comportamento do Usuário:
- ✅ Quais pilotos geram mais interesse
- ✅ Quais páginas têm maior engajamento
- ✅ Onde os usuários saem do site
- ✅ Tempo médio em cada seção
- ✅ Profundidade de scroll por página

### Conteúdo:
- ✅ Vídeos mais populares
- ✅ Estatísticas mais consultadas
- ✅ Temporadas mais acessadas
- ✅ Termos de busca comuns

### Conversão:
- ✅ Taxa de cliques em "Inscrições"
- ✅ Taxa de acesso ao Discord
- ✅ Funil de navegação completo
- ✅ Abandono em cada etapa

### Performance:
- ✅ Velocidade de carregamento (Core Web Vitals)
- ✅ Taxa de rejeição por página
- ✅ Dispositivos mais usados
- ✅ Navegadores mais comuns

---

## 🛠️ Próximas Ações

### Imediato:
1. ✅ Testar eventos no console do navegador (F12)
2. ✅ Verificar eventos em tempo real no GA4
3. ✅ Configurar conversões importantes

### Curto Prazo (1-2 semanas):
1. 📊 Criar relatórios personalizados principais
2. 📊 Configurar alertas para eventos importantes
3. 📊 Analisar primeiros dados coletados

### Médio Prazo (1 mês):
1. 📈 Identificar padrões de comportamento
2. 📈 Otimizar páginas com baixo engajamento
3. 📈 A/B testing baseado em dados
4. 📈 Criar dashboards executivos

---

## 🐛 Debug

Para verificar se os eventos estão funcionando:

1. Abra o Console do navegador (F12)
2. Navegue pelo site
3. Procure por: `📊 GA4 Event:` nos logs
4. Verifique parâmetros enviados

### Remover Logs em Produção:
Comente ou remova esta linha em `analytics-events.js`:
```javascript
console.log('📊 GA4 Event:', eventName, eventParams);
```

---

## 📱 Eventos Mobile vs Desktop

Todos os eventos funcionam igualmente em:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

Use dimensão `device_category` no GA4 para comparar comportamento entre dispositivos.

---

## ⚡ Performance

O script de eventos é:
- ✅ Leve (~8KB)
- ✅ Não bloqueia o carregamento
- ✅ Usa event delegation quando possível
- ✅ Throttling em eventos frequentes (scroll, search)

---

## 🎉 Resumo

Com esta implementação, você terá **visibilidade completa** sobre:
- 📊 Como os usuários navegam
- 🎯 O que mais interessa aos visitantes
- 💡 Onde melhorar o site
- 🚀 Taxa de conversão para inscrições

**Próximo passo crítico:** Acessar o GA4 e começar a explorar os dados!
