const MODULE_ID = "multiversus-rpg";

export class SocialHubDatabase {
    static init() {
        console.log("MULTIVERSUS | Database Carregada.");
        
        game.settings.register(MODULE_ID, "chatTheme", {
            scope: "client", config: false, type: String, default: "neon-link"
        });

        game.settings.register(MODULE_ID, "social_hub_groups", {
            scope: "world", config: false, type: Array, 
            default: [{id: "nexus-prime", name: "NEXUS_PRIME", icon: "fa-server", isPrivate: false}]
        });

        game.settings.register(MODULE_ID, "social_hub_messages", {
            scope: "world", config: false, type: Array, default: []
        });

        game.settings.register(MODULE_ID, "discordWebhookUrl", {
            name: "Nexus Hub: Discord Webhook URL",
            hint: "Insira a URL do Webhook do Discord (ou Discohook) para onde as postagens do Nexus Hub serão enviadas automaticamente quando os jogadores optarem por sincronizar.",
            scope: "world",
            config: true,
            type: String,
            default: ""
        });

        game.settings.register(MODULE_ID, "discordChannelLink", {
            name: "Nexus Hub: Link/Nome do Canal no Discord",
            hint: "Nome ou Link do canal do Discord onde as postagens são espelhadas (ex: #feed-nexus).",
            scope: "world",
            config: true,
            type: String,
            default: ""
        });
    }

    // --- DISCORD RELAY ---
    static async sendToDiscordWebhook(postData) {
        if (!game?.settings) return;
        if (postData.isPrivate) return;
        if (postData.chatId && postData.chatId.startsWith("dm-")) return;

        let webhookUrl = "";
        try {
            webhookUrl = game.settings.get(MODULE_ID, "discordWebhookUrl") || "";
        } catch(e) {}
        if (!webhookUrl || !webhookUrl.startsWith("http")) return;

        const actorId = postData.senderId || postData.authorId || null;
        const actor = actorId ? game.actors.get(actorId) : (game.user.character || null);
        if (!actor) return;

        const socialProfile = actor.getFlag(MODULE_ID, "social_profile") || {};
        if (!socialProfile.syncDiscord && !socialProfile.sendToDiscord) return;

        const authorName = socialProfile.socialName || actor.name || "Desconhecido";
        const channelRef = game.settings.get(MODULE_ID, "discordChannelLink") || postData.chatId || "Nexus Hub";
        let avatarUrl = socialProfile.coverImage || actor.img || "";
        const validHttpAvatar = avatarUrl && avatarUrl.startsWith("http") ? avatarUrl : "https://i.imgur.com/3q1t6b8.png";

        let description = postData.text || postData.content || "*Sem texto*";
        let embedImage = null;
        if (postData.attachments && Array.isArray(postData.attachments) && postData.attachments.length > 0) {
            const firstImg = postData.attachments.find(a => a && typeof a === 'string' && a.startsWith("http"));
            if (firstImg) embedImage = { url: firstImg };
        } else if (postData.image && typeof postData.image === 'string' && postData.image.startsWith("http")) {
            embedImage = { url: postData.image };
        }

        const payload = {
            username: `${authorName} • Nexus Hub`,
            avatar_url: validHttpAvatar,
            embeds: [
                {
                    title: `🌐 Nova Publicação (${channelRef})`,
                    description: description,
                    color: 3447003,
                    image: embedImage,
                    footer: {
                        text: `Multiversus RPG • Personagem: ${actor.name}`
                    },
                    timestamp: new Date(postData.timestamp || Date.now()).toISOString()
                }
            ]
        };

        try {
            await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            console.log("NEXUS HUB | Publicação enviada ao Discord com sucesso!");
        } catch (err) {
            console.error("NEXUS HUB | Erro ao enviar ao Discord Webhook:", err);
        }
    }

    // --- GRUPOS ---
    static async createGroup(name, password = null) {
        if (!name) return;
        const newGroup = {
            id: foundry.utils.randomID(),
            name: name.toUpperCase(),
            icon: password ? "fa-lock" : "fa-hashtag",
            isPrivate: !!password,
            password: password
        };

        import('./SocialHubStore.js').then(({ hubGroupsStore }) => {
            hubGroupsStore.update(groups => {
                if (groups.find(g => g.id === newGroup.id)) return groups;
                return [...groups, newGroup];
            });
            Hooks.callAll("socialHubUpdate");
        }).catch(() => {});

        if (game.user.isGM) {
            const groups = game.settings.get(MODULE_ID, "social_hub_groups") || [];
            if (!groups.find(g => g.id === newGroup.id)) {
                groups.push(newGroup);
                await game.settings.set(MODULE_ID, "social_hub_groups", groups);
            }
            this.notifyUpdate();
        } else {
            game.socket.emit(`module.${MODULE_ID}`, { type: "SOCIAL_HUB_NEW_GROUP", group: newGroup });
            game.socket.emit(`module.${MODULE_ID}`, { type: "SOCIAL_HUB_CREATE_GROUP", name, password });
        }
    }

