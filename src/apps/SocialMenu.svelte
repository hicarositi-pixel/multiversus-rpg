<script>
    import { onMount, tick, afterUpdate, createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import DiceLogic from '../DiceLogic.svelte';
    import { CHAT_THEME_DB } from '../components/ChatThemeDB.js';
    import { SocialHubDatabase } from '../database/SocialHubDatabase.js';
    import { 
        hubChatStore, hubGroupsStore, hubActiveTab, 
        hubActiveChatId, hubActiveChatName, hubActiveActorId, updateHubStore 
    } from '../database/SocialHubStore.js';
    import SocialNetworkFeed from './components/SocialNetworkFeed.svelte';

    export let application;
    const MODULE_ID = "multiversus-rpg";
    const dispatch = createEventDispatcher();
    const currentUserId = game.user.id;
    let personaSearchTerm = "";
    let gmSearchTerm = "";

    // --- REATIVIDADE ---
    $: messages = ($hubChatStore || []).filter(m => m.chatId === $hubActiveChatId);
    $: groups = $hubGroupsStore || [];
    $: {
        if (!$hubActiveActorId) {
            const defaultActor = game.user.character || Array.from(game.actors).find(a => a.isOwner && a.type === "character");
            if (defaultActor) hubActiveActorId.set(defaultActor.id);
        }
    }
    $: mainActor = game.actors.get($hubActiveActorId);
    $: allPlayers = game.users.filter(u => !u.isGM || game.user.isGM);

    $: activeDMs = Array.from(new Set(
        ($hubChatStore || [])
            .filter(m => m.chatId.startsWith('dm-') && m.chatId.includes(mainActor?.id))
            .map(m => m.chatId)
    )).map(chatId => {
        const otherId = chatId.replace('dm-', '').split('-').find(id => id !== mainActor?.id);
        const otherActor = game.actors.get(otherId);
        const msgs = ($hubChatStore || []).filter(m => m.chatId === chatId);
        const lastMsg = msgs[msgs.length - 1];
        return {
            id: chatId,
            name: otherActor?.name || 'Desconhecido',
            actorId: otherId,
            lastTimestamp: lastMsg ? lastMsg.timestamp : 0,
            unread: (lastMsg && lastMsg.timestamp > (socialProfile.lastReadDMs?.[chatId] || 0) && lastMsg.senderId !== mainActor?.id)
        };
    }).sort((a, b) => b.lastTimestamp - a.lastTimestamp);

    $: hasUnreadDMs = activeDMs.some(dm => dm.unread);

    $: allPosts = ($hubChatStore || []).filter(m => m.chatId === 'feed');
    $: lastPostTime = allPosts.length > 0 ? allPosts[allPosts.length - 1].timestamp : 0;
    $: hasUnreadFeed = lastPostTime > (socialProfile.lastReadFeed || 0) && (allPosts[allPosts.length - 1]?.senderId !== mainActor?.id);

    let _readTimer = null;
    function markAsRead(chatId, tab) {
        if (!mainActor) return;
        if (_readTimer) clearTimeout(_readTimer);
        _readTimer = setTimeout(() => {
            let sp = mainActor.getFlag(MODULE_ID, "social_profile") || {};
            let changed = false;
            if (tab === 'chats' && chatId && chatId.startsWith('dm-')) {
                if (!sp.lastReadDMs) sp.lastReadDMs = {};
                if ((sp.lastReadDMs[chatId] || 0) < Date.now() - 5000) {
                    sp.lastReadDMs[chatId] = Date.now();
                    changed = true;
                }
            } else if (tab === 'network') {
                if ((sp.lastReadFeed || 0) < Date.now() - 5000) {
                    sp.lastReadFeed = Date.now();
                    changed = true;
                }
            }
            if (changed) {
                socialProfile = sp;
                mainActor.setFlag(MODULE_ID, "social_profile", sp).catch(()=>{});
            }
        }, 500);
    }

    $: if ($hubActiveTab && $hubActiveChatId && mainActor) {
        markAsRead($hubActiveChatId, $hubActiveTab);
    }

    let socialVisibleActors = [];
    try { socialVisibleActors = game.settings.get("multiversus-rpg", "socialVisibleActors") || []; } catch(e){}

    function toggleVisibility(actorId) {
        if (!game.user.isGM) return;
        let current = game.settings.get("multiversus-rpg", "socialVisibleActors") || [];
        if (current.includes(actorId)) current = current.filter(id => id !== actorId);
        else current.push(actorId);
        game.settings.set("multiversus-rpg", "socialVisibleActors", current);
        socialVisibleActors = current;
    }

    $: filteredActors = Array.from(game.actors).filter(a => {
        if (!a.isOwner || a.type !== "character") return false;
        if (!personaSearchTerm) return true;
        const term = personaSearchTerm.toLowerCase();
        const flag = a.getFlag("multiversus-rpg", "social_profile");
        const socialName = (flag && flag.socialName ? flag.socialName : "").toLowerCase();
        return a.name.toLowerCase().includes(term) || socialName.includes(term);
    }).map(a => {
        const flag = a.getFlag("multiversus-rpg", "social_profile");
        return {
            id: a.id,
            name: a.name,
            img: a.img,
            socialName: flag && flag.socialName ? flag.socialName : a.name
        };
    });

    // --- TEMA ---
    let savedTheme = "neon-link";
    $: activeThemeKey = (CHAT_THEME_DB && CHAT_THEME_DB[savedTheme]) ? savedTheme : "neon-link";
    $: currentTheme = CHAT_THEME_DB[activeThemeKey];

    // --- UI STATES ---
    let newMessage = "";
    let simpleRollFormula = "";
    let chatContainer;
    let showWarning = true;
    let activeModal = null;
    let modalData = { input: "", input2: "", targetGroup: null };
    let showHelp = false;
    let showDiceLogic = false;

    // --- IDENTIDADE ---
    let socialProfile = { socialName: "", bio: "", attachments: [], coverImage: "" };
    let _lastProfileActorId = null;

    $: if ($hubActiveActorId && $hubActiveActorId !== _lastProfileActorId) {
        _lastProfileActorId = $hubActiveActorId;
        const a = game.actors.get($hubActiveActorId);
        if (a) {
            socialProfile = a.getFlag(MODULE_ID, "social_profile") || { socialName: "", bio: "", attachments: [], coverImage: "" };
            if (!socialProfile.attachments) socialProfile.attachments = [];
        }
    }

    onMount(async () => {
        updateHubStore();
        try {
            const theme = game.settings.get(MODULE_ID, "chatTheme");
            if (theme) savedTheme = theme;
        } catch (e) {}

        Hooks.on("socialHubUpdate", () => { updateHubStore(); });
        Hooks.on("userConnected", () => { allPlayers = [...game.users]; });
    });

    afterUpdate(() => {
        if (messages && chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });

    function setTab(tab) { hubActiveTab.set(tab); }
    function closeModal() { activeModal = null; modalData = { input: "", input2: "", targetGroup: null }; }

    function switchChat(id, name) {
        hubActiveChatId.set(id);
        hubActiveChatName.set(name);
    }

    function openDM(targetActor) {
        if (!mainActor || !targetActor) return;
        const ids = [mainActor.id, targetActor.id].sort();
        hubActiveChatId.set(`dm-${ids.join('-')}`);
        hubActiveChatName.set(targetActor.name);
        hubActiveTab.set('chats');
    }

    function formatMessage(text) {
        if (!text) return "";
        return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/~~(.*?)~~/g, '<s>$1</s>');
    }

    // --- FUNÇÕES DO GRUPO ---
    async function createGroupAction() {
        if (!modalData.input || modalData.input.trim() === "") return ui.notifications.warn("Nome inválido.");
        await SocialHubDatabase.createGroup(modalData.input, modalData.input2);
        closeModal();
    }

    function initiateDeleteGroup(group, e) {
        // Agora funciona pois a linha não é mais um <button>
        modalData.targetGroup = group;
        if (group.isPrivate && !game.user.isGM) activeModal = 'delete_password';
        else activeModal = 'confirm_delete';
    }

    async function confirmDelete() {
        if (activeModal === 'delete_password') {
            if (modalData.input !== modalData.targetGroup.password) return ui.notifications.error("Senha incorreta.");
        }
        await SocialHubDatabase.deleteGroup(modalData.targetGroup.id);
        closeModal();
    }

    async function send(img = null, customContent = null, isRoll = false) {
        if (!newMessage.trim() && !img && !customContent) return;

        if (newMessage.trim() === "/cls") {
            if (game.user.isGM) { await SocialHubDatabase.clearChat(); ui.notifications.info("Chat limpo."); }
            else { ui.notifications.warn("Apenas GMs."); }
            newMessage = ""; return;
        }

        let finalAvatar = mainActor?.img || "icons/svg/mystery-man.svg";

        const senderData = {
            senderName: socialProfile.socialName || mainActor?.name || "Desconhecido",
            senderImg: finalAvatar,
            color: "#ffffff",
            realName: game.user.name
        };

        const content = isRoll ? customContent : formatMessage(newMessage.trim());
        if (!isRoll) newMessage = "";

        await SocialHubDatabase.sendMessage({
            chatId: $hubActiveChatId, senderId: mainActor?.id || game.user.id, ...senderData,
            text: content, image: img, isRoll: isRoll
        });
    }

    async function handleDiceLogicResult(htmlContent) {
        await send(null, htmlContent, true);
        showDiceLogic = false;
    }

    async function saveProfile() {
        if (mainActor) {
            await mainActor.setFlag(MODULE_ID, "social_profile", socialProfile);
            ui.notifications.info("Perfil Salvo.");
        }
    }

    async function setChatTheme(key) {
        savedTheme = key;
        await game.settings.set(MODULE_ID, "chatTheme", key);
    }

    function openImageDialog() {
        new Dialog({
            title: "ENVIAR IMAGEM",
            content: `<input id="imgUrl" class="hacker-input" style="width:100%" placeholder="Cole o link aqui..." />`,
            buttons: { send: { label: "ENVIAR", callback: (h) => send(h.find("#imgUrl").val()) } }
        }).render(true);
    }
    
    function confirmPasswordEnter() {
        if (modalData.input === modalData.targetGroup.password) {
            switchChat(modalData.targetGroup.id, modalData.targetGroup.name);
            closeModal();
        } else { ui.notifications.error("Senha Incorreta"); }
    }
</script>

<div class="nexus-hub-root" style="{Object.entries(currentTheme.vars).map(([k,v]) => `${k}:${v}`).join(';')};">

{#if showDiceLogic}
        <div style="position: absolute; inset: 0; z-index: 100; pointer-events: auto;">
            <DiceLogic 
                character={mainActor} 
                pool={{d:4, hd:0, wd:0}} 
                on:close={() => showDiceLogic = false}
                externalHandler={handleDiceLogicResult} 
            />
        </div>
    {/if}

    {#if activeModal || showWarning}
        <div class="modal-layer" transition:fade={{duration: 150}}>
            {#if showWarning}
                <div class="terminal-card warning" in:scale>
                    <header>⚠️ SISTEMA VETOR</header>
                    <div class="card-content"><p>Conexão segura estabelecida.</p><button class="btn-full" on:click={() => showWarning = false}>ENTRAR</button></div>
                </div>
            {:else if activeModal === 'create_group'}
                <div class="terminal-card" in:scale>
                    <header>NOVO CANAL</header>
                    <div class="card-content">
                        <input type="text" bind:value={modalData.input} class="hacker-input" placeholder="NOME" />
                        <input type="password" bind:value={modalData.input2} class="hacker-input" placeholder="SENHA (OPCIONAL)" style="margin-top:10px" />
                    </div>
                    <div class="card-footer"><button class="btn-ghost" on:click={closeModal}>X</button><button class="btn-main" on:click={createGroupAction}>CRIAR</button></div>
                </div>
            {:else if activeModal === 'password'}
                <div class="terminal-card small" in:scale>
                    <header>SENHA: {modalData.targetGroup.name}</header>
                    <div class="card-content"><input type="password" bind:value={modalData.input} class="hacker-input-large" autofocus on:keydown={e=>e.key==='Enter'&&confirmPasswordEnter()}/></div>
                    <div class="card-footer"><button class="btn-ghost" on:click={closeModal}>VOLTAR</button><button class="btn-main" on:click={confirmPasswordEnter}>ENTRAR</button></div>
                </div>
            {:else if activeModal === 'confirm_delete'}
                <div class="terminal-card small" in:scale>
                    <header>EXCLUIR {modalData.targetGroup.name}?</header>
                    <div class="card-content" style="color: red; text-align: center;">Esta ação é irreversível.</div>
                    <div class="card-footer"><button class="btn-ghost" on:click={closeModal}>NÃO</button><button class="btn-main" style="background:red" on:click={confirmDelete}>SIM, EXCLUIR</button></div>
                </div>
            {:else if activeModal === 'delete_password'}
                <div class="terminal-card small" in:scale>
                    <header>SENHA PARA EXCLUIR</header>
                    <div class="card-content"><input type="password" bind:value={modalData.input} class="hacker-input-large" autofocus /></div>
                    <div class="card-footer"><button class="btn-ghost" on:click={closeModal}>CANCELAR</button><button class="btn-main" style="background:red" on:click={confirmDelete}>DELETAR</button></div>
                </div>
            {/if}
        </div>
    {/if}

    <aside class="nexus-sidebar">
        <div class="nav-icons">
            <button class:active={$hubActiveTab === 'network'} on:click={() => setTab('network')} title="Feed">
                <i class="fas fa-home" class:blinking={hasUnreadFeed && $hubActiveTab !== 'network'} style={hasUnreadFeed && $hubActiveTab !== 'network' ? 'color:#00ff41;' : ''}></i>
            </button>
            <button class:active={$hubActiveTab === 'explore'} on:click={() => setTab('explore')} title="Explorar"><i class="fas fa-search"></i></button>
            <button class:active={$hubActiveTab === 'chats'} on:click={() => setTab('chats')} title="Directs">
                <i class="fas fa-paper-plane" class:blinking={hasUnreadDMs && $hubActiveTab !== 'chats'} style={hasUnreadDMs && $hubActiveTab !== 'chats' ? 'color:#00ff41;' : ''}></i>
            </button>
            <button class:active={$hubActiveTab === 'profile'} on:click={() => setTab('profile')} title="Perfil"><i class="fas fa-user"></i></button>
            <button class:active={$hubActiveTab === 'personas'} on:click={() => setTab('personas')} title="Trocar Ficha (OOC)"><i class="fas fa-id-card"></i></button>
            {#if game.user.isGM}
                <button class:active={$hubActiveTab === 'gm_visibility'} on:click={() => setTab('gm_visibility')} title="Visão do Mestre"><i class="fas fa-eye"></i></button>
            {/if}
            <div class="nav-sep"></div>
            <button class:active={$hubActiveTab === 'settings'} on:click={() => setTab('settings')}><i class="fas fa-paint-brush"></i></button>
        </div>
        <div class="user-mini-status">
            <img src={mainActor?.img || "icons/svg/mystery-man.svg"} alt="Me"/>
            <div class="dot real"></div>
        </div>
    </aside>

    <main class="nexus-viewport">
        {#if $hubActiveTab === 'chats'}
            <div class="split-view" in:fade>
                <aside class="chat-list-sidebar">
                    <div class="section-label">DIRECTS</div>
                    <div class="scroll-list custom-scroll">
                        {#each groups as g}
                            <div class="chat-row" class:active={$hubActiveChatId === g.id} role="button" tabindex="0"
                                on:click={() => {
                                    if(g.isPrivate && !game.user.isGM) { modalData.targetGroup = g; activeModal = 'password'; }
                                    else switchChat(g.id, g.name);
                                }}>
                                <div style="display:flex; align-items:center; gap:8px; flex:1;">
                                    <i class="fas {g.isPrivate ? 'fa-lock' : 'fa-hashtag'}"></i>
                                    <span>{g.name}</span>
                                </div>
                                <i class="fas fa-trash trash-icon" role="button" tabindex="0" on:click|stopPropagation={(e) => initiateDeleteGroup(g, e)}></i>
                            </div>
                        {/each}
                    </div>

                    <div class="section-label">MENSAGENS DIRETAS</div>
                    <div class="scroll-list custom-scroll" style="margin-bottom:15px;">
                        {#each activeDMs as dm}
                            <div class="chat-row" class:active={$hubActiveChatId === dm.id} role="button" tabindex="0" on:click={() => switchChat(dm.id, dm.name)}>
                                <div style="display:flex; align-items:center; gap:8px; flex:1;">
                                    <i class="fas fa-user" style={dm.unread ? 'color:#00ff41;' : ''}></i>
                                    <span style={dm.unread ? 'font-weight:bold; color:#00ff41;' : ''}>{dm.name}</span>
                                </div>
                                {#if dm.unread}
                                    <div class="unread-dot"></div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </aside>

                <section class="chat-main">
                    <header class="chat-header-bar"><span class="channel-name"># {$hubActiveChatName}</span></header>
                    <div class="message-log custom-scroll" bind:this={chatContainer}>
                        {#each messages as m (m.id)}
                            <div class="msg-row" class:me={m.senderId === game.user.id || m.senderId === mainActor?.id || m.realName === game.user.name} in:fade>
                                <img src={m.senderImg} class="msg-avatar" alt="av" on:click={()=>window.open(m.senderImg)}/>
                                <div class="msg-content-wrapper">
                                    <div class="msg-header">
                                        <span class="msg-sender" style="color:{m.color}">{m.senderName}</span>
                                        {#if m.senderName !== m.realName}<span class="msg-tag">({m.realName})</span>{/if}
                                        <span class="msg-time">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div class="msg-bubble {m.isRoll ? 'roll' : ''}" style="border-left-color: {m.color}">
                                        {#if m.image}<img src={m.image} class="msg-attach" alt="media" on:click={()=>window.open(m.image)} />{/if}
                                        <div class="msg-text">{@html m.text}</div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                    
                    <div class="action-bar" style="justify-content: flex-end;">
                        <!-- Vetor Rolador Oculto nas DMs para manter visual social limpo -->
                        <div class="quick-roll-box" style="max-width: 200px;">
                            <input type="text" bind:value={simpleRollFormula} placeholder="Ex: /r 1d20" on:keydown={async (e) => {
                                if(e.key === 'Enter' && simpleRollFormula) {
                                    try { let r = new Roll(simpleRollFormula); await r.evaluate(); send(null, await r.render(), true); simpleRollFormula=""; }
                                    catch(err) { ui.notifications.error("Erro na rolagem"); }
                                }
                            }} />
                        </div>
                    </div>
                    
                    <div class="chat-composer">
                        <button class="btn-icon" on:click={openImageDialog}><i class="fas fa-image"></i></button>
                        <textarea bind:value={newMessage} placeholder="Transmitir... (/cls)" on:keydown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}></textarea>
                        <button class="send-btn" on:click={()=>send()}><i class="fas fa-paper-plane"></i></button>
                    </div>
                </section>
            </div>

        {:else if $hubActiveTab === 'network'}
            <div class="app-pane" style="padding:0;" in:fade>
                <SocialNetworkFeed actor={mainActor} viewMode="feed" on:openDM={(e) => openDM(game.actors.get(e.detail))} />
            </div>

        {:else if $hubActiveTab === 'explore'}
            <div class="app-pane" style="padding:0;" in:fade>
                <SocialNetworkFeed actor={mainActor} viewMode="explore" on:openDM={(e) => openDM(game.actors.get(e.detail))} />
            </div>

        {:else if $hubActiveTab === 'profile'}
            <div class="app-pane" style="padding:0;" in:fade>
                <SocialNetworkFeed actor={mainActor} viewMode="profile" on:openDM={(e) => openDM(game.actors.get(e.detail))} />
            </div>

        {:else if $hubActiveTab === 'personas'}
             <div class="app-pane" in:fade>
                <div class="settings-grid">
                    <label>MINHAS PERSONAS (FICHAS)</label>
                    <input type="text" bind:value={personaSearchTerm} class="hacker-input" placeholder="Pesquisar por nome de ficha ou perfil..." style="margin-bottom: 15px; width: 100%;" />
                    <div class="player-list-grid custom-scroll" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                        {#each filteredActors as act}
                            <div class="player-card {act.id === $hubActiveActorId ? 'on' : 'off'}" on:click={() => hubActiveActorId.set(act.id)}>
                                <div class="p-avatar"><img src={act.img} alt="user" /><div class="p-dot"></div></div>
                                <div class="p-info">
                                    <b>{act.socialName}</b>
                                    <span>{act.name}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
             </div>
             {:else if $hubActiveTab === 'gm_visibility' && game.user.isGM}
             <div class="app-pane" in:fade>
                 <div class="settings-grid">
                     <label>VISÃO DO MESTRE (PERFIS NO HUB)</label>
                     <p style="font-size: 11px; color: #aaa; margin-bottom: 5px;">Marque as fichas que podem aparecer nas pesquisas e serem vistas pelos jogadores.</p>
                     <input type="text" bind:value={gmSearchTerm} class="hacker-input" placeholder="Pesquisar por nome de ficha..." style="margin-bottom: 15px; width: 100%;" />
                     <div class="player-list-grid custom-scroll" style="max-height: 500px; overflow-y: auto; padding-right: 5px;">
                         {#each Array.from(game.actors).filter(a => a.type === "character" && a.name.toLowerCase().includes(gmSearchTerm.toLowerCase())) as act}
                             <div class="player-card {socialVisibleActors.includes(act.id) ? 'on' : 'off'}" on:click={() => toggleVisibility(act.id)}>
                                 <div class="p-avatar"><img src={act.img} alt="user" /><div class="p-dot"></div></div>
                                 <div class="p-info">
                                     <b>{act.name}</b>
                                     <span style="font-size:10px; color:#888;">{socialVisibleActors.includes(act.id) ? 'Visível' : 'Oculto'}</span>
                                 </div>
                             </div>
                         {/each}
                     </div>
                 </div>
             </div>

        {:else if $hubActiveTab === 'settings'}
            <div class="app-pane" in:fade>
                <div class="settings-grid"><label>TEMAS</label>
                    <div class="theme-list">
                         {#each Object.entries(CHAT_THEME_DB) as [key, theme]}
                            <button class="theme-card" class:active={savedTheme === key} on:click={() => setChatTheme(key)}>
                                <div class="color-preview" style="background: {theme.vars['--chat-accent']}"></div><span>{theme.label}</span>
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </main>
</div>

<style>
    /* CSS BLINDADO PARA INTERAÇÃO */
    .nexus-hub-root { display: flex; width: 100%; height: 100%; background: var(--chat-bg); color: var(--chat-text); font-family: var(--font, monospace); position: relative; overflow: hidden; border: 1px solid var(--chat-border); pointer-events: none; }
    .nexus-sidebar, .nexus-viewport, .modal-layer, .dice-logic-overlay { pointer-events: auto; }
    .custom-bg-layer { position: absolute; inset: 0; pointer-events: none; background-image: var(--custom-bg); background-size: cover; background-position: center; opacity: 0.2; z-index: 0; }
    
    .nexus-sidebar { width: 60px; min-width: 60px; background: rgba(0,0,0,0.6); border-right: 1px solid var(--chat-border); display: flex; flex-direction: column; justify-content: space-between; padding: 15px 0; align-items: center; z-index: 2; }
    .nav-icons { display: flex; flex-direction: column; gap: 18px; align-items: center; width: 100%; }
    .nexus-sidebar button { background: none; border: none; color: var(--chat-text); font-size: 22px; cursor: pointer; opacity: 0.4; transition: 0.2s; }
    .nexus-sidebar button.active { opacity: 1; color: var(--chat-accent); text-shadow: 0 0 10px var(--chat-accent); }
    .user-mini-status img { width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--chat-border); }
    @keyframes fastPulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
    .blinking { animation: fastPulse 1s infinite; text-shadow: 0 0 10px #00ff41; }
    .unread-dot { width: 8px; height: 8px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 5px #00ff41; }
    
    .nexus-viewport { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; z-index: 1; min-width: 0; }
    .split-view { display: flex; height: 100%; width: 100%; }
    .chat-list-sidebar { width: 220px; min-width: 180px; background: rgba(0,0,0,0.4); border-right: 1px solid var(--chat-border); display: flex; flex-direction: column; }
    .scroll-list { flex: 1; overflow-y: auto; padding: 10px; }
    .section-label { padding: 10px 15px; font-size: 10px; color: var(--chat-accent); font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
    .btn-tiny { background: transparent; border: 1px solid var(--chat-accent); color: var(--chat-accent); cursor: pointer; border-radius: 3px; font-size: 10px; width: 18px; height: 18px; }
    
    /* CORREÇÃO CSS: .chat-row agora é div, estilo de botão mantido */
    .chat-row { background: transparent; border: none; color: var(--chat-text); padding: 8px 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; text-align: left; width: 100%; border-radius: 4px; transition: 0.2s; }
    .chat-row:hover { background: rgba(255,255,255,0.05); }
    .chat-row.active { background: rgba(var(--chat-accent), 0.15); border-left: 3px solid var(--chat-accent); color: var(--chat-accent); }
    .trash-icon { opacity: 0; transition: 0.2s; color: #ff5555; pointer-events: auto; padding: 5px; } /* Padding aumenta área de clique */
    .chat-row:hover .trash-icon { opacity: 1; }

    .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .chat-header-bar { height: 45px; min-height: 45px; border-bottom: 1px solid var(--chat-border); display: flex; align-items: center; padding: 0 20px; background: rgba(0,0,0,0.3); font-weight: bold; color: var(--chat-accent); }
    .message-log { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
    .msg-row { display: flex; gap: 12px; align-items: flex-start; }
    .msg-row.me { flex-direction: row-reverse; }
    .msg-avatar { width: 40px; height: 40px; border-radius: 4px; border: 1px solid var(--chat-border); flex-shrink: 0; cursor: pointer; object-fit: cover; }
    .msg-content-wrapper { display: flex; flex-direction: column; max-width: 80%; }
    .me .msg-content-wrapper { align-items: flex-end; }
    .msg-header { font-size: 11px; margin-bottom: 2px; opacity: 0.8; display: flex; gap: 6px; align-items: center; }
    .msg-sender { font-weight: bold; }
    .msg-time { font-size: 9px; opacity: 0.5; }
    .msg-bubble { background: var(--msg-theirs-bg); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--msg-theirs-border); border-left-width: 3px; font-size: 13px; line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; }
    .me .msg-bubble { background: var(--msg-mine-bg); border-color: var(--msg-mine-border); text-align: right; }
    .msg-bubble.roll { background: rgba(0,0,0,0.5) !important; border-style: dashed; }
    .msg-attach { max-width: 100%; border-radius: 4px; margin-bottom: 5px; cursor: pointer; }

    /* CORREÇÃO CSS: Z-INDEX para botões de ação */
    .action-bar { position: relative; z-index: 10; display: flex; align-items: center; gap: 10px; padding: 5px 15px; background: rgba(0,0,0,0.3); border-top: 1px solid var(--chat-border); }
    
    .vetor-btn { background: var(--chat-accent); color: #000; border: none; padding: 4px 12px; font-weight: bold; cursor: pointer; font-size: 11px; border-radius: 3px; pointer-events: auto; }
    .quick-roll-box { flex: 1; display: flex; align-items: center; gap: 5px; }
    .label-mini { font-size: 9px; color: #888; }
    .quick-roll-box input { background: transparent; border: none; color: #fff; width: 100%; font-family: inherit; }

    .chat-composer { padding: 15px; background: var(--input-bg); border-top: 1px solid var(--chat-border); display: flex; gap: 10px; align-items: flex-end; position: relative; }
    .chat-composer textarea { flex: 1; background: rgba(0,0,0,0.5); border: 1px solid var(--chat-border); color: #fff; padding: 10px; border-radius: 4px; resize: none; height: 50px; font-family: inherit; }
    .btn-icon, .send-btn { width: 40px; height: 40px; border-radius: 4px; border: 1px solid var(--chat-border); background: transparent; color: var(--chat-text); cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .send-btn { background: var(--chat-accent); color: #000; border: none; }

    .app-pane { padding: 30px; height: 100%; overflow-y: auto; }
    .centered { display: flex; justify-content: center; align-items: center; }
    .spoofer-box { width: 100%; max-width: 450px; background: rgba(0,0,0,0.4); border: 1px solid var(--chat-accent); padding: 20px; }
    .form-group { margin-bottom: 15px; }
    .hacker-input { width: 100%; background: #050505; border: 1px solid var(--chat-border); color: var(--chat-accent); padding: 8px; font-family: inherit; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; }
    .toggle-btn { background: #222; color: #666; border: 1px solid #444; padding: 5px 15px; cursor: pointer; }
    .toggle-btn.on { background: var(--chat-accent); color: #000; border-color: var(--chat-accent); font-weight: bold; }
    .btn-full { width: 100%; background: var(--chat-accent); color: #000; font-weight: bold; padding: 10px; border: none; cursor: pointer; }

    .player-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .player-card { background: rgba(255,255,255,0.03); border: 1px solid var(--chat-border); padding: 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.2s; }
    .player-card:hover { border-color: var(--chat-accent); background: rgba(255,255,255,0.05); }
    .p-avatar { position: relative; width: 40px; height: 40px; }
    .p-avatar img { width: 100%; height: 100%; border-radius: 50%; border: 1px solid #555; }
    .p-dot { width: 10px; height: 10px; background: #00ff00; border-radius: 50%; position: absolute; bottom: 0; right: 0; border: 2px solid #000; }
    .off .p-dot { background: #555; }
    .status-dot-mini { width: 8px; height: 8px; border-radius: 50%; background: #555; margin-right: 5px; }
    .status-dot-mini.online { background: #00ff41; box-shadow: 0 0 5px #00ff41; }

    .modal-layer { position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; justify-content: center; align-items: center; }
    .terminal-card { background: #111; border: 1px solid var(--chat-accent); width: 350px; box-shadow: 0 0 30px #000; pointer-events: auto; }
    .terminal-card header { background: var(--chat-accent); color: #000; padding: 8px 15px; font-weight: bold; font-size: 12px; }
    .card-content { padding: 20px; }
    .card-footer { padding: 15px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #333; }
    .btn-ghost { background: transparent; border: 1px solid #444; color: #ccc; padding: 5px 15px; cursor: pointer; }
    .btn-main { background: var(--chat-accent); color: #000; border: none; padding: 5px 15px; font-weight: bold; cursor: pointer; }
    .hacker-input-large { width: 100%; font-size: 24px; text-align: center; background: #000; border: 1px solid var(--chat-accent); color: var(--chat-accent); padding: 5px; }
    
    .theme-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .theme-card { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--chat-border); cursor: pointer; color: #fff; }
    .theme-card.active { border-color: var(--chat-accent); background: rgba(var(--chat-accent), 0.1); }
    .color-preview { width: 16px; height: 16px; border-radius: 50%; }
    
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--chat-accent); border-radius: 3px; }
</style>