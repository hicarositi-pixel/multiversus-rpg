<script>
    // Recebe a lista do corpo tático do Pai
    export let limbs = [];
</script>

<div class="vitals-container">
    <div class="panel-tag">COMBAT_VITALS</div>
    
    <div class="limbs-list">
        {#each limbs as limb}
            {@const hp = Number(limb.hp) || 1}
            {@const k = Number(limb.killing) || 0}
            {@const s = Number(limb.shock) || 0}
            {@const h = Math.max(0, hp - k - s)}

            <div class="limb-row">
                <div class="l-info">
                    <span class="l-loc">[{limb.loc}]</span>
                    <span class="l-name">{limb.name}</span>
                </div>
                
                <div class="hp-container" title="Saúde: {h} | Choque: {s} | Letal: {k} (Max: {hp})">
                    <div class="hp-bar">
                        {#if k > 0} <div class="chunk k-dmg" style="flex: {k}"></div> {/if}
                        {#if s > 0} <div class="chunk s-dmg" style="flex: {s}"></div> {/if}
                        {#if h > 0} <div class="chunk healthy" style="flex: {h}"></div> {/if}
                    </div>
                    <span class="hp-numbers">{h}/{hp}</span>
                </div>

                <div class="armor-stats">
                    <span class="arm-box har" title="Armadura Pesada (HAR)">
                        <i class="fas fa-shield-alt"></i> {limb.har || 0}
                    </span>
                    <span class="arm-box lar" title="Armadura Leve (LAR)">
                        <i class="fas fa-tshirt"></i> {limb.lar || 0}
                    </span>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .panel-tag { font-size: calc(9px * var(--res)); color: var(--primary); border-bottom: 1px solid #333; margin-bottom: 10px; opacity: 0.8; letter-spacing: 1px; }

    .limbs-list { display: flex; flex-direction: column; gap: 8px; }
    .limb-row { display: flex; align-items: center; gap: 8px; }
    
    .l-info { display: flex; flex-direction: column; width: calc(55px * var(--res)); line-height: 1.1; }
    .l-loc { font-size: calc(8px * var(--res)); color: #666; }
    .l-name { font-size: calc(10px * var(--res)); font-weight: bold; color: #ccc; }

    .hp-container { flex: 1; position: relative; height: calc(14px * var(--res)); background: #111; border: 1px solid #333; border-radius: 4px; display: flex; overflow: hidden; }
    .hp-bar { display: flex; width: 100%; height: 100%; }
    
    .chunk { height: 100%; border-right: 1px solid rgba(0,0,0,0.5); }
    .chunk.healthy { background: #00ff41; opacity: 0.8; }
    .chunk.s-dmg { background: #ffaa00; }
    .chunk.k-dmg { background: #ff3333; }
    
    .hp-numbers { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: calc(9px * var(--res)); font-weight: bold; text-shadow: 1px 1px 0 #000; color: #fff; }

    .armor-stats { display: flex; gap: 4px; width: calc(70px * var(--res)); justify-content: flex-end; }
    .arm-box { font-size: calc(9px * var(--res)); padding: 2px 4px; border-radius: 3px; background: #111; border: 1px solid #333; display: flex; align-items: center; gap: 3px; font-weight: bold; }
    .arm-box.har { color: #a855f7; border-color: #a855f7; }
    .arm-box.lar { color: #00aaff; border-color: #00aaff; }
</style>