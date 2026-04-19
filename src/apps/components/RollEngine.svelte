<script>
    import { fade, slide, scale } from 'svelte/transition';
    import { ORE } from '../../../Logic/ORE.js';

    // Props que este componente recebe do MobileHUD
    export let actor;
    export let actionName = "Ação de Sistema";
    export let pool = { d: 1, hd: 0, wd: 0, spray: 0 };
    export let theme = { primary: '#00ff41', bg: 'rgba(5, 5, 10, 0.95)' };
    export let onClose; // Função para fechar o modal

    // --- ESTADOS DO MOTOR ---
    // Etapas: 'setup' -> 'wiggle' (se necessário) -> 'done'
    let step = 'setup'; 
    
    // Modificadores do Jogador
    let mods = { 
        spray: pool.spray || 0, 
        buffs: 0, 
        debuffs: 0, 
        reactionD: 0, 
        reactionHD: 0, 
        reactionWD: 0 
    };

    let showReaction = false; // Toggle para abrir painel de reação
    
    // Dados Rolados
    let rolledDice = [];
    let wiggleIndices = []; // Guarda a posição original dos WDs na array
    let wiggleChoices = []; // Valores escolhidos pelo jogador
    let finalResults = null;

    // --- LÓGICA PASSO A PASSO ---

    import { onMount, onDestroy } from 'svelte';

  // ... suas outras variáveis (activeApp, isOpen, etc) ...

  onMount(() => {
    // Escuta o chamado do chat ou de outros arquivos JS
    const hookId = Hooks.on("nexusToggleApp", (appId) => {
      // Abre o app (no seu caso, appId será 'dados')
      openApp(appId, null);
    });

    return () => {
      Hooks.off("nexusToggleApp", hookId);
    };
  });

    // 1. Inicia a rolagem baseada na configuração atual
    function handleRoll() {
        const actionPool = { d: pool.d, hd: pool.hd, wd: pool.wd, spray: mods.spray };
        const reactionPool = { d: mods.reactionD, hd: mods.reactionHD, wd: mods.reactionWD, spray: 0 };
        
        const finalPool = ORE.calculateFinalPool(actionPool, reactionPool, { buffs: mods.buffs, debuffs: mods.debuffs });
        rolledDice = ORE.generateRoll(finalPool);

        const pendingWiggles = ORE.getPendingWiggles(rolledDice);

        if (pendingWiggles > 0) {
            // Vai para a tela de escolher a face dos coringas
            step = 'wiggle';
            wiggleIndices = rolledDice.map((d, i) => d.type === 'wd' ? i : -1).filter(i => i !== -1);
            wiggleChoices = Array(pendingWiggles).fill(10); // Padrão: face 10
        } else {
            // Se não tem WD, finaliza direto
            finishRoll();
        }
    }

    // 2. Aplica as faces escolhidas aos Wiggle Dice
    function confirmWiggles() {
        wiggleIndices.forEach((diceIndex, i) => {
            rolledDice[diceIndex].val = Number(wiggleChoices[i]);
        });
        finishRoll();
    }

    // 3. Processa resultados e envia pro chat
    function finishRoll() {
        finalResults = ORE.parseResults(rolledDice);
        sendToChat();
        step = 'done';
    }

    // 4. Monta a Carta de Chat e Envia
    function sendToChat() {
        const tColor = theme.primary;
        let html = `
        <div class="ore-chat-card" style="border: 2px solid ${tColor}; background: #0a0a0f; color: #fff; font-family: monospace; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px ${tColor}44;">
            <header style="background: ${tColor}22; padding: 10px; border-bottom: 1px solid ${tColor};">
                <h3 style="margin: 0; color: ${tColor}; text-shadow: 0 0 5px ${tColor}; text-transform: uppercase;">${actionName}</h3>
                <span style="font-size: 10px; color: #aaa;">${actor.name}</span>
            </header>
            <div style="padding: 10px;">
        `;

        if (finalResults.validSets.length > 0) {
            html += `<div style="font-weight: bold; font-size: 12px; color: #aaa; margin-bottom: 5px;">CONJUNTOS VÁLIDOS (L x A)</div>`;
            finalResults.validSets.forEach(set => {
                html += `
                <div style="display: flex; align-items: center; margin-bottom: 5px; background: #111; padding: 5px; border-left: 3px solid ${tColor}; border-radius: 4px;">
                    <span style="font-size: 18px; font-weight: bold; color: ${tColor}; margin-right: 10px;">${set.w}x${set.h}</span>
                    <div style="display: flex; gap: 2px;">
                        ${Array(set.w).fill(`<div style="width: 15px; height: 15px; background: ${tColor}; border-radius: 2px;"></div>`).join('')}
                    </div>
                </div>`;
            });
        } else {
            html += `<div style="color: #ff4444; font-weight: bold; text-align: center; padding: 10px; border: 1px dashed #ff4444;">FALHA NA AÇÃO</div>`;
        }

        if (finalResults.looseDice.length > 0) {
            html += `<div style="margin-top: 10px; font-size: 10px; color: #666; border-top: 1px dashed #333; padding-top: 5px;">
                Dados Soltos: ${finalResults.looseDice.map(d => d.h).join(', ')}
            </div>`;
        }

        html += `</div></div>`;

        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            content: html
        });
    }
