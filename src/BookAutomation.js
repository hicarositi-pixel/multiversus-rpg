export const BookAutomation = {
    renderMarkdown: (text, glossary) => {
        if (!text) return "";
        
        // 1. Normaliza quebras de linha do Copiar/Colar do Discord
        let html = text.replace(/\r\n/g, '\n');

        // ==========================================
        // 2. ATALHOS DE IMAGEM E COR (BUG CORRIGIDO)
        // ==========================================
        // Usamos (.+) guloso para a URL e ([^:]+) para o tamanho. 
        // Assim ele ignora os ":" do "https://" e só corta no tamanho final!
        html = html.replace(/\[img:(.+):([^:]+)\]/g, '<img src="$1" style="width: $2; max-width: 100%; border-radius: 4px;" class="live-img" data-url="$1">');
        
        // Cores Customizadas
        html = html.replace(/\[color:(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1;">$2</span>');

        // ==========================================
        // 3. CAIXA DE DESTAQUE DATA HELL (> ## Titulo)
        // ==========================================
        html = html.replace(/(?:^>.*(?:\n|$))+/gm, (match) => {
            let lines = match.split('\n').filter(l => l.trim().length > 0);
            let contentLines = lines.map(l => l.replace(/^>\s?/, '').trim());

            if (contentLines.length > 0 && contentLines[0].startsWith('## ')) {
                let title = contentLines[0].replace(/^##\s*/, '');
                let body = contentLines.slice(1).join('<br>'); 
                return `\n<div class="dh-callout"><div class="callout-title">${title}</div><div class="callout-body">${body}</div></div>\n`;
            } else {
                return `\n<blockquote>${contentLines.join('<br>')}</blockquote>\n`;
            }
        });

        // 4. TÍTULOS PADRÕES DO DISCORD
        html = html.replace(/^# (.*?)$/gm, '<h1 class="chapter-title">$1</h1>');
        html = html.replace(/^## (.*?)$/gm, '<h2 class="section-title">$1</h2>');

        // 5. NEGRITO E ITÁLICO
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        // 6. LISTAS E PARÁGRAFOS
        html = html.replace(/^-\s+(.*?)$/gm, '<li class="md-list-item">$1</li>');
        
        const blocks = html.split(/\n\s*\n/);
        html = blocks.map(block => {
            // Ignora tags HTML nativas para não estragar a formatação
            const isHtmlBlock = /^<(h[1-6]|div|blockquote|ul|ol|li|img|span)/i.test(block.trim());
            if (isHtmlBlock || block.trim() === '') return block;
            return `<p>${block.replace(/\n/g, '<br>')}</p>`;
        }).join('\n');

        html = html.replace(/(<li class="md-list-item">.*?<\/li>\s*)+/g, match => `<ul class="md-list">${match}</ul>`);

        // =================================================================
        // 7. AUTO-GLOSSÁRIO À PROVA DE FALHAS
        // =================================================================
        if (glossary && Object.keys(glossary).length > 0) {
            // Ordena os termos do maior para o menor
            const terms = Object.entries(glossary)
                .filter(([_, data]) => data.word)
                .sort((a, b) => b[1].word.length - a[1].word.length);

            // Separa o HTML em Nós de Texto (para traduzir) e Tags (para ignorar)
            let parts = html.split(/(<[^>]*>)/g);
            
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 0) {
                    for (const [key, data] of terms) {
                        const escapedWord = data.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        // Respeita Acentos (À-ÿ) e pontuações coladas na palavra!
                        const regex = new RegExp(`(^|[^a-zA-Z0-9À-ÿ])(${escapedWord})([^a-zA-Z0-9À-ÿ]|$)`, 'gi');
                        parts[i] = parts[i].replace(regex, `$1<span class="rule-keyword" data-key="${key}">$2</span>$3`);
                    }
                }
            }
            html = parts.join(''); 
        }

        return html;
    }
};