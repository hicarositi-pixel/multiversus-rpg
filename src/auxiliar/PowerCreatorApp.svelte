<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { AuxiliarSystem } from './AuxiliarSystem.js';

    const dispatch = createEventDispatcher();
    
    // --- 1. DADOS ---
    
    // Jogadores (Para receber o poder como Observador)
    let playerList = game.users ? game.users.filter(u => !u.isGM).map(u => ({ id: u.id, name: u.name })) : [];

    // Pastas de ITEM (Diferente de Actor)
    // Lista todas, independente de permissão de visualização
    let folderList = game.folders 
        ? game.folders.filter(f => f.type === "Item").sort((a, b) => a.name.localeCompare(b.name)) 
        : [];

    // --- 2. ESTADOS ---
    let newItemName = "";
    let selectedPlayerId = "";
    let selectedFolderId = "";
    let isProcessing = false;
    let progress = 0;

    async function confirmCreation() {
        if (!newItemName.trim()) {
            ui.notifications.warn(">> ERRO: O Poder precisa de um nome.");
            return;
        }

        isProcessing = true;
        
        let interval = setInterval(() => {
            progress += 15;
            if(progress > 100) clearInterval(interval);
        }, 80);

        try {
            // --- 3. LÓGICA DE PERMISSÃO (HIERARQUIA) ---
            const authorizedIDs = AuxiliarSystem.getAuthorizedUsers();
            
            let ownership = {
                default: 0 // Ninguém vê por padrão
            };

            // REGRA 1: Sindicato (GMs + Auxiliares) são DONOS (3)
            game.users.forEach(u => {
                if (u.isGM || authorizedIDs.includes(u.id) || u.id === game.user.id) {
                    ownership[u.id] = 3; 
                }
            });

            // REGRA 2: O Jogador Alvo é OBSERVADOR (2)
            // Ele pode ver e arrastar para a ficha, mas não pode editar o item raiz.
            if (selectedPlayerId) {
                ownership[selectedPlayerId] = 2;
            }

            // --- 4. CRIAÇÃO DO ITEM ---
            const itemData = {
                name: newItemName,
                type: "power", // TIPO CONFIRMADO NO CONSOLE
                img: "icons/svg/lightning.svg", // Ícone padrão de poder
                folder: selectedFolderId || null,
                ownership: ownership,
                system: {} 
            };

            const cls = getDocumentClass("Item");
            const newItem = await cls.create(itemData);

            clearInterval(interval);
            progress = 100;

            setTimeout(async () => {
                if (newItem) {
                    ui.notifications.info(`>> PODER FORJADO: [${newItem.name}]`);
                    await newItem.sheet.render(true); // Abre para o Auxiliar editar
                    dispatch('close');
                }
            }, 400);

        } catch (err) {
            console.error(err);
            ui.notifications.error(`FALHA NA MATRIZ: ${err.message}`);
            isProcessing = false;
            progress = 0;
        }
    }
</script>

<div class="backdrop" transition:fade on:click={() => dispatch('close')}></div>

