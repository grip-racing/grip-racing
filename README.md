# 🏁 Grip Racing - Site Oficial

Site oficial da equipe Grip Racing - Visamundo, especializada em automobilismo virtual desde 2008.

## 🚀 Como Publicar no GitHub Pages

### 1️⃣ Crie uma conta no GitHub
- Acesse: https://github.com
- Clique em "Sign up" (se ainda não tiver conta)

### 2️⃣ Crie um novo repositório
- Clique no botão **"+"** no canto superior direito → **"New repository"**
- **Repository name:** `gripracing` (ou o nome que preferir)
- Marque como **Public**
- ✅ Marque **"Add a README file"**
- Clique em **"Create repository"**

### 3️⃣ Faça upload dos arquivos

**Opção A: Via interface do GitHub (mais fácil)**
1. Na página do seu repositório, clique em **"Add file"** → **"Upload files"**
2. Arraste os arquivos:
   - `index.html`
   - `style.css`
   - `script.js`
3. Clique em **"Commit changes"**

**Opção B: Via Git (linha de comando)**
```bash
# No PowerShell, dentro da pasta grip-racing-site
git init
git add .
git commit -m "Site inicial Grip Racing"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/gripracing.git
git push -u origin main
```

### 4️⃣ Ative o GitHub Pages
1. Vá em **Settings** (configurações do repositório)
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione:
   - Branch: **main**
   - Folder: **/ (root)**
4. Clique em **Save**
5. Aguarde alguns minutos ⏱️

### 5️⃣ Acesse seu site! 🎉
Seu site estará disponível em:
```
https://SEU-USUARIO.github.io/gripracing
```

## 🎨 Cores da Grip Racing
- **Laranja:** `#FF6B00`
- **Preto:** `#000000`
- **Branco:** `#FFFFFF`

## 📱 Recursos do Site
- ✅ Design moderno e profissional
- ✅ 100% responsivo (mobile, tablet, desktop)
- ✅ Animações suaves
- ✅ Performance otimizada
- ✅ SEO-friendly

## 🛠️ Personalização

### Atualizar links das redes sociais
Edite o arquivo `index.html` nas linhas dos botões sociais:
```html
<a href="SEU_LINK_INSTAGRAM" target="_blank" class="social-btn instagram">
<a href="SEU_LINK_TWITTER" target="_blank" class="social-btn twitter">
```

### Adicionar fotos da equipe
Para substituir as iniciais por fotos reais, edite a seção `.staff-avatar` no HTML:
```html
<div class="staff-avatar">
    <img src="caminho/para/foto.jpg" alt="Nome">
</div>
```

### Mudar cores
Edite as variáveis CSS no arquivo `style.css`:
```css
:root {
    --orange: #FF6B00;
    --black: #000000;
    --white: #FFFFFF;
}
```

## 📞 Suporte
Precisa de ajuda? Entre em contato através das redes sociais da Grip Racing!

---

**© 2026 Grip Racing - Visamundo**  
Automobilismo Virtual | Brasil 🇧🇷
