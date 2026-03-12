<script>
    import { flip } from 'svelte/animate';
    import { quintOut } from 'svelte/easing';
    export let queue = []; // Lista ordenada pelo CombatEngine
</script>

<div class="carousel-container">
    <div class="track custom-scroll">
        {#each queue as c, i (c.id)}
            <div class="portrait-card {c.ready ? 'ready' : ''}" animate:flip={{duration: 400, easing: quintOut}}>
                <div class="order-badge">{i + 1}</div>
                <img src={c.img} alt="Avatar" />
                <div class="p-name">{c.name}</div>
            </div>
        {/each}
        {#if queue.length === 0}
            <div class="empty-track">Aguardando Vetores...</div>
        {/if}
    </div>
</div>

<style>
    .carousel-container { width: 100%; background: #000; border-bottom: 2px solid #333; padding: 10px 5px; }
    .track { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
    
    .portrait-card {
        position: relative; width: 60px; height: 80px; flex-shrink: 0;
        border: 2px solid #555; border-radius: 4px; overflow: hidden;
        filter: grayscale(0.8) brightness(0.5); transition: 0.3s;
    }
    .portrait-card.ready { filter: grayscale(0) brightness(1); border-color: var(--c-primary, #00ff41); box-shadow: 0 0 10px rgba(0,255,65,0.5); }
    
    .portrait-card img { width: 100%; height: 100%; object-fit: cover; }
    
    .order-badge { position: absolute; top: -2px; left: -2px; background: #000; color: #fff; font-weight: bold; font-size: 10px; padding: 2px 4px; border: 1px solid #555; border-radius: 4px; }
    .ready .order-badge { background: var(--c-primary, #00ff41); color: #000; border-color: var(--c-primary, #00ff41); }
    
    .p-name { position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.8); color: #fff; font-size: 8px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 2px 0; }
    .empty-track { width: 100%; text-align: center; color: #555; font-size: 12px; font-weight: bold; padding: 10px; }
    .custom-scroll::-webkit-scrollbar { height: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
</style>