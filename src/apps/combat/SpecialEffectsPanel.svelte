<script>
    import { slide } from 'svelte/transition';
    export let action; 
    export let disabled = false;

    const effectsDatabase = [
        { id: 'cuidadoso', label: 'Cuidadoso', desc: 'Converte Letal em Choque.', type: 'ataque', style: 'ambos' },
        { id: 'cruel', label: 'Cruel', desc: 'Converte Choque em Letal.', type: 'ataque', style: 'ambos' },
        { id: 'poderoso', label: 'Poderoso', desc: '+1 Largura (Apenas Dano).', type: 'ataque', style: 'ambos' },
        { id: 'rapido', label: 'Rápido', desc: '+1 Largura (Apenas Iniciativa).', type: 'ataque', style: 'ambos' },
        { id: 'finta', label: 'Finta', desc: 'Alvo perde 1D de defesa.', type: 'ataque', style: 'ambos' },
        { id: 'knockdown', label: 'Derrubar', desc: '+1 Shock. Alvo cai.', type: 'ataque', style: 'melee' },
        { id: 'atordoar', label: 'Atordoar', desc: 'Alvo perde dados = Largura deste ataque.', type: 'ataque', style: 'ambos' },
        { id: 'empurrar', label: 'Empurrar', desc: 'Afasta alvo e quebra 1D.', type: 'ataque', style: 'melee' },
        { id: 'lutar', label: 'Wrestle', desc: 'Agarrão tático. Ambos caem.', type: 'ataque', style: 'melee' },
        { id: 'estrangulamento', label: 'Estrangular', desc: 'Dá 1 Shock/Turno.', type: 'ataque', style: 'melee' },
        { id: 'estrangulamento_letal', label: 'Sufocar', desc: 'Dá 2 Shock/Turno (Corta sangue).', type: 'ataque', style: 'melee' },
        { id: 'sniping', label: 'Sniping', desc: 'Morte furtiva (Aciona Trauma).', type: 'ataque', style: 'ranged' }
    ];

    $: availableEffects = effectsDatabase.filter(e => 
        e.type === action.type && (e.style === 'ambos' || e.style === action.style)
    );

    function toggleEffect(id) {
        if (disabled) return;
        if (action.maneuvers.includes(id)) {
            action.maneuvers = action.maneuvers.filter(x => x !== id);
        } else {
            action.maneuvers = [...action.maneuvers, id];
        }
    }
</script>

<div class="effects-container" transition:slide>
    <div class="effects-header">
        <i class="fas fa-microscope"></i> MANOBRAS E MUTAÇÕES <span>(-1D Custo Tático por Efeito)</span>
    </div>
    
    <div class="effects-pillbox">
        {#each availableEffects as effect}
            {@const isActive = action.maneuvers.includes(effect.id)}
            
            <div class="effect-pill {isActive ? 'active' : ''}" on:click={() => toggleEffect(effect.id)}>
                <div class="e-check">
                    {#if isActive}<i class="fas fa-check"></i>{/if}
                </div>
                <div class="e-info">
                    <strong>{effect.label}</strong>
                    <span>{effect.desc}</span>
                </div>
            </div>
        {/each}
        
        {#if availableEffects.length === 0}
            <div class="empty-effects">Nenhum efeito tático disponível para este vetor.</div>
        {/if}
    </div>
</div>

<style>
    .effects-container { 
        background: #050508; 
        border: 1px solid #222; 
        border-left: 2px solid var(--c-primary, #00ff41); 
        border-radius: 6px; 
        padding: 10px; 
        margin-top: 5px; 
        box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
    }
    
    .effects-header { font-size: 9px; color: var(--c-primary, #00ff41); font-weight: bold; letter-spacing: 1px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; border-bottom: 1px dashed #333; padding-bottom: 5px; }
    .effects-header span { color: #ffaa00; font-size: 8px; margin-left: auto; }

    .effects-pillbox { display: flex; flex-wrap: wrap; gap: 6px; }
    
    .effect-pill { 
        display: flex; align-items: center; gap: 8px; 
        background: #0a0a0f; border: 1px solid #333; border-radius: 20px; 
        padding: 4px 12px 4px 4px; cursor: pointer; transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); 
        flex-grow: 1; min-width: 160px; max-width: max-content;
    }
    .effect-pill:hover { border-color: #666; background: #111; transform: translateY(-2px); }
    
    .effect-pill.active { 
        background: rgba(0, 255, 65, 0.05); 
        border-color: var(--c-primary, #00ff41); 
        box-shadow: 0 2px 10px rgba(0,255,65,0.2); 
    }
    
    .e-check { 
        width: 18px; height: 18px; border-radius: 50%; 
        background: #000; border: 1px solid #555; 
        display: flex; justify-content: center; align-items: center; 
        font-size: 9px; color: var(--c-primary, #00ff41); flex-shrink: 0;
    }
    .active .e-check { border-color: var(--c-primary, #00ff41); box-shadow: inset 0 0 5px var(--c-primary, #00ff41); }
    
    .e-info { display: flex; flex-direction: column; overflow: hidden; }
    .e-info strong { font-size: 10px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .e-info span { font-size: 8px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .active .e-info span { color: #aaa; }

    .empty-effects { color: #666; font-size: 9px; font-style: italic; width: 100%; text-align: center; padding: 5px; }
</style>