<script>
    import { fade, scale, fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { createEventDispatcher, onDestroy } from 'svelte';

    const dispatch = createEventDispatcher();

    // --- PROPS ---
    export let actionName = "PROTOCOLO_VETOR_01";
    export let pool = { d: 4, hd: 0, wd: 0 };
    export let character = null;
    
    // [NOVO] Permite que o SocialMenu capture o resultado
    export let externalHandler = null; 

    // --- ESTADOS INTERNOS ---
    let step = 'CONFIG'; 
    let imageUrl = "";
    let mods = { debuffs: 0, buffers: 0 };
    let rolledDice = []; 
    let wiggleSelector = { show: false, index: null };
    
    // --- ESTADOS DE SEGURANÇA ---
    let isLocked = false;      
    let rollCompleted = false; 

    // --- CÁLCULOS ---
    $: finalD = Math.max(0, pool.d + mods.buffers - mods.debuffs);
    $: finalPool = { d: finalD, hd: pool.hd, wd: pool.wd };
    $: sets = calculateSets(rolledDice);

    // --- ANTI-CHEAT (DEAD MAN SWITCH) ---
    onDestroy(() => {
        if (isLocked && !rollCompleted) {
            // Anti-cheat continua indo para o Chat Global do Foundry para expor o jogador
            if (typeof ChatMessage !== 'undefined') {
                ChatMessage.create({
                    content: `
                    <div style="background: #000; border: 2px solid #ff0000; color: #ff0000; padding: 10px; font-family: 'Share Tech Mono';">
                        <h3 style="margin:0; border-bottom: 1px solid #ff0000">⚠️ VIOLAÇÃO DE PROTOCOLO</h3>
                        <p>O usuário desconectou ou fechou o terminal durante o cálculo de <b>${actionName}</b>.</p>
                        <p style="font-size: 0.8em;">REGISTRO DE INCIDENTE: TENTATIVA DE EVASÃO DETECTADA.</p>
                    </div>`,
                    speaker: character ? ChatMessage.getSpeaker({actor: character}) : {}
                });
            }
        }
    });

    async function executeRoll() {
        isLocked = true; 
        step = 'ROLLING';
        rolledDice = [];
        let temp = [];

        for (let i = 0; i < finalPool.hd; i++) temp.push({ val: 10, type: 'hd' });
        for (let i = 0; i < finalPool.d; i++) temp.push({ val: Math.floor(Math.random() * 10) + 1, type: 'd' });
        for (let i = 0; i < finalPool.wd; i++) temp.push({ val: 0, type: 'wd' });

        await new Promise(r => setTimeout(r, 1200));
        rolledDice = temp;

        if (finalPool.wd > 0) {
            step = 'WIGGLE_PHASE';
        } else {
            await sendSignal();
        }
    }

    function calculateSets(dice) {
        const counts = {};
        dice.filter(d => d.val > 0).forEach(d => {
            counts[d.val] = (counts[d.val] || 0) + 1;
        });

        return Object.entries(counts)
            .filter(([v, c]) => c >= 2)
            .map(([v, c]) => ({ w: c, h: parseInt(v) }))
            .sort((a,b) => b.w - a.w || b.h - a.h);
    }

    function selectWiggle(val) {
        rolledDice[wiggleSelector.index].val = val;
        rolledDice = [...rolledDice]; 
        wiggleSelector.show = false;

        const remaining = rolledDice.filter(d => d.val === 0).length;
        if (remaining === 0) {
            sendSignal();
        }
    }

    async function sendSignal() {
        rollCompleted = true; 

        let content = `
            <div style="border: 1px solid #00ff41; background: #000; padding: 10px; font-family: 'Share Tech Mono', monospace; color: #00ff41;">
                ${imageUrl ? `<img src="${imageUrl}" style="width: 100%; border: 1px solid #222; margin-bottom: 8px;"/>` : ''}
                <div style="font-weight: bold; border-bottom: 1px dashed #00ff41; margin-bottom: 8px; text-transform: uppercase;">> ${actionName}</div>
                <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px;">
                    ${rolledDice.map(d => `
                        <span style="border: 1px solid ${d.type === 'hd' ? '#ff3333' : d.type === 'wd' ? '#ffcc00' : '#00ff41'}; padding: 2px 8px; background: rgba(0,0,0,0.5); font-weight:bold; color: #fff;">
                            ${d.val}
                        </span>
                    `).join('')}
                </div>
                <div style="font-size: 13px;">SETS: ${sets.length ? sets.map(s => `<b style="color:#fff; background:rgba(0,255,65,0.2); padding:0 4px;">[${s.w}x${s.h}]</b>`).join(' ') : '<span style="color:#ff3333">FALHA_SISTEMA</span>'}</div>
            </div>`;
        
        // [INTEGRAÇÃO] Se houver handler externo (SocialMenu), usa ele. Senão, usa chat normal.
        if (externalHandler) {
            await externalHandler(content);
        } else if (typeof ChatMessage !== 'undefined') {
            const speaker = character ? ChatMessage.getSpeaker({actor: character}) : {};
            ChatMessage.create({ content, speaker });
        }
        
        dispatch('close');
    }
</script>

<div class="dice-logic-overlay" transition:fade={{duration: 200}}>
    <div class="vector-window" in:scale={{start: 0.9, duration: 400, easing: cubicOut}}>
        
        <header>
            <div class="status-dot" class:busy={isLocked}></div>
            <span>VETOR_CALCULATION_UNIT // {isLocked ? 'LOCKED' : 'READY'}</span>
            {#if !isLocked}
                <button class="x-btn" on:click={() => dispatch('close')}>×</button>
            {/if}
        </header>

        <main class="window-body">
            {#if step === 'CONFIG'}
                <div class="setup-layout" in:fly={{y: 10, duration: 400}}>
                    <section class="meta-inputs">
                        <label>ID_AÇÃO</label>
                        <input type="text" bind:value={actionName} />
                        <label>SINAL_VISUAL (URL)</label>
                        <input type="text" bind:value={imageUrl} placeholder="Opcional..." />
                    </section>

                    <section class="pool-inputs">
                        <div class="input-group">
                            <label>DADOS (D | HD | WD)</label>
                            <div class="row">
                                <input type="number" bind:value={pool.d} />
                                <input type="number" bind:value={pool.hd} class="hd" />
                                <input type="number" bind:value={pool.wd} class="wd" />
                            </div>
                        </div>
                        <div class="input-group">
                            <label>MODIFICADORES (DBF | BUF)</label>
                            <div class="row">
                                <input type="number" bind:value={mods.debuffs} class="dbf" />
                                <input type="number" bind:value={mods.buffers} class="buf" />
                            </div>
                        </div>
                    </section>

                    <button class="roll-trigger" on:click={executeRoll}>
                        >> INICIAR_SEQUÊNCIA_IRREVERSÍVEL
                    </button>
                    <div style="font-size:9px; color:#555; text-align:center; margin-top:5px;">
                        ⚠️ AÇÃO NÃO PODE SER CANCELADA APÓS O INÍCIO
                    </div>
                </div>

            {:else if step === 'ROLLING'}
                <div class="rolling-anim" in:fade>
                    <p class="blink">> GERANDO ENTROPIA...</p>
                    <div class="progress-bar"><div class="fill"></div></div>
                </div>

            {:else if step === 'WIGGLE_PHASE'}
                <div class="results-layout" in:fly={{y: 10, duration: 400}}>
                    <div class="warning-box">
                        ALOCAÇÃO DE VARIÁVEIS NECESSÁRIA
                    </div>
                    
                    <div class="dice-display">
                        {#each rolledDice as d, i}
                            <div class="die-node {d.type}" 
                                 class:is-wiggle={d.val === 0}
                                 class:assigned-wiggle={d.type === 'wd' && d.val !== 0}
                                 on:click={() => d.val === 0 && (wiggleSelector = {show: true, index: i})}>
                                {d.val === 0 ? '?' : d.val}
                            </div>
                        {/each}
                    </div>

                    <div style="text-align:center; font-size: 10px; color:#ffcc00; margin-top:10px;">
                        SELECIONE OS VALORES (?) PARA TRANSMITIR AUTOMATICAMENTE
                    </div>
                </div>
            {/if}
        </main>
    </div>
</div>

{#if wiggleSelector.show}
    <div class="wiggle-modal" transition:fade={{duration: 100}}>
        <div class="num-grid">
            {#each [1,2,3,4,5,6,7,8,9,10] as n}
                <button on:click={() => selectWiggle(n)}>{n}</button>
            {/each}
        </div>
    </div>
{/if}

<style>
    .dice-logic-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 60000; backdrop-filter: blur(4px); }
    .vector-window { width: 420px; background: #000; border: 1px solid #00ff41; font-family: 'Share Tech Mono', monospace; color: #00ff41; box-shadow: 0 0 30px rgba(0,255,65,0.1); }
    header { background: #00ff41; color: #000; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 11px; }
    .status-dot { width: 8px; height: 8px; background: #000; animation: blink 1s infinite; }
    .x-btn { background: transparent; border: none; cursor: pointer; font-weight: bold; font-size: 16px; color: #000; }
    .window-body { padding: 25px; }

    label { font-size: 10px; display: block; margin-bottom: 4px; opacity: 0.8; }
    input { width: 100%; background: #0a0a0a; border: 1px solid #333; color: #fff; padding: 8px; font-family: inherit; margin-bottom: 15px; outline: none; }
    input:focus { border-color: #00ff41; }
    
    .row { display: flex; gap: 8px; }
    .row input { text-align: center; font-size: 16px; }
    .hd { color: #ff3333 !important; border-color: #441111 !important; }
    .wd { color: #ffcc00 !important; border-color: #443311 !important; }
    .dbf { color: #ff3333; }
    .buf { color: #00ccff; }

    .roll-trigger { width: 100%; padding: 12px; background: #00ff41; color: #000; border: none; font-weight: bold; cursor: pointer; }
    .roll-trigger:hover { background: #fff; }

    .dice-display { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; min-height: 50px; }
    .die-node { width: 45px; height: 45px; border: 1px solid #333; display: flex; align-items: center; justify-content: center; font-size: 20px; background: #050505; transition: 0.2s; color: #fff; }
    .die-node.hd { border-color: #ff3333; color: #ff3333; }
    .die-node.wd { border-color: #ffcc00; color: #ffcc00; }
    .die-node.is-wiggle { border-style: dashed; animation: blink 1s infinite; cursor: pointer; }
    .die-node.is-wiggle:hover { background: #ffcc00; color: #000; }

    .progress-bar { width: 100%; height: 2px; background: #111; margin-top: 10px; overflow: hidden; }
    .fill { height: 100%; background: #00ff41; width: 100%; animation: load 1.5s ease-in-out; }

    @keyframes load { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes blink { 50% { border-color: transparent; } }

    .wiggle-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 70000; }
    .num-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; padding: 20px; border: 1px solid #ffcc00; background: #000; }
    .num-grid button { width: 45px; height: 45px; background: #000; border: 1px solid #ffcc00; color: #ffcc00; cursor: pointer; font-family: inherit; }
    .num-grid button:hover { background: #ffcc00; color: #000; }
    .status-dot.busy { background: #ff0000; box-shadow: 0 0 10px #ff0000; }
    
    .warning-box {
        border: 1px dashed #ffcc00; color: #ffcc00; padding: 5px; 
        text-align: center; font-size: 11px; margin-bottom: 15px;
        animation: blink 2s infinite;
    }

    .die-node.assigned-wiggle {
        border-color: #fff; color: #fff; background: rgba(255, 204, 0, 0.2);
    }
</style>