<script>
    import { slide } from 'svelte/transition';
    export let action; // Recebe a ação inteira para modificar
    export let disabled = false;

    // O dicionário oficial de efeitos integrado ao CombatEffect.js
    const effectsDatabase = [
        { id: 'cuidadoso', label: 'Ataque Cuidadoso', desc: 'Converte todo o dano letal (Killing) em dano de choque (Shock).', type: 'ataque', style: 'ambos' },
        { id: 'cruel', label: 'Ataque Cruel', desc: 'Converte todo o dano de choque em letal. Causa ferimentos graves.', type: 'ataque', style: 'ambos' },
        { id: 'poderoso', label: 'Ataque Poderoso', desc: '+1 na Largura da rolagem APENAS para calcular Dano e Recuo.', type: 'ataque', style: 'ambos' },
        { id: 'rapido', label: 'Ataque Rápido', desc: '+1 na Largura da rolagem APENAS para agir primeiro na Iniciativa.', type: 'ataque', style: 'ambos' },
        { id: 'finta', label: 'Finta', desc: 'Faz um ataque falso. O alvo perde 1 dado da melhor rolagem de defesa dele.', type: 'ataque', style: 'ambos' },
        { id: 'knockdown', label: 'Derrubar', desc: 'O alvo sofre 1 Shock extra e cai (condição: Derrubado).', type: 'ataque', style: 'melee' },
        { id: 'atordoar', label: 'Atordoar (Daze)', desc: 'O alvo perde dados igual à largura deste ataque, por [Largura] turnos.', type: 'ataque', style: 'ambos' },
        { id: 'empurrar', label: 'Empurrar (Shove)', desc: 'Empurra o alvo e quebra 1 dado da melhor rolagem dele.', type: 'ataque', style: 'melee' },
        { id: 'lutar', label: 'Imobilizar (Wrestle)', desc: 'Ambos caem. O alvo fica Agarrado e não pode agir contra outros.', type: 'ataque', style: 'melee' },
        { id: 'estrangulamento', label: 'Estrangulamento', desc: 'Requer alvo Imobilizado ou Tiro na Cabeça. Dá 1 Shock por turno.', type: 'ataque', style: 'melee' },
        { id: 'estrangulamento_letal', label: 'Sufocamento', desc: 'Igual estrangulamento, mas dá 2 Shock por turno (corta sangue).', type: 'ataque', style: 'melee' },
        { id: 'sniping', label: 'Tiro de Precisão', desc: 'Se matar furtivamente, aciona Teste de Trauma na mente do atirador.', type: 'ataque', style: 'ranged' }
    ];

    // Filtra o que pode ser exibido com base no que o jogador escolheu (Tiro, Porrada, etc)
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
    <div class="effects-grid">
        {#each availableEffects as effect}
            {@const isActive = action.maneuvers.includes(effect.id)}
            <div class="effect-card {isActive ? 'active' : ''}" on:click={() => toggleEffect(effect.id)}>
                <div class="e-head">
                    <div class="checkbox">
                        {#if isActive}<i class="fas fa-check"></i>{/if}
                    </div>
                    <strong>{effect.label}</strong>
                </div>
                <div class="e-desc">{effect.desc}</div>
                <div class="e-cost">-1 Dado Base</div>
            </div>
        {/each}
        {#if availableEffects.length === 0}
            <div style="color: #666; font-size: 10px; padding: 10px;">Nenhum efeito especial disponível para este tipo de ação.</div>
        {/if}
    </div>
</div>

<style>
    .effects-container { background: #050505; border: 1px dashed var(--c-primary); border-radius: 4px; padding: 10px; margin-top: 10px; }
    .effects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
    
    .effect-card { background: #111; border: 1px solid #333; padding: 8px; border-radius: 4px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; gap: 4px; }
    .effect-card:hover { border-color: #666; }
    .effect-card.active { background: rgba(0, 255, 65, 0.1); border-color: var(--c-primary); }
    
    .e-head { display: flex; gap: 6px; align-items: center; color: #fff; font-size: 11px; }
    .checkbox { width: 14px; height: 14px; border: 1px solid #555; display: flex; justify-content: center; align-items: center; font-size: 9px; color: var(--c-primary); background: #000; }
    .active .checkbox { border-color: var(--c-primary); }
    
    .e-desc { font-size: 9px; color: #888; line-height: 1.2; }
    .active .e-desc { color: #ccc; }
    
    .e-cost { font-size: 8px; color: #ffaa00; font-weight: bold; margin-top: auto; text-align: right; }
</style>