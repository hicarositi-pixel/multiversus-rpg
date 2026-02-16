<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    export let themeColor = "#00ff41";
    
    const dispatch = createEventDispatcher();
    
    let starX = 50; // %
    let starY = 50; // %
    let attempts = 0;
    let isCaught = false;

    // A estrela foge 5 vezes rápido, depois cansa
    function runAway() {
        if (isCaught) return;
        
        attempts++;
        if (attempts > 5) return; // Deixa pegar

        // Move para posição aleatória (entre 10% e 90% da tela)
        starX = Math.random() * 80 + 10;
        starY = Math.random() * 80 + 10;
    }

    function catchStar() {
        isCaught = true;
        // Toca um som de sucesso aqui se quiser
        setTimeout(() => {
            dispatch('win'); // Avisa o componente pai que ganhou
        }, 800);
    }
</script>

<div class="minigame-area" on:mousemove={runAway}>
    
    {#if !isCaught}
        <div class="instructions" in:fade>
            PROTOCOLO: PEGUE A ESTRELA<br>
            <span style="font-size: 0.7em; opacity: 0.7;">INTERCEPTE O SINAL DA LOCALIZAÇÂO DA ESTRELA</span>
        </div>

        <button 
            class="the-star" 
            style="left: {starX}%; top: {starY}%; --theme: {themeColor}; transition: {attempts > 5 ? '0.5s' : '0.1s'}"
            on:mouseenter={runAway} 
            on:click={catchStar}
            transition:scale
        >
            <i class="fas fa-star"></i>
        </button>
    {:else}
        <div class="success-msg" in:scale>
            INFORMAÇÂO FORNECIDA AO SR VOLHEIM
        </div>
    {/if}
</div>

<style>
    .minigame-area {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.9);
        display: flex; align-items: center; justify-content: center;
        overflow: hidden; cursor: crosshair;
    }
    .instructions {
        position: absolute; top: 20%;
        text-align: center; color: #fff; font-size: 1.5rem; letter-spacing: 3px;
        pointer-events: none;
    }
    .the-star {
        position: absolute;
        width: 60px; height: 60px;
        background: var(--theme); color: #000;
        border: none; border-radius: 50%;
        font-size: 2rem; display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        box-shadow: 0 0 30px var(--theme);
        transform: translate(-50%, -50%); /* Centraliza no ponto X/Y */
    }
    .success-msg {
        font-size: 3rem; color: var(--theme); font-weight: bold; letter-spacing: 5px;
        text-shadow: 0 0 20px var(--theme);
    }
</style>