# 📁 Estrutura do Projeto - Grip Racing

## Organização de Pastas

```
grip-racing-site/
├── index.html              # Página principal
├── README.md               # Guia de publicação no GitHub
├── ESTRUTURA.md           # Este arquivo (documentação da estrutura)
├── update-data.ps1         # Script PowerShell para atualizar dados
│
├── assets/                 # 🖼️ Imagens e ícones
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── grip-daytona.png
│   └── Grip Racing Logo Vector.svg
│
├── css/                    # 🎨 Arquivos de estilo
│   ├── style.css          # Estilos da página principal
│   └── pilotos.css        # Estilos das páginas de pilotos
│
├── js/                     # ⚙️ Scripts JavaScript
│   ├── script.js          # Menu mobile e interações gerais
│   ├── data-loader.js     # Carrega dados da página principal
│   ├── pilotos.js         # Lista de pilotos com busca/filtros
│   └── piloto-detalhes.js # Detalhes individuais de cada piloto
│
├── data/                   # 📊 Dados CSV do Google Sheets
│   ├── data-stats.csv          # Estatísticas gerais da equipe
│   ├── data-pilotos.csv        # Dados de todos os pilotos
│   └── data-participacoes.csv  # Histórico completo de corridas
│
└── pages/                  # 📄 Páginas secundárias
    ├── pilotos.html            # Lista completa de pilotos
    └── piloto-detalhes.html    # Página individual do piloto
```

## 🔄 Fluxo de Dados

1. **Google Sheets** → Fonte de dados (editável pela equipe)
2. **update-data.ps1** → Baixa CSVs atualizados
3. **data/*.csv** → Armazena dados localmente
4. **js/data-loader.js** → Lê CSVs e atualiza HTML
5. **index.html** → Exibe dados dinamicamente

## 🚀 Comandos Úteis

### Iniciar servidor local
```powershell
python -m http.server 8000
# Acesse: http://localhost:8000
```

### Atualizar dados do Google Sheets
```powershell
.\update-data.ps1
```

## 📝 Caminhos de Referência

### Na página principal (index.html)
- CSS: `css/style.css`
- JS: `js/script.js`, `js/data-loader.js`
- Imagens: `assets/grip-daytona.png`
- Dados: `data/data-stats.csv`
- Link para pilotos: `pages/pilotos.html`

### Nas páginas de pilotos (pages/*.html)
- CSS: `../css/style.css`, `../css/pilotos.css`
- JS: `../js/script.js`, `../js/pilotos.js`
- Imagens: `../assets/favicon-32x32.png`
- Dados: `../data/data-pilotos.csv`
- Volta para home: `../index.html`

## 🎯 Benefícios da Organização

✅ **Fácil manutenção** - Cada tipo de arquivo em sua pasta
✅ **Escalável** - Adicione novos arquivos sem bagunça
✅ **Profissional** - Estrutura padrão da indústria
✅ **Versionamento** - Git ignora arquivos de cache facilmente
✅ **Deploy** - GitHub Pages funciona perfeitamente
✅ **Performance** - Navegador faz cache por pasta

## 📦 Para Deploy no GitHub Pages

Toda esta estrutura pode ser enviada para o GitHub. O GitHub Pages serve arquivos estáticos automaticamente respeitando a estrutura de pastas.

**Importante:** Mantenha o `index.html` na raiz do repositório para o GitHub Pages funcionar corretamente.
