<script>
    import { onMount, onDestroy } from 'svelte';
    import { slide, fade, scale } from 'svelte/transition';
    import { GroupDatabase } from '../database/GroupDatabase.js';
    
    // Sub-Módulos
    import BaseDashboard from './bases/BaseDashboard.svelte';
    import BaseStructures from './bases/BaseStructures.svelte';
    import BaseMembers from './bases/BaseMembers.svelte';
    import BaseInventory from './bases/BaseInventory.svelte';
    import BaseMissions from './bases/BaseMissions.svelte';
    
    export let actor;

    let myGroup = null;
    let allGroups = []; 
    let activeSubApp = 'dashboard';
    let isSystemReady = false; // Controle para evitar o "bug do F5"
    
    // Forms
    let newGroupName = "";
    let newGroupPass = ""; 
    let isProcessing = false;
    let showLeaveConfirm = false;
    let targetGroup = null; 
    let joinPasswordInput = "";
    let showRename = false;
    let renameInput = "";

    $: isLeader = myGroup?.leader === game.user.id;
    $: isGM = game.user.isGM;

    // --- SINCRONIA E CARREGAMENTO ---
    async function refreshData() {
        // Puxa a lista mais recente do banco de dados
        allGroups = await GroupDatabase.getGroups(); 
        
        // Verifica se o usuário atual está em algum grupo
        myGroup = await GroupDatabase.getUserGroup(game.user.id);
        
        // Libera a interface
        isSystemReady = true; 
    }

    onMount(async () => {
        await refreshData();
        
        // Escuta mudanças globais no sistema (Settings ou Sockets)
        Hooks.on("nexusGroupUpdate", refreshData);
        // Escuta atualizações de configurações do mundo (onde os grupos geralmente ficam salvos)
        Hooks.on("updateSetting", (setting) => {
            if (setting.key.includes("groups")) refreshData();
        });
    });

    onDestroy(() => {
        Hooks.off("nexusGroupUpdate", refreshData);
    });

    // Função auxiliar para avisar outros clientes
    function notifyUpdate() {
        Hooks.callAll("nexusGroupUpdate");
        refreshData(); // Atualiza a si mesmo
    }

    // --- AÇÕES ---
    async function createGroup() {
        if (!newGroupName.trim()) return ui.notifications.warn("Defina um nome.");
        isProcessing = true;
        try {
            await GroupDatabase.createGroup(newGroupName.trim(), game.user.id, newGroupPass, false);
            newGroupName = ""; newGroupPass = "";
            activeSubApp = 'dashboard';
            ui.notifications.info("Base criada!");
            notifyUpdate();
        } catch (e) { ui.notifications.error(e.message); }
        isProcessing = false;
    }

    async function createNomad() {
        isProcessing = true;
        try {
            const nomadName = `Nômade: ${game.user.name}`;
            await GroupDatabase.createGroup(nomadName, game.user.id, "", true);
            activeSubApp = 'dashboard';
            ui.notifications.info("Modo Nômade ativado.");
            notifyUpdate();
        } catch (e) { ui.notifications.error(e.message); }
        isProcessing = false;
    }

    async function deleteGroup(groupId) {
        if (!isGM) return;
        new Dialog({
            title: "Confirmar Exclusão",
            content: "<p>Apagar este grupo permanentemente?</p>",
            buttons: {
                yes: { icon: '<i class="fas fa-trash"></i>', label: "Sim", callback: async () => {
                    await GroupDatabase.deleteGroup(groupId);
                    ui.notifications.info("Grupo apagado.");
                    notifyUpdate();
                }},
                no: { icon: '<i class="fas fa-times"></i>', label: "Não", callback: () => {} }
            }
        }).render(true);
    }

    function openRename() { renameInput = myGroup.name; showRename = true; }

    async function confirmRename() {
        if (!renameInput.trim()) return;
        await GroupDatabase.renameGroup(myGroup.id, renameInput.trim());
        showRename = false;
        notifyUpdate();
    }

    function initiateJoin(group) {
        if (group.password && !isGM) {
            targetGroup = group; joinPasswordInput = "";
        } else {
            confirmJoin(group.id, "");
        }
    }

    async function confirmJoin(id = null, pass = null) {
        const groupId = id || targetGroup?.id;
        const password = pass !== null ? pass : joinPasswordInput;
        isProcessing = true;
        try {
            await GroupDatabase.joinGroup(groupId, game.user.id, password);
            targetGroup = null;
            activeSubApp = 'dashboard';
            ui.notifications.info("Conectado.");
            notifyUpdate(); // Avisa o líder que você entrou
        } catch (e) { ui.notifications.error(e.message); }
        isProcessing = false;
    }

    async function leave() {
        await GroupDatabase.leaveGroup(game.user.id);
        showLeaveConfirm = false;
        activeSubApp = 'dashboard';
        notifyUpdate(); // Avisa que você saiu
    }
