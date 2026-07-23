<script>
    import { onMount, onDestroy, tick } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';
    import DiceLogic from '../../DiceLogic.svelte';

    export let themeColor = "rgba(45, 45, 50, 0.4)";
    export let neonColor = "#00bfff";

    // Reatividade com game.combat
    let activeCombat = null;
    let combatants = [];
    let currentTurnCombatant = null;

    // Seleção Local
    let selectedActorId = null;
    let showActorDropdown = false;
    let isGM = false;

    // Ações
    let actionTypes = { 'A': 0, 'D': 0, 'U': 0 };
    let rollDice = { d: 0, hd: 0, wd: 0 };
    
    // Resoluções do Combate (vindo das flags)
    let combatResolutions = [];
    let combatPassives = [];
    let rightPanelExpanded = false;
    let targetDropdownState = { open: false, resId: null, setIndex: null };
    
    let passivesWindowOpen = false;
    let newPassive = { notes: '', actorId: null };
    let passiveActionTypes = { 'A': 0, 'D': 0, 'U': 0 };
    let passiveRollDice = { d: 0, hd: 0, wd: 0 };
    
    // Configurações do HUD
    let hudScale = 100;
    let showScaleSettings = false;

    // Constantes Estéticas
    const actionColors = {
        'A': '#ff3333', // Vermelho Ataque
        'D': '#3388ff', // Azul Defesa
        'U': '#ffea00'  // Amarelo Utilidade
    };

    function getBorderColor(types) {
        if (!Array.isArray(types)) types = [types];
        const unique = [...new Set(types)];
        if (unique.length > 1) return '#ffffff';
        return actionColors[unique[0]] || '#333';
    }

    function getBgColor(types) {
        if (!Array.isArray(types)) types = [types];
        const unique = [...new Set(types)];
        if (unique.length > 1) return '#000000';
        return 'rgba(0,0,0,0.4)';
    }

    function getDieTextColor(types) {
        if (!Array.isArray(types)) types = [types];
        const unique = [...new Set(types)];
        if (unique.length > 1) return '#ffffff'; // Mistos (Preto) com fonte branca
        if (unique[0] === 'U') return '#000000'; // Utility (Amarelo) com fonte preta (APENAS DELE)
        return '#ffffff'; // Attacks (Vermelho) e Defends (Azul) com fonte branca
    }

    function getDieBoxBg(types) {
        if (!Array.isArray(types)) types = [types];
        const unique = [...new Set(types)];
        if (unique.length > 1) return '#000000'; // Mistos: fundo preto para contraste com fonte branca
        return actionColors[unique[0]] || '#333';
    }

    function getTitle(types) {
        if (!Array.isArray(types)) types = [types];
        let counts = {};
        types.forEach(t => counts[t] = (counts[t] || 0) + 1);
        let parts = [];
        for (let k in counts) parts.push(`${counts[k]}x ${k}`);
        return parts.join(' + ');
    }

    function updateCombatState() {
        // Obter o combate que está sendo visualizado na aba do tracker atualmente
        const viewedCombat = game.combats?.viewed || game.combat;
        
        if (!viewedCombat) {
            activeCombat = null;
            combatants = [];
            currentTurnCombatant = null;
            return;
        }
        
        // Define a "Cena Oficial e Exclusiva" deste combate
        let exclusiveSceneId = null;
        if (viewedCombat.scene) {
            exclusiveSceneId = typeof viewedCombat.scene === 'string' ? viewedCombat.scene : viewedCombat.scene.id;
        } else if (viewedCombat.combatants && viewedCombat.combatants.size > 0) {
            // Se o Foundry não carimbou a cena na raiz, assumimos que a cena do combate 
            // é a cena onde o primeiro combatente se encontra (Collection usa .contents e .size)
            const firstCombatant = viewedCombat.combatants.contents[0];
            exclusiveSceneId = firstCombatant.sceneId || firstCombatant.token?.parent?.id;
        } else {
            // Combate recém-criado, vazio, assumimos a cena atual temporariamente
            exclusiveSceneId = canvas.scene?.id;
        }

        // Se a cena exclusiva do combate não for a cena atual, ele não existe aqui.
        if (exclusiveSceneId && exclusiveSceneId !== canvas.scene?.id) {
            activeCombat = null;
            return;
        }

        activeCombat = viewedCombat;
        isGM = game.user.isGM;

        // Lista de combatentes (ordenada pela iniciativa para exibição)
        let sorted = [...activeCombat.combatants].sort((a, b) => a.initiative - b.initiative);
        combatants = sorted;

        if (activeCombat.combatant) {
            currentTurnCombatant = activeCombat.combatant;
        }

        // Recuperar resoluções das flags de TODOS os combatentes
        let allActions = [];
        for (let c of activeCombat.combatants) {
            const flag = c.getFlag('multiversus-rpg', 'combatActions');
            if (flag) {
                let actions = Array.isArray(flag) ? flag : Object.values(flag);
                allActions.push(...actions);
            }
        }
        combatResolutions = allActions;

        // Recuperar passivas
        let pFlag = activeCombat.getFlag('multiversus-rpg', 'combatPassives');
        combatPassives = Array.isArray(pFlag) ? pFlag : [];

        // Manter seleção de ator válida (se tiver um selecionado e ele ainda estiver no combate)
        if (selectedActorId && !combatants.find(c => c.actor?.id === selectedActorId)) {
            selectedActorId = null;
        }
    }

    onMount(() => {
        if (!game.user.isGM && game.user.character) {
            const charCombatant = game.combat?.combatants.find(c => c.actor?.id === game.user.character.id);
            if (charCombatant) {
                selectedActorId = charCombatant.actor.id;
            }
        }

        let savedScale = localStorage.getItem('nexus_hud_scale');
        if (savedScale) hudScale = parseInt(savedScale, 10);

        window.NexusCombatOS = {
            setPool: (pool) => {
                rollDice = { d: pool.d || 0, hd: pool.hd || 0, wd: pool.wd || 0 };
                ui.notifications.info("Pool enviada para o Combat OS.");
            }
        };

        updateCombatState();
        Hooks.on('updateCombat', updateCombatState);
        Hooks.on('updateCombatant', updateCombatState);
        Hooks.on('deleteCombat', updateCombatState);
        Hooks.on('createCombat', updateCombatState);
        Hooks.on('canvasReady', updateCombatState); // Quando muda de cena
        Hooks.on('renderCombatTracker', updateCombatState); // Quando muda a aba de combate
    });

    onDestroy(() => {
        Hooks.off('updateCombat', updateCombatState);
        Hooks.off('updateCombatant', updateCombatState);
        Hooks.off('deleteCombat', updateCombatState);
        Hooks.off('createCombat', updateCombatState);
        Hooks.off('canvasReady', updateCombatState);
        Hooks.off('renderCombatTracker', updateCombatState);
    });

    $: myActorsInCombat = combatants.filter(c => c.actor?.isOwner);
    $: selectedActor = game.actors?.get(selectedActorId);
    $: selectedCombatant = combatants.find(c => c.actor?.id === selectedActorId);

    function generateRolls(pool) {
        let rolled = [];
        for (let i = 0; i < pool.d; i++) rolled.push({ id: foundry.utils.randomID(), val: Math.floor(Math.random() * 10) + 1, type: 'd' });
        for (let i = 0; i < pool.hd; i++) rolled.push({ id: foundry.utils.randomID(), val: 10, type: 'hd' });
        for (let i = 0; i < pool.wd; i++) rolled.push({ id: foundry.utils.randomID(), val: 10, type: 'wd' });
        return rolled;
    }

    function evaluateORE(rolled) {
        if (!rolled || !Array.isArray(rolled)) return { sets: [], loose: [] };
        let byVal = {};
        
        rolled.forEach(d => {
            if (!byVal[d.val]) byVal[d.val] = [];
            byVal[d.val].push(d);
        });

        let sets = [];
        let loose = [];

        Object.keys(byVal).forEach(k => {
            const v = parseInt(k);
            const diceList = byVal[k];
            const c = diceList.length;
            
            const priority = { wd: 1, hd: 2, d: 3 };
            let sortedDice = [...diceList].sort((a, b) => (priority[a.type] || 99) - (priority[b.type] || 99));
            
            if (c > 1) {
                sets.push({ w: c, h: v, dice: sortedDice, targetId: null });
            } else {
                loose.push({ h: v, dice: sortedDice[0] });
            }
        });

        sets.sort((a, b) => b.w !== a.w ? b.w - a.w : b.h - a.h);
        loose.sort((a, b) => b.h - a.h);
        return { sets, loose };
    }

    async function passTurn() {
        if (!activeCombat) return;
        const currentId = activeCombat.combatant?.actorId;
        if (!isGM && selectedActor?.id !== currentId) {
            ui.notifications.warn("Não é o seu turno!");
            return;
        }
        await activeCombat.nextTurn();
    }

    async function submitAction() {
        if (!selectedActor || !activeCombat) return;

        if (!isGM) {
            const activeTurnActorId = activeCombat.combatant?.actorId;
            if (selectedActor.id !== activeTurnActorId) {
                ui.notifications.warn("Não é seu turno ainda.");
                return;
            }
        }

        let selectedTypes = [];
        for (let k of ['A', 'D', 'U']) {
            for (let i = 0; i < actionTypes[k]; i++) selectedTypes.push(k);
        }

        if (selectedTypes.length === 0) {
            ui.notifications.warn("Selecione pelo menos 1 tipo de ação.");
            return;
        }

        if (rollDice.d === 0 && rollDice.hd === 0 && rollDice.wd === 0) {
            ui.notifications.warn("Insira pelo menos 1 dado para a ação.");
            return;
        }

        const rolledDice = generateRolls(rollDice);
        const result = evaluateORE(rolledDice);

        const newAction = {
            id: foundry.utils.randomID(),
            actorId: selectedActor.id,
            actorName: selectedActor.name,
            img: selectedActor.img,
            type: selectedTypes,
            pool: { ...rollDice },
            rolledDice: rolledDice,
            result: result,
            public: false,
            timestamp: Date.now()
        };

        const combatant = activeCombat.combatants.find(c => c.actor?.id === selectedActor.id);
        if (!combatant) return;

        const currentFlag = combatant.getFlag('multiversus-rpg', 'combatActions');
        let currentActions = [];
        if (currentFlag) currentActions = Array.isArray(currentFlag) ? currentFlag : Object.values(currentFlag);
        currentActions.push(newAction);

        await combatant.setFlag('multiversus-rpg', 'combatActions', currentActions);

        // Reset pool
        rollDice = { d: 0, hd: 0, wd: 0 };
        actionTypes = { 'A': 0, 'D': 0, 'U': 0 };
    }

    async function forceTurn(combatantId) {
        if (!isGM || !activeCombat) return;
        const index = activeCombat.turns.findIndex(c => c.id === combatantId);
        if (index !== -1) {
            await activeCombat.update({ turn: index });
        }
    }

    // Ação Draggable para Svelte
    function draggable(node) {
        let x;
        let y;

        function handleMousedown(event) {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'BUTTON' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT' || event.target.tagName === 'I') return;
            x = event.clientX;
            y = event.clientY;
            window.addEventListener('mousemove', handleMousemove);
            window.addEventListener('mouseup', handleMouseup);
        }

        function handleMousemove(event) {
            const dx = event.clientX - x;
            const dy = event.clientY - y;
            x = event.clientX;
            y = event.clientY;

            const computedStyle = window.getComputedStyle(node);
            const left = parseInt(computedStyle.left) || 0;
            const top = parseInt(computedStyle.top) || 0;
            
            node.style.left = `${left + dx}px`;
            node.style.top = `${top + dy}px`;
            node.style.position = 'fixed';
            node.style.transform = 'none';
        }

        function handleMouseup() {
            window.removeEventListener('mousemove', handleMousemove);
            window.removeEventListener('mouseup', handleMouseup);
        }

        node.addEventListener('mousedown', handleMousedown);

        return {
            destroy() {
                node.removeEventListener('mousedown', handleMousedown);
            }
        };
    }

    async function openPassiveModal() {
        if (!selectedActorId && myActorsInCombat.length > 0) {
            selectedActorId = myActorsInCombat[0].actor?.id;
        }
        newPassive = { notes: '', actorId: selectedActorId };
        passiveActionTypes = { 'A': 0, 'D': 0, 'U': 0 };
        passiveRollDice = { d: 0, hd: 0, wd: 0 };
        passivesWindowOpen = true;
    }

    async function submitPassive() {
        if (!newPassive.notes.trim()) {
            ui.notifications.warn("Insira uma descrição para o passivo.");
            return;
        }
        if (!newPassive.actorId) {
            ui.notifications.warn("Nenhum personagem selecionado.");
            return;
        }

        let selectedTypes = [];
        for (let k of ['A', 'D', 'U']) {
            for (let i = 0; i < passiveActionTypes[k]; i++) selectedTypes.push(k);
        }

        if (selectedTypes.length === 0) {
            ui.notifications.warn("Selecione pelo menos 1 tipo de ação para a passiva.");
            return;
        }

        if (passiveRollDice.d === 0 && passiveRollDice.hd === 0 && passiveRollDice.wd === 0) {
            ui.notifications.warn("Insira pelo menos 1 dado para a passiva.");
            return;
        }
        
        const pActor = game.actors.get(newPassive.actorId);
        const rolledDice = generateRolls(passiveRollDice);
        const result = evaluateORE(rolledDice);
        if (result.sets) result.sets.forEach(s => s.targetId = null);
        
        let newP = {
            id: foundry.utils.randomID(),
            actorId: newPassive.actorId,
            actorName: pActor ? pActor.name : "Desconhecido",
            img: pActor ? pActor.img : "icons/svg/mystery-man.svg",
            type: selectedTypes,
            pool: { ...passiveRollDice },
            rolledDice: rolledDice,
            result: result,
            notes: newPassive.notes,
            public: false,
            timestamp: Date.now()
        };
        
        if (game.user.isGM) {
            let arr = [...combatPassives, newP];
            await activeCombat.setFlag('multiversus-rpg', 'combatPassives', arr);
        } else {
            game.socket.emit('module.multiversus-rpg', {
                type: "COMBAT_ADD_PASSIVE",
                passive: newP
            });
            ui.notifications.info("Passiva enviada!");
        }
    }

    async function togglePassiveVisibility(pid) {
        if (!isGM) return;
        let arr = [...combatPassives];
        let p = arr.find(x => x.id === pid);
        if (p) {
            p.public = !p.public;
            await activeCombat.setFlag('multiversus-rpg', 'combatPassives', arr);
        }
    }

    async function deletePassive(pid) {
        if (!isGM) return;
        let arr = combatPassives.filter(x => x.id !== pid);
        await activeCombat.setFlag('multiversus-rpg', 'combatPassives', arr);
    }

    async function changeWD(res, die) {
        if (!die || die.type !== 'wd') return;
        if (!isGM && res.actorId !== game.user.character?.id && !game.actors.get(res.actorId)?.isOwner) return;

        new Dialog({
            title: "Ajustar Wiggle Die (WD)",
            content: `
                <div style="margin-bottom: 10px; font-family: 'Roboto', sans-serif;">Defina o novo valor do dado (1 a 10):</div>
                <input type="number" id="wd-val" value="${die.val || 10}" min="1" max="10" autofocus style="width: 100%; padding: 5px; text-align: center; font-size: 16px; border: 1px solid #00ff41; background: #111; color: #fff;">
                <hr>
            `,
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirmar",
                    callback: async (html) => {
                        let v = parseInt(html.find("#wd-val").val());
                        if (isNaN(v) || v < 1 || v > 10) return;
                        
                        let updatedAction = false;
                        const combatant = activeCombat?.combatants.find(c => c.actor?.id === res.actorId);
                        if (combatant) {
                            const currentFlag = combatant.getFlag('multiversus-rpg', 'combatActions');
                            let actions = [];
                            if (Array.isArray(currentFlag)) {
                                actions = foundry.utils.deepClone(currentFlag);
                            } else if (currentFlag && typeof currentFlag === 'object') {
                                actions = foundry.utils.deepClone(Object.values(currentFlag));
                            }

                            const idx = actions.findIndex(a => a.id === res.id);
                            if (idx !== -1) {
                                let action = actions[idx];
                                if (!action.rolledDice) action.rolledDice = [];
                                let rDie = action.rolledDice.find(d => d.id && d.id === die.id);
                                if (!rDie) rDie = action.rolledDice.find(d => d.type === 'wd' && d.val === die.val) || action.rolledDice.find(d => d.type === 'wd');
                                if (rDie) rDie.val = v;
                                
                                action.result = evaluateORE(action.rolledDice);
                                actions[idx] = action;
                                await combatant.setFlag('multiversus-rpg', 'combatActions', actions);
                                updatedAction = true;
                            }
                        }

                        if (!updatedAction && activeCombat) {
                            let pFlag = activeCombat.getFlag('multiversus-rpg', 'combatPassives');
                            let passives = Array.isArray(pFlag) ? foundry.utils.deepClone(pFlag) : [];
                            const pIdx = passives.findIndex(p => p.id === res.id);
                            if (pIdx !== -1) {
                                let passive = passives[pIdx];
                                if (!passive.rolledDice) passive.rolledDice = [];
                                let rDie = passive.rolledDice.find(d => d.id && d.id === die.id);
                                if (!rDie) rDie = passive.rolledDice.find(d => d.type === 'wd' && d.val === die.val) || passive.rolledDice.find(d => d.type === 'wd');
                                if (rDie) rDie.val = v;

                                passive.result = evaluateORE(passive.rolledDice);
                                passives[pIdx] = passive;
                                await activeCombat.setFlag('multiversus-rpg', 'combatPassives', passives);
                            }
                        }
                    }
                }
            },
            default: "ok"
        }).render(true);
    }

    async function toggleActionVisibility(actionId) {
        if (!isGM) return;
        for (let c of activeCombat.combatants) {
            const currentFlag = c.getFlag('multiversus-rpg', 'combatActions');
            if (currentFlag) {
                let actions = Array.isArray(currentFlag) ? currentFlag : Object.values(currentFlag);
                const action = actions.find(a => a.id === actionId);
                if (action) {
                    action.public = !action.public;
                    await c.setFlag('multiversus-rpg', 'combatActions', actions);
                    return;
                }
            }
        }
    }

    async function toggleAllVisibility() {
        if (!isGM || !activeCombat) return;
        const allPublic = combatResolutions.length > 0 && combatResolutions.every(a => a.public);
        const newState = !allPublic;

        for (let c of activeCombat.combatants) {
            const currentFlag = c.getFlag('multiversus-rpg', 'combatActions');
            if (currentFlag) {
                let actions = Array.isArray(currentFlag) ? currentFlag : Object.values(currentFlag);
                actions.forEach(a => a.public = newState);
                await c.setFlag('multiversus-rpg', 'combatActions', actions);
            }
        }
    }

    async function clearAllActions() {
        if (!isGM || !activeCombat) return;
        for (let c of activeCombat.combatants) {
            await c.unsetFlag('multiversus-rpg', 'combatActions');
        }
    }

    function openTargetSelect(resId, setIndex) {
        targetDropdownState = { open: true, resId, setIndex };
    }

    async function selectTarget(targetId) {
        if (!targetDropdownState.open || !activeCombat) return;
        const { resId, setIndex } = targetDropdownState;
        targetDropdownState = { open: false, resId: null, setIndex: null };
        
        const res = combatResolutions.find(r => r.id === resId);
        if (!res) return;

        res.result.sets[setIndex].targetId = targetId;

        const combatant = activeCombat.combatants.find(c => c.actor?.id === res.actorId);
        if (combatant) {
            const flag = combatant.getFlag('multiversus-rpg', 'combatActions');
            if (flag) {
                let actions = Array.isArray(flag) ? [...flag] : Object.values(flag);
                const idx = actions.findIndex(a => a.id === res.id);
                if (idx !== -1) {
                    actions[idx] = res;
                    await combatant.setFlag('multiversus-rpg', 'combatActions', actions);
                }
            }
        }
    }

    $: visibleSets = (() => {
        let items = [];
        combatResolutions.filter(a => isGM || a.public || myActorsInCombat.some(c => c.actor?.id === a.actorId)).forEach(res => {
            if (res.result?.sets?.length > 0) {
                res.result.sets.forEach((set, idx) => {
                    items.push({
                        type: 'set',
                        res: res,
                        set: set,
                        setIndex: idx,
                        showLoose: idx === res.result.sets.length - 1 ? res.result.loose : null,
                        w: set.w,
                        h: set.h,
                        timestamp: res.timestamp || 0
                    });
                });
            } else {
                let w = 0, h = 0;
                if (res.result?.loose?.length > 0) {
                    let firstLoose = res.result.loose[0];
                    w = 1;
                    h = typeof firstLoose === 'object' ? firstLoose.h : firstLoose;
                }
                items.push({
                    type: 'loose_only',
                    res: res,
                    set: null,
                    setIndex: -1,
                    showLoose: res.result?.loose || [],
                    w: w,
                    h: h,
                    timestamp: res.timestamp || 0
                });
            }
        });
        
        return items.sort((a, b) => {
            if (b.w !== a.w) return b.w - a.w;
            if (b.h !== a.h) return b.h - a.h;
            return b.timestamp - a.timestamp;
        });
    })();

    $: passiveVisibleSets = (() => {
        let items = [];
        combatPassives.filter(a => isGM || a.public || myActorsInCombat.some(c => c.actor?.id === a.actorId)).forEach(res => {
            if (res.result?.sets?.length > 0) {
                res.result.sets.forEach((set, idx) => {
                    items.push({
                        type: 'set',
                        res: res,
                        set: set,
                        setIndex: idx,
                        showLoose: idx === res.result.sets.length - 1 ? res.result.loose : null,
                        w: set.w,
                        h: set.h,
                        timestamp: res.timestamp || 0
                    });
                });
            } else {
                let w = 0, h = 0;
                if (res.result?.loose?.length > 0) {
                    let firstLoose = res.result.loose[0];
                    w = 1;
                    h = typeof firstLoose === 'object' ? firstLoose.h : firstLoose;
                }
                items.push({
                    type: 'loose_only',
                    res: res,
                    set: null,
                    setIndex: -1,
                    showLoose: res.result?.loose || [],
                    w: w,
                    h: h,
                    timestamp: res.timestamp || 0
                });
            }
        });
        
        return items.sort((a, b) => {
            if (b.w !== a.w) return b.w - a.w;
            if (b.h !== a.h) return b.h - a.h;
            return b.timestamp - a.timestamp;
        });
    })();

    function updateScale() {
        localStorage.setItem('nexus_hud_scale', hudScale.toString());
    }