    static async deleteGroup(groupId) {
        import('./SocialHubStore.js').then(({ hubGroupsStore }) => {
            hubGroupsStore.update(groups => groups.filter(g => g.id !== groupId));
            Hooks.callAll("socialHubUpdate");
        }).catch(() => {});

        if (game.user.isGM) {
            const groups = game.settings.get(MODULE_ID, "social_hub_groups") || [];
            const newGroups = groups.filter(g => g.id !== groupId);
            await game.settings.set(MODULE_ID, "social_hub_groups", newGroups);
            this.notifyUpdate();
        } else {
            game.socket.emit(`module.${MODULE_ID}`, { type: "SOCIAL_HUB_DELETE_GROUP", groupId });
        }
    }

    // --- MENSAGENS ---
    static async sendMessage(data) {
        const finalMsg = {
            id: data.id || foundry.utils.randomID(),
            timestamp: data.timestamp || Date.now(),
            ...data
        };

        import('./SocialHubStore.js').then(({ hubChatStore }) => {
            hubChatStore.update(messages => {
                if (messages.find(m => m.id === finalMsg.id)) return messages;
                const arr = [...messages, finalMsg];
                if (arr.length > 200) arr.shift();
                return arr;
            });
            Hooks.callAll("socialHubUpdate");
        }).catch(() => {});

        if (!finalMsg.chatId || !finalMsg.chatId.startsWith("dm-")) {
            SocialHubDatabase.sendToDiscordWebhook(finalMsg).catch(() => {});
        }

        let whisper = [];
        if (finalMsg.chatId && finalMsg.chatId.startsWith("dm-")) {
            const parts = finalMsg.chatId.replace("dm-", "").split("-");
            const targetUsers = game.users.filter(u => parts.includes(u.id) || (u.character && parts.includes(u.character.id)) || u.isGM).map(u => u.id);
            if (targetUsers.length > 0) whisper = targetUsers;
        }

        try {
            await ChatMessage.create({
                content: finalMsg.text || "",
                whisper: whisper,
                speaker: ChatMessage.getSpeaker({ actor: game.actors.get(finalMsg.senderId) || null }),
                flags: {
                    "multiversus-rpg": {
                        isNexusHub: true,
                        nexusMessageData: finalMsg
                    }
                }
            });
        } catch (e) {
            console.error("Erro ao enviar mensagem Nexus Hub via ChatMessage:", e);
        }
    }

    static async clearChat() {
        if (!game.user.isGM) return ui?.notifications?.warn("Apenas GMs podem limpar o chat.");
        import('./SocialHubStore.js').then(({ hubChatStore }) => {
            hubChatStore.set([]);
            Hooks.callAll("socialHubUpdate");
        }).catch(() => {});

        await game.settings.set(MODULE_ID, "social_hub_messages", []);
        const nexusMsgs = game.messages.filter(m => m.getFlag(MODULE_ID, "isNexusHub")).map(m => m.id);
        if (nexusMsgs.length > 0) {
            await ChatMessage.deleteDocuments(nexusMsgs);
        }
        this.notifyUpdate();
    }

    // --- CONTATOS ---
    static async addContact(actor, contactID) {
        if (!actor) return;
        const contacts = actor.getFlag(MODULE_ID, "contacts") || [];
        if (contacts.find(c => c.commID === contactID)) return;
        contacts.push({
            id: foundry.utils.randomID(),
            name: "Conexão " + contactID,
            commID: contactID,
            img: "icons/svg/mystery-man.svg"
        });
        await actor.setFlag(MODULE_ID, "contacts", contacts);
        Hooks.callAll("socialHubUpdate"); 
    }

    static notifyUpdate(msg = null) {
        if (msg && typeof msg === 'object' && msg.id) {
            game.socket.emit(`module.${MODULE_ID}`, { type: "SOCIAL_HUB_NEW_MESSAGE", msg });
        } else {
            game.socket.emit(`module.${MODULE_ID}`, { type: "SOCIAL_HUB_REFRESH" });
        }
        Hooks.callAll("socialHubUpdate");
    }
}