</script>

<div class="roll-engine-overlay no-drag" style="--primary: {theme.primary}; --bg: {theme.bg};" transition:fade>
    <div class="roll-box" transition:scale>
        
        <header class="re-header">
            <h2>{actionName}</h2>
            <button class="close-btn" on:click={onClose}>×</button>
        </header>

        {#if step === 'setup'}
<div class="pool-display">
                <div class="pd-item" title="Normal Dice">
                    <input type="number" min="0" bind:value={pool.d}> D
                </div>
                <div class="pd-item hd" title="Hard Dice">
                    <input type="number" min="0" bind:value={pool.hd}> HD
                </div>
                <div class="pd-item wd" title="Wiggle Dice">
                    <input type="number" min="0" bind:value={pool.wd}> WD
                </div>
            </div>

            <div class="mods-section">
                <div class="mod-row">
                    <label>Spray (Ataque em Área):</label>
                    <input type="number" min="0" max="10" bind:value={mods.spray}>
                </div>
                <div class="mod-row">
                    <label>Vantagem (Buffs em D):</label>
                    <input type="number" min="0" bind:value={mods.buffs}>
                </div>
                <div class="mod-row">
                    <label>Penalidade (Debuffs):</label>
                    <input type="number" min="0" bind:value={mods.debuffs}>
                </div>
            </div>

            <div class="reaction-toggle" on:click={() => showReaction = !showReaction}>
                <i class="fas fa-shield-alt"></i> Adicionar Rolagem de Reação {showReaction ? '▲' : '▼'}
            </div>

            {#if showReaction}
                <div class="mods-section reaction-box" transition:slide>
                    <div class="mod-row"><label>Reação (D):</label><input type="number" min="0" bind:value={mods.reactionD}></div>
                    <div class="mod-row"><label>Reação (HD):</label><input type="number" min="0" bind:value={mods.reactionHD}></div>
                    <div class="mod-row"><label>Reação (WD):</label><input type="number" min="0" bind:value={mods.reactionWD}></div>
                </div>
            {/if}

            <button class="execute-btn" on:click={handleRoll}>
                <i class="fas fa-dice-d20"></i> INICIAR ROLAGEM
            </button>
        {/if}

        {#if step === 'wiggle'}
            <div class="wiggle-view" transition:fade>
                <div class="alert-box">WIGGLE DICE DETECTADO!</div>
                <p>Defina as faces dos seus dados coringa para completar o conjunto.</p>
                
                <div class="dice-grid">
                    {#each rolledDice as d, i}
                        {#if d.type === 'wd'}
                            {@const wIndex = wiggleIndices.indexOf(i)}
                            <div class="die wd-active">
                                <input type="number" min="1" max="10" bind:value={wiggleChoices[wIndex]}>
                            </div>
                        {:else}
                            <div class="die {d.type} locked">{d.val}</div>
                        {/if}
                    {/each}
                </div>

                <button class="execute-btn" on:click={confirmWiggles}>
                    CONFIRMAR FACES
                </button>
            </div>
        {/if}

        {#if step === 'done'}
            <div class="done-view" transition:scale>
                <i class="fas fa-check-circle success-icon"></i>
                <h3>SISTEMA ATUALIZADO</h3>
                <p>Os resultados foram enviados para o canal de comunicação.</p>
                
                <div class="quick-results">
                    {#each finalResults.validSets as set}
                        <div class="qr-set">{set.w}x{set.h}</div>
                    {/each}
                </div>

                <button class="execute-btn outline" on:click={onClose}>FECHAR PAINEL</button>
            </div>
        {/if}
    </div>
</div>

<style>
.roll-engine-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.85);
        display: flex; align-items: center; justify-content: center;
        
        /* A SOLUÇÃO ESTÁ AQUI: */
        z-index: 999999 !important; 
        pointer-events: all !important; 
        
        font-family: 'Share Tech Mono', monospace;
    }

    .roll-box {
        width: 350px; background: var(--bg);
        border: 2px solid var(--primary);
        border-radius: 12px; padding: 20px;
        color: #fff; box-shadow: 0 10px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,255,65,0.1);
    }

    .re-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
    .re-header h2 { margin: 0; color: var(--primary); font-size: 16px; text-transform: uppercase; }
    .close-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
    .close-btn:hover { color: #ff4444; }

    /* Exibição da Pool Base */
    .pool-display { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
.pd-item input { width: 40px; background: transparent; border: none; border-bottom: 2px solid #333; color: #fff; font-size: 24px; font-weight: bold; text-align: center; outline: none; font-family: inherit; transition: 0.2s; }
    .pd-item input:focus { border-color: var(--primary); }
    .pd-item.hd input { color: #ffaa00; }
    .pd-item.wd input { color: #00aaff; }
    /* Controles de Modificadores */
    .mods-section { background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; }
    .mod-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
    .mod-row input { width: 50px; background: #000; border: 1px solid var(--primary); color: var(--primary); text-align: center; padding: 5px; font-weight: bold; border-radius: 4px; }

    .reaction-toggle { background: #111; padding: 10px; text-align: center; font-size: 12px; cursor: pointer; border: 1px dashed #444; border-radius: 4px; margin-bottom: 15px; transition: 0.2s; }
    .reaction-toggle:hover { border-color: var(--primary); color: var(--primary); }
    .reaction-box { border: 1px dashed #ffaa00; }

    /* Botão Principal */
    .execute-btn { width: 100%; padding: 15px; background: var(--primary); color: #000; font-weight: bold; font-size: 16px; border: none; border-radius: 6px; cursor: pointer; transition: 0.2s; font-family: inherit; margin-top: 10px; }
    .execute-btn:hover { filter: brightness(1.2); box-shadow: 0 0 15px var(--primary); }
    .execute-btn.outline { background: transparent; border: 2px solid var(--primary); color: var(--primary); }
    .execute-btn.outline:hover { background: var(--primary); color: #000; }

    /* Tela de Wiggle Dice */
    .alert-box { background: #ffaa00; color: #000; padding: 10px; font-weight: bold; text-align: center; border-radius: 4px; margin-bottom: 10px; animation: pulseWiggle 1s infinite alternate; }
    @keyframes pulseWiggle { from { box-shadow: 0 0 5px #ffaa00; } to { box-shadow: 0 0 20px #ffaa00; } }
    
    .dice-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 20px 0; }
    .die { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; border-radius: 6px; }
    .die.d { background: #222; border: 1px solid #444; color: #fff; }
    .die.hd { background: #332200; border: 2px solid #ffaa00; color: #ffaa00; }
    .die.wd-active { background: rgba(0, 170, 255, 0.2); border: 2px dashed #00aaff; }
    .die.wd-active input { width: 100%; height: 100%; background: transparent; border: none; color: #00aaff; font-size: 20px; font-weight: bold; text-align: center; }
    .die.locked { opacity: 0.6; pointer-events: none; }

    /* Tela de Sucesso */
    .done-view { text-align: center; padding: 20px 0; }
    .success-icon { font-size: 50px; color: var(--primary); margin-bottom: 10px; }
    .quick-results { display: flex; gap: 10px; justify-content: center; margin: 15px 0; flex-wrap: wrap; }
    .qr-set { background: var(--primary); color: #000; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 16px; }
</style>