</script>

{#if activeCombat && activeCombat.started}
<div class="combat-hud-wrapper" style="--os-bg: {themeColor}; --os-neon: {neonColor}; transform: translateX(-50%) scale({hudScale / 100}); transform-origin: bottom center;" transition:slide>
    
    <!-- ESQUERDA: PERSONAGEM -->
    <div class="hud-panel left-panel">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="avatar-monitor" on:click={() => showActorDropdown = !showActorDropdown}>
            {#if selectedActor}
                <img src={selectedActor.img} alt="Avatar" />
                <div class="scanline-overlay"></div>
                <div class="actor-name-badge">{selectedActor.name.split(' ')[0]}</div>
            {:else}
                <div class="no-actor"><i class="fas fa-user-slash"></i></div>
            {/if}
        </div>
        
        {#if showActorDropdown && myActorsInCombat.length > 0}
            <div class="actor-dropdown" transition:fade={{duration: 150}}>
                {#each myActorsInCombat as combatant}
                    {#if combatant.actor}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div class="dropdown-item" on:click={() => { selectedActorId = combatant.actor.id; showActorDropdown = false; }}>
                        <img src={combatant.actor.img} alt="img" />
                        <span>{combatant.actor.name}</span>
                    </div>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>

    <!-- CENTRO: NÚCLEO (INICIATIVA E ROLAGEM) -->
    <div class="hud-panel center-panel">
        <!-- Barra de Iniciativa -->
        <div class="initiative-bar">
            {#each combatants as c}
                {@const isCurrent = currentTurnCombatant?.id === c.id}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="init-item {isCurrent ? 'active' : ''}" title="{c.name} (Score: {c.initiative}) {isGM ? '- Trocar turno ativo atual' : ''}" on:contextmenu|preventDefault={() => forceTurn(c.id)} on:click={() => forceTurn(c.id)}>
                    <img src={c.img} alt="c" />
                    {#if isCurrent}
                        <div class="turn-highlight" style="border-color: var(--os-neon);"></div>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="core-mechanics">
            <!-- Seletor de Tipo de Ação -->
            <div class="action-selector">
                <div class="act-counter" style="--c: {actionColors['A']};">
                    <button class="ac-btn" on:click={() => actionTypes['A'] = Math.max(0, actionTypes['A'] - 1)}>-</button>
                    <span class="ac-lbl" style="color: {actionTypes['A'] > 0 ? 'var(--c)' : '#555'}"><i class="fas fa-crosshairs"></i> {actionTypes['A']} A</span>
                    <button class="ac-btn" on:click={() => actionTypes['A']++}>+</button>
                </div>
                <div class="act-counter" style="--c: {actionColors['D']};">
                    <button class="ac-btn" on:click={() => actionTypes['D'] = Math.max(0, actionTypes['D'] - 1)}>-</button>
                    <span class="ac-lbl" style="color: {actionTypes['D'] > 0 ? 'var(--c)' : '#555'}"><i class="fas fa-shield-alt"></i> {actionTypes['D']} D</span>
                    <button class="ac-btn" on:click={() => actionTypes['D']++}>+</button>
                </div>
                <div class="act-counter" style="--c: {actionColors['U']};">
                    <button class="ac-btn" on:click={() => actionTypes['U'] = Math.max(0, actionTypes['U'] - 1)}>-</button>
                    <span class="ac-lbl" style="color: {actionTypes['U'] > 0 ? 'var(--c)' : '#555'}"><i class="fas fa-bolt"></i> {actionTypes['U']} U</span>
                    <button class="ac-btn" on:click={() => actionTypes['U']++}>+</button>
                </div>
            </div>

            <!-- Dados Manuais -->
            <div class="dice-inputs">
                <div class="dice-box">
                    <label>D</label>
                    <input type="number" min="0" max="10" bind:value={rollDice.d} />
                </div>
                <div class="dice-box hard">
                    <label>HD</label>
                    <input type="number" min="0" max="10" bind:value={rollDice.hd} />
                </div>
                <div class="dice-box wiggle">
                    <label>WD</label>
                    <input type="number" min="0" max="10" bind:value={rollDice.wd} />
                </div>
                <button class="btn-roll" on:click={submitAction} style="background: rgba(255,0,0,0.5);"><i class="fas fa-dice-d20"></i> ENVIAR</button>
                <div style="position: relative; display: flex; flex-direction: column; gap: 5px;">
                    <button class="btn-settings" on:click={() => showScaleSettings = !showScaleSettings} title="Configurar Escala HUD"><i class="fas fa-cog"></i></button>
                    {#if showScaleSettings}
                        <div class="scale-popover">
                            <label style="font-size: 10px; color: white;">Escala: {hudScale}%</label>
                            <input type="range" min="100" max="200" step="10" bind:value={hudScale} on:change={updateScale} style="width: 80px;" />
                        </div>
                    {/if}
                    <button class="btn-pass" on:click={passTurn} title="Passar Turno"><i class="fas fa-arrow-right"></i></button>
                </div>
            </div>
        </div>
    </div>

    <!-- DIREITA: PAINEL DE RESOLUÇÃO -->
    <div class="hud-panel right-panel {rightPanelExpanded ? 'expanded' : ''}">
        <div class="panel-header">
            <span><i class="fas fa-list"></i> Resoluções</span>
            <div class="header-controls">
                <button title="Adicionar Efeito Passivo" class="passive-btn" on:click={openPassiveModal}><i class="fas fa-bolt" style="color: #ffea00;"></i></button>
                {#if isGM}
                    {@const allPublic = combatResolutions.length > 0 && combatResolutions.every(a => a.public)}
                    <button title="Alternar Visibilidade de Todas as Resoluções" class="eye-btn {allPublic ? 'active' : ''}" on:click={toggleAllVisibility}><i class="fas fa-eye"></i></button>
                    <button title="Limpar Resoluções" class="clear-btn" on:click={clearAllActions}><i class="fas fa-trash"></i></button>
                {/if}
                <button class="expand-btn" on:click={() => rightPanelExpanded = !rightPanelExpanded}><i class="fas fa-{rightPanelExpanded ? 'compress' : 'expand'}"></i></button>
            </div>
        </div>

        <div class="resolutions-list">
            {#if visibleSets.length === 0}
                <div class="empty-msg">Nenhuma ação registrada.</div>
            {/if}
            {#each visibleSets as item (item.res.id + '_' + item.setIndex)}
                <div class="res-item" style="border-left-color: {getBorderColor(item.res.type)}; background: {getBgColor(item.res.type)};" transition:fade>
                    <img src={item.res.img} alt="A" class="res-avatar" />
                    <div class="res-info" style="width: 100%;">
                        <div class="res-name" style="display:flex; justify-content:space-between; align-items:center;">
                            <span>{item.res.actorName} <span style="font-weight:normal; color:#888;">({getTitle(item.res.type)})</span></span>
                            {#if isGM && item.res.public !== undefined}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <!-- svelte-ignore a11y-no-static-element-interactions -->
                                <i class="fas {item.res.public ? 'fa-eye' : 'fa-eye-slash'}" style="color: {item.res.public ? '#00ff41' : '#f33'}; cursor:pointer; font-size: 10px;" on:click={() => toggleActionVisibility(item.res.id)}></i>
                            {/if}
                        </div>
                        
                        {#if item.res.result}
                            <div class="ore-result" style="margin-top: 5px; border-top: 1px solid #333; padding-top: 5px; border-left: 2px solid {getBorderColor(item.res.type)}; padding-left: 5px;">
                                {#if item.type === 'set'}
                                    <div style="display:flex; align-items:center; gap:5px;">
                                        <img src={item.res.img} alt="Origin" style="width:16px;height:16px;border-radius:50%;" title="Originador" />
                                        <div class="set-line" style="font-size: 13px; font-weight: bold; color: #fff;">
                                            {item.set.w}x{item.set.h} 
                                            <span class="boxes" style="display:inline-flex; gap: 2px; margin-left: 5px;">
                                                {#each (item.set.dice || Array(item.set.w).fill({})) as die}
                                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                                                    <div 
                                                        on:click={() => changeWD(item.res, die)}
                                                        style="width:14px; height:14px; background: {getDieBoxBg(item.res.type)}; border-radius: 2px; box-shadow: 0 0 5px {getBorderColor(item.res.type)}; display:flex; align-items:center; justify-content:center; font-size: 9px; font-weight: bold; color: {getDieTextColor(item.res.type)}; cursor: {die.type === 'wd' ? 'pointer' : 'default'};"
                                                        title={die.type === 'wd' ? 'Clique para ajustar WD' : ''}>
                                                        {die.type ? die.type.toUpperCase().charAt(0) : ''}
                                                    </div>
                                                {/each}
                                            </span>
                                        </div>

                                        <i class="fas fa-arrow-right" style="color: #555; font-size: 10px; margin: 0 2px;"></i>
                                        
                                        {#if item.set.targetId === 'area'}
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                                            <div class="target-btn" on:click={() => openTargetSelect(item.res.id, item.setIndex)} title="Alvo: Área">
                                                <i class="fas fa-bullseye" style="color:#f33"></i>
                                            </div>
                                        {:else if item.set.targetId}
                                            {@const tgt = game.actors?.get(item.set.targetId)}
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                                            <div class="target-btn" on:click={() => openTargetSelect(item.res.id, item.setIndex)} title="Alvo: {tgt?.name}">
                                                {#if tgt}<img src={tgt.img} alt="Tgt" style="width:100%;height:100%;border-radius:50%;" />{/if}
                                            </div>
                                        {:else}
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                                            <div class="target-btn empty" on:click={() => openTargetSelect(item.res.id, item.setIndex)} title="Selecionar Alvo">
                                                <i class="fas fa-crosshairs"></i>
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                                
                                {#if item.showLoose && item.showLoose.length > 0}
                                    <div class="loose" style="font-size: 10px; color: #888; margin-top: 4px; display:flex; gap: 3px; align-items: center; flex-wrap: wrap;">
                                        Dados Soltos: 
                                        {#each (item.showLoose || []) as looseItem}
                                            {@const val = typeof looseItem === 'object' ? looseItem.h : looseItem}
                                            {@const die = typeof looseItem === 'object' ? looseItem.dice : {}}
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                                            <div 
                                                on:click={() => changeWD(item.res, die)}
                                                style="width:14px; height:14px; border: 1px solid #555; border-radius: 2px; display:flex; align-items:center; justify-content:center; font-size: 9px; color: #aaa; cursor: {die?.type === 'wd' ? 'pointer' : 'default'};"
                                                title={die?.type === 'wd' ? 'Clique para ajustar WD' : 'Dado tipo ' + (die?.type || '?').toUpperCase()}>
                                                {val}<sup>{die?.type ? die.type.toUpperCase().charAt(0) : ''}</sup>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <div class="res-pool">Pool: {item.res.pool?.d || 0}D / {item.res.pool?.hd || 0}HD / {item.res.pool?.wd || 0}WD</div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

</div>
{/if}

<!-- SELETOR DE ALVOS GLOBAL -->
{#if targetDropdownState.open}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="target-overlay" on:click={() => targetDropdownState.open = false}>
        <div class="target-menu" on:click|stopPropagation>
            <div class="tm-title">SELECIONAR ALVO</div>
            <div class="tm-item" on:click={() => selectTarget('area')}>
                <i class="fas fa-bullseye" style="color:#f33"></i> Área de Efeito
            </div>
            {#each combatants as c}
                {#if c.actor}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="tm-item" on:click={() => selectTarget(c.actor.id)}>
                    <img src={c.actor.img} alt="A" /> {c.actor.name}
                </div>
                {/if}
            {/each}
        </div>
    </div>
{/if}

<!-- MODAL PASSIVAS -->
{#if passivesWindowOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div use:draggable class="target-menu passive-modal" style="position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 750px; max-height: 80vh; overflow-y: auto; background: var(--os-bg); border: 1px solid #ffea00; z-index: 1000; box-shadow: 0 0 20px rgba(0,0,0,0.8);" on:click|stopPropagation>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; border-bottom: 1px solid #333;">
            <div class="tm-title" style="color: #ffea00; margin: 0;"><i class="fas fa-bolt"></i> EFEITOS PASSIVOS</div>
            <button on:click={() => passivesWindowOpen = false} style="background: none; border: none; color: white; cursor: pointer;"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="resolutions-list" style="margin-top: 10px;">
            {#if passiveVisibleSets.length === 0}
                <div class="empty-msg">Nenhuma passiva registrada.</div>
            {/if}
            {#each passiveVisibleSets as item (item.res.id + '_' + item.setIndex)}
                <div class="res-item" style="border-left-color: {getBorderColor(item.res.type)}; background: {getBgColor(item.res.type)};" transition:fade>
                    <img src={item.res.img} alt="A" class="res-avatar" />
                    <div class="res-info" style="width: 100%;">
                        <div class="res-name" style="display:flex; justify-content:space-between; align-items:center;">
                            <span>{item.res.actorName} <span style="font-weight:normal; color:#888;">(Passiva)</span></span>
                            {#if isGM && item.res.public !== undefined}
                                <div style="display: flex; gap: 5px;">
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                                    <i class="fas fa-trash" style="color: #f33; cursor:pointer; font-size: 10px;" on:click={() => deletePassive(item.res.id)}></i>
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                                    <i class="fas {item.res.public ? 'fa-eye' : 'fa-eye-slash'}" style="color: {item.res.public ? '#00ff41' : '#f33'}; cursor:pointer; font-size: 10px;" on:click={() => togglePassiveVisibility(item.res.id)}></i>
                                </div>
                            {/if}
                        </div>
                        
                        {#if item.res.result}
                            <div class="ore-result" style="margin-top: 5px; border-top: 1px solid #333; padding-top: 5px; border-left: 2px solid {getBorderColor(item.res.type)}; padding-left: 5px;">
                                {#if item.type === 'set'}
                                    <div style="display:flex; align-items:center; gap:5px;">
                                        <img src={item.res.img} alt="Origin" style="width:16px;height:16px;border-radius:50%;" title="Originador" />
                                        <div class="set-line" style="font-size: 13px; font-weight: bold; color: #fff;">
                                            {item.set.w}x{item.set.h} 
                                            <span class="boxes" style="display:inline-flex; gap: 2px; margin-left: 5px;">
                                                {#each (item.set.dice || Array(item.set.w).fill({})) as die}
                                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                                                    <div 
                                                        on:click={() => changeWD(item.res, die)}
                                                        style="width:14px; height:14px; background: {getDieBoxBg(item.res.type)}; border-radius: 2px; box-shadow: 0 0 5px {getBorderColor(item.res.type)}; display:flex; align-items:center; justify-content:center; font-size: 9px; font-weight: bold; color: {getDieTextColor(item.res.type)}; cursor: {die.type === 'wd' ? 'pointer' : 'default'};"
                                                        title={die.type === 'wd' ? 'Clique para ajustar WD' : ''}>
                                                        {die.type ? die.type.toUpperCase().charAt(0) : ''}
                                                    </div>
                                                {/each}
                                            </span>
                                        </div>
                                    </div>
                                {/if}
                                
                                {#if item.showLoose && item.showLoose.length > 0}
                                    <div class="loose" style="font-size: 10px; color: #888; margin-top: 4px; display:flex; gap: 3px; align-items: center; flex-wrap: wrap;">
                                        Dados Soltos: 
                                        {#each (item.showLoose || []) as looseItem}
                                            {@const val = typeof looseItem === 'object' ? looseItem.h : looseItem}
                                            {@const die = typeof looseItem === 'object' ? looseItem.dice : {}}
                                            <div 
                                                style="width:14px; height:14px; border: 1px solid #555; border-radius: 2px; display:flex; align-items:center; justify-content:center; font-size: 9px; color: #aaa;">
                                                {val}<sup>{die?.type ? die.type.toUpperCase().charAt(0) : ''}</sup>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                                <div style="font-size: 11px; color: #ddd; margin-top: 5px; font-style: italic;">{item.res.notes}</div>
                            </div>
                        {:else}
                            <div class="res-pool">Pool: {item.res.pool?.d || 0}D / {item.res.pool?.hd || 0}HD / {item.res.pool?.wd || 0}WD</div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>

        <div class="core-mechanics" style="margin-top: 15px; border-top: 1px solid #333; padding-top: 15px;">
            <div class="tm-title" style="font-size: 10px; text-align: left; margin-bottom: 5px;">ADICIONAR PASSIVA</div>
            <div style="margin-bottom: 10px;">
                <select bind:value={newPassive.actorId} style="width: 100%; box-sizing: border-box; background: black; color: white; border: 1px solid #555; padding: 5px; border-radius: 4px; font-size: 10px;">
                    {#each myActorsInCombat as combatant}
                        {#if combatant.actor}
                            <option value={combatant.actor.id}>{combatant.actor.name}</option>
                        {/if}
                    {/each}
                </select>
            </div>

            <div class="action-selector" style="justify-content: center; gap: 5px; margin-bottom: 10px; padding: 5px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                <div class="act-counter" style="--c: {actionColors['A']};">
                    <button class="ac-btn" on:click={() => passiveActionTypes['A'] = Math.max(0, passiveActionTypes['A'] - 1)}>-</button>
                    <span class="ac-lbl" style="color: {passiveActionTypes['A'] > 0 ? 'var(--c)' : '#555'}"><i class="fas fa-crosshairs"></i> {passiveActionTypes['A']} A</span>
                    <button class="ac-btn" on:click={() => passiveActionTypes['A']++}>+</button>
                </div>
                <div class="act-counter" style="--c: {actionColors['D']};">
                    <button class="ac-btn" on:click={() => passiveActionTypes['D'] = Math.max(0, passiveActionTypes['D'] - 1)}>-</button>
                    <span class="ac-lbl" style="color: {passiveActionTypes['D'] > 0 ? 'var(--c)' : '#555'}"><i class="fas fa-shield-alt"></i> {passiveActionTypes['D']} D</span>
                    <button class="ac-btn" on:click={() => passiveActionTypes['D']++}>+</button>
                </div>
                <div class="act-counter" style="--c: {actionColors['U']};">
                    <button class="ac-btn" on:click={() => passiveActionTypes['U'] = Math.max(0, passiveActionTypes['U'] - 1)}>-</button>
                    <span class="ac-lbl" style="color: {passiveActionTypes['U'] > 0 ? 'var(--c)' : '#555'}"><i class="fas fa-bolt"></i> {passiveActionTypes['U']} U</span>
                    <button class="ac-btn" on:click={() => passiveActionTypes['U']++}>+</button>
                </div>
            </div>

            <div class="dice-inputs" style="justify-content: center; gap: 5px; margin-bottom: 10px;">
                <div class="dice-box" style="width: 40px; padding: 2px;">
                    <label style="font-size: 8px;">D</label>
                    <input type="number" min="0" max="10" bind:value={passiveRollDice.d} style="font-size: 12px; padding: 2px;" />
                </div>
                <div class="dice-box hard" style="width: 40px; padding: 2px;">
                    <label style="font-size: 8px;">HD</label>
                    <input type="number" min="0" max="10" bind:value={passiveRollDice.hd} style="font-size: 12px; padding: 2px;" />
                </div>
                <div class="dice-box wiggle" style="width: 40px; padding: 2px;">
                    <label style="font-size: 8px;">WD</label>
                    <input type="number" min="0" max="10" bind:value={passiveRollDice.wd} style="font-size: 12px; padding: 2px;" />
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <textarea bind:value={newPassive.notes} rows="2" style="width: 100%; box-sizing: border-box; background: black; color: white; border: 1px solid #555; padding: 5px; border-radius: 4px; resize: none; font-size: 10px;" placeholder="Descrição do efeito..."></textarea>
            </div>

            <div style="display: flex; justify-content: stretch;">
                <button class="btn-roll" on:click={submitPassive} style="flex: 1; background: rgba(255,234,0,0.3); color: #ffea00; border: 1px solid #ffea00;"><i class="fas fa-dice-d20"></i> ENVIAR PASSIVA</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .target-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 1000; display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.5);
    }
    .target-menu {
        background: var(--os-bg); border: 1px solid var(--os-neon); border-radius: 8px;
        padding: 5px; display: flex; flex-direction: column; gap: 2px;
        max-height: 300px; overflow-y: auto; box-shadow: 0 0 20px rgba(0,0,0,0.8);
    }
    .tm-title { font-size: 10px; color: var(--os-neon); text-align: center; margin-bottom: 5px; font-weight: bold; }
    .tm-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: white; padding: 5px; cursor: pointer; border-radius: 4px; }
    .tm-item:hover { background: rgba(255,255,255,0.1); }
    .tm-item img { width: 24px; height: 24px; border-radius: 50%; }

    .target-btn {
        width: 18px; height: 18px; border-radius: 50%;
        background: rgba(0,0,0,0.5); border: 1px dashed #555;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; font-size: 10px; color: #888; flex-shrink: 0;
        overflow: hidden;
    }
    .target-btn:hover { border-color: white; color: white; }
    .target-btn img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

    .combat-hud-wrapper {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: flex-end;
        gap: 15px;
        z-index: 100;
        pointer-events: none; /* Deixa clicar no grid atravessando os buracos */
    }

    .hud-panel {
        position: relative;
        pointer-events: auto; /* Permite clicar nos painéis */
        background: var(--os-bg);
        border: 1px solid var(--os-neon);
        border-radius: 8px;
        padding: 5px;
        box-shadow: 0 0 15px rgba(0,0,0,0.5);
        backdrop-filter: blur(5px);
        /* overflow: hidden; REMOVED TO ALLOW DROPDOWN TO BE VISIBLE */
    }

    /* --- ESQUERDA --- */
    .left-panel {
        width: 145px;
        height: 145px;
        position: relative;
    }
    .avatar-monitor {
        width: 100%;
        height: 100%;
        position: relative;
        cursor: pointer;
        border-radius: 8px;
        overflow: hidden;
    }
    .avatar-monitor img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .scanline-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
        background-size: 100% 4px, 3px 100%;
        pointer-events: none;
    }
    .actor-name-badge {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        background: rgba(0,0,0,0.7);
        color: var(--os-neon);
        font-size: 10px;
        text-align: center;
        padding: 2px 0;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .no-actor {
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        color: #555; font-size: 30px;
    }
    .actor-dropdown {
        position: absolute;
        bottom: 120px; left: 0;
        width: 150px;
        background: var(--os-bg);
        border: 1px solid var(--os-neon);
        border-radius: 4px;
        display: flex; flex-direction: column;
        max-height: 200px; overflow-y: auto;
        z-index: 9999;
    }
    .dropdown-item {
        display: flex; align-items: center; gap: 8px;
        padding: 5px; cursor: pointer; color: white; font-size: 11px;
    }
    .dropdown-item:hover { background: rgba(255,255,255,0.1); }
    .dropdown-item img { width: 24px; height: 24px; border-radius: 50%; }

    /* --- CENTRO --- */
    .center-panel {
        width: 500px;
        height: 145px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .initiative-bar {
        display: flex;
        min-height: 45px;
        background: rgba(0,0,0,0.4);
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding: 5px;
        gap: 5px;
        overflow-x: auto;
        overflow-y: hidden;
        align-items: center;
    }
    .init-item {
        width: 30px; height: 30px;
        border-radius: 4px; overflow: hidden;
        position: relative; flex-shrink: 0;
        opacity: 0.6;
        cursor: pointer;
    }
    .init-item.active { opacity: 1; }
    .init-item img { width: 100%; height: 100%; object-fit: cover; }
    .turn-highlight {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        border: 2px solid; pointer-events: none;
    }

    .core-mechanics {
        display: flex;
        flex: 1;
        padding: 5px 10px;
        align-items: center;
        justify-content: space-between;
    }
    .action-selector { display: flex; gap: 5px; }
    .act-btn {
        background: rgba(0,0,0,0.5); border: 1px solid transparent;
        color: white; width: 40px; height: 35px; border-radius: 4px;
        cursor: pointer; transition: all 0.2s;
    }
    .act-btn.active {
        border-color: var(--btn-color);
        box-shadow: 0 0 8px var(--btn-color);
        color: var(--btn-color);
    }
    .dice-inputs { display: flex; gap: 8px; align-items: center; }
    .dice-box { display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #ccc; }
    .dice-box input {
        width: 35px; height: 25px; text-align: center; background: rgba(0,0,0,0.6);
        border: 1px solid #555; color: white; border-radius: 3px;
    }
    .dice-box.hard input { border-color: #f33; }
    .dice-box.wiggle input { border-color: #fc0; }
    .btn-roll {
        padding: 0 15px; height: 35px; border: none; border-radius: 4px;
        color: white; font-weight: bold; cursor: pointer; text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    }
    .btn-roll:hover { filter: brightness(1.2); }
    .btn-settings {
        width: 35px; height: 15px; border: none; border-radius: 4px; background: rgba(0,0,0,0.5);
        color: #888; font-size: 10px; cursor: pointer; transition: 0.2s; border: 1px solid transparent;
        display: flex; align-items: center; justify-content: center;
    }
    .btn-settings:hover { color: white; background: rgba(255,255,255,0.1); }
    .scale-popover {
        position: absolute; bottom: 60px; right: 0; background: var(--os-bg); border: 1px solid var(--os-neon);
        border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 5px; z-index: 1000;
        box-shadow: 0 0 15px rgba(0,0,0,0.8);
    }
    .btn-pass {
        width: 35px; height: 35px; border: none; border-radius: 4px; background: rgba(0,0,0,0.5);
        color: #888; font-weight: bold; cursor: pointer; transition: 0.2s;
        border: 1px solid transparent;
    }
    .btn-pass:hover { color: white; background: rgba(255,255,255,0.1); border-color: #888; }

    /* --- DIREITA --- */
    .right-panel {
        width: 250px;
        height: 145px;
        display: flex; flex-direction: column;
        transition: height 0.3s ease;
    }
    .right-panel.expanded { height: 350px; }
    .panel-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 5px 10px; background: rgba(0,0,0,0.5); border-bottom: 1px solid rgba(255,255,255,0.1);
        font-size: 12px; color: var(--os-neon); font-weight: bold;
    }
    .header-controls { display: flex; gap: 5px; }
    .header-controls button {
        background: none; border: none; color: #888; cursor: pointer;
    }
    .header-controls button:hover { color: white; }
    .header-controls .eye-btn.active { color: #00ff41; }
    
    .resolutions-list {
        flex: 1; overflow-y: auto; padding: 5px;
        display: flex; flex-direction: column; gap: 5px;
    }
    .empty-msg { text-align: center; color: #666; font-size: 11px; margin-top: 20px; }
    
    .res-item {
        display: flex; align-items: center; gap: 8px;
        background: rgba(0,0,0,0.4); border-left: 3px solid;
        padding: 5px; border-radius: 3px; position: relative;
    }
    .res-avatar { width: 24px; height: 24px; border-radius: 50%; }
    .res-info { display: flex; flex-direction: column; flex: 1; }
    .res-name { font-size: 10px; color: white; font-weight: bold; }
    .res-pool { font-size: 9px; color: #aaa; }
    
    .toggle-vis-btn {
        position: absolute; right: 5px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer; font-size: 10px;
    }
    .toggle-vis-btn.public { color: #00ff41; }
    .toggle-vis-btn.private { color: #f33; }

</style>