</script>

<div class="faction-hub">
    
    {#if !isSystemReady}
        <div class="loading-screen">
            <i class="fas fa-satellite-dish pulse-icon"></i>
            <span>SINCRONIZANDO UPLINK...</span>
        </div>
    {:else}

        {#if targetGroup}
            <div class="modal-backdrop" transition:fade>
                <div class="modal-box" in:scale>
                    <header><i class="fas fa-lock"></i> ACESSO RESTRITO</header>
                    <div class="modal-body">
                        <p>Senha para <strong>{targetGroup.name}</strong>:</p>
                        <input type="password" bind:value={joinPasswordInput} autofocus on:keydown={e => e.key === 'Enter' && confirmJoin()} />
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" on:click={() => targetGroup = null}>X</button>
                        <button class="btn-confirm" on:click={() => confirmJoin()}>ENTRAR</button>
                    </div>
                </div>
            </div>
        {/if}

        {#if showRename}
            <div class="modal-backdrop" transition:fade>
                <div class="modal-box" in:scale>
                    <header><i class="fas fa-edit"></i> RENOMEAR GRUPO</header>
                    <div class="modal-body">
                        <input type="text" bind:value={renameInput} autofocus on:keydown={e => e.key === 'Enter' && confirmRename()} />
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" on:click={() => showRename = false}>X</button>
                        <button class="btn-confirm" on:click={confirmRename}>SALVAR</button>
                    </div>
                </div>
            </div>
        {/if}

        {#if !myGroup}
            <div class="login-screen" in:fade>
                <div class="login-panel">
                    <header>
                        <i class="fas fa-network-wired pulse-icon"></i>
                        <h2>NEXUS UPLINK</h2>
                    </header>

                    <div class="login-body">
                        <div class="action-column">
                            <h3>CRIAR FREQUÊNCIA</h3>
                            <div class="create-form">
                                <input type="text" bind:value={newGroupName} placeholder="NOME DA UNIDADE" class="big-input"/>
                                <input type="password" bind:value={newGroupPass} placeholder="SENHA (OPCIONAL)" class="pass-input"/>
                                <button class="btn-create" on:click={createGroup} disabled={isProcessing}>
                                    <i class="fas fa-plus-circle"></i> FUNDAR BASE
                                </button>
                            </div>
                            <div class="divider"><span>OU</span></div>
                            <button class="btn-nomad" on:click={createNomad} disabled={isProcessing}>
                                <i class="fas fa-user-secret"></i> MODO NÔMADE
                            </button>
                        </div>

                        <div class="list-column">
                            <h3>SINAIS ({allGroups.length})</h3>
                            <div class="group-list custom-scroll">
                                {#each allGroups as g}
                                    <div class="group-item">
                                        <div class="g-info">
                                            <div class="g-name">
                                                <i class="fas {g.isNomad ? 'fa-user-secret' : 'fa-warehouse'}" style="color: {g.isNomad ? '#aaa' : '#facc15'}"></i>
                                                {g.name}
                                                {#if g.password}<i class="fas fa-lock" title="Senha"></i>{/if}
                                            </div>
                                            <small>Líder: {game.users.get(g.leader)?.name || '???'}</small>
                                        </div>
                                        <div class="g-actions">
                                            <button class="btn-join" on:click={() => initiateJoin(g)} disabled={isProcessing}>ENTRAR</button>
                                            {#if isGM}
                                                <button class="btn-del" on:click={() => deleteGroup(g.id)}><i class="fas fa-trash"></i></button>
                                            {/if}
                                        </div>
                                    </div>
                                {:else}
                                    <div class="empty-state"><span>Sem sinais.</span></div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        {:else}
            <div class="main-interface" in:scale={{start:0.98}}>
                <header class="hub-header">
                    <div class="group-identity">
                        <div class="logo-box"><i class="fas {myGroup.isNomad ? 'fa-user-secret' : 'fa-users'}"></i></div>
                        <div class="titles">
                            <div class="title-row">
                                <h1>{myGroup.name}</h1>
                                {#if isLeader || isGM}
                                    <button class="btn-edit-name" on:click={openRename} title="Renomear"><i class="fas fa-pen"></i></button>
                                {/if}
                            </div>
                            <span class="id-tag">ID: {myGroup.id}</span>
                        </div>
                    </div>
                    <div class="user-controls">
                        <span class="u-name">{game.user.name}</span>
                        <button class="btn-leave" on:click={() => showLeaveConfirm = true} title="Sair"><i class="fas fa-power-off"></i></button>
                    </div>
                </header>

                <div class="hub-body">
                    <nav class="hub-nav">
                        <button class:active={activeSubApp === 'dashboard'} on:click={() => activeSubApp = 'dashboard'}><i class="fas fa-tachometer-alt"></i> GERAL</button>
                        <button class:active={activeSubApp === 'structures'} on:click={() => activeSubApp = 'structures'}><i class="fas fa-industry"></i> ESTRUTURAS</button>
                        <button class:active={activeSubApp === 'inventory'} on:click={() => activeSubApp = 'inventory'}><i class="fas fa-boxes"></i> COFRE</button>
                        <button class:active={activeSubApp === 'members'} on:click={() => activeSubApp = 'members'}><i class="fas fa-users"></i> PESSOAL</button>
                        <div class="nav-spacer"></div>
                        <button class:active={activeSubApp === 'missions'} on:click={() => activeSubApp = 'missions'}><i class="fas fa-crosshairs"></i> MISSÕES</button>
                    </nav>

                    <main class="hub-content custom-scroll">
                        {#if activeSubApp === 'dashboard'} <BaseDashboard {group} isLeader={isLeader} />
                        {:else if activeSubApp === 'structures'} <BaseStructures {group} isLeader={isLeader} />
                        {:else if activeSubApp === 'inventory'} <BaseInventory {group} actor={actor} isLeader={isLeader || isGM} />
                        {:else if activeSubApp === 'members'} <BaseMembers {group} isLeader={isLeader} isGM={isGM} />
                        {:else if activeSubApp === 'missions'} <BaseMissions {group} isLeader={isLeader} isGM={isGM} />
                        {/if}
                    </main>
                </div>
            </div>
        {/if}

        {#if showLeaveConfirm}
            <div class="modal-backdrop">
                <div class="modal-box alert">
                    <h3>SAIR DO GRUPO?</h3>
                    <div class="modal-footer">
                        <button on:click={() => showLeaveConfirm = false}>NÃO</button>
                        <button class="btn-confirm" on:click={leave}>SIM</button>
                    </div>
                </div>
            </div>
        {/if}
    {/if} </div>

<style>
/* CSS Mantido, com adição do loading-screen */
    /* ... (Seu CSS anterior aqui) ... */
    
    .loading-screen {
        width: 100%; height: 100%; display: flex; flex-direction: column; 
        align-items: center; justify-content: center; color: #00ff41; gap: 15px;
    }
    .loading-screen i { font-size: 40px; }
    
    /* ... (Restante do CSS) ... */
    .faction-hub { width: 100%; height: 100%; background: #050505; color: #00ff41; font-family: 'Share Tech Mono', monospace; display: flex; flex-direction: column; overflow: hidden; position: relative; }
    .custom-scroll::-webkit-scrollbar { width: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #004400; border-radius: 2px; }
    
    .login-screen { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #0a0a0a 0%, #000 100%); }
    .login-panel { width: 100%; max-width: 800px; height: 500px; border: 1px solid #00ff41; background: rgba(0, 10, 0, 0.95); display: flex; flex-direction: column; }
    .login-panel header { padding: 15px; text-align: center; border-bottom: 1px solid #004400; }
    .pulse-icon { font-size: 28px; margin-bottom: 5px; animation: pulse 2s infinite; }
    .login-body { flex: 1; display: flex; overflow: hidden; }
    
    .action-column { flex: 1; padding: 30px; border-right: 1px solid #004400; display: flex; flex-direction: column; justify-content: center; }
    .list-column { flex: 1; padding: 20px; background: rgba(0,255,65,0.02); display: flex; flex-direction: column; overflow-y: auto; }
    
    .create-form { display: flex; flex-direction: column; gap: 10px; }
    .big-input { background: #000; border: 2px solid #004400; color: #fff; padding: 12px; font-size: 16px; text-transform: uppercase; }
    .pass-input { background: #000; border: 1px solid #004400; color: #fff; padding: 10px; }
    .btn-create, .btn-nomad { padding: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; }
    .btn-create { background: #004400; color: #fff; border: 1px solid #00ff41; font-weight: bold; }
    .btn-nomad { background: transparent; border: 1px dashed #444; color: #888; }
    .divider { display: flex; align-items: center; margin: 20px 0; opacity: 0.5; font-size: 10px; }
    .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #004400; }
    
    .group-list { display: flex; flex-direction: column; gap: 5px; }
    .group-item { background: rgba(255,255,255,0.03); padding: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid transparent; }
    .group-item:hover { border-color: #00ff41; }
    .g-info { display: flex; flex-direction: column; }
    .g-name { font-weight: bold; display: flex; align-items: center; gap: 5px; }
    .g-actions { display: flex; gap: 5px; }
    .btn-join { background: transparent; border: 1px solid #00ff41; color: #00ff41; cursor: pointer; padding: 5px 15px; font-size: 11px; }
    .btn-join:hover { background: #00ff41; color: #000; }
    .btn-del { background: #300; border: 1px solid #f00; color: #f00; padding: 5px; cursor: pointer; }

    .main-interface { display: flex; flex-direction: column; height: 100%; }
    .hub-header { height: 60px; background: #080808; border-bottom: 2px solid #004400; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
    .group-identity { display: flex; align-items: center; gap: 15px; }
    .logo-box { width: 40px; height: 40px; border: 2px solid #00ff41; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(0,255,65,0.1); }
    .titles h1 { margin: 0; font-size: 20px; line-height: 1; letter-spacing: 1px; }
    .title-row { display: flex; align-items: center; gap: 10px; }
    .btn-edit-name { background: none; border: none; color: #00ff41; cursor: pointer; opacity: 0.5; font-size: 12px; }
    .btn-edit-name:hover { opacity: 1; }
    
    .hub-body { flex: 1; display: flex; overflow: hidden; }
    .hub-nav { width: 200px; background: rgba(0,0,0,0.6); border-right: 1px solid #004400; display: flex; flex-direction: column; padding: 15px 0; }
    .hub-nav button { background: transparent; border: none; color: #888; padding: 12px 20px; text-align: left; cursor: pointer; display: flex; gap: 10px; align-items: center; border-left: 3px solid transparent; }
    .hub-nav button.active { color: #00ff41; border-left-color: #00ff41; background: rgba(0,255,65,0.1); }
    .hub-content { flex: 1; padding: 20px; overflow-y: auto; background: radial-gradient(circle at top right, #0a150a 0%, #000 60%); }

    .modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 100; backdrop-filter: blur(5px); }
    .modal-box { background: #050505; border: 1px solid #00ff41; width: 350px; box-shadow: 0 0 50px rgba(0,0,0,0.8); }
    .modal-box header { background: #001100; color: #00ff41; padding: 10px; font-weight: bold; border-bottom: 1px solid #004400; }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .modal-body input { background: #000; border: 1px solid #333; color: #fff; padding: 10px; text-align: center; }
    .modal-footer { padding: 10px; display: flex; justify-content: center; gap: 10px; background: rgba(255,255,255,0.02); }
    .btn-cancel { background: transparent; border: 1px solid #555; color: #888; padding: 5px 15px; cursor: pointer; }
    .btn-confirm { background: #004400; border: 1px solid #00ff41; color: #fff; padding: 5px 15px; font-weight: bold; cursor: pointer; }

    @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } }
</style>