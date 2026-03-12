<script>
    import { createEventDispatcher } from 'svelte';
    
    // Recebe a lista de stats do Pai
    export let stats = [];
    
    const dispatch = createEventDispatcher();

    // Dispara um evento para o MobileHUD abrir o RollEngine
    function requestRoll(actionName, pool) {
        dispatch('roll', { actionName, pool });
    }
</script>

<div class="status-container">
    <div class="panel-tag">DATABASE_STATS</div>
    
    {#each stats as stat}
        <div class="stat-group">
            <div class="stat-main">
                <span class="s-name">{stat.label}</span>
                <div class="s-controls">
                    <span class="s-dice">{stat.dice.d}d|{stat.dice.hd}h|{stat.dice.wd}w</span>
                    <button class="roll-btn" on:click={() => requestRoll(stat.label, stat.dice)}>
                        <i class="fas fa-dice"></i>
                    </button>
                </div>
            </div>
            
            {#if stat.skills && stat.skills.length > 0}
                <div class="skills-list">
                    {#each stat.skills as sk}
                        <div class="skill-item">
                            <span class="sk-name">{sk.name}</span>
                            <div class="sk-controls">
                                <span class="sk-dice">+{sk.dice.d}d</span>
                                <button class="roll-btn small" on:click={() => requestRoll(`${stat.label} + ${sk.name}`, {
                                    d: stat.dice.d + sk.dice.d, 
                                    hd: stat.dice.hd + sk.dice.hd, 
                                    wd: stat.dice.wd + sk.dice.wd
                                })}>
                                    <i class="fas fa-dice"></i>
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .panel-tag { font-size: calc(9px * var(--res)); color: var(--primary); border-bottom: 1px solid #333; margin-bottom: 10px; opacity: 0.8; letter-spacing: 1px; }

    .stat-group { background: rgba(0,0,0,0.3); border: 1px solid #222; border-radius: 6px; margin-bottom: 8px; overflow: hidden; }
    .stat-main { display: flex; justify-content: space-between; align-items: center; background: #111; padding: 6px 10px; border-left: 3px solid var(--primary); }
    
    .s-name { font-weight: bold; font-size: calc(11px * var(--res)); color: #eee; }
    .s-controls { display: flex; align-items: center; gap: 8px; }
    .s-dice { font-size: calc(10px * var(--res)); color: #888; }
    
    .skills-list { display: flex; flex-direction: column; padding: 4px 10px; gap: 4px; }
    .skill-item { display: flex; justify-content: space-between; align-items: center; font-size: calc(10px * var(--res)); color: #aaa; border-bottom: 1px dashed #222; padding-bottom: 2px; }
    .sk-controls { display: flex; align-items: center; gap: 6px; }
    
    .roll-btn { background: transparent; border: 1px solid var(--primary); color: var(--primary); border-radius: 4px; cursor: pointer; padding: 3px 6px; font-size: calc(10px * var(--res)); transition: 0.2s; }
    .roll-btn:hover { background: var(--primary); color: #000; }
    .roll-btn.small { border-color: #666; color: #aaa; padding: 1px 4px; font-size: calc(9px * var(--res)); } 
    .roll-btn.small:hover { border-color: var(--primary); color: var(--primary); background: transparent; }
</style>