<div class="cyber-window" in:scale={{duration: 300, start: 0.95}}>
    
    <div class="top-bar-deco"></div>
    <div class="scan-line"></div>

    <header>
        <div class="icon-frame warn">
            <i class="fas fa-bolt"></i>
        </div>
        <div class="header-text">
            <h1>FORJAR PODER</h1>
            <small>DB DE HABILIDADES V2.1</small>
        </div>
        <button class="close-btn" on:click={() => dispatch('close')}>×</button>
    </header>

    <main>
        <div class="input-block">
            <label>NOME DA HABILIDADE</label>
            <div class="cyber-input">
                <input type="text" bind:value={newItemName} placeholder="Ex: Raios Laser" autofocus disabled={isProcessing}/>
                <div class="bar warn"></div>
            </div>
        </div>

        <div class="input-block">
            <label>BANCO DE DADOS (PASTA DE ITENS)</label>
            <div class="cyber-select">
                <select bind:value={selectedFolderId} disabled={isProcessing}>
                    <option value="" selected>📂 [RAIZ DE ITENS]</option>
                    {#each folderList as f}
                        <option value={f.id}>📂 {f.name}</option>
                    {/each}
                </select>
                <i class="fas fa-folder-open arrow"></i>
            </div>
        </div>

        <div class="input-block">
            <label>DESTINATÁRIO (OBSERVADOR)</label>
            <div class="cyber-select">
                <select bind:value={selectedPlayerId} disabled={isProcessing}>
                    <option value="" selected>👁️ APENAS AUXILIARES</option>
                    {#each playerList as p}
                        <option value={p.id}>👁️ {p.name.toUpperCase()}</option>
                    {/each}
                </select>
                <i class="fas fa-eye arrow"></i>
            </div>
            <div class="info-msg warn">
                <i class="fas fa-lock"></i> O jogador poderá ver, mas não editar.
            </div>
        </div>
    </main>

    <footer>
        {#if isProcessing}
            <div class="processing-box">
                <div class="bar-fill warn" style="width: {progress}%"></div>
                <span>COMPILANDO CÓDIGO... {progress}%</span>
            </div>
        {:else}
            <button class="action-btn warn" on:click={confirmCreation}>
                CRIAR REGISTRO <i class="fas fa-chevron-right"></i>
            </button>
        {/if}
    </footer>
</div>

<style>
    /* Reutilizando estilo do CreatorApp com variações de cor (WARN = Amber/Yellow) */
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .backdrop {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 40000;
        backdrop-filter: blur(3px);
    }

    .cyber-window {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 400px;
        background: #0a0a08; /* Levemente amarelado/escuro */
        border: 1px solid #ffcc00; /* Cor de Destaque para Poderes */
        box-shadow: 0 0 50px rgba(255, 204, 0, 0.15);
        z-index: 40001;
        font-family: 'Share Tech Mono', monospace;
        display: flex; flex-direction: column;
        color: #ccc;
    }

    .top-bar-deco { height: 3px; background: repeating-linear-gradient(90deg, #ffcc00, #ffcc00 20px, transparent 20px, transparent 40px); }
    
    .scan-line {
        position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(to bottom, transparent, rgba(255, 204, 0, 0.05), transparent);
        height: 50px; animation: scan 3s linear infinite;
    }
    @keyframes scan { 0% { top: -50px; } 100% { top: 100%; } }

    header {
        display: flex; align-items: center; padding: 15px 20px;
        background: rgba(255,255,255,0.03); border-bottom: 1px solid #222;
    }
    
    .icon-frame {
        width: 36px; height: 36px; border: 1px solid #ffcc00; color: #ffcc00;
        display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 15px;
        box-shadow: inset 0 0 10px rgba(255, 204, 0, 0.1);
    }
    
    .header-text h1 { margin: 0; font-size: 18px; color: #fff; letter-spacing: 2px; }
    .header-text small { font-size: 10px; color: #ffcc00; }
    .close-btn { margin-left: auto; background: none; border: none; color: #555; font-size: 18px; cursor: pointer; }
    .close-btn:hover { color: #fff; }

    main { padding: 20px; display: flex; flex-direction: column; gap: 18px; }

    .input-block label { font-size: 10px; color: #ffcc00; display: block; margin-bottom: 6px; font-weight: bold; }

    .cyber-input { position: relative; }
    .cyber-input input {
        width: 100%; background: #111; border: none; color: #fff; padding: 10px;
        font-family: inherit; font-size: 14px; box-sizing: border-box;
    }
    .cyber-input input:focus { background: #151515; outline: none; }
    .cyber-input .bar { height: 1px; width: 0; background: #ffcc00; transition: 0.3s; margin: 0 auto; }
    .cyber-input input:focus + .bar { width: 100%; box-shadow: 0 0 10px #ffcc00; }

    .cyber-select { position: relative; border: 1px solid #333; background: #111; }
    .cyber-select:hover { border-color: #555; }
    .cyber-select select {
        width: 100%; background: transparent; border: none; color: #ccc;
        padding: 10px; font-family: inherit; font-size: 12px; appearance: none; cursor: pointer;
    }
    .cyber-select select:focus { outline: none; color: #fff; }
    .arrow { position: absolute; right: 10px; top: 12px; color: #ffcc00; font-size: 10px; pointer-events: none; }

    .info-msg { font-size: 9px; color: #666; margin-top: 5px; font-style: italic; }
    .info-msg.warn { color: #aa8800; }

    footer { padding: 0 20px 20px 20px; }

    .action-btn {
        width: 100%; background: #221a00; border: 1px solid #ffcc00; color: #ffcc00;
        padding: 12px; font-family: inherit; font-weight: bold; font-size: 14px;
        cursor: pointer; transition: 0.2s; display: flex; justify-content: space-between; align-items: center;
    }
    .action-btn:hover { background: #ffcc00; color: #000; box-shadow: 0 0 20px #ffcc00; }

    .processing-box {
        height: 40px; background: #000; border: 1px solid #333;
        position: relative; display: flex; align-items: center; justify-content: center;
    }
    .bar-fill {
        position: absolute; left: 0; top: 0; bottom: 0; background: #004400; opacity: 0.7; transition: width 0.1s linear;
    }
    .bar-fill.warn { background: #665200; }
    .processing-box span { position: relative; z-index: 2; font-size: 11px; color: #fff; animation: blink 1s infinite; }

    @keyframes blink { 50% { opacity: 0.5; } }
</style>