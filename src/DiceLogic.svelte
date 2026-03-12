<script>
    import { fade, scale, fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { createEventDispatcher, onDestroy } from 'svelte';

    const dispatch = createEventDispatcher();

    // --- PROPS ---
    export let actionName = "Nome da Ação";
    export let pool = { d: 4, hd: 0, wd: 0 };
    export let character = null;
    export let externalHandler = null; 
    

    // --- ESTADOS INTERNOS ---
    let step = 'CONFIG'; 
    let imageUrl = "";
    let mods = { debuffs: 0, buffers: 0 };
    let rolledDice = []; 
    let wiggleSelector = { show: false, index: null };
    let currentTheme = 'default'; // Prepara o terreno para o criador de temas
    
    let isLocked = false;      
    let rollCompleted = false; 

    // --- CÁLCULOS REATIVOS (ORE SYSTEM) ---
    $: finalPool = (() => {
        // Buffs adicionam dados normais
        let currentD = pool.d + mods.buffers;
        let currentHD = pool.hd;
        let currentWD = pool.wd;
        let remainingDebuffs = mods.debuffs;

        // Regra de Debuff: Retira Hard Dice -> Normal Dice -> Wiggle Dice
        if (remainingDebuffs > 0) {
            const removeHD = Math.min(remainingDebuffs, currentHD);
            currentHD -= removeHD;
            remainingDebuffs -= removeHD;
        }
        if (remainingDebuffs > 0) {
            const removeD = Math.min(remainingDebuffs, currentD);
            currentD -= removeD;
            remainingDebuffs -= removeD;
        }
        if (remainingDebuffs > 0) {
            const removeWD = Math.min(remainingDebuffs, currentWD);
            currentWD -= removeWD;
            remainingDebuffs -= removeWD;
        }

        return { d: Math.max(0, currentD), hd: Math.max(0, currentHD), wd: Math.max(0, currentWD) };
    })();

    // Separa os resultados em Conjuntos (2+) e Soltos (1)
    $: allResults = calculateResults(rolledDice);
    $: validSets = allResults.filter(r => r.w >= 2);
    $: looseDice = allResults.filter(r => r.w === 1);
    
    // Verifica se ainda existem Wiggle Dice (?) para serem escolhidos
    $: pendingWiggles = rolledDice.filter(d => d.val === 0).length;

    // --- PREVENÇÃO DE FECHAMENTO ACIDENTAL ---
    onDestroy(() => {
        if (isLocked && !rollCompleted && typeof ChatMessage !== 'undefined') {
            ChatMessage.create({
                content: `
                <div style="background: #fff0f0; border: 1px solid #ff0000; color: #cc0000; padding: 10px; font-family: sans-serif;">
                    <h4 style="margin:0 0 5px 0;">Rolagem Cancelada</h4>
                    <p style="margin:0; font-size: 13px;">O jogador fechou a janela durante a rolagem de <b>${actionName}</b>.</p>
                </div>`,
                speaker: character ? ChatMessage.getSpeaker({actor: character}) : {}
            });
        }
    });

    async function executeRoll() {
        if (finalPool.d === 0 && finalPool.hd === 0 && finalPool.wd === 0) return;

        isLocked = true; 
        step = 'ROLLING';
        rolledDice = [];
        let temp = [];

        // Adiciona os dados na pool final
        for (let i = 0; i < finalPool.hd; i++) temp.push({ val: 10, type: 'hd' });
        for (let i = 0; i < finalPool.d; i++) temp.push({ val: Math.floor(Math.random() * 10) + 1, type: 'd' });
        for (let i = 0; i < finalPool.wd; i++) temp.push({ val: 0, type: 'wd' });

        // Tempo de animação dos dados
        await new Promise(r => setTimeout(r, 1000));
        rolledDice = temp;

        if (finalPool.wd > 0) {
            step = 'WIGGLE_PHASE';
        } else {
            await sendSignal();
        }
    }

    // Calcula Largura x Altura de todos os dados rolados
    function calculateResults(dice) {
        if (!dice || dice.length === 0) return [];
        const counts = {};
        dice.filter(d => d.val > 0).forEach(d => {
            counts[d.val] = (counts[d.val] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([v, c]) => ({ w: c, h: parseInt(v) }))
            .sort((a,b) => b.w - a.w || b.h - a.h); // Ordena por Largura, depois Altura
    }

    function selectWiggle(val) {
        rolledDice[wiggleSelector.index].val = val;
        rolledDice = [...rolledDice]; // Atualiza a tela
        wiggleSelector.show = false;
    }

    async function sendSignal() {
        rollCompleted = true; 
        const setValues = validSets.map(s => s.h);

        let content = `
            <div style="border: 1px solid #444; background: #fafafa; padding: 12px; font-family: sans-serif; color: #222; border-radius: 5px;">
                ${imageUrl ? `<img src="${imageUrl}" style="width: 100%; border-radius: 4px; margin-bottom: 10px;"/>` : ''}
                
                <h3 style="margin: 0 0 10px 0; border-bottom: 2px solid #222; padding-bottom: 5px;">
                    ${actionName}
                </h3>
                
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 15px;">
                    ${rolledDice.map(d => {
                        const isSet = setValues.includes(d.val);
                        const borderColor = d.type === 'hd' ? '#cc0000' : d.type === 'wd' ? '#b8860b' : '#333';
                        const bgColor = isSet ? '#e6f7ff' : '#eee';
                        return `
                        <span style="border: 2px solid ${borderColor}; padding: 4px 8px; font-size: 14px; 
                                     background: ${bgColor}; font-weight: bold; border-radius: 4px;">
                            ${d.val}
                        </span>`;
                    }).join('')}
                </div>
                
                <div style="background: #fff; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                    <div style="margin-bottom: 8px;">
                        <span style="font-size: 12px; font-weight: bold; color: #555;">CONJUNTOS:</span><br/>
                        ${validSets.length > 0 
                            ? validSets.map(s => `<b style="background: #0055ff; color: #fff; padding: 3px 6px; border-radius: 3px; margin-right: 4px; display: inline-block;">${s.w}x${s.h}</b>`).join(' ') 
                            : '<span style="color: #cc0000; font-size: 13px;">Nenhum conjunto formado.</span>'}
                    </div>
                    <div>
                        <span style="font-size: 12px; font-weight: bold; color: #555;">DADOS SOLTOS:</span><br/>
                        ${looseDice.length > 0 
                            ? looseDice.map(s => `<span style="background: #e0e0e0; padding: 2px 5px; border-radius: 3px; margin-right: 4px; font-size: 12px; display: inline-block;">${s.w}x${s.h}</span>`).join(' ') 
                            : '<span style="color: #777; font-size: 12px;">Nenhum dado solto.</span>'}
                    </div>
                </div>
            </div>`;
        
        if (externalHandler) {
            await externalHandler(content);
        } else if (typeof ChatMessage !== 'undefined') {
            const speaker = character ? ChatMessage.getSpeaker({actor: character}) : {};
            ChatMessage.create({ content, speaker });
        }
        
        dispatch('close');
    }
</script>

<div class="dice-logic-overlay" data-theme={currentTheme} transition:fade={{duration: 200}}>
    <div class="vector-window" in:scale={{start: 0.9, duration: 400, easing: cubicOut}}>
        
        <header>
            <span class="header-title">Interface de Rolagem Multiversal</span>
            <div class="header-actions">
                {#if !isLocked}
                    <button class="theme-btn" on:click={() => dispatch('openThemeCreator')}>
                        🎨 Temas
                    </button>
                    <button class="x-btn" on:click={() => dispatch('close')}>✖ Fechar</button>
                {/if}
            </div>
        </header>

        <main class="window-body">
            {#if step === 'CONFIG'}
                <div class="setup-layout" in:fly={{y: 10, duration: 400}}>
                    <section class="meta-inputs">
                        <label>Nome da Ação / Ataque</label>
                        <input type="text" bind:value={actionName} placeholder="Ex: Soco de Fogo" />
                        
                        <label>Imagem da Ação (Link URL - Opcional)</label>
                        <input type="text" bind:value={imageUrl} placeholder="https://..." />
                    </section>

                    <section class="pool-inputs">
                        <label class="section-label">Quantidade de Dados</label>
                        <div class="dice-controls-grid">
                            <div class="control-box">
                                <span class="lbl d-color">Normais (D)</span>
                                <div class="stepper">
                                    <button on:click={() => pool.d > 0 && pool.d--}>-</button>
                                    <input type="number" bind:value={pool.d} min="0" />
                                    <button on:click={() => pool.d++}>+</button>
                                </div>
                            </div>

                            <div class="control-box">
                                <span class="lbl hd-color">Hard (HD)</span>
                                <div class="stepper">
                                    <button on:click={() => pool.hd > 0 && pool.hd--}>-</button>
                                    <input type="number" bind:value={pool.hd} min="0" />
                                    <button on:click={() => pool.hd++}>+</button>
                                </div>
                            </div>

                            <div class="control-box">
                                <span class="lbl wd-color">Wiggle (WD)</span>
                                <div class="stepper">
                                    <button on:click={() => pool.wd > 0 && pool.wd--}>-</button>
                                    <input type="number" bind:value={pool.wd} min="0" />
                                    <button on:click={() => pool.wd++}>+</button>
                                </div>
                            </div>
                        </div>

                        <label class="section-label" style="margin-top: 15px;">Modificadores Temporários</label>
                        <div class="dice-controls-grid dual">
                            <div class="control-box">
                                <span class="lbl dbf-color">Debuffs (Remove dados)</span>
                                <div class="stepper">
                                    <button on:click={() => mods.debuffs > 0 && mods.debuffs--}>-</button>
                                    <input type="number" bind:value={mods.debuffs} min="0" />
                                    <button on:click={() => mods.debuffs++}>+</button>
                                </div>
                            </div>
                            <div class="control-box">
                                <span class="lbl buf-color">Buffs (Adiciona Normais)</span>
                                <div class="stepper">
                                    <button on:click={() => mods.buffers > 0 && mods.buffers--}>-</button>
                                    <input type="number" bind:value={mods.buffers} min="0" />
                                    <button on:click={() => mods.buffers++}>+</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="pool-preview">
                            <b>Pool Final:</b> {finalPool.d} Normais | {finalPool.hd} Hard | {finalPool.wd} Wiggle
                        </div>
                    </section>

                    <button class="roll-trigger" on:click={executeRoll}>
                        Rolar Dados
                    </button>
                </div>

            {:else if step === 'ROLLING'}
                <div class="rolling-anim" in:fade>
                    <p>Rolando os dados...</p>
                    <div class="progress-bar"><div class="fill"></div></div>
                </div>

            {:else if step === 'WIGGLE_PHASE'}
                <div class="results-layout" in:fly={{y: 10, duration: 400}}>
                    
                    <h4 class="results-title">Resultados da Rolagem</h4>
                    
                    <div class="dice-display">
                        {#each rolledDice as d, i}
                            <div class="die-node {d.type}" 
                                 class:is-wiggle={d.val === 0}
                                 class:in-set={validSets.some(s => s.h === d.val && d.val !== 0)}
                                 on:click={() => d.val === 0 && (wiggleSelector = {show: true, index: i})}>
                                {d.val === 0 ? '?' : d.val}
                            </div>
                        {/each}
                    </div>

                    <div class="live-sets-preview">
                        <div class="preview-row">
                            <span class="lbl">CONJUNTOS:</span>
                            <div class="sets-container">
                                {#if validSets.length > 0}
                                    {#each validSets as s} <span class="set-badge">{s.w}x{s.h}</span> {/each}
                                {:else}
                                    <span class="empty-msg">Nenhum conjunto.</span>
                                {/if}
                            </div>
                        </div>
                        <div class="preview-row" style="margin-top: 8px;">
                            <span class="lbl">SOLTOS:</span>
                            <div class="sets-container">
                                {#each looseDice as s} <span class="loose-badge">{s.w}x{s.h}</span> {/each}
                            </div>
                        </div>
                    </div>

                    {#if pendingWiggles > 0}
                        <div class="instruction-box">
                            Selecione os dados com "?" para definir seus valores.
                        </div>
                    {:else}
                        <button class="roll-trigger confirm" on:click={sendSignal} in:scale>
                            Enviar para o Chat
                        </button>
                    {/if}

                </div>
            {/if}
        </main>
    </div>
</div>

{#if wiggleSelector.show}
    <div class="wiggle-modal" transition:fade={{duration: 100}}>
        <div class="num-grid">
            <div class="num-grid-title">Escolha o valor do Wiggle Dice:</div>
            {#each [1,2,3,4,5,6,7,8,9,10] as n}
                <button on:click={() => selectWiggle(n)}>{n}</button>
            {/each}
        </div>
    </div>
{/if}

{#if wiggleSelector.show}
    <div class="wiggle-modal" transition:fade={{duration: 100}}>
        <div class="num-grid">
            <div style="grid-column: 1 / -1; text-align: center; margin-bottom: 10px; font-weight: bold; color: #fff;">
                Escolha o valor numérico para este dado:
            </div>
            {#each [1,2,3,4,5,6,7,8,9,10] as n}
                <button on:click={() => selectWiggle(n)}>{n}</button>
            {/each}
        </div>
    </div>
{/if}

<style>
    .dice-logic-overlay { 
        /* --- SISTEMA DE TEMAS (Cores Base) --- */
        --theme-overlay: rgba(0,0,0,0.65);
        --theme-bg: #ffffff;
        --theme-text: #333333;
        --theme-text-muted: #666666;
        --theme-header-bg: #f8f9fa;
        --theme-border: #e2e8f0;
        
        --theme-primary: #0055ff;
        --theme-primary-hover: #0044cc;
        --theme-confirm: #059669;
        --theme-confirm-hover: #047857;
        
        --color-hd: #dc2626;
        --color-wd: #d97706;
        --color-buf: #059669;
        
        position: fixed; inset: 0; 
        background: var(--theme-overlay); 
        display: flex; align-items: center; justify-content: center; 
        z-index: 60000; font-family: 'Segoe UI', system-ui, sans-serif; 
        backdrop-filter: blur(3px);
    }

    .vector-window { 
        width: 460px; 
        background: var(--theme-bg); 
        border-radius: 12px; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
        overflow: hidden; 
        color: var(--theme-text); 
        border: 1px solid var(--theme-border);
    }
    
    header { 
        background: var(--theme-header-bg); 
        padding: 14px 20px; 
        display: flex; justify-content: space-between; align-items: center; 
        border-bottom: 1px solid var(--theme-border); 
    }

    .header-title { font-weight: 700; font-size: 15px; color: var(--theme-text); }
    .header-actions { display: flex; gap: 8px; }

    .theme-btn {
        background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569;
        cursor: pointer; font-size: 12px; font-weight: 600; border-radius: 6px; 
        padding: 6px 10px; transition: 0.2s;
    }
    .theme-btn:hover { background: #e2e8f0; color: #1e293b; border-color: #94a3b8; }

    .x-btn { 
        background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; 
        cursor: pointer; font-size: 12px; font-weight: 600; border-radius: 6px; 
        padding: 6px 10px; transition: 0.2s; 
    }
    .x-btn:hover { background: #fecaca; color: #991b1b; }
    
    .window-body { padding: 24px; }

    label { font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px; color: var(--theme-text); }
    .section-label { 
        border-bottom: 2px solid var(--theme-border); 
        padding-bottom: 6px; margin-bottom: 16px; 
        font-size: 14px; color: var(--theme-text); font-weight: 700;
    }
    
    input[type="text"] { 
        width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; 
        border-radius: 6px; padding: 10px; font-family: inherit; font-size: 14px;
        margin-bottom: 18px; outline: none; box-sizing: border-box; transition: 0.2s;
        color: var(--theme-text);
    }
    input[type="text"]:focus { border-color: var(--theme-primary); box-shadow: 0 0 0 3px rgba(0,85,255,0.15); }
    
    .dice-controls-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .dice-controls-grid.dual { grid-template-columns: repeat(2, 1fr); }
    
    .control-box { 
        background: var(--theme-header-bg); border: 1px solid var(--theme-border); 
        border-radius: 8px; padding: 10px; text-align: center; 
        display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .lbl { font-size: 12px; font-weight: 700; color: var(--theme-text-muted); }
    
    .d-color { color: var(--theme-primary); }
    .hd-color, .dbf-color { color: var(--color-hd); }
    .wd-color { color: var(--color-wd); }
    .buf-color { color: var(--color-buf); }

    .stepper { 
        display: flex; align-items: center; justify-content: space-between; 
        background: var(--theme-bg); border: 1px solid var(--theme-border); 
        border-radius: 6px; overflow: hidden; 
    }
    .stepper button { 
        background: #f1f5f9; border: none; width: 32px; height: 32px; 
        cursor: pointer; font-size: 16px; font-weight: bold; color: var(--theme-text);
        transition: 0.2s; 
    }
    .stepper button:hover { background: #e2e8f0; }
    .stepper input { 
        width: 100%; text-align: center; border: none; font-size: 15px; font-weight: 600;
        outline: none; -moz-appearance: textfield; color: var(--theme-text); background: transparent;
    }
    .stepper input::-webkit-outer-spin-button, .stepper input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

    .pool-preview { 
        background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;
        padding: 10px; border-radius: 6px; text-align: center; font-size: 13px; 
        margin-top: 15px; font-weight: 500;
    }

    .roll-trigger { 
        width: 100%; padding: 14px; background: var(--theme-primary); color: #fff; 
        border: none; border-radius: 8px; font-weight: 700; font-size: 15px; 
        cursor: pointer; transition: 0.2s; margin-top: 15px; text-transform: uppercase;
        letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(0,85,255,0.2);
    }
    .roll-trigger:hover { background: var(--theme-primary-hover); transform: translateY(-1px); }
    
    .roll-trigger.confirm { background: var(--theme-confirm); box-shadow: 0 4px 6px rgba(5,150,105,0.2); }
    .roll-trigger.confirm:hover { background: var(--theme-confirm-hover); }

    .results-title { margin: 0 0 16px 0; text-align: center; color: var(--theme-text); font-size: 18px; }

    .dice-display { 
        display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; 
        margin-bottom: 24px; min-height: 50px; 
    }
    .die-node { 
        width: 50px; height: 50px; border: 2px solid var(--theme-border); 
        border-radius: 10px; display: flex; align-items: center; justify-content: center; 
        font-size: 22px; font-weight: bold; background: #f8fafc; transition: all 0.2s; 
        cursor: default; color: var(--theme-text-muted); box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .die-node.in-set { 
        background: #eff6ff; border-color: var(--theme-primary); 
        color: var(--theme-primary); transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,85,255,0.15);
    }
    .die-node.hd { border-color: var(--color-hd); color: var(--color-hd); }
    .die-node.wd { border-color: var(--color-wd); color: var(--color-wd); }
    
    .die-node.is-wiggle { 
        border: 2px dashed var(--color-wd); background: #fffbeb; 
        cursor: pointer; font-size: 26px; color: var(--color-wd); animation: pulse 2s infinite;
    }
    .die-node.is-wiggle:hover { background: #fef3c7; transform: scale(1.05); }

    .live-sets-preview { 
        background: var(--theme-header-bg); border: 1px solid var(--theme-border); 
        border-radius: 8px; padding: 14px; margin-top: 10px; font-size: 13px; 
    }
    .preview-row { display: flex; align-items: center; gap: 12px; }
    .sets-container { display: flex; gap: 8px; flex-wrap: wrap; min-height: 24px; align-items: center;}
    
    .set-badge { background: var(--theme-primary); color: #fff; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 14px; }
    .loose-badge { background: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 600; }
    .empty-msg { color: #94a3b8; font-style: italic; }

    .instruction-box { 
        background: #fffbeb; border: 1px solid #fde68a; color: #b45309;
        padding: 12px; text-align: center; border-radius: 8px; margin-top: 20px; 
        font-size: 14px; font-weight: 600; 
    }

    .progress-bar { width: 100%; height: 8px; background: var(--theme-border); border-radius: 4px; overflow: hidden; margin-top: 12px; }
    .fill { height: 100%; background: var(--theme-primary); width: 100%; animation: load 1s ease-in-out; }

    @keyframes load { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

    .wiggle-modal { 
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); 
        display: flex; align-items: center; justify-content: center; z-index: 70000; 
        backdrop-filter: blur(4px);
    }
    .num-grid { 
        display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; 
        padding: 24px; background: var(--theme-bg); border-radius: 12px; 
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); 
    }
    .num-grid-title { 
        grid-column: 1 / -1; text-align: center; margin-bottom: 12px; 
        font-weight: 700; color: var(--theme-text); font-size: 16px; 
    }
    .num-grid button { 
        width: 56px; height: 56px; background: #f8fafc; border: 2px solid #cbd5e1; 
        border-radius: 10px; font-size: 20px; font-weight: 700; cursor: pointer; 
        transition: all 0.15s; color: var(--theme-text);
    }
    .num-grid button:hover { 
        background: var(--color-wd); color: #fff; border-color: var(--color-wd); 
        transform: scale(1.05); box-shadow: 0 4px 6px rgba(217, 119, 6, 0.2);
    }
</style>