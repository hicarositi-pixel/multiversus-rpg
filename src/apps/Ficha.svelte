<script>
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { cubicIn, cubicOut } from 'svelte/easing';
    
    // --- IMPORTAÇÃO DOS APPS ---
    import ProfileApp from './ProfileApp.svelte'; 
    import SettingsApp from './SettingsApp.svelte';
    import CombatApp from './CombatApp.svelte';
    import SurvivalApp from './SurvivalApp.svelte'; 
    import BaseApp from './BaseApp.svelte';
    import PoderesApp from './PoderesApp.svelte'; 
    import InventoryApp from './InventoryApp.svelte';
    import StatsSkillsApp from './StatsSkillsApp.svelte'; 
    import OraclePlayerApp from './OraclePlayerApp.svelte';
    import PlayerNexus from '../database/PlayerNexus.svelte';
    import CommsApp from './CommsApp.svelte';
    import TestamentoApp from './TestamentoApp.svelte';
    import BattlePassApp from './BattlePassApp.svelte';

    // --- IMPORTAÇÃO DO BANCO DE TEMAS ---
    import { SHEET_THEMES } from '../data/SheetThemeDB.js';
    import { ThemeEngine } from '../database/ThemeEngine.js';

    export let actor;
    
    const MODULE_ID = "multiversus-rpg";
    const isGM = game.user.isGM; // Variável global de GM

    // --- 1. DADOS REATIVOS (FLAGS) ---
    $: flags = actor?.flags?.[MODULE_ID] || {};
    $: system = actor?.system || {}; 
    
    // Configurações de Boot
    // Se for GM, forçamos true. Se não, lê a flag.
    $: fastBootEnabled = isGM ? true : (flags.sheetConfig?.fastBoot || false);
    $: savedPassword = flags.sheetConfig?.password || "";

    // --- 2. SISTEMA DE TEMAS ---
    $: activeThemeKey = flags.sheetConfig?.theme || 'terminal';
    $: currentThemeData = SHEET_THEMES[activeThemeKey] || SHEET_THEMES['terminal'];
    
    $: cssString = Object.entries(currentThemeData.vars)
        .map(([key, value]) => `${key}: ${value};`)
        .join(' ');

    $: themeColor = currentThemeData.vars['--c-primary'];
    $: wallpaperURL = flags.sheetConfig?.wallpaper || "https://mir-s3-cdn-cf.behance.net/project_modules/hd/e4316a93890387.5e70ade47b737.gif";

    $: {
        if (typeof ThemeEngine !== 'undefined' && SHEET_THEMES[activeThemeKey]) {
            setTimeout(() => ThemeEngine.apply(activeThemeKey, SHEET_THEMES[activeThemeKey]), 10);
        }
    }

    // --- 3. REATIVIDADE MANUAL DO FOUNDRY ---
    onMount(() => {
        const hookId = Hooks.on("updateActor", (doc, changes) => {
            if (doc.id === actor.id) {
                if (doc.flags[MODULE_ID]) {
                    flags = { ...doc.flags[MODULE_ID] };
                }
            }
        });
        return () => Hooks.off("updateActor", hookId);
    });

    // --- 4. LÓGICA DE LOGIN / BOOT (CORRIGIDA) ---
    
    // Inicializa o estado baseado no FastBoot IMEDIATAMENTE
    // Se fastBoot for true (ou GM), começa como 'logged_in', senão 'idle'
    let loginState = (isGM || (actor.getFlag(MODULE_ID, "sheetConfig.fastBoot") === true)) ? 'logged_in' : 'idle';
    
    let bootText = "";
    let activeApp = null; 
    let inputBuffer = ""; 

    function closeSystem() { actor.sheet.close(); }

    function startLoginSequence() {
        loginState = 'verifying';
        bootText = "VERIFICANDO CREDENCIAIS...";
        setTimeout(() => {
            loginState = 'welcome';
            bootText = `BEM-VINDO, ${actor.name.toUpperCase()}.`;
            setTimeout(() => { loginState = 'logged_in'; }, 1500);
        }, 2000);
    }

    function handleKeydown(e) {
        if (loginState !== 'idle') return;

        if (e.key === 'Enter') {
            // Se tiver senha salva, verifica. Se não tiver, qualquer Enter passa (ou exija tamanho mínimo)
            if (savedPassword) {
                 if (inputBuffer === savedPassword) {
                     startLoginSequence();
                 } else {
                     inputBuffer = ""; 
                     ui.notifications.warn(">> ACESSO NEGADO: CÓDIGO INVÁLIDO");
                 }
            } else {
                // Sem senha configurada: exige apenas 6 digitos quaisquer ou libera direto?
                // Vamos liberar se tiver digitado algo, ou direto.
                if (inputBuffer.length >= 4) startLoginSequence(); // Mínimo 4 dígitos pra 'fingir'
                else ui.notifications.warn("DIGITE UM CÓDIGO DE ACESSO INICIAL (MÍN 4)");
            }
        } 
        else if (e.key === 'Backspace') {
            inputBuffer = inputBuffer.slice(0, -1);
        } 
        else if (e.key.length === 1 && inputBuffer.length < 6) {
            // Aceita letras e números para senha, ou só números? Vou deixar geral.
            inputBuffer += e.key;
        }
    }

    const desktopIcons = [
        { id: 'combat', icon: 'fa-crosshairs', label: 'COMBATE' },
        { id: 'profile', icon: 'fa-id-card', label: 'PERFIL' },
        { id: 'stats', icon: 'fa-dna', label: 'ATRIBUTOS' },
        { id: 'inv', icon: 'fa-box-open', label: 'INVENTÁRIO' },
        { id: 'powers', icon: 'fa-bolt', label: 'PODERES' },
        { id: 'survival', icon: 'fa-heartbeat', label: 'SOBREVIVENTE' },
        { id: 'oracle', icon: 'fa-terminal', label: 'ORACLE LINK' },
        { id: 'archives', icon: 'fa-book-dead', label: 'THE ARCHIVES' },
        { id: 'testamento', icon: 'fa-file-signature', label: 'MEMORIAL' },
        { id: 'comms', icon: 'fa-comments', label: 'ZAP_NET' },
        { id: 'base', icon: 'fa-warehouse', label: 'BASE / GRUPO' },
        { id: 'battlepass', icon: 'fa-trophy', label: 'BATTLE PASS' },
        { id: 'settings', icon: 'fa-cogs', label: 'SISTEMA' },
        { id: 'shutdown', icon: 'fa-power-off', label: 'DESLIGAR', action: closeSystem } 
    ];
