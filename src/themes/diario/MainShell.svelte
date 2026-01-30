<script>
    import { fade, fly, scale } from 'svelte/transition';
    import { elasticOut } from 'svelte/easing';
    import ProfileApp from '../../apps/ProfileApp.svelte';
    import CombatApp from '../../apps/CombatApp.svelte';
    // Importe os outros componentes do Wild Talents conforme sua estrutura

    export let actor;
    export let system;

    let isOpened = false;
    let isLocked = true;
    let activeApp = 'stats';
    let shake = false;

    // Ícones padrão da ficha Wild Talents
    const menuItems = [
        { id: 'stats', label: 'Atributos', icon: 'fa-user-bolt' },
        { id: 'skills', label: 'Perícias', icon: 'fa-list-check' },
        { id: 'powers', label: 'Milagres', icon: 'fa-hand-sparkles' },
        { id: 'combat', label: 'Combate/Dano', icon: 'fa-shield-heart' },
        { id: 'inv', label: 'Equipamento', icon: 'fa-briefcase' },
        { id: 'bio', label: 'Dossiê', icon: 'fa-address-card' }
    ];

    function attemptUnlock() {
        if (isLocked) {
            // Pequena animação de "negativa" se tentar abrir sem destravar
            // Mas aqui vamos direto para a animação de sucesso
            isLocked = false;
        }
    }

    function toggleBook() {
        if (isLocked) {
            shake = true;
            setTimeout(() => shake = false, 500);
            return;
        }
        isOpened = !isOpened;
    }
</script>

<div class="diary-wrapper" style="--theme: {system.themeColor || '#d4af37'}">
    
    {#if !isOpened}
        <div class="book-cover" 
             out:fly={{ x: -800, duration: 1000, easing: elasticOut }}
             in:scale={{ duration: 400 }}>
            
            <div class="leather-texture"></div>
            
            <div class="cover-content">
                <div class="emblem">
                    <i class="fas fa-journal-whills"></i>
                </div>
                
                <h1 class="actor-name">{actor.name}</h1>
                
                <div class="lock-mechanism" class:shaking={shake}>
                    <button class="lock-btn" 
                            class:unlocked={!isLocked} 
                            on:click={attemptUnlock}>
                        <i class="fas {isLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
                    </button>
                    <p class="lock-hint">{isLocked ? 'Documento Sigiloso' : 'Acesso Liberado'}</p>
                </div>

                <button class="open-diary-btn" 
                        disabled={isLocked}
                        on:click={() => isOpened = true}>
                    ABRIR REGISTROS
                </button>
            </div>
        </div>

    {:else}
        <div class="book-interior" in:fade={{ delay: 400 }}>
            
            <aside class="sidebar">
                {#each menuItems as item}
                    <button 
                        class="nav-tab" 
                        class:active={activeApp === item.id}
                        on:click={() => activeApp = item.id}
                        title={item.label}
                    >
                        <i class="fas {item.icon}"></i>
                        <span class="tab-label">{item.label}</span>
                    </button>
                {/each}

                <div class="spacer"></div>

                <button class="nav-tab close-tab" on:click={() => isOpened = false}>
                    <i class="fas fa-door-open"></i>
                    <span class="tab-label">Fechar</span>
                </button>
            </aside>

            <main class="parchment-page">
                <div class="page-header">
                    <h2>{menuItems.find(m => m.id === activeApp)?.label}</h2>
                    <hr class="gold-line" />
                </div>

                <div class="scrollable-content">
                    {#if activeApp === 'stats'}
                        <div class="placeholder-grid">
                            <p>Aqui entram os Atributos de Wild Talents (Body, Mind, etc)</p>
                        </div>
                    {:else if activeApp === 'combat'}
                        <CombatApp {actor} {system} />
                    {:else if activeApp === 'bio'}
                        <ProfileApp {actor} {system} />
                    {/if}
                </div>
            </main>
        </div>
    {/if}
</div>

<style>
    /* Variáveis e Reset */
    .diary-wrapper {
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        background: radial-gradient(circle, #2c1e14 0%, #1a0f0a 100%);
        --c-primary: var(--theme);
        color: #f0e6d2;
    }

    /* CAPA */
    .book-cover {
        position: relative;
        width: 450px; height: 600px;
        background: #4a2d1f;
        border-radius: 10px 40px 40px 10px;
        border: 4px solid #362016;
        box-shadow: 25px 25px 50px rgba(0,0,0,0.8), inset -5px 0 15px rgba(0,0,0,0.5);
        display: flex; flex-direction: column; align-items: center;
        overflow: hidden;
    }

    .leather-texture {
        position: absolute; width: 100%; height: 100%;
        opacity: 0.3;
        background-image: url('https://www.transparenttextures.com/patterns/dark-leather.png');
        pointer-events: none;
    }

    .cover-content {
        z-index: 2; padding: 40px; text-align: center;
        height: 100%; display: flex; flex-direction: column;
    }

    .emblem {
        font-size: 5rem; color: var(--c-primary);
        filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
        margin-bottom: 20px;
    }

    .actor-name {
        font-family: var(--font-head, 'Modesto Condensed', serif);
        font-size: 2.5rem; text-transform: uppercase;
        border-bottom: 2px solid var(--c-primary);
        margin-bottom: 50px;
    }

    /* MECANISMO DE CADEADO */
    .lock-mechanism { margin-bottom: 40px; }
    
    .lock-btn {
        background: #222; border: 3px solid #d4af37;
        width: 80px; height: 80px; border-radius: 50%;
        font-size: 2rem; color: #d4af37; cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .lock-btn.unlocked {
        background: var(--c-primary); color: #fff;
        border-color: #fff; transform: scale(1.1);
        box-shadow: 0 0 20px var(--c-primary);
    }

    .shaking { animation: shake 0.4s ease-in-out; }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }

    .open-diary-btn {
        background: var(--c-primary); color: white;
        padding: 15px 30px; border: none; font-weight: bold;
        border-radius: 5px; cursor: pointer; margin-top: auto;
        opacity: 0.5; transition: 0.3s;
    }

    .open-diary-btn:not(:disabled) { opacity: 1; cursor: pointer; }

    /* INTERIOR */
    .book-interior {
        width: 98%; height: 98%;
        display: flex; background: #e8dcc4;
        border-radius: 5px; box-shadow: 0 0 40px rgba(0,0,0,0.6);
    }

    .sidebar {
        width: 80px; background: #2d1e14;
        display: flex; flex-direction: column; gap: 10px; padding: 20px 0;
        border-right: 4px solid #1a0f0a;
    }

    .nav-tab {
        background: none; border: none; color: #8a7060;
        font-size: 1.5rem; padding: 15px 0; cursor: pointer;
        position: relative; transition: 0.2s;
    }

    .nav-tab.active, .nav-tab:hover { color: var(--c-primary); }
    
    .nav-tab.active::after {
        content: ''; position: absolute; right: 0; top: 20%; height: 60%;
        width: 4px; background: var(--c-primary);
    }

    .tab-label { font-size: 0.7rem; display: block; text-transform: uppercase; margin-top: 5px; }

    .parchment-page {
        flex: 1; padding: 40px; color: #2d1e14;
        background-image: radial-gradient(transparent, rgba(0,0,0,0.05)), 
                          url('https://www.transparenttextures.com/patterns/old-map.png');
    }

    .gold-line { border: none; height: 2px; background: linear-gradient(90deg, transparent, #d4af37, transparent); }

    .scrollable-content { height: calc(100% - 60px); overflow-y: auto; }
</style>