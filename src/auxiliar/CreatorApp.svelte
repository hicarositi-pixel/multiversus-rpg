<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { AuxiliarSystem } from './AuxiliarSystem.js';

    const dispatch = createEventDispatcher();
    
    // --- DADOS ---
    let playerList = game.users ? game.users.filter(u => !u.isGM).map(u => ({ id: u.id, name: u.name })) : [];
    
    let folderList = game.folders 
        ? game.folders.filter(f => f.type === "Actor").sort((a, b) => a.name.localeCompare(b.name)) 
        : [];

    // --- ESTADOS ---
    let newCharName = "";
    let selectedPlayerId = "";
    let selectedFolderId = "";
    let isProcessing = false;
    let progress = 0;

    async function confirmCreation() {
        if (!newCharName.trim()) return ui.notifications.warn(">> ERRO: NOME INVÁLIDO.");

        isProcessing = true;
        let interval = setInterval(() => { progress += 8; if(progress > 95) clearInterval(interval); }, 50);

        try {
            // LÓGICA DE PERMISSÃO (SINDICATO)
            const authorizedIDs = AuxiliarSystem.getAuthorizedUsers();
            let ownership = { default: 0 };

            game.users.forEach(u => {
                if (u.isGM || authorizedIDs.includes(u.id) || u.id === game.user.id) ownership[u.id] = 3;
            });

            if (selectedPlayerId) ownership[selectedPlayerId] = 3;

            const actorData = {
                name: newCharName,
                type: "character", 
                img: "icons/svg/mystery-man.svg",
                folder: selectedFolderId || null,
                ownership: ownership,
                system: {} 
            };

            const cls = getDocumentClass("Actor");
            const newActor = await cls.create(actorData);

            clearInterval(interval);
            progress = 100;

            setTimeout(async () => {
                if (newActor) {
                    ui.notifications.info(`>> PROTOCOLO: [${newActor.name}] REGISTRADO.`);
                    await newActor.sheet.render(true);
                    dispatch('close');
                }
            }, 600);

        } catch (err) {
            console.error(err);
            ui.notifications.error(`FALHA CRÍTICA: ${err.message}`);
            isProcessing = false; progress = 0;
        }
    }
</script>

<div class="backdrop" transition:fade on:click={() => dispatch('close')}></div>

