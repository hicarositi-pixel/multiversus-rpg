const DISCORD_MODULE = "multiversus-rpg";

// ==================================================================
// 1. CONFIGURAÇÕES
// ==================================================================
Hooks.once("init", () => {
    game.settings.register(DISCORD_MODULE, "webhookShop", { name: "Discord: Canal do Mercado", scope: "world", config: true, type: String, default: "" });
    game.settings.register(DISCORD_MODULE, "webhookBank", { name: "Discord: Canal do Caixa", scope: "world", config: true, type: String, default: "" });
    game.settings.register(DISCORD_MODULE, "webhookStatus", { name: "Discord: Canal de Status", scope: "world", config: true, type: String, default: "" });
    game.settings.register(DISCORD_MODULE, "webhookSecurity", { name: "Discord: Logs de Segurança", scope: "world", config: true, type: String, default: "" });
    game.settings.register(DISCORD_MODULE, "webhookCustomTalent", {
        name: "Discord: Talentos Personalizáveis (Novo Agente)",
        hint: "Webhook do canal do Discord para onde serão enviadas as descrições de Talentos Personalizáveis solicitados na criação de Novo Agente (se vazio, usa Logs de Segurança).",
        scope: "world",
        config: true,
        type: String,
        default: ""
    });
});

// ==================================================================
// 2. FUNÇÃO ROTEADORA DE ENVIO
// ==================================================================
async function sendToDiscord(channelType, title, description, color, fields = []) {
    let url = "";
    if (channelType === "shop") url = game.settings.get(DISCORD_MODULE, "webhookShop");
    if (channelType === "bank") url = game.settings.get(DISCORD_MODULE, "webhookBank");
    if (channelType === "status") url = game.settings.get(DISCORD_MODULE, "webhookStatus");
    if (channelType === "security") url = game.settings.get(DISCORD_MODULE, "webhookSecurity");
    if (channelType === "customTalent") url = game.settings.get(DISCORD_MODULE, "webhookCustomTalent") || game.settings.get(DISCORD_MODULE, "webhookSecurity");

    if (!url) return;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: "Nexus OS",
            avatar_url: "https://i.imgur.com/SEU_ICON.png",
            embeds: [{
                title: title,
                description: description,
                color: color,
                fields: fields,
                footer: { text: `Registro Oficial • ${new Date().toLocaleTimeString()}` }
            }]
        })
    });
}

// ==================================================================
// 3. LISTENERS AUTOMÁTICOS (LOJA, CAIXA, STATUS, XP)
// ==================================================================

// Loja (Mercador)
Hooks.on("nexusStoreItemAdded", (item) => {
    if (!game.user.isGM) return;
    const stock = item.system.stock === -1 ? "Infinito" : item.system.stock;
    sendToDiscord("shop", "🛒 Nova Oferta Disponível", `**${item.name}** foi adicionado ao catálogo.`, 16766720, 
        [{ name: "Preço", value: `${item.price} MC`, inline: true }, { name: "Estoque", value: String(stock), inline: true }]
    );
});

// Caixa (Compras)
Hooks.on("nexusTransaction", (user, item) => {
    if (game.user.id !== user.id) return;
    sendToDiscord("bank", "💸 Transação Aprovada", `Compra registrada no sistema.`, 5763719,
        [{ name: "Cliente", value: user.name, inline: true }, { name: "Produto", value: item.name, inline: true }, { name: "Valor", value: `-${item.price} MC`, inline: true }]
    );
});

// Status (Ativador/Cena)
Hooks.on("nexusItemActivated", (item, user) => {
    if (game.user.id !== user.id) return;
    sendToDiscord("status", "⚡ Protocolo de Renderização", `**${user.name}** ativou: **${item.name}**.`, 3447003);
});

Hooks.on("updateScene", (scene, changes) => {
    if (changes.active === true && game.user.isGM) {
        sendToDiscord("status", "🌍 Atualização de Local", `Entrando em: **${scene.name}**.`, 3447003);
    }
});

// Ganho de XP (Admin)
Hooks.on("nexusXPGain", (user, amount, reason, total) => {
    sendToDiscord("security", "📈 Evolução Registrada (XP)", 
        `O usuário **${user.name}** recebeu experiência.`, 10181046, // Roxo
        [
            { name: "Valor", value: `+${amount} XP`, inline: true },
            { name: "Motivo", value: reason, inline: true },
            { name: "Novo Total", value: String(total), inline: true }
        ]
    );
});

