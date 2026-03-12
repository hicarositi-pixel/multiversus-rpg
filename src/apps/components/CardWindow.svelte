<script>
    import { onMount, onDestroy } from 'svelte';

    export let cardData = {
        name: "Protocolo Desconhecido",
        img: "icons/svg/hazard.svg",
        desc: "Código fonte corrompido.",
        tags: [{label: "Custo", val: "1 WP", color: "#00ff41"}],
        html: "", 
        css: "",
        js: ""
    };
    export let actor = null;
    export let onAction = () => {}; // Opcional, caso a carta queira mandar um comando pro Pai

    let customStyleElement = null;

    // INJEÇÃO SEGURA DE CSS E JS
    onMount(() => {
        // 1. Injeta o CSS Customizado da Carta diretamente no HEAD para não sofrer Scope lock do Svelte
        if (cardData.css) {
            customStyleElement = document.createElement('style');
            customStyleElement.innerHTML = cardData.css;
            document.head.appendChild(customStyleElement);
        }

        // 2. Se a carta tiver JS, nós criamos a função global e a executamos
        // Nós amarramos o 'actor' no escopo global temporário para o botão HTML conseguir enxergar
        if (cardData.js) {
            window.cardActor = actor; // Expõe temporariamente
            try {
                // A carta pode definir funções como window.applyRest = function() {...}
                const execute = new Function('actor', cardData.js);
                execute(actor);
            } catch (e) {
                console.error("Nexus HUD | Erro no Script da Carta:", e);
            }
        }
    });

    onDestroy(() => {
        // Limpa o CSS da carta ao fechá-la para não vazar pro resto do Foundry
        if (customStyleElement) {
            document.head.removeChild(customStyleElement);
        }
        window.cardActor = null; // Limpa a referência
    });
</script>

<div class="rpg-card">
    <div class="card-border"></div>

    <div class="card-inner">
        <header class="card-header">
            <span class="card-name">{cardData.name}</span>
            <div class="card-tags">
                {#if cardData.tags}
                    {#each cardData.tags as tag}
                        <span class="tag-pill" style="border-color: {tag.color}; color: {tag.color}">
                            {tag.val}
                        </span>
                    {/each}
                {/if}
            </div>
        </header>

        <div class="card-art">
            <img src={cardData.img || "icons/svg/mystery-man.svg"} alt="Art" />
        </div>

        <div class="card-body custom-scroll">
            <p class="description">{cardData.desc}</p>
            
            {#if cardData.type === 'power' && cardData.raw?.qualitiesData}
                <div class="power-qualities">
                    {#each cardData.raw.qualitiesData as q}
                        <div class="q-line">
                            <strong>{q.name}</strong> (Lvl {q.level})
                            <span class="q-type">{q.type.toUpperCase()}</span>
                        </div>
                    {/each}
                </div>
            {/if}

            {#if cardData.html}
                <div class="custom-inject-area">
                    {@html cardData.html}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .rpg-card {
        width: 320px;
        height: 480px;
        position: relative;
        background: #0a0a0f;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8), inset 0 0 10px rgba(0, 255, 65, 0.2);
        overflow: hidden;
    }

    .card-border {
        position: absolute;
        inset: 0;
        border: 2px solid var(--primary, #00ff41);
        border-radius: 12px;
        pointer-events: none;
        z-index: 10;
        opacity: 0.8;
    }

    .card-inner {
        position: absolute;
        inset: 2px;
        background: #111118;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        z-index: 5;
    }

    .card-header {
        padding: 10px;
        background: rgba(0,0,0,0.8);
        border-bottom: 1px solid #333;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .card-name {
        font-weight: bold;
        font-size: 16px;
        color: #fff;
        text-shadow: 0 0 5px var(--primary, #00ff41);
        letter-spacing: 1px;
    }

    .card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }

    .tag-pill {
        font-size: 9px;
        padding: 2px 6px;
        background: rgba(0,0,0,0.5);
        border: 1px solid;
        border-radius: 4px;
        font-weight: bold;
    }

    .card-art {
        width: 100%;
        height: 200px;
        background: #000;
        border-bottom: 2px solid #333;
    }
    .card-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .card-body {
        flex: 1;
        padding: 12px;
        font-size: 12px;
        line-height: 1.4;
        color: #ccc;
        overflow-y: auto;
    }

    .description {
        margin: 0 0 10px 0;
        font-style: italic;
        color: #888;
        border-bottom: 1px dashed #333;
        padding-bottom: 10px;
    }

    .power-qualities {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .q-line {
        background: #000;
        padding: 5px;
        border-left: 2px solid var(--primary, #00ff41);
        display: flex;
        justify-content: space-between;
    }
    .q-type { font-size: 9px; color: #666; }

    .custom-inject-area {
        margin-top: 10px;
    }

    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
</style>