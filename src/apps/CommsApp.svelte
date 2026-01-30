<script>
    import { onMount, tick } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { CommsDatabase } from '../database/CommsDatabase.js';
    import { chatStore, groupsStore, activeTabStore, activeChatIdStore, activeChatNameStore, updateCommsStore } from '../database/CommsStore.js';

    export let actor;
    export let themeStyle = "";
    const MODULE_ID = "multiversus-rpg";

    // --- SUBSCRIPTIONS ---
    let activeTab; activeTabStore.subscribe(v => activeTab = v);
    let activeChatId; activeChatIdStore.subscribe(v => activeChatId = v);
    let activeChatName; activeChatNameStore.subscribe(v => activeChatName = v);
    
    // MENSAGENS REATIVAS
    $: messages = ($chatStore || []).filter(m => m.chatId === activeChatId);

    // GRUPOS REATIVOS (Todos visíveis agora)
    $: groups = $groupsStore || [];

    let newMessage = "";
    let chatContainer;
    let showWarning = true;
    let activeModal = null; 
    let modalData = { input: "", input2: "", targetGroup: null };

    // DADOS DA FICHA
    $: contacts = actor.getFlag(MODULE_ID, "contacts") || [];
    $: statusFeed = game.settings.get(MODULE_ID, "comms_status") || [];
    $: myCommID = actor.getFlag(MODULE_ID, "commID") || "MV-0000";

    onMount(async () => {
        myCommID = await CommsDatabase.getCommID(actor);
        updateCommsStore();
        Hooks.on("commsUpdate", () => { updateCommsStore(); scroll(); });
    });

    async function scroll() { await tick(); if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight; }

    function closeModal() { activeModal = null; modalData = { input: "", input2: "", targetGroup: null }; }
    function setTab(tab) { activeTabStore.set(tab); }

    function switchChat(id, name) {
        activeChatIdStore.set(id);
        activeChatNameStore.set(name);
        scroll();
    }

    // --- LÓGICA DE ENTRADA (Senha toda vez) ---
    function handleEnterGroup(group) {
        if (!group.isPrivate || game.user.isGM) {
            return switchChat(group.id, group.name);
        }
        // Se for privado, abre modal de senha SEMPRE
        modalData = { input: "", targetGroup: group };
        activeModal = 'password';
    }

    function confirmPassword() {
        if (modalData.input === modalData.targetGroup.password) {
            switchChat(modalData.targetGroup.id, modalData.targetGroup.name);
            closeModal();
        } else {
            ui.notifications.error("CHAVE_INVÁLIDA");
            modalData.input = "";
        }
    }

    async function send(img = null) {
        if (!newMessage.trim() && !img) return;
        await CommsDatabase.sendMessage({
            chatId: activeChatId, senderActorId: actor.id, senderName: actor.name,
            senderImg: actor.img, senderCommID: myCommID, text: newMessage.trim(), image: img
        });
        newMessage = "";
    }

    function openDM(contact) {
        const dmId = CommsDatabase.getPrivateChatId(actor.id, contact.id);
        switchChat(dmId, contact.name);
        setTab('chats');
    }
</script>