// ==================================================================
// 4. LISTENER MANUAL "DEDO-DURO" (GASTOS DE PONTOS)
// ==================================================================
// Este ouvinte recebe a ordem direta dos botões Svelte (Atributos, Skills, Universos, Poderes)
Hooks.on("nexusPointSpent", (actorName, category, detail, cost, remaining) => {
    // Define se é gasto ou reembolso baseado no sinal do custo
    const isSpending = cost > 0;
    
    const title = isSpending ? `📉 Investimento: ${category}` : `♻️ Reembolso: ${category}`;
    const desc = isSpending ? `**${actorName}** investiu pontos.` : `**${actorName}** recuperou pontos.`;
    const color = isSpending ? 15105570 : 3066993; // Laranja (Gasto) ou Verde (Reembolso)

    sendToDiscord("security", title, desc, color, [
        { name: "Detalhe", value: detail, inline: true }, // Ex: "Corpo (Normal): 4 ➔ 5"
        { name: "Custo", value: `${Math.abs(cost)} Pontos`, inline: true },
        { name: "Saldo Disponível", value: `${remaining}`, inline: true }
    ]);
});

// ==================================================================
// 5. DETECÇÃO DE XP MANUAL (ANTI-CHEAT)
// ==================================================================
// Este continua automático, pois o player edita o input de texto, não clica num botão específico.
Hooks.on("updateActor", (actor, changes, options, userId) => {
    if (game.user.id !== userId) return; 

    // Pega mudança em system.xp
    const newXP = foundry.utils.getProperty(changes, "system.xp");
    
    if (newXP !== undefined) {
        const oldXP = actor.system.xp || 0;
        const diff = newXP - oldXP;
        
        // Só avisa se a diferença for diferente de 0
        if (diff !== 0) {
            sendToDiscord("security", "⚠️ Alteração Manual de XP", 
                `**${actor.name}** editou o XP diretamente na ficha.`, 15158332, // Vermelho
                [
                    { name: "Mudança", value: `${oldXP} ➔ ${newXP}`, inline: true },
                    { name: "Diferença", value: `${diff > 0 ? '+' : ''}${diff}`, inline: true }
                ]
            );
        }
    }
});

// ==================================================================
// 6. SORTEIO DE ORIGEM E CRIAÇÃO DE FICHA ("NOVO AGENTE")
// ==================================================================
Hooks.on("nexusOriginRoll", (data) => {
    if (!data) return;
    sendToDiscord("security", "🧬 Sorteio de Origem (Novo Agente)",
        `Rolagem de raridade de Origem registrada no Criador de Identidade.`, 3447003,
        [
            { name: "Usuário", value: data.rollerName || game.user?.name || "Desconhecido", inline: true },
            { name: "Dono da Ficha", value: data.ownerName || "Não definido no momento", inline: true },
            { name: "Tipo", value: data.rollType || "Rolagem de Origem", inline: true },
            { name: "Resultado (1d100)", value: `**${data.result}** — ${data.rarity}`, inline: false }
        ]
    );
});

Hooks.on("nexusAgentCreated", (data) => {
    if (!data) return;
    sendToDiscord("security", "🪪 Novo Agente Registrado",
        `Ficha **${data.charName}** finalizada no Criador de Identidade.`, 3066993,
        [
            { name: "Criado por", value: data.creatorName || game.user?.name || "Desconhecido", inline: true },
            { name: "Dono da Ficha", value: data.ownerName || "Sem vínculo", inline: true },
            { name: "Origem Escolhida", value: data.originName || "N/A", inline: true },
            { name: "Última Rolagem de Origem", value: data.rollCategory || "Nenhuma rolagem realizada", inline: false }
        ]
    );
});

Hooks.on("nexusCustomTalentRequest", (data) => {
    if (!data) return;
    const rawDesc = (data.talentDescription || "").trim();
    const safeDesc = rawDesc.length > 3800 ? rawDesc.slice(0, 3800) + "...\n*(Texto truncado pelo limite do Discord)*" : rawDesc;
    const descBlock = safeDesc
        ? `**Descrição enviada pelo jogador:**\n>>> ${safeDesc}`
        : "*Nenhuma descrição detalhada informada.*";

    const kitTalentsStr = Array.isArray(data.selectedKitTalents) && data.selectedKitTalents.length > 0
        ? data.selectedKitTalents.join(", ")
        : "Nenhum talento de kit selecionado";

    sendToDiscord("customTalent", "✨ Talento Personalizável Solicitado (Novo Agente)",
        descBlock, 10181046,
        [
            { name: "Agente (Ficha)", value: data.charName || "Sem nome", inline: true },
            { name: "Solicitante", value: data.creatorName || game.user?.name || "Desconhecido", inline: true },
            { name: "Dono da Ficha", value: data.ownerName || "Sem vínculo", inline: true },
            { name: "Origem", value: data.originName || "N/A", inline: true },
            { name: "Conceito / Título", value: (data.talentName || "Talento Personalizado").slice(0, 250), inline: true },
            { name: "Kits Escolhidos", value: kitTalentsStr.slice(0, 1000), inline: false }
        ]
    );
});