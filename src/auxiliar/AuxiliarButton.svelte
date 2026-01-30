<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { AuxiliarSystem } from './AuxiliarSystem.js';
    import AuxiliarHud from './AuxiliarHud.svelte';

    // --- ESTADO ---
    let canAccess = false;
    let windowInstance = null;

    // --- ESTADO DE MOVIMENTO ---
    // Posição inicial: Esquerda Inferior
    let pos = { x: 120, y: window.innerHeight - 200 };
    let isDragging = false;
    let startDragPos = { x: 0, y: 0 };

    onMount(() => {
        checkAccess();
        Hooks.on("auxiliarUpdate", checkAccess);

        const savedPos = localStorage.getItem("multiversus-aux-pos");
        if (savedPos) {
            try { pos = JSON.parse(savedPos); } catch(e) {}
        }
    });

    function checkAccess() {
        canAccess = AuxiliarSystem.isAuxiliar(game.user);
    }

    // --- DRAG & DROP ---
    function onMouseDown(e) {
        if (e.button !== 0) return;
        isDragging = true;
        startDragPos = { x: e.clientX, y: e.clientY };
    }

    function onWindowMove(e) {
        if (!isDragging) return;
        pos = {
            x: pos.x + e.movementX,
            y: pos.y + e.movementY
        };
    }

    function onWindowUp(e) {
        if (!isDragging) return;
        isDragging = false;

        const dist = Math.hypot(e.clientX - startDragPos.x, e.clientY - startDragPos.y);
        
        if (dist < 5) {
            openHud();
        } else {
            localStorage.setItem("multiversus-aux-pos", JSON.stringify(pos));
        }
    }

    // --- ABRIR HUD ---
    function openHud() {
        if (windowInstance) {
            windowInstance.close();
            windowInstance = null;
            return;
        }

        class AuxWindow extends Application {
            static get defaultOptions() {
                return foundry.utils.mergeObject(super.defaultOptions, {
                    id: "auxiliar-hud-window",
                    title: "AUXILIAR_OS // SYSTEM",
                    // CORREÇÃO: Apontando para um arquivo que EXISTE (sheet.html)
                    template: `modules/multiversus-rpg/templates/sheet.html`,
                    width: 500,
                    height: 600,
                    resizable: true,
                    classes: ["aux-window-shell"]
                });
            }

            activateListeners(html) {
                super.activateListeners(html);
                // LIMPEZA OBRIGATÓRIA: Apaga o conteúdo do sheet.html
                html.empty(); 
                new AuxiliarHud({ target: html[0] });
            }

            close(options) {
                windowInstance = null;
                return super.close(options);
            }
        }

        windowInstance = new AuxWindow();
        windowInstance.render(true);
    }
</script>

<svelte:window on:mousemove={onWindowMove} on:mouseup={onWindowUp} />

{#if canAccess}
    <button class="pc-trigger" 
            style="top: {pos.y}px; left: {pos.x}px;"
            on:mousedown={onMouseDown} 
            transition:fade 
            title="Painel Auxiliar (Arraste para mover)">
        
        <div class="screen">
            <span class="text">MV</span>
            <div class="scan"></div>
        </div>
        <div class="stand"></div>
        <div class="base"></div>
    </button>
{/if}

<style>
    .pc-trigger {
        position: fixed; 
        background: transparent; 
        border: none; 
        cursor: grab;
        display: flex; 
        flex-direction: column; 
        align-items: center;
        z-index: 50000; 
        filter: drop-shadow(0 0 5px #000);
        transition: transform 0.1s, filter 0.2s;
        padding: 0; margin: 0;
        pointer-events: auto;
    }
    
    .pc-trigger:active { cursor: grabbing; transform: scale(0.95); }
    .pc-trigger:hover { transform: scale(1.1); filter: drop-shadow(0 0 8px #00ff41); }

    /* MONITOR */
    .screen {
        width: 44px; height: 34px; 
        background: #050505;
        border: 2px solid #00ff41; 
        border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        position: relative; overflow: hidden;
        box-shadow: inset 0 0 10px rgba(0, 255, 65, 0.2);
    }

    .text { 
        color: #00ff41; 
        font-family: monospace; 
        font-weight: bold; 
        font-size: 14px; 
        z-index: 2; 
        text-shadow: 0 0 5px #00ff41;
    }
    
    .scan {
        position: absolute; width: 100%; height: 30%; 
        background: linear-gradient(to bottom, transparent, rgba(0, 255, 65, 0.4), transparent);
        top: 0; animation: scan 3s linear infinite; pointer-events: none;
    }

    .stand {
        width: 12px; height: 6px; 
        background: #111; 
        border-left: 2px solid #00ff41;
        border-right: 2px solid #00ff41;
    }

    .base {
        width: 30px; height: 4px;
        background: #00ff41;
        border-radius: 2px;
        box-shadow: 0 0 5px #00ff41;
    }

    @keyframes scan { 0% { top: -30%; } 100% { top: 130%; } }
</style>