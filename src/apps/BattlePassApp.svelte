<script>
    import { onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { PassSystem, PASS_TIERS } from '../PassSystem.js';
    import { StoreDatabase } from '../StoreDatabase.js';
    import BattlePassAdmin from './BattlePassAdmin.svelte';
    
    // COMPONENTES
    import StoreCard from '../StoreCard.svelte'; 
    import ItemWindow from '../ItemWindow.svelte'; 

    export let actor;
    const isGM = game.user.isGM;
    const MODULE_ID = "multiversus-rpg";

    // --- DADOS DO SISTEMA ---
    let season = {};
    let playerTier = PASS_TIERS.COBRE;
    let rewardsMap = [];
    let claimed = [];
    let showAdmin = false;

    // --- LÓGICA DE TEMPO ---
    let currentWeekNumber = 1;
    let daysRemaining = 0;
    let progressPercent = 0;

    // --- ESTADOS DE UI ---
    let cardTilt = { x: 0, y: 0 };
    let selectedItemForInspect = null;

    // --- CONFIGURAÇÃO DE TIERS (CORES E ÍCONES) ---
    const TIER_CONFIG = {
        gambiarrite: { label: 'GAMBIARRITE', icon: 'fa-biohazard', color: '#ff3333', bg: 'rgba(255, 51, 51, 0.05)' },
        diamante:    { label: 'DIAMANTE',    icon: 'fa-gem',       color: '#00fbff', bg: 'rgba(0, 251, 255, 0.05)' },
        ouro:        { label: 'OURO',        icon: 'fa-trophy',    color: '#ffcc00', bg: 'rgba(255, 204, 0, 0.05)' },
        prata:       { label: 'PRATA',       icon: 'fa-medal',     color: '#e0e0e0', bg: 'rgba(224, 224, 224, 0.05)' },
        cobre:       { label: 'COBRE',       icon: 'fa-shield-alt', color: '#cd7f32', bg: 'rgba(205, 127, 50, 0.05)' }
    };

    // Estilo dinâmico do cartão de perfil
    $: currentStyle = {
        bg: `linear-gradient(135deg, #050505, ${TIER_CONFIG[playerTier.id]?.color || '#cd7f32'})`,
        border: TIER_CONFIG[playerTier.id]?.color || '#cd7f32',
        shadow: `${TIER_CONFIG[playerTier.id]?.color}40`
    };

    onMount(() => {
        refresh();
        Hooks.on("passSystemUpdate", refresh);
    });

    async function refresh() {
        season = PassSystem.getSeasonData();
        playerTier = PassSystem.getPlayerTier(game.user.id);
        rewardsMap = PassSystem.getRewardsMap();
        claimed = actor.getFlag(MODULE_ID, "claimedRewards") || [];
        calculateTimeLogic();
    }

    function calculateTimeLogic() {
        if (!season.startDate || !season.endDate) return;
        const now = Date.now();
        const oneWeekMs = 1000 * 60 * 60 * 24 * 7;
        const totalDuration = season.endDate - season.startDate;
        const elapsed = now - season.startDate;

        currentWeekNumber = Math.min(12, Math.floor(elapsed / oneWeekMs) + 1);
        if (season.status !== 'active') currentWeekNumber = 0;

        progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        daysRemaining = PassSystem.utils.getDaysRemaining(season.endDate);
    }

    // Retorna string formatada da data de desbloqueio
    function getUnlockDateDisplay(weekIdx) {
        if (!season.startDate) return "EM BREVE";
        const oneWeekMs = 1000 * 60 * 60 * 24 * 7;
        const unlockTime = season.startDate + (weekIdx * oneWeekMs);
        const date = new Date(unlockTime);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const hora = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `LIBERAÇÃO: ${dia}/${mes} às ${hora}:${min}`;
    }

    // --- VISUAL 3D (Mouse Move) ---
    function handleMouseMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width; 
        const y = (e.clientY - rect.top) / rect.height;
        cardTilt = { x: (0.5 - y) * 20, y: (x - 0.5) * 20 };
    }
    function resetTilt() { cardTilt = { x: 0, y: 0 }; }

    // --- INSPEÇÃO DE ITEM ---
    async function inspectItem(item) {
        if (!item) return;
        // Busca versão completa do banco
        const archive = StoreDatabase.getArchive();
        const found = archive.find(i => i.id === item.id);
        let fullItem = found ? { ...found, ...item } : { ...item };

        selectedItemForInspect = {
            ...fullItem,
            system: { description: "Sem descrição.", ...fullItem.system, stock: -1 },
            price: 0, isPassItem: true 
        };
    }

    // --- HELPERS ---
    function isWeekFuture(weekIdx) { return (weekIdx + 1) > currentWeekNumber; }
    function isWeekCurrent(weekIdx) { return (weekIdx + 1) === currentWeekNumber; }
    function isLockedTier(t) { return PassSystem.getEligibleTiers(playerTier.id).indexOf(t) === -1; }
    function isItemTaken(weekIdx, t) { return claimed.includes(`w${weekIdx}_${t}`); }

    // --- SISTEMA DE RESGATE ---
    async function claimWeek(weekIdx) {
        if (season.status !== 'active') return ui.notifications.warn("Temporada Inativa.");
        if ((weekIdx + 1) > currentWeekNumber) return ui.notifications.warn(`Semana ${weekIdx + 1} bloqueada temporalmente!`);

        const weekData = rewardsMap[weekIdx];
        const eligibleTiers = PassSystem.getEligibleTiers(playerTier.id);
        let rewardsToGive = [];
        let newClaimed = [...claimed];

        // Coleta recompensas disponíveis para o Tier atual
        for (const tierKey of eligibleTiers) {
            const rewardSimple = weekData[tierKey];
            const claimId = `w${weekIdx}_${tierKey}`;
            
            if (rewardSimple && !claimed.includes(claimId)) {
                const archive = StoreDatabase.getArchive();
                const fullItem = archive.find(i => i.id === rewardSimple.id) || rewardSimple;
                rewardsToGive.push(fullItem);
                newClaimed.push(claimId);
            }
        }

        if (rewardsToGive.length === 0) return;

        AudioHelper.play({src: "sounds/lock.wav", volume: 0.8, autoplay: true, loop: false}, false);

        for (const item of rewardsToGive) {
            if (item.type === 'currency' || item.systemTag === 'Moeda') {
                 await StoreDatabase.adminModifyCoins(game.user.id, 500, 'add'); 
                 ui.notifications.info(`[PASSE] Créditos Recebidos!`);
            } else {
                await StoreDatabase.injectPassItem(game.user.id, item);
                ui.notifications.info(`[PASSE] ${item.name} enviado para o Inventário.`);
            }
        }

        await actor.setFlag(MODULE_ID, "claimedRewards", newClaimed);
        claimed = newClaimed;
    }
