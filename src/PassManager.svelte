<script>
    import { onMount } from 'svelte';
    import { PassSystem, PASS_TIERS } from './PassSystem.js';

    // DADOS
    let users = [];
    let season = { status: 'closed' };
    
    // UTILS
    const TIERS = Object.values(PASS_TIERS); // Necessário para o <select>

    // --- CÁLCULOS REATIVOS (Isso corrige o erro) ---
    // Calcula dias restantes
    $: daysLeft = season.endDate ? PassSystem.utils.getDaysRemaining(season.endDate) : 0;

    // Calcula o Texto do Status
    $: statusLabel = (() => {
        if (season.status === 'closed') return "FECHADO / OFF-SEASON";
        if (season.status === 'presale') return "PRÉ-VENDA (AGUARDANDO INÍCIO)";
        if (season.status === 'active') return `ATIVO (RESTAM ${daysLeft} DIAS)`;
        return "DESCONHECIDO";
    })();

    // Calcula a Cor do Status
    $: statusColor = (() => {
        if (season.status === 'closed') return '#666';
        if (season.status === 'presale') return '#0088ff';
        if (season.status === 'active') return '#00ff41';
        return '#fff';
    })();

    // --- INICIALIZAÇÃO ---
    onMount(() => {
        refresh();
        Hooks.on("passSystemUpdate", refresh);
    });

    function refresh() {
        // Pega dados do sistema
        season = PassSystem.getSeasonData();

        const rawUsers = game.users.filter(u => !u.isGM);
        users = rawUsers.map(u => {
            const tierInfo = PassSystem.getPlayerTier(u.id);
            return {
                id: u.id, 
                name: u.name, 
                color: u.color,
                tierInfo: tierInfo,
                // Mapeamos o tier ID para o select funcionar corretamente
                currentTierId: tierInfo.id 
            };
        });
    }

    // --- AÇÕES ---
    async function setStatus(status) {
        let update = { status };
        
        // Se estiver ativando, define as datas automaticamente
        if (status === 'active') {
            const now = Date.now();
            update.startDate = now;
            update.endDate = PassSystem.utils.calculateEndDate(now);
        } 
        // Se estiver fechando, limpa as datas
        else if (status === 'closed') {
            update.startDate = null;
            update.endDate = null;
        }

        await PassSystem.updateSeason(update);
        refresh();
    }

    async function setTier(userId, tierId) {
        await PassSystem.setPlayerTier(userId, tierId);
        refresh();
    }
</script>

<div class="pass-layout">
    
    <div class="season-control">
        <div class="season-info">
            <span class="label">STATUS DO SISTEMA:</span>
            <span class="status-display" style="color: {statusColor}; border-color: {statusColor}">
                {statusLabel}
            </span>
            <small>Data Fim: {season.endDate ? PassSystem.utils.formatDate(season.endDate) : "--"}</small>
        </div>

        <div class="season-actions">
            {#if season.status === 'closed'}
                <button class="mode-btn pre" on:click={() => setStatus('presale')}>ABRIR PRÉ-VENDA</button>
            {/if}
            
            {#if season.status === 'presale' || season.status === 'closed'}
                <button class="mode-btn start" on:click={() => setStatus('active')}>INICIAR TEMPORADA (3 MESES)</button>
            {/if}

            {#if season.status !== 'closed'}
                <button class="mode-btn close" on:click={() => setStatus('closed')}>ENCERRAR TEMPORADA</button>
            {/if}
        </div>
    </div>

    <div class="list-container">
        <div class="grid-header">
            <span>AGENTE</span>
            <span>TIER ATUAL</span>
            <span>STATUS INDIVIDUAL</span>
        </div>

        <div class="scroll-rows">
            {#each users as u}
                <div class="row" style="border-left: 4px solid {u.tierInfo.color}">
                    
                    <div class="col user">
                        <span class="name" style="color:{u.color}">{u.name}</span>
                        <span class="id-tag">ID: {u.id}</span>
                    </div>

                    <div class="col tier">
                        <select value={u.currentTierId} on:change={(e) => setTier(u.id, e.target.value)} 
                                style="color: {u.tierInfo.color}; border-color: {u.tierInfo.color}">
                            {#each TIERS as t}
                                <option value={t.id}>{t.label}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="col status">
                        {#if season.status === 'closed'}
                            <span class="badge closed">AGUARDANDO</span>
                        {:else if u.tierInfo.id === 'cobre'}
                            <span class="badge cobre">PADRÃO</span>
                        {:else}
                            <span class="badge premium">PREMIUM ATIVO</span>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
    
    .pass-layout {
        display: flex; flex-direction: column; height: 100%; width: 100%;
        font-family: 'Share Tech Mono', monospace; color: #ccc; background: rgba(0,0,0,0.2);
    }
    
    /* SEASON CONTROL */
    .season-control {
        padding: 20px; background: rgba(0,0,0,0.8); border-bottom: 2px solid #333;
        display: flex; justify-content: space-between; align-items: center;
    }
    .season-info { display: flex; flex-direction: column; gap: 5px; }
    .label { font-size: 10px; color: #666; letter-spacing: 2px; }
    .status-display { 
        font-size: 18px; font-weight: bold; border: 1px solid; padding: 5px 15px; 
        background: #000; text-shadow: 0 0 10px; display: inline-block;
    }

    .season-actions { display: flex; gap: 10px; }
    .mode-btn {
        padding: 10px 15px; font-weight: bold; cursor: pointer; border: 1px solid transparent;
        background: #111; color: #aaa; font-family: inherit; transition: 0.2s;
    }
    .mode-btn:hover { color: #fff; transform: translateY(-2px); }
    
    .mode-btn.pre { border-color: #0088ff; color: #0088ff; }
    .mode-btn.pre:hover { background: #0088ff; color: #000; }

    .mode-btn.start { border-color: #00ff41; color: #00ff41; }
    .mode-btn.start:hover { background: #00ff41; color: #000; box-shadow: 0 0 15px #00ff41; }

    .mode-btn.close { border-color: #ff3333; color: #ff3333; }
    .mode-btn.close:hover { background: #ff3333; color: #000; }

    /* LISTA */
    .list-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 20px; }
    
    .grid-header {
        display: grid; grid-template-columns: 2fr 2fr 1fr;
        padding: 10px; background: #111; font-weight: bold; color: #00ff41; font-size: 12px;
        border-bottom: 2px solid #00ff41;
    }

    .scroll-rows { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-top: 10px; }

    .row {
        display: grid; grid-template-columns: 2fr 2fr 1fr;
        background: rgba(0,0,0,0.6); align-items: center; padding: 10px;
        border: 1px solid #333; transition: 0.2s;
    }
    .row:hover { background: rgba(255,255,255,0.05); }

    .col { display: flex; align-items: center; padding: 0 10px; }
    
    .user { flex-direction: column; align-items: flex-start; }
    .name { font-weight: bold; font-size: 14px; }
    .id-tag { font-size: 9px; color: #666; }

    select {
        background: #000; padding: 5px; font-family: inherit; font-weight: bold; width: 100%;
        border: 1px solid;
    }
    select option { background: #111; color: #ccc; }

    .badge { padding: 4px 8px; font-size: 10px; border-radius: 4px; font-weight: bold; text-align: center; width: 100%; }
    .closed { background: #333; color: #555; }
    .cobre { background: #5a3a22; color: #cd7f32; border: 1px solid #cd7f32; }
    .premium { background: #003300; color: #00ff41; border: 1px solid #00ff41; box-shadow: 0 0 5px #00ff41; }
</style>