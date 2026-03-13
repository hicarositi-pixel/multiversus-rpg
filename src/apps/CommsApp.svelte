<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { CommsDatabase } from '../database/CommsDatabase.js';
    import { chatStore, groupsStore, activeTabStore, activeChatIdStore, activeChatNameStore, updateCommsStore } from '../database/CommsStore.js';
    
    import CommsModals from './CommsModals.svelte';
    import CommsChat from './CommsChat.svelte';
    import { loadInitialComms } from '../database/CommsStore.js';

    export let actor;
    export let themeStyle = "";



    const MODULE_ID = "multiversus-rpg";

    // --- STORES ---
    let activeTab; activeTabStore.subscribe(v => activeTab = v);
    let activeChatId; activeChatIdStore.subscribe(v => activeChatId = v);
    let activeChatName; activeChatNameStore.subscribe(v => activeChatName = v);
    
    $: messages = ($chatStore || []).filter(m => m.chatId === activeChatId);
    $: groups = $groupsStore || [];

    // --- DADOS DA FICHA ---
    $: contacts = actor.getFlag(MODULE_ID, "contacts") || [];
    $: statusFeed = game.settings.get(MODULE_ID, "comms_status") || [];
    let myCommID = "MV-0000";

    // --- ESTADO LOCAL ---
    let showWarning = true;
    let activeModal = null; 
    let modalData = { input: "", input2: "", targetGroup: null };

    // Substitua a sua função onMount por esta:
onMount(async () => {
        // ATENÇÃO: Retiramos o init() daqui! O main.js já fez isso.
        
        // Apenas define MEU ID para esta janela
        myCommID = await CommsDatabase.getCommID(actor) || "MV-0000";
        
        // Escuta mudanças na ficha e no feed para atualizar a tela
        Hooks.on("commsContactUpdate", () => { contacts = actor.getFlag(MODULE_ID, "contacts") || []; });
        Hooks.on("commsStatusUpdate", () => { statusFeed = game.settings.get(MODULE_ID, "comms_status") || []; });
    });

    // --- AÇÕES DO CÉREBRO ---
    function setTab(tab) { activeTabStore.set(tab); }
    
    function switchChat(id, name) {
        activeChatIdStore.set(id);
        activeChatNameStore.set(name);
    }

    function openDM(contact) {
        const dmId = CommsDatabase.getPrivateChatId(actor.id, contact.id);
        switchChat(dmId, contact.name);
        setTab('chats');
    }

    function handleEnterGroup(group) {
        if (!group.isPrivate || game.user.isGM) {
            return switchChat(group.id, group.name);
        }
        modalData = { input: "", targetGroup: group };
        activeModal = 'password';
    }

</script>

<div class="comms-app-root" style="{themeStyle}">
    
    <CommsModals 
        {activeModal} 
        {showWarning} 
        bind:modalData 
        {actor}
        on:close={() => { activeModal = null; modalData = { input: "", input2: "", targetGroup: null }; }}
        on:acceptWarning={() => showWarning = false}
        on:passwordSuccess={(e) => { switchChat(e.detail.id, e.detail.name); activeModal = null; }}
    />

    <nav class="app-nav">
        <button class:active={activeTab === 'chats'} on:click={() => setTab('chats')}><i class="fas fa-terminal"></i><span>REDE</span></button>
        <button class:active={activeTab === 'contacts'} on:click={() => setTab('contacts')}><i class="fas fa-users-cog"></i><span>LINKS</span></button>
        <button class:active={activeTab === 'status'} on:click={() => setTab('status')}><i class="fas fa-satellite"></i><span>FEED</span></button>
    </nav>

    <div class="app-viewport">
        
        {#if activeTab === 'chats'}
            <CommsChat 
                {actor} {myCommID} {groups} {contacts} {messages} 
                {activeChatId} {activeChatName}
                on:requestModal={(e) => activeModal = e.detail}
                on:enterGroup={(e) => handleEnterGroup(e.detail)}
                on:openDM={(e) => openDM(e.detail)}
            />

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
    /* CSS GLOBAL DA ESTRUTURA (Apenas o que estrutura o fundo e a navbar) */
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .comms-app-root { display: flex; height: 100%; background: var(--c-bg, #050505); color: var(--c-text, #ccc); font-family: 'Share Tech Mono', monospace; position: relative; overflow: hidden; border: 1px solid rgba(var(--c-primary), 0.2); }
    .app-nav { width: 60px; background: rgba(0, 0, 0, 0.4); border-right: 1px solid rgba(var(--c-primary), 0.3); display: flex; flex-direction: column; align-items: center; gap: 25px; padding: 25px 0; z-index: 10; }
    .app-nav button { background: transparent; border: none; color: rgba(var(--c-primary), 0.3); font-size: 22px; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .app-nav button span { font-size: 8px; font-weight: bold; }
    .app-nav button:hover { color: var(--c-primary); transform: scale(1.1); }
    .app-nav button.active { color: var(--c-primary); filter: drop-shadow(0 0 8px var(--c-primary)); }
    .app-viewport { flex: 1; position: relative; overflow: hidden; }

    /* CSS DOS CONTATOS E FEED (Mantidos aqui por serem curtos) */
    .contacts-panel { padding: 40px; overflow-y: auto; height: 100%; }
    .id-hero { background: rgba(var(--c-primary), 0.05); border: 2px dashed rgba(var(--c-primary), 0.3); padding: 30px; text-align: center; margin-bottom: 40px; }
    .hero-label { font-size: 10px; opacity: 0.5; margin-bottom: 10px; }
    .hero-val { font-size: 48px; font-weight: bold; color: var(--c-primary); text-shadow: 0 0 20px var(--c-primary); margin-bottom: 20px; }
    .btn-main { background: var(--c-primary); color: #000; border: none; padding: 10px 25px; font-weight: bold; cursor: pointer; font-family: inherit; }
    
    .contact-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
    .contact-card { background: rgba(255,255,255,0.03); border: 1px solid #222; padding: 15px; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s; }
    .contact-card:hover { border-color: var(--c-primary); background: rgba(var(--c-primary), 0.05); }
    .contact-card img { width: 45px; height: 45px; border-radius: 50%; border: 1px solid var(--c-primary); }
    .c-meta { display: flex; flex-direction: column; }
    
    .status-panel { padding: 30px; height: 100%; overflow-y: auto; }
    .btn-status-post { width: 100%; background: transparent; border: 2px dashed #333; color: #555; padding: 25px; font-weight: bold; margin-bottom: 30px; cursor: pointer; transition: 0.2s; font-family: inherit; font-size: 14px;}
    .btn-status-post:hover { border-color: var(--c-primary); color: var(--c-primary); }
    .status-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
    .status-card-v2 { aspect-ratio: 9/16; background-size: cover; background-position: center; border-radius: 8px; position: relative; overflow: hidden; border: 1px solid #222; transition: 0.3s; }
    .status-card-v2:hover { transform: scale(1.02); border-color: var(--c-primary); }
    .card-overlay { position: absolute; inset: 0; background: linear-gradient(transparent 40%, rgba(0,0,0,0.9)); display: flex; flex-direction: column; justify-content: flex-end; padding: 15px; }
    .s-av { width: 35px; height: 35px; border-radius: 50%; border: 2px solid var(--c-primary); position: absolute; top: 12px; left: 12px; }
    .s-info b { font-size: 13px; color: var(--c-primary); display: block; margin-bottom: 4px; }
    .s-info p { font-size: 11px; color: #ccc; margin: 0; line-height: 1.2; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(var(--c-primary), 0.2); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--c-primary); }
</style>