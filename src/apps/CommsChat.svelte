<script>
    import { onMount, tick, createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
    import { CommsDatabase } from '../database/CommsDatabase.js';
    import { chatModeStore } from '../database/CommsStore.js';
    import { OnlineComms } from './OnlineComms.js';

    export let actor;
    export let myCommID;
    export let groups = [];
    export let contacts = [];
    export let messages = [];
    export let activeChatId;
    export let activeChatName;

    const dispatch = createEventDispatcher();
    let newMessage = "";
    let chatContainer;
    
    // Assina a variável de modo
    let chatMode; chatModeStore.subscribe(v => chatMode = v);

    $: if (messages) scroll();

    async function scroll() {
        await tick();
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }

async function send(img = null) {
        if (!newMessage.trim() && !img) return;

        const isOffGame = chatMode === 'offgame';
        
        // MUDOU DE CommsDatabase.sendMessage PARA OnlineComms.sendMessage
        await OnlineComms.sendMessage({
            chatId: activeChatId,
            senderUserId: game.user.id,
            senderActorId: actor.id, // ADICIONADO PARA O PRIVADO FUNCIONAR!
            mode: chatMode,
            senderName: isOffGame ? `[OOC] ${game.user.name}` : actor.name,
            senderImg: isOffGame ? 'icons/svg/mystery-man.svg' : actor.img,
            senderColor: isOffGame ? game.user.color : 'var(--c-primary)',
            senderCommID: isOffGame ? 'PLAYER' : myCommID,
            text: newMessage.trim(), 
            image: img
        });
        
        newMessage = "";
    }
</script>

<div class="split-view" in:fade>
    <aside class="chat-selector">
        <div class="sidebar-label">CANAIS <button class="btn-mini" on:click={() => dispatch('requestModal', 'create_group')}>+</button></div>
        <div class="scroll-list">
            {#each groups as g}
                <button class="chat-tab" class:active={activeChatId === g.id} on:click={() => dispatch('enterGroup', g)}>
                    <i class="fas {g.icon}"></i> <span>{g.name}</span>
                </button>
            {/each}
        </div>
        <div class="sidebar-label">DIRETAS</div>
        <div class="scroll-list">
            {#each contacts as c}
                <button class="chat-tab" class:active={activeChatId === CommsDatabase.getPrivateChatId(actor.id, c.id)} on:click={() => dispatch('openDM', c)}>
                    <img src={c.img} class="av-mini" alt="av"/> <span>{c.name}</span>
                </button>
            {/each}
        </div>
    </aside>

    <main class="chat-main">
        <header class="chat-info">
            <div class="title-wrap"># {activeChatName || "SELECIONE UM CANAL"}</div>
            
            <div class="mode-toggle">
                <button class:active={chatMode === 'ingame'} on:click={() => chatModeStore.set('ingame')}>
                    <i class="fas fa-crosshairs"></i> RP
                </button>
                <button class:active={chatMode === 'offgame'} on:click={() => chatModeStore.set('offgame')} class="ooc-btn">
                    <i class="fas fa-user"></i> OOC
                </button>
            </div>
        </header>

        <div class="message-log custom-scroll" bind:this={chatContainer}>
            {#each messages as m (m.id)}
                <div class="msg-block" class:me={m.senderUserId === game.user.id} class:offgame={m.mode === 'offgame'} in:fade>
                    <div class="bubble">
                        <div class="b-head">
                            <span class="b-name" style="color: {m.senderColor}">{m.senderName}</span>
                            <span class="b-id">#{m.senderCommID}</span>
                        </div>
                        {#if m.image}<img src={m.image} class="b-img" alt="media" on:click={() => window.open(m.image)} />{/if}
                        <div class="b-text">{@html m.text.replace(/\n/g, '<br>')}</div>
                        <div class="b-time">{new Date(m.timestamp).toLocaleTimeString()}</div>
                    </div>
                </div>
            {/each}
        </div>

        <div class="chat-composer" class:ooc-composer={chatMode === 'offgame'}>
            <button class="btn-small-icon" on:click={() => { 
                 new Dialog({
                    title: "ANEXAR ARQUIVO", content: `<input id="u" class="hacker-input" style="width:100%" placeholder="URL da imagem...">`,
                    buttons: { ok: { label: "ENVIAR", callback: (h) => send(h.find("#u").val()) }}
                }).render(true);
            }}><i class="fas fa-paperclip"></i></button>
            
            <textarea class="chat-input" bind:value={newMessage} placeholder={chatMode === 'ingame' ? "Transmitir mensagem táctica..." : "Falar em Off..."} on:keydown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}></textarea>
            
            <button class="btn-small-send" on:click={() => send()}><i class="fas fa-paper-plane"></i></button>
        </div>
    </main>
</div>

<style>
    /* ... (Mantenha o CSS que você já tinha) ... */
    
    .split-view { display: flex; height: 100%; width: 100%; }
    .chat-selector { width: 240px; background: rgba(0, 0, 0, 0.2); border-right: 1px solid rgba(var(--c-primary), 0.1); display: flex; flex-direction: column; }
    .sidebar-label { padding: 15px; font-size: 10px; letter-spacing: 2px; color: var(--c-primary); opacity: 0.6; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(var(--c-primary), 0.05); }
    .btn-mini { background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); border-radius: 3px; width: 18px; height: 18px; cursor: pointer; font-size: 12px; }
    .scroll-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
    .chat-tab { background: transparent; border: 1px solid transparent; color: #888; padding: 10px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.2s; border-radius: 4px; text-align: left; font-family: inherit; }
    .chat-tab:hover { background: rgba(var(--c-primary), 0.05); color: #ccc; }
    .chat-tab.active { background: rgba(var(--c-primary), 0.1); border-color: rgba(var(--c-primary), 0.3); color: var(--c-primary); box-shadow: inset 4px 0 0 var(--c-primary); }
    .av-mini { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--c-primary); }
    
    .chat-main { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.3); }
    .chat-info { height: 50px; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(var(--c-primary), 0.2); background: rgba(0,0,0,0.4); }
    .title-wrap { color: var(--c-primary); font-weight: bold; letter-spacing: 1px; font-size: 14px; text-transform: uppercase; }
    
    /* MODO TOGGLE CSS */
    .mode-toggle { display: flex; border: 1px solid #444; border-radius: 4px; overflow: hidden; }
    .mode-toggle button { background: #000; color: #666; border: none; padding: 4px 10px; font-size: 10px; font-weight: bold; cursor: pointer; transition: 0.2s; font-family: inherit; }
    .mode-toggle button.active { background: rgba(var(--c-primary), 0.2); color: var(--c-primary); }
    .mode-toggle button.ooc-btn.active { background: rgba(255, 170, 0, 0.2); color: #ffaa00; }

    .message-log { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 18px; background-image: radial-gradient(rgba(var(--c-primary), 0.03) 1px, transparent 1px); background-size: 20px 20px; }
    
    .msg-block { display: flex; width: 100%; }
    .msg-block.me { justify-content: flex-end; }
    
    .bubble { max-width: 75%; background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 4px; position: relative; }
    
    /* ESTÉTICA IN-GAME (MEU) */
    .me .bubble { border-color: rgba(var(--c-primary), 0.4); background: rgba(var(--c-primary), 0.05); box-shadow: 0 0 15px rgba(0,0,0,0.3); }
    
    /* ESTÉTICA OFF-GAME (OOC) */
    .msg-block.offgame .bubble { border-color: #555; background: #111; box-shadow: none; border-style: dashed; }
    .msg-block.offgame .b-text { color: #aaa; font-style: italic; font-family: sans-serif; }
    
    .b-head { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 6px; gap: 20px; }
    .b-name { font-weight: bold; }
    .b-id { opacity: 0.3; cursor: pointer; color: #888; }
    .b-text { font-size: 13px; line-height: 1.5; color: #ddd; word-break: break-word; }
    .b-img { max-width: 100%; border-radius: 4px; margin: 8px 0; border: 1px solid #333; cursor: zoom-in; }
    .b-time { font-size: 8px; opacity: 0.3; margin-top: 5px; text-align: right; color: #888;}

    /* COMPOSER DINÂMICO */
    .chat-composer { min-height: 90px; padding: 15px 20px; background: rgba(0,0,0,0.6); border-top: 1px solid rgba(var(--c-primary), 0.2); display: flex; gap: 12px; align-items: flex-end; transition: 0.3s; }
    .chat-composer.ooc-composer { border-top-color: #ffaa00; background: rgba(20,10,0,0.8); }
    
    .chat-input { flex: 1; min-height: 80px; background: rgba(0,0,0,0.8); border: 1px solid #333; color: #fff; padding: 12px; border-radius: 4px; resize: none; font-family: inherit; font-size: 13px; outline: none; transition: 0.3s; }
    .chat-input:focus { border-color: var(--c-primary); box-shadow: 0 0 10px rgba(var(--c-primary), 0.2); }
    .ooc-composer .chat-input:focus { border-color: #ffaa00; box-shadow: 0 0 10px rgba(255,170,0, 0.2); }
    
    .btn-small-icon, .btn-small-send { width: 35px; height: 35px; border-radius: 4px; background: #111; color: var(--c-primary); border: 1px solid #333; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-small-send { background: var(--c-primary); color: #000; border: none; font-size: 18px; }
    .btn-small-send:hover { transform: translateY(-2px); box-shadow: 0 0 15px var(--c-primary); }
    
    .ooc-composer .btn-small-icon { color: #ffaa00; }
    .ooc-composer .btn-small-send { background: #ffaa00; box-shadow: 0 0 15px #ffaa00; }

    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(var(--c-primary), 0.2); border-radius: 10px; }
</style>