<div class="comms-app-root" style="{themeStyle}">
    
    {#if activeModal || showWarning}
        <div class="modal-layer" transition:fade>
            {#if showWarning}
                <div class="terminal-card warning" in:scale>
                    <header>⚠️ PROTOCOLO_CANÔNICO</header>
                    <div class="card-content">
                        {@html CommsDatabase.getRPWarning()}
                        <button class="btn-full" on:click={() => showWarning = false}>AUTENTICAR</button>
                    </div>
                </div>
            {:else if activeModal === 'password'}
                <div class="terminal-card small" in:scale>
                    <header>SENHA REQUERIDA: {modalData.targetGroup.name}</header>
                    <div class="card-content center">
                        <input type="password" maxlength="4" bind:value={modalData.input} class="hacker-input-large" autofocus on:keydown={e => e.key === 'Enter' && confirmPassword()}/>
                    </div>
                    <div class="card-footer">
                        <button class="btn-ghost" on:click={closeModal}>ABORTAR</button>
                        <button class="btn-main" on:click={confirmPassword}>ENTRAR</button>
                    </div>
                </div>
            {:else if activeModal === 'add_contact'}
                <div class="terminal-card small" in:scale>
                    <header>VINCULAR_NOVO_ID</header>
                    <div class="card-content center">
                        <input type="text" bind:value={modalData.input} class="hacker-input" placeholder="MV-XXXX" />
                    </div>
                    <div class="card-footer">
                        <button class="btn-ghost" on:click={closeModal}>CANCELAR</button>
                        <button class="btn-main" on:click={() => { CommsDatabase.addContact(actor, modalData.input.toUpperCase()); closeModal(); }}>SINCRONIZAR</button>
                    </div>
                </div>
            {:else if activeModal === 'create_group'}
                <div class="terminal-card" in:scale>
                    <header>NOVA_FREQUÊNCIA</header>
                    <div class="card-content">
                        <input type="text" bind:value={modalData.input} class="hacker-input" placeholder="NOME DO CANAL" />
                        <input type="password" maxlength="4" bind:value={modalData.input2} class="hacker-input" placeholder="SENHA (OPCIONAL)" style="margin-top:10px" />
                    </div>
                    <div class="card-footer">
                        <button class="btn-ghost" on:click={closeModal}>VOLTAR</button>
                        <button class="btn-main" on:click={() => { CommsDatabase.createGroup(modalData.input, modalData.input2); closeModal(); }}>INICIALIZAR</button>
                    </div>
                </div>
            {:else if activeModal === 'post_status'}
                <div class="terminal-card" in:scale>
                    <header>TRANSMITIR_AO_FEED</header>
                    <div class="card-content">
                        <input type="text" bind:value={modalData.input} class="hacker-input" placeholder="Mensagem..." />
                        <input type="text" bind:value={modalData.input2} class="hacker-input" placeholder="URL da Imagem..." style="margin-top:10px" />
                    </div>
                    <div class="card-footer">
                        <button class="btn-ghost" on:click={closeModal}>ABORTAR</button>
                        <button class="btn-main" on:click={() => { CommsDatabase.updateStatus(actor, {text: modalData.input, image: modalData.input2}); closeModal(); }}>TRANSMITIR</button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <nav class="app-nav">
        <button class:active={activeTab === 'chats'} on:click={() => setTab('chats')}><i class="fas fa-terminal"></i><span>REDE</span></button>
        <button class:active={activeTab === 'contacts'} on:click={() => setTab('contacts')}><i class="fas fa-users-cog"></i><span>LINKS</span></button>
        <button class:active={activeTab === 'status'} on:click={() => setTab('status')}><i class="fas fa-satellite"></i><span>FEED</span></button>
    </nav>

    <div class="app-viewport">
        {#if activeTab === 'chats'}
            <div class="split-view" in:fade>
                <aside class="chat-selector">
                    <div class="sidebar-label">CANAIS <button class="btn-mini" on:click={() => activeModal = 'create_group'}>+</button></div>
                    <div class="scroll-list">
                        {#each groups as g}
                            <button class="chat-tab" class:active={activeChatId === g.id} on:click={() => handleEnterGroup(g)}>
                                <i class="fas {g.icon}"></i> <span>{g.name}</span>
                            </button>
                        {/each}
                    </div>
                    <div class="sidebar-label">DIRETAS</div>
                    <div class="scroll-list">
                        {#each contacts as c}
                            <button class="chat-tab" class:active={activeChatId === CommsDatabase.getPrivateChatId(actor.id, c.id)} on:click={() => openDM(c)}>
                                <img src={c.img} class="av-mini" alt="av"/> <span>{c.name}</span>
                            </button>
                        {/each}
                    </div>
                </aside>

                <main class="chat-main">
                    <header class="chat-info"><div class="title-wrap"># {activeChatName}</div></header>
                    <div class="message-log" bind:this={chatContainer}>
                        {#each messages as m (m.id)}
                            <div class="msg-block" class:me={m.senderActorId === actor.id} in:fade>
                                <div class="bubble">
                                    <div class="b-head">
                                        <span class="b-name">{m.senderName}</span>
                                        <span class="b-id" on:click={() => CommsDatabase.addContact(actor, m.senderCommID)}>#{m.senderCommID}</span>
                                    </div>
                                    {#if m.image}<img src={m.image} class="b-img" alt="media" on:click={() => window.open(m.image)} />{/if}
                                    <div class="b-text">{@html m.text.replace(/\n/g, '<br>')}</div>
                                    <div class="b-time">{new Date(m.timestamp).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        {/each}
                    </div>
                    <div class="chat-composer">
                        <button class="btn-small-icon" on:click={() => { 
                             new Dialog({
                                title: "ANEXAR", content: `<input id="u" class="hacker-input" style="width:100%" placeholder="URL da imagem...">`,
                                buttons: { ok: { label: "ENVIAR", callback: (h) => send(h.find("#u").val()) }}
                            }).render(true);
                        }}><i class="fas fa-paperclip"></i></button>
                        <textarea class="chat-input" bind:value={newMessage} on:keydown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}></textarea>
                        <button class="btn-small-send" on:click={() => send()}><i class="fas fa-paper-plane"></i></button>
                    </div>
                </main>
            </div>

        {:else if activeTab === 'contacts'}
            <div class="contacts-panel" in:fade>
                <div class="id-hero">
                    <div class="hero-label">ID_LOCAL</div>
                    <div class="hero-val">{myCommID}</div>
                    <button class="btn-main" on:click={() => activeModal = 'add_contact'}>SINCRONIZAR_ID</button>
                </div>
                <div class="contact-grid">
                    {#each contacts as c}
                        <div class="contact-card" on:click={() => openDM(c)}>
                            <img src={c.img} alt="av" />
                            <div class="c-meta"><b>{c.name}</b><span>{c.commID}</span></div>
                        </div>
                    {/each}
                </div>
            </div>

        {:else if activeTab === 'status'}
            <div class="status-panel" in:fade>
                <button class="btn-status-post" on:click={() => activeModal = 'post_status'}>ATUALIZAR_MEU_FEED</button>
                <div class="status-list">
                    {#each statusFeed as s}
                        <div class="status-card-v2" style="background-image: url({s.image && s.image.length > 3 ? s.image : 'icons/svg/hazard.svg'})">
                            <div class="card-overlay">
                                <img src={s.img} class="s-av" alt="av"/>
                                <div class="s-info"><b>{s.name}</b><p>{s.text}</p></div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>


<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .comms-app-root {
        display: flex;
        height: 100%;
        background: var(--c-bg);
        color: var(--c-text);
        font-family: 'Share Tech Mono', monospace;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(var(--c-primary), 0.2);
    }

    /* --- NAVEGAÇÃO LATERAL --- */
    .app-nav {
        width: 60px;
        background: rgba(0, 0, 0, 0.4);
        border-right: 1px solid rgba(var(--c-primary), 0.3);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 25px;
        padding: 25px 0;
        z-index: 10;
    }

    .app-nav button {
        background: transparent;
        border: none;
        color: rgba(var(--c-primary), 0.3);
        font-size: 22px;
        cursor: pointer;
        transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }

    .app-nav button span { font-size: 8px; font-weight: bold; }
    .app-nav button:hover { color: var(--c-primary); transform: scale(1.1); }
    .app-nav button.active { 
        color: var(--c-primary); 
        filter: drop-shadow(0 0 8px var(--c-primary)); 
    }

    /* --- VIEWPORT & SPLIT VIEW --- */
    .app-viewport { flex: 1; position: relative; overflow: hidden; }
    .split-view { display: flex; height: 100%; }

    /* --- SIDEBAR DE CHATS --- */
    .chat-selector {
        width: 240px;
        background: rgba(0, 0, 0, 0.2);
        border-right: 1px solid rgba(var(--c-primary), 0.1);
        display: flex;
        flex-direction: column;
    }

    .sidebar-label {
        padding: 15px;
        font-size: 10px;
        letter-spacing: 2px;
        color: var(--c-primary);
        opacity: 0.6;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(var(--c-primary), 0.05);
    }

    .btn-mini {
        background: transparent;
        border: 1px solid var(--c-primary);
        color: var(--c-primary);
        border-radius: 3px;
        width: 18px;
        height: 18px;
        cursor: pointer;
        font-size: 12px;
    }

    .scroll-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 4px; }

    .chat-tab {
        background: transparent;
        border: 1px solid transparent;
        color: #888;
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: 0.2s;
        border-radius: 4px;
        text-align: left;
        font-family: inherit;
    }

    .chat-tab:hover { background: rgba(var(--c-primary), 0.05); color: #ccc; }
    .chat-tab.active { 
        background: rgba(var(--c-primary), 0.1); 
        border-color: rgba(var(--c-primary), 0.3); 
        color: var(--c-primary);
        box-shadow: inset 4px 0 0 var(--c-primary);
    }

    .av-mini { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--c-primary); }

    /* --- JANELA PRINCIPAL DE CHAT --- */
    .chat-main { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.3); }

    .chat-info {
        height: 50px;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(var(--c-primary), 0.2);
        background: rgba(0,0,0,0.4);
    }

    .title-wrap { color: var(--c-primary); font-weight: bold; letter-spacing: 1px; font-size: 14px; }
    .id-tag { font-size: 9px; opacity: 0.4; border: 1px solid currentColor; padding: 2px 6px; border-radius: 10px; }

    /* --- MENSAGENS --- */
    .message-log {
        flex: 1;
        overflow-y: auto;
        padding: 25px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        background-image: radial-gradient(rgba(var(--c-primary), 0.03) 1px, transparent 1px);
        background-size: 20px 20px;
    }

    .msg-block { display: flex; width: 100%; }
    .msg-block.me { justify-content: flex-end; }

    .bubble {
        max-width: 75%;
        background: rgba(20, 20, 20, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px;
        border-radius: 4px;
        position: relative;
    }

    .me .bubble {
        border-color: rgba(var(--c-primary), 0.4);
        background: rgba(var(--c-primary), 0.05);
        box-shadow: 0 0 15px rgba(0,0,0,0.3);
    }

    .b-head { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 6px; gap: 20px; }
    .b-name { color: var(--c-primary); font-weight: bold; }
    .b-id { opacity: 0.3; cursor: pointer; }
    .b-id:hover { opacity: 1; text-decoration: underline; }

    .b-text { font-size: 13px; line-height: 1.5; color: #ddd; word-break: break-word; }
    .b-img { max-width: 100%; border-radius: 4px; margin: 8px 0; border: 1px solid #333; cursor: zoom-in; }
    .b-time { font-size: 8px; opacity: 0.3; margin-top: 5px; text-align: right; }

    /* --- COMPOSER (ÁREA DE ESCRITA) --- */
    .chat-composer {
        min-height: 90px;
        padding: 15px 20px;
        background: rgba(0,0,0,0.6);
        border-top: 1px solid rgba(var(--c-primary), 0.2);
        display: flex;
        gap: 12px;
        align-items: flex-end;
    }

    .chat-input {
        flex: 1;
        background: rgba(0,0,0,0.8);
        border: 1px solid #333;
        color: #fff;
        padding: 12px;
        min-height: 60px;
        max-height: 150px;
        border-radius: 4px;
        resize: none;
        font-family: inherit;
        font-size: 13px;
        outline: none;
        transition: 0.3s;
    }

    .chat-input:focus { border-color: var(--c-primary); box-shadow: 0 0 10px rgba(var(--c-primary), 0.2); }

    .btn-small-icon, .btn-small-send {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        background: #111;
        color: var(--c-primary);
        border: 1px solid #333;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.2s;
    }

    .btn-small-send { background: var(--c-primary); color: #000; border: none; font-size: 18px; }
    .btn-small-send:hover { transform: translateY(-2px); box-shadow: 0 0 15px var(--c-primary); }

    /* --- MODAIS TIPO TERMINAL --- */
    .modal-layer {
        position: absolute;
        inset: 0;
        z-index: 1000;
        background: rgba(0,0,0,0.9);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
    }

    .terminal-card {
        background: #050505;
        border: 1px solid var(--c-primary);
        width: 100%;
        max-width: 500px;
        box-shadow: 0 0 40px #000;
        display: flex;
        flex-direction: column;
    }

    .terminal-card header {
        padding: 12px 20px;
        background: var(--c-primary);
        color: #000;
        font-weight: bold;
        font-size: 12px;
        letter-spacing: 2px;
    }

    .card-content { padding: 30px; overflow-y: auto; max-height: 60vh; }
    .card-content.center { text-align: center; }

    .card-footer {
        padding: 15px;
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        border-top: 1px solid #222;
    }

    .hacker-input-large {
        background: #000;
        border: 1px solid var(--c-primary);
        color: var(--c-primary);
        font-size: 32px;
        text-align: center;
        width: 200px;
        margin-top: 20px;
        letter-spacing: 10px;
        padding: 10px;
    }

    .btn-main { background: var(--c-primary); color: #000; border: none; padding: 10px 25px; font-weight: bold; cursor: pointer; }
    .btn-ghost { background: transparent; border: 1px solid #444; color: #666; padding: 10px 25px; cursor: pointer; }
    .btn-full { width: 100%; background: var(--c-primary); border: none; padding: 15px; font-weight: bold; cursor: pointer; }

    /* --- ABA CONTATOS --- */
    .contacts-panel { padding: 40px; overflow-y: auto; height: 100%; }
    .id-hero {
        background: rgba(var(--c-primary), 0.05);
        border: 2px dashed rgba(var(--c-primary), 0.3);
        padding: 30px;
        text-align: center;
        margin-bottom: 40px;
    }
    .hero-label { font-size: 10px; opacity: 0.5; margin-bottom: 10px; }
    .hero-val { font-size: 48px; font-weight: bold; color: var(--c-primary); text-shadow: 0 0 20px var(--c-primary); margin-bottom: 20px; }

    .contact-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
    .contact-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid #222;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 15px;
        cursor: pointer;
        transition: 0.2s;
    }
    .contact-card:hover { border-color: var(--c-primary); background: rgba(var(--c-primary), 0.05); }
    .contact-card img { width: 45px; height: 45px; border-radius: 50%; border: 1px solid var(--c-primary); }
    .c-meta { display: flex; flex-direction: column; }
    .c-name { font-weight: bold; font-size: 14px; }
    .c-id { font-size: 10px; opacity: 0.4; }

    /* --- ABA STATUS --- */
    .status-panel { padding: 30px; height: 100%; overflow-y: auto; }
    .btn-status-post {
        width: 100%;
        background: transparent;
        border: 2px dashed #333;
        color: #555;
        padding: 25px;
        font-weight: bold;
        margin-bottom: 30px;
        cursor: pointer;
        transition: 0.2s;
    }
    .btn-status-post:hover { border-color: var(--c-primary); color: var(--c-primary); }

    .status-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
    .status-card-v2 {
        aspect-ratio: 9/16;
        background-size: cover;
        background-position: center;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
        border: 1px solid #222;
        transition: 0.3s;
    }
    .status-card-v2:hover { transform: scale(1.02); border-color: var(--c-primary); }

    .card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(transparent 40%, rgba(0,0,0,0.9));
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 15px;
    }

    .s-av { width: 35px; height: 35px; border-radius: 50%; border: 2px solid var(--c-primary); position: absolute; top: 12px; left: 12px; }
    .s-info b { font-size: 13px; color: var(--c-primary); display: block; margin-bottom: 4px; }
    .s-info p { font-size: 11px; color: #ccc; margin: 0; line-height: 1.2; }

    /* SCROLLBAR HACKER */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(var(--c-primary), 0.2); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--c-primary); }

    /* ANIMAÇÃO DE PULSO NO LED */
    @keyframes ledPulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

        .loading-tag { font-size: 9px; color: var(--c-primary); letter-spacing: 1px; }
    .blink { animation: blinker 1s linear infinite; }
    @keyframes blinker { 50% { opacity: 0; } }
    
    .chat-input:disabled { opacity: 0.5; cursor: wait; }
        /* Adições específicas para o Textarea e Botões menores */
    .chat-input {
        min-height: 80px !important;
        background: rgba(0,0,0,0.6) !important;
    }
    .btn-small-icon, .btn-small-send {
        width: 35px !important;
        height: 35px !important;
    }
    .av-mini { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--c-primary); }

        /* O CSS Hacker já enviado anteriormente permanece idêntico, 
       herde as classes .contacts-panel, .id-hero, .status-list, etc. */
        .label-actions { display: flex; gap: 5px; }

            .chat-input { min-height: 80px !important; background: rgba(0,0,0,0.6) !important; color: #fff !important; }
    .btn-small-icon, .btn-small-send { width: 35px !important; height: 35px !important; }
</style>