</script>

<svelte:window on:keydown={handleKeydown}/>

<div class="cyber-frame root-terminal {currentThemeData.class}" style="{cssString}">
    
    <div class="code-border code-top"></div>
    <div class="code-border code-bottom"></div>
    <div class="code-border code-left"></div>
    <div class="code-border code-right"></div>
    <div class="corner-decor top-left"></div>
    <div class="corner-decor top-right"></div>
    <div class="corner-decor bottom-left"></div>
    <div class="corner-decor bottom-right"></div>
    
    <div class="inner-terminal-screen">
        
        <div class="wallpaper-layer" style="background-image: url('{wallpaperURL}')"></div>
        <div class="grid-layer"></div>
        <div class="scanlines"></div>
        <div class="vignette"></div>

        {#if loginState !== 'logged_in'}
            <div class="login-layer" out:fly={{y: -100, duration: 800, easing: cubicIn}}>
                <div class="login-container">
                    <div class="bio-scanner" class:scanning={loginState === 'verifying'}>
                        <img src={actor.img} class="bio-img" alt="Avatar"/>
                        <div class="scanner-beam"></div>
                        {#if loginState === 'verifying'} <div class="processing-ring"></div> {/if}
                    </div>
                    
                    <div class="login-info">
                        <h1>{actor.name.toUpperCase()}</h1>
                        <small>>> {loginState === 'idle' ? 'SISTEMA BLOQUEADO' : 'PROCESSANDO LOGIN...'}</small>
                    </div>

                    {#if loginState === 'idle'}
                        <div class="pass-input-box" in:fade>
                            {#each Array(6) as _, i}
                                <div class="digit-box" class:filled={i < inputBuffer.length}>
                                    {i < inputBuffer.length ? '●' : ''}
                                </div>
                            {/each}
                        </div>
                        <div class="login-msg blink">
                            {inputBuffer.length < 6 ? (savedPassword ? "INSIRA SENHA" : "DEFINA ACESSO TEMPORÁRIO") : "[ PRESSIONE ENTER ]"}
                        </div>
                    {:else}
                        <div class="boot-sequence" in:fade>
                            {#if loginState === 'verifying'} <div class="spinner"></div> {/if}
                            <span class="boot-text" class:success={loginState === 'welcome'}>{bootText}</span>
                        </div>
                    {/if}
                </div>
            </div>

        {:else}
            <div class="os-container" in:fade={{duration: 1000, delay: 200, easing: cubicOut}}>
                
                <header class="status-bar">
                    <div class="bar-left"><span class="led"></span> ONLINE</div>
                    <div class="bar-center">MULTIVERSUS OS // {currentThemeData.label}</div>
                    <div class="bar-right">{actor.name}</div>
                </header>

                <main class="viewport">
                    {#if activeApp === null}
                        <div class="desktop-grid" in:fade={{duration: 300}}>
                            {#each desktopIcons as icon}
                                <button class="icon-btn" class:danger={icon.id === 'shutdown'}
                                    on:click={() => icon.action ? icon.action() : activeApp = icon.id}>
                                    <div class="icon-frame">
                                        <i class="fas {icon.icon}"></i>
                                        <div class="glitch-effect"></div>
                                    </div>
                                    <div class="label-box"><span class="icon-label">{icon.label}</span></div>
                                </button>
                            {/each}
                        </div>

                    {:else}
                        <div class="window-frame" in:fly={{ y: 20, duration: 300 }}>
                            <div class="window-header">
                                <div class="header-left">
                                    <i class="fas fa-terminal"></i>
                                    <span class="win-title">run/{activeApp}.exe</span>
                                </div>
                                <button class="win-close" on:click={() => activeApp = null}>
                                    [ VOLTAR ] <i class="fas fa-undo"></i>
                                </button>
                            </div>
                            
                            <div class="window-content-area">
                                {#if activeApp === 'combat'} 
                                    <CombatApp {actor} {system} {flags} themeColor={themeColor} />
                                {:else if activeApp === 'profile'} 
                                    <ProfileApp {actor} {system} {flags} themeColor={themeColor} />
                                {:else if activeApp === 'settings'} 
                                    <SettingsApp {actor} {flags} on:close={() => activeApp = null} />
                                {:else if activeApp === 'survival'} 
                                    <SurvivalApp {actor} {flags} themeColor={themeColor} />
                                {:else if activeApp === 'comms'} 
                                    <CommsApp {actor} {flags} themeStyle={cssString} />
                                {:else if activeApp === 'testamento'}
                                    <TestamentoApp {actor} {flags} themeStyle={cssString} />
                                {:else if activeApp === 'oracle'} 
                                    <OraclePlayerApp {actor} {flags} themeStyle={cssString} />
                                {:else if activeApp === 'archives'} 
                                    <PlayerNexus themeStyle={cssString} />
                                {:else if activeApp === 'base'} 
                                    <BaseApp {actor} {flags} />
                                {:else if activeApp === 'powers'} 
                                    <PoderesApp {actor} {flags} themeColor={themeColor} />
                                {:else if activeApp === 'inv'} 
                                    <InventoryApp {actor} {flags} themeColor={themeColor} />
                                {:else if activeApp === 'stats'} 
                                    <StatsSkillsApp {actor} {system} {flags} themeColor={themeColor} />
                                {:else if activeApp === 'battlepass'} 
                                    <BattlePassApp {actor} {flags} />
                                {:else}
                                    <div class="wip-msg">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <span>MÓDULO OFF-LINE</span>
                                    </div>
                                {/if}
                            </div>
                        </div> 
                    {/if}
                </main>
            </div>
        {/if}
    </div>
</div>

<style>

    /* =========================================================================

       CSS CORRIGIDO E BLINDADO (CLIQUE GARANTIDO)

       ========================================================================= */



    /* A Classe ROOT recebe as variáveis injetadas */

    .root-terminal {

        position: absolute; inset: 0;

        

        /* Variáveis do Tema */

        background: var(--c-bg);

        color: var(--c-text); 

        font-family: var(--font-body);

        border: var(--border-style);

        border-radius: var(--border-radius);

        box-shadow: var(--box-shadow);

        backdrop-filter: var(--backdrop);



        overflow: hidden; display: flex; flex-direction: column;

        padding: 5px;

    }



    /* Elementos Internos */

    .inner-terminal-screen {

        flex: 1; position: relative; overflow: hidden;

        border: 1px solid rgba(var(--c-primary), 0.2);

        border-color: var(--c-primary);

        background: rgba(0,0,0,0.2);

        /* IMPORTANTE: Deixa o mouse passar pelo container base */

        pointer-events: none; 

    }



    /* --- DECORAÇÃO (CLIQUE TRANSPARENTE) --- */

    /* Adicionado pointer-events: none em TUDO que é decoração */

    

    .code-border {

        position: absolute; z-index: 90; pointer-events: none; opacity: 0.4;

        filter: drop-shadow(0 0 2px var(--c-primary)); 

        background-color: var(--c-primary);

    }

    .code-top { top: 0; left: 0; right: 0; height: 2px; }

    .code-bottom { bottom: 0; left: 0; right: 0; height: 2px; }

    .corner-decor { 

        position: absolute; width: 15px; height: 15px; 

        border: 2px solid var(--c-primary); z-index: 95; 

        opacity: 0.7; pointer-events: none; /* CORREÇÃO AQUI */

    }

    .top-left { top: 0; left: 0; border-right: none; border-bottom: none; }

    .top-right { top: 0; right: 0; border-left: none; border-bottom: none; }

    .bottom-left { bottom: 0; left: 0; border-right: none; border-top: none; }

    .bottom-right { bottom: 0; right: 0; border-left: none; border-top: none; }



    /* --- LAYERS DE FUNDO (CLIQUE TRANSPARENTE) --- */

    .wallpaper-layer { 

        position: absolute; inset: 0; background-size: cover; background-position: center; 

        opacity: 0.4; z-index: 0; filter: contrast(1.1) brightness(0.8);

        pointer-events: none; /* CORREÇÃO */

    }

    .grid-layer { 

        position: absolute; inset: 0; 

        background-image: radial-gradient(var(--c-primary) 1px, transparent 1px); 

        background-size: 40px 40px; opacity: 0.1; z-index: 1;

        pointer-events: none; /* CORREÇÃO */

    }

    .scanlines { 

        position: absolute; inset: 0; 

        background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 50%); 

        background-size: 100% 4px; z-index: 5; opacity: 0.5;

        pointer-events: none; /* CORREÇÃO */

    }

    .vignette {

        position: absolute; inset: 0; 

        background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.8) 100%);

        z-index: 6; pointer-events: none;

    }



    /* --- ÁREAS INTERATIVAS (CLIQUE ATIVADO) --- */

    

    /* Login */

    .login-layer { 

        position: absolute; inset: 0; z-index: 100; 

        background: var(--c-bg); 

        display: flex; align-items: center; justify-content: center; 

        pointer-events: auto; /* O mouse volta a funcionar aqui */

    }

    .login-container { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 350px; }

    

    .bio-scanner { 

        width: 140px; height: 140px; position: relative; border-radius: 50%; overflow: hidden; 

        border: 3px solid var(--c-primary); box-shadow: 0 0 30px var(--c-primary); 

    }

    .bio-img { width: 100%; height: 100%; object-fit: cover; }

    .login-info h1 { 

        font-family: var(--font-head); font-size: 32px; margin: 0; 

        text-shadow: 0 0 15px var(--c-primary); color: var(--c-primary); text-align: center;

    }

    .pass-input-box { display: flex; gap: 10px; }

    .digit-box { 

        width: 40px; height: 50px; border: 2px solid var(--c-text); 

        display: flex; align-items: center; justify-content: center; 

        font-size: 20px; color: var(--c-primary); background: rgba(0,0,0,0.5); 

    }

    .digit-box.filled { border-color: var(--c-primary); box-shadow: 0 0 10px var(--c-primary); }

    .login-msg { color: var(--c-text); font-size: 12px; opacity: 0.7; letter-spacing: 1px; }



    /* OS & Desktop */

    .os-container {

        display: flex; flex-direction: column; width: 100%; height: 100%; 

        position: relative; z-index: 10; /* Acima das scanlines */

        pointer-events: auto; /* IMPORTANTE: Garante o clique no OS */

    }



    .status-bar { 

        height: 32px; background: rgba(0,0,0,0.8); border-bottom: 1px solid var(--c-primary); 

        display: flex; justify-content: space-between; align-items: center; padding: 0 15px; 

        font-size: 11px; font-weight: bold; font-family: var(--font-head); color: var(--c-primary); 

    }

    .led { display: inline-block; width: 6px; height: 6px; background: var(--c-primary); border-radius: 50%; margin-right: 6px; box-shadow: 0 0 5px var(--c-primary); }

    

    .viewport { flex: 1; position: relative; overflow: hidden; padding: 15px; }

    

    .desktop-grid { 

        height: 100%; overflow-y: auto; 

        display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); 

        grid-auto-rows: 120px; gap: 15px; 

        align-content: start; justify-items: center; 

        position: relative; z-index: 20; /* Garante que os ícones fiquem bem no topo */

    }

    

    .icon-btn { 

        background: transparent; border: none; cursor: pointer; 

        display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; 

        transition: 0.2s; pointer-events: auto; 

    }

    .icon-btn:hover { transform: scale(1.05); }

    

    .icon-frame { 

        width: 64px; height: 64px; border: 2px solid var(--c-primary); 

        display: flex; align-items: center; justify-content: center; 

        font-size: 28px; background: rgba(0,0,0,0.4); color: var(--c-primary); 

        clip-path: polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%); 

        transition: 0.2s; 

    }

    .icon-btn:hover .icon-frame { background: var(--c-primary); color: #000; box-shadow: 0 0 20px var(--c-primary); }

    

    .icon-label { 

        font-size: 10px; font-weight: bold; font-family: var(--font-head);

        background: rgba(0,0,0,0.8); border: 1px solid var(--c-primary); 

        padding: 3px 8px; border-radius: 2px; color: var(--c-primary); 

    }



    /* Janela de App Aberto */

    .window-frame { 

        position: absolute; inset: 0; display: flex; flex-direction: column; 

        background: var(--c-bg); border: 1px solid var(--c-primary); 

        box-shadow: 0 0 40px rgba(0,0,0,0.5); 

        pointer-events: auto; z-index: 50;

    }

    .window-header { 

        padding: 8px 15px; background: rgba(0,0,0,0.8); border-bottom: 1px solid var(--c-primary); 

        display: flex; justify-content: space-between; align-items: center; font-family: var(--font-head);

    }

    .header-left { display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 12px; color: var(--c-primary); }

    .win-close { 

        background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); 

        padding: 4px 10px; font-size: 10px; cursor: pointer; transition: 0.2s; 

    }

    .win-close:hover { background: var(--c-primary); color: #000; }

    

    .window-content-area { flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; }

    .wip-msg { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.5; color: var(--c-primary); }



    /* Globais */

    :global(.root-terminal i) { text-shadow: 0 0 5px currentColor; }

    :global(::-webkit-scrollbar-thumb) { background: var(--c-primary) !important; }

</style>