</script>

{#if selectedItemForInspect}
    <ItemWindow 
        item={selectedItemForInspect} 
        mode="view" 
        {isGM} 
        themeColor="#00ff41"
        on:close={() => selectedItemForInspect = null} 
    />
{/if}

<div class="bp-root">
    {#if showAdmin}
        <div class="admin-wrapper">
            <button class="back-btn" on:click={() => showAdmin = false}> <i class="fas fa-arrow-left"></i> VOLTAR </button>
            <BattlePassAdmin />
        </div>
    {:else}
        <div class="bp-layout">
            
            <aside class="profile-zone">
                <div class="card-container" 
                     on:mousemove={handleMouseMove} on:mouseleave={resetTilt}
                     style="transform: perspective(1000px) rotateX({cardTilt.x}deg) rotateY({cardTilt.y}deg);">
                    
                    <div class="holo-card" style="background: {currentStyle.bg}; border-color: {currentStyle.border}; box-shadow: 0 0 40px {currentStyle.shadow};">
                        <div class="card-header">
                            <span class="season-lbl">{season.name}</span>
                            <span class="status-lbl">{season.status === 'active' ? 'ATIVO' : 'OFF'}</span>
                        </div>
                        <div class="card-body">
                            <div class="avatar-frame" style="border-color: {currentStyle.border}">
                                <img src={actor.img} alt="Player" />
                            </div>
                            <h2 style="color: {currentStyle.border}">{playerTier.label}</h2>
                            <p class="card-id">ID: {actor.name.toUpperCase()}</p>
                        </div>
                        <div class="card-footer">
                            <div class="progress-info">
                                <span>PROGRESSO</span>
                                <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <div class="p-bar"><div class="fill" style="width: {progressPercent}%; background: {currentStyle.border}"></div></div>
                            <div class="timer-txt">FIM EM: {daysRemaining} DIAS</div>
                        </div>
                        <div class="holo-sheen"></div>
                    </div>
                </div>
                {#if isGM}
                    <button class="gm-edit-btn" on:click={() => showAdmin = true}> <i class="fas fa-edit"></i> ADMIN </button>
                {/if}
            </aside>

            <main class="tracks-zone">
                <div class="track-header">
                    <h3>CRONOGRAMA DE SUPRIMENTOS</h3>
                    <div class="week-indicator">SEMANA ATUAL: <span class="accent">{currentWeekNumber}</span> / 12</div>
                </div>

                <div class="scroll-track">
                    <div class="connection-line"></div>

                    {#each rewardsMap as week, idx}
                        {@const isFuture = isWeekFuture(idx)}
                        {@const isCurrent = isWeekCurrent(idx)}
                        {@const weekNum = idx + 1}

                        <div class="week-node" class:locked-time={isFuture} class:current={isCurrent}>
                            <div class="node-marker">
                                <span class="num">S{weekNum}</span>
                            </div>

                            <div class="week-content">
                                
                                <div class="tier-list">
                                    {#each ['gambiarrite', 'diamante', 'ouro', 'prata', 'cobre'] as t}
                                        {@const hasItem = !!week[t]}
                                        {@const lockedTier = isLockedTier(t)}
                                        {@const taken = isItemTaken(idx, t)}
                                        {@const config = TIER_CONFIG[t]}

                                        {#if hasItem}
                                            <div class="tier-row" 
                                                 style="--tier-color: {config.color}; background: {config.bg}">
                                                
                                                <div class="tier-label" style="color: {config.color}">
                                                    <i class="fas {config.icon}"></i> {config.label}
                                                </div>

                                                <div class="card-slot" 
                                                     class:locked={lockedTier}
                                                     class:taken={taken}
                                                     title="Clique para inspecionar"
                                                     on:click={() => inspectItem(week[t])}>
                                                    
                                                    <div class="card-wrapper">
                                                        <StoreCard item={{...week[t], price: 0}} />
                                                    </div>

                                                    {#if taken} 
                                                        <div class="overlay taken"><i class="fas fa-check"></i> RESGATADO</div> 
                                                    {/if}
                                                    {#if lockedTier} 
                                                        <div class="overlay lock"><i class="fas fa-lock"></i> BLOQUEADO</div> 
                                                    {/if}
                                                </div>
                                            </div>
                                        {/if}
                                    {/each}
                                </div>

                                <div class="week-footer">
                                    {#if isFuture}
                                        <div class="time-lock-display">
                                            <i class="fas fa-clock"></i> 
                                            <span>{getUnlockDateDisplay(idx)}</span>
                                        </div>
                                    {:else}
                                        <button class="claim-btn" on:click={() => claimWeek(idx)}>
                                            RESGATAR SEMANA {weekNum}
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </main>
        </div>
    {/if}
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .bp-root {
        height: 100%; width: 100%; overflow: hidden;
        background: radial-gradient(circle at 10% 20%, #080808 0%, #000 90%);
        font-family: 'Share Tech Mono', monospace; color: #fff;
    }

    .bp-layout { display: grid; grid-template-columns: 320px 1fr; height: 100%; }

    /* ESQUERDA: PERFIL */
    .profile-zone {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(255,255,255,0.02); border-right: 1px solid #333;
        padding: 20px; perspective: 1000px;
    }
    .card-container { width: 100%; max-width: 280px; transition: transform 0.1s ease-out; }
    
    .holo-card {
        width: 100%; aspect-ratio: 0.65; border-radius: 12px; border: 2px solid;
        display: flex; flex-direction: column; padding: 20px; position: relative; overflow: hidden;
        backdrop-filter: blur(10px);
    }
    .card-header { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 20px; font-weight: bold; text-shadow: 0 1px 2px #000; }
    .card-body { text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; }
    .avatar-frame { width: 100px; height: 100px; border-radius: 50%; border: 3px solid; overflow: hidden; background: #000; margin-bottom: 15px; box-shadow: 0 0 25px rgba(0,0,0,0.8); }
    .avatar-frame img { width: 100%; height: 100%; object-fit: cover; }
    .card-body h2 { margin: 0; font-size: 26px; text-transform: uppercase; text-shadow: 0 0 10px rgba(0,0,0,0.8); letter-spacing: 2px; }
    .card-id { font-size: 10px; opacity: 0.8; letter-spacing: 1px; margin-top: 5px; }
    .card-footer { margin-top: auto; font-size: 10px; font-weight: bold; }
    .progress-info { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .p-bar { width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; margin-bottom: 5px; }
    .p-bar .fill { height: 100%; transition: width 1s ease-out; }
    .timer-txt { text-align: center; color: #fff; text-shadow: 0 0 5px #000; }
    .holo-sheen { position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); transform: skewX(-25deg); animation: sheen 6s infinite; pointer-events: none; }
    
    .gm-edit-btn { margin-top: 30px; background: #111; color: #888; border: 1px dashed #444; padding: 10px; cursor: pointer; width: 100%; font-family: inherit; font-size: 11px; }
    .gm-edit-btn:hover { background: #222; color: #fff; border-color: #fff; }

    /* DIREITA: TRACKS ZONE */
    .tracks-zone { display: flex; flex-direction: column; padding: 0 20px 20px 20px; overflow: hidden; position: relative; }
    .track-header { padding: 20px 0; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; background: linear-gradient(180deg, #0a0a0a 80%, transparent); z-index: 10; }
    .track-header h3 { margin: 0; color: #00ff41; font-size: 18px; letter-spacing: 2px; }
    .accent { color: #00ff41; font-size: 18px; text-shadow: 0 0 10px #00ff41; }

    .scroll-track { flex: 1; overflow-y: auto; padding-right: 15px; position: relative; display: flex; flex-direction: column; gap: 30px; padding-bottom: 50px; }
    .connection-line { position: absolute; top: 0; bottom: 0; left: 30px; width: 2px; background: #222; z-index: 0; }

    /* WEEK NODE (CONTAINER SEMANA) */
    .week-node { 
        display: flex; gap: 20px; background: #0e0e0e; border: 1px solid #222; 
        padding: 15px; position: relative; z-index: 1; transition: 0.3s; 
        border-radius: 8px; align-items: flex-start;
    }
    .week-node.current { border-color: #00ff41; box-shadow: 0 0 20px rgba(0,255,65,0.05); background: #0f120f; }
    
    /* CORREÇÃO DO BLOQUEIO: Permite clique (pointer-events: auto), mas mantém visual "apagado" */
    .week-node.locked-time { opacity: 0.6; filter: grayscale(0.8); transition: 0.3s; }
    .week-node.locked-time:hover { opacity: 0.9; filter: grayscale(0.2); }

    .node-marker { 
        width: 50px; height: 50px; background: #000; border: 2px solid #444; border-radius: 50%; 
        display: flex; align-items: center; justify-content: center; font-weight: bold; color: #555; 
        font-size: 16px; flex-shrink: 0; z-index: 2; margin-left: 5px;
    }
    .week-node.current .node-marker { border-color: #00ff41; color: #00ff41; background: #000; box-shadow: 0 0 10px #00ff41; }

    .week-content { flex: 1; display: flex; flex-direction: column; gap: 15px; }

    /* LISTA DE TIERS */
    .tier-list { display: flex; flex-direction: column; gap: 8px; }

    .tier-row {
        display: flex; align-items: center; border-left: 4px solid var(--tier-color);
        background: linear-gradient(90deg, rgba(255,255,255,0.02), transparent);
        padding: 5px 10px; border-radius: 0 4px 4px 0; gap: 15px;
    }

    .tier-label { 
        width: 120px; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 8px; 
        text-shadow: 0 0 5px currentColor;
    }

    /* CARD SLOT - ONDE O STORE CARD FICA */
    .card-slot {
        width: 130px; height: 130px; /* Quadrado */
        position: relative; border: 1px solid #333; border-radius: 6px; 
        background: #000; cursor: pointer; overflow: hidden;
        transition: 0.2s;
    }
    .card-slot:hover { border-color: #fff; transform: scale(1.05); z-index: 10; box-shadow: 0 0 15px rgba(0,0,0,0.8); }
    .card-slot.locked { border-color: #333; opacity: 0.5; }
    .card-slot.taken { border-color: #00ff41; box-shadow: 0 0 10px rgba(0,255,65,0.2); }

    /* ZOOM no StoreCard para ele caber no slot de 130px sem distorcer */
    .card-wrapper {
        width: 220px; /* Tamanho original do StoreCard aprox */
        height: 320px; 
        transform: scale(0.6); /* Reduz proporcionalmente */
        transform-origin: top left;
        pointer-events: none; /* Clique passa para o slot */
    }

    .overlay {
        position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.85); color: #fff; font-size: 10px; font-weight: bold; gap: 5px;
        backdrop-filter: blur(2px); z-index: 5;
    }
    .overlay.taken { color: #00ff41; background: rgba(0,20,0,0.85); border: 1px solid #00ff41; }
    .overlay.lock { color: #888; }
    .overlay i { font-size: 20px; margin-bottom: 5px; }

    /* RODAPÉ E TEMPO */
    .week-footer { border-top: 1px dashed #333; padding-top: 10px; display: flex; justify-content: flex-end; }

    .time-lock-display {
        background: #000; border: 1px solid #444; color: #666;
        padding: 8px 15px; font-size: 12px; font-weight: bold;
        display: flex; align-items: center; gap: 8px; border-radius: 4px;
        letter-spacing: 1px;
    }
    .time-lock-display i { color: #888; }

    .claim-btn { 
        background: #00ff41; color: #000; border: none; padding: 10px 20px; font-weight: bold; font-size: 12px; 
        cursor: pointer; font-family: inherit; clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%); transition: 0.2s; 
    }
    .claim-btn:hover { background: #fff; box-shadow: 0 0 15px #00ff41; }

    .admin-wrapper { padding: 20px; height: 100%; display: flex; flex-direction: column; background: #000; }
    .back-btn { background: #222; color: #ccc; padding: 12px; border: 1px solid #444; margin-bottom: 10px; cursor: pointer; text-align: left; }
    .back-btn:hover { background: #333; color: #fff; }

    @keyframes sheen { 0% { left: -100%; } 20% { left: 200%; } 100% { left: 200%; } }
</style>