<div class="creator-window" in:scale={{duration: 400, start: 0.95, easing: quintOut}}>
    
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <header>
        <div class="h-icon"><i class="fas fa-fingerprint"></i></div>
        <div class="h-info">
            <h1>NOVO REGISTRO</h1>
            <div class="h-meta">
                <span>V4.0</span> <span class="sep">//</span> <span>{game.user.name.toUpperCase()}</span>
            </div>
        </div>
        <button class="close-btn" on:click={() => dispatch('close')}>
            <i class="fas fa-times"></i>
        </button>
    </header>

    <main>
        <div class="field-group" in:fly={{y: 10, duration: 300, delay: 100}}>
            <label><i class="fas fa-tag"></i> CODENAME</label>
            <div class="input-wrapper">
                <input type="text" bind:value={newCharName} placeholder="Digite o nome da identidade..." autofocus disabled={isProcessing}/>
                <div class="focus-line"></div>
            </div>
        </div>

        <div class="field-group" in:fly={{y: 10, duration: 300, delay: 200}}>
            <label><i class="fas fa-folder"></i> DIRETÓRIO DE ARQUIVO</label>
            <div class="select-wrapper">
                <select bind:value={selectedFolderId} disabled={isProcessing}>
                    <option value="" selected>📂 [RAIZ DO MUNDO]</option>
                    {#each folderList as f}
                        <option value={f.id}>📂 {f.name}</option>
                    {/each}
                </select>
                <i class="fas fa-chevron-down arrow"></i>
            </div>
        </div>

        <div class="field-group" in:fly={{y: 10, duration: 300, delay: 300}}>
            <label><i class="fas fa-link"></i> VÍNCULO NEURAL (OPCIONAL)</label>
            <div class="select-wrapper">
                <select bind:value={selectedPlayerId} disabled={isProcessing}>
                    <option value="" selected>👤 APENAS EQUIPE AUXILIAR</option>
                    {#each playerList as p}
                        <option value={p.id}>👤 {p.name.toUpperCase()}</option>
                    {/each}
                </select>
                <i class="fas fa-chevron-down arrow"></i>
            </div>
            <div class="info-tag">
                <i class="fas fa-shield-alt"></i> ACESSO COMPARTILHADO COM TODOS AUXILIARES
            </div>
        </div>
    </main>

    <footer>
        {#if isProcessing}
            <div class="processing-state" in:fade>
                <div class="loading-bar">
                    <div class="fill" style="width: {progress}%"></div>
                </div>
                <span class="status-text">CRIPTOGRAFANDO DADOS... {progress}%</span>
            </div>
        {:else}
            <button class="create-btn" on:click={confirmCreation}>
                <span>INICIALIZAR FICHA</span>
                <i class="fas fa-power-off"></i>
            </button>
        {/if}
    </footer>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    /* --- BACKDROP --- */
    .backdrop {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 5, 0, 0.8); z-index: 40000;
        backdrop-filter: blur(4px);
    }

    /* --- JANELA --- */
    .creator-window {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 450px;
        background: rgba(10, 12, 10, 0.95);
        border: 1px solid #333;
        border-top: 2px solid #00ff41;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(0, 255, 65, 0.2);
        z-index: 40001;
        font-family: 'Share Tech Mono', monospace;
        display: flex; flex-direction: column;
        color: #ccc; overflow: hidden;
    }

    /* FX DE FUNDO */
    .bg-grid {
        position: absolute; inset: 0; pointer-events: none;
        background-image: linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px);
        background-size: 20px 20px; z-index: 0;
    }
    .bg-scanline {
        position: absolute; inset: 0; pointer-events: none; z-index: 1;
        background: linear-gradient(to bottom, transparent, rgba(0,255,65,0.05), transparent);
        height: 30px; animation: scan 4s linear infinite;
    }
    @keyframes scan { 0% { top: -20%; } 100% { top: 120%; } }

    /* --- HEADER --- */
    header {
        position: relative; z-index: 2;
        display: flex; align-items: center; padding: 20px 25px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        background: linear-gradient(90deg, rgba(0,255,65,0.05), transparent);
    }
    .h-icon {
        width: 42px; height: 42px; background: rgba(0,0,0,0.3);
        border: 1px solid #00ff41; display: flex; align-items: center; justify-content: center;
        color: #00ff41; font-size: 20px; margin-right: 15px;
        box-shadow: 0 0 15px rgba(0,255,65,0.2);
    }
    .h-info h1 { margin: 0; font-size: 20px; color: #fff; letter-spacing: 2px; line-height: 1; }
    .h-meta { font-size: 10px; color: #00ff41; margin-top: 4px; opacity: 0.8; }
    .h-meta .sep { color: #555; margin: 0 5px; }
    
    .close-btn {
        margin-left: auto; background: transparent; border: none; color: #555; 
        font-size: 18px; cursor: pointer; transition: 0.2s;
    }
    .close-btn:hover { color: #fff; transform: scale(1.1); }

    /* --- MAIN --- */
    main { position: relative; z-index: 2; padding: 25px; display: flex; flex-direction: column; gap: 20px; }

    .field-group label {
        display: block; font-size: 11px; color: #888; font-weight: bold; margin-bottom: 8px;
        display: flex; align-items: center; gap: 6px;
    }
    .field-group label i { color: #00ff41; }

    /* INPUT ESTILIZADO */
    .input-wrapper { position: relative; }
    .input-wrapper input {
        width: 100%; background: rgba(0,0,0,0.3); border: 1px solid #333;
        color: #fff; padding: 12px 15px; font-family: inherit; font-size: 14px;
        transition: 0.3s;
    }
    .input-wrapper input:focus { border-color: #555; background: rgba(0,0,0,0.5); outline: none; }
    .focus-line {
        position: absolute; bottom: 0; left: 0; height: 2px; width: 0;
        background: #00ff41; transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        box-shadow: 0 0 10px #00ff41;
    }
    .input-wrapper input:focus + .focus-line { width: 100%; }

    /* SELECT ESTILIZADO */
    .select-wrapper { position: relative; }
    .select-wrapper select {
        width: 100%; background: rgba(0,0,0,0.3); border: 1px solid #333;
        color: #ccc; padding: 12px 15px; font-family: inherit; font-size: 13px;
        appearance: none; cursor: pointer; transition: 0.3s;
    }
    .select-wrapper select:hover { border-color: #555; color: #fff; }
    .select-wrapper select:focus { border-color: #00ff41; outline: none; color: #fff; background: rgba(0,0,0,0.6); }
    
    .arrow { position: absolute; right: 15px; top: 14px; font-size: 10px; color: #666; pointer-events: none; }

    .info-tag {
        margin-top: 6px; font-size: 9px; color: #555; 
        display: flex; align-items: center; gap: 5px;
    }

    /* --- FOOTER --- */
    footer {
        position: relative; z-index: 2; padding: 0 25px 25px 25px;
    }

    .create-btn {
        width: 100%; background: #00ff41; color: #000; border: none;
        padding: 14px; font-family: inherit; font-size: 16px; font-weight: bold;
        cursor: pointer; display: flex; justify-content: space-between; align-items: center;
        transition: 0.2s; letter-spacing: 1px; clip-path: polygon(0 0, 100% 0, 100% 75%, 96% 100%, 0 100%);
    }
    .create-btn:hover {
        background: #fff; box-shadow: 0 0 25px rgba(0, 255, 65, 0.6);
        transform: translateY(-2px);
    }
    .create-btn:active { transform: translateY(0); }

    /* LOADING STATE */
    .processing-state {
        height: 46px; background: #000; border: 1px solid #333;
        display: flex; align-items: center; justify-content: center; position: relative;
    }
    .loading-bar {
        position: absolute; inset: 0; width: 100%; height: 100%;
        background: #001100;
    }
    .loading-bar .fill {
        height: 100%; background: repeating-linear-gradient(45deg, #003300, #003300 10px, #004400 10px, #004400 20px);
        transition: width 0.1s linear; border-right: 2px solid #00ff41;
    }
    .status-text {
        position: relative; z-index: 2; font-size: 12px; color: #00ff41;
        font-weight: bold; animation: blink 1s infinite;
    }

    @keyframes blink { 50% { opacity: 0.5; } }
</style>