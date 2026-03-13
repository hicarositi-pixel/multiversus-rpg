import { writable, get } from 'svelte/store';
import { ORE } from './ORE.js';

export const combatQueue = writable([]);
export const combatPhase = writable('declaration');
export const activeTurnId = writable(null);

export const resolutionCombatants = writable([]);
export const timelineEvents = writable([]);
export const revealedSets = writable([]); 

const MODULE_ID = "multiversus-rpg";
const SOCKET_NAME = `module.${MODULE_ID}`;

// FUNÇÃO INTERNA PARA DISPARAR SOCKET (Resolve o erro do Mestre)
function emitSocket(action, data) {
    game.socket.emit(SOCKET_NAME, { action, data });
}

export class CombatManager {
    
    // ==========================================
    // FASE 1: DECLARAÇÃO
    // ==========================================
static setTurn(turnId) {
        activeTurnId.set(turnId);
        combatQueue.update(queue => {
            const current = queue.find(c => c.id === turnId);
            if (current && current.submitted) {
                current.submitted = false; 
                current.ready = false;
                ui.notifications.info(`[TURNO ATIVO] Os vetores de ${current.name} foram destravados para narração.`);
            }
            return queue;
        });
        
        emitSocket('TURN_CHANGED', { turnId }); // Rádio instantâneo
        
        // A MÁGICA AQUI: Salva no banco de dados para os jogadores verem sempre!
        if (game.user.isGM && canvas?.scene) {
            canvas.scene.setFlag(MODULE_ID, "activeTurnId", turnId);
        }
    }

    static lockAction(actorId, actions, pool) {
        combatQueue.update(queue => {
            const combatant = queue.find(c => c.actorId === actorId);
            if (combatant) {
                combatant.actions = actions;
                combatant.poolToRoll = pool;
                combatant.submitted = true;
                combatant.ready = true;
            }
            return queue;
        });
        emitSocket('ACTION_LOCKED', { actorId });
    }

    // ==========================================
    // FASE 2: RESOLUÇÃO E PERSISTÊNCIA ONLINE
    // ==========================================
    static initResolution(combatantsData) {
        revealedSets.set([]); 
        let combatants = combatantsData.map(c => {
            const finalPool = c.poolToRoll || c.pool; 
            const rolledDice = ORE.generateRoll(finalPool);
            return { ...c, rolledDice, reactionUsed: false, currentSets: [] };
        });
        this.updateResolutionState(combatants, false);
    }

    static loadStateFromFlags() {
        if (!canvas?.scene) return false;
        const state = canvas.scene.getFlag(MODULE_ID, "resolutionState");
        const rSets = canvas.scene.getFlag(MODULE_ID, "revealedSets") || [];
        
        if (state && state.length > 0) {
            revealedSets.set(rSets);
            this.updateResolutionState(state, true);
            return true;
        }
        return false;
    }

static updateResolutionState(combatants, skipDbSave = false) {
        let list = [];
        let rSets = get(revealedSets);

        combatants.forEach(c => {
            const parsed = ORE.parseResults(c.rolledDice);
            c.currentSets = parsed.validSets;

            c.currentSets.forEach((set, i) => {
                let action = c.actions[i] || { type: 'utilidade', utility: { style: 'move' }, text: 'Ação Improvisada' };
                let speedBonus = 0;
                if (action.type === 'defesa') speedBonus = action.defense?.goFirst || 0;
                if (action.maneuvers?.includes('rapido')) speedBonus += 1;
                
                let stableId = `${c.id}-${i}`; 
                
                list.push({
                    uniqueId: stableId, actorId: c.id, name: c.name, img: c.img,
                    width: set.w, effectiveSpeed: set.w + speedBonus, height: set.h,
                    action: action, setIndex: i, sourceUnit: c,
                    isRevealed: rSets.includes(stableId)
                });
            });
        });
        
        list.sort((a, b) => b.effectiveSpeed - a.effectiveSpeed || b.height - a.height);
        
        resolutionCombatants.set(combatants);
        timelineEvents.set(list);

        // CORREÇÃO: Salvamento Seguro à prova de falhas!
        if (game.user.isGM && !skipDbSave && canvas?.scene) {
            canvas.scene.setFlag(MODULE_ID, "resolutionState", combatants).then(() => {
                canvas.scene.setFlag(MODULE_ID, "revealedSets", rSets).then(() => {
                    emitSocket('RESOLUTION_SYNC', { combatants, revealedSets: rSets });
                });
            });
        }
    }

    // ==========================================
    // INTERAÇÕES DE JOGO (REVELAR, WIGGLE, DANO)
    // ==========================================
    static revealSet(setId) {
        revealedSets.update(s => {
            if (!s.includes(setId)) s.push(setId);
            return s;
        });
        const currentCombatants = get(resolutionCombatants);
        this.updateResolutionState(currentCombatants); 
    }

    static async resetResolutionState() {
        if (!game.user.isGM || !canvas.scene) return;
        resolutionCombatants.set([]);
        timelineEvents.set([]);
        revealedSets.set([]);
        await canvas.scene.unsetFlag(MODULE_ID, "resolutionState");
        await canvas.scene.unsetFlag(MODULE_ID, "revealedSets");
        console.log("NEXUS | Sistema de Resolução resetado para nova rodada.");
    }

    static setWiggleDie(unitId, index, value) {
        let combatants = get(resolutionCombatants);
        const cIndex = combatants.findIndex(c => c.id === unitId);
        if (cIndex === -1) return;
        combatants[cIndex].rolledDice = ORE.assignWiggleValue(combatants[cIndex].rolledDice, index, value);
        this.updateResolutionState(combatants);
    }

    static triggerReaction(unitId) {
        let combatants = get(resolutionCombatants);
        const cIndex = combatants.findIndex(c => c.id === unitId);
        if (cIndex === -1) return;
        const c = combatants[cIndex];
        if (c.reactionUsed) return;
        const reactD = c.pool.reaction?.d || 2; 
        for(let i=0; i<reactD; i++) c.rolledDice.push({ val: Math.floor(Math.random() * 10) + 1, type: 'd' });
        c.reactionUsed = true;
        this.updateResolutionState(combatants);
    }

    static consumeSet(unitId, width, height) {
        let combatants = get(resolutionCombatants);
        const cIndex = combatants.findIndex(c => c.id === unitId);
        if (cIndex === -1) return;
        let removed = 0;
        combatants[cIndex].rolledDice = combatants[cIndex].rolledDice.filter(d => {
            if (removed < width && d.val === height) { removed++; return false; }
            return true;
        });
        this.updateResolutionState(combatants);
    }

    static applyDamageGobble(unitId, amount) {
        if (amount <= 0) return 0;
        let combatants = get(resolutionCombatants);
        let cIndex = combatants.findIndex(c => c.id === unitId);
        if (cIndex === -1) return 0;
        let diceList = [...combatants[cIndex].rolledDice];
        diceList.sort((a, b) => b.val - a.val); 
        let removed = 0;
        let newList = [];
        for (let d of diceList) {
            if (removed < amount && d.val > 0) removed++;
            else newList.push(d);
        }
        combatants[cIndex].rolledDice = newList;
        this.updateResolutionState(combatants);
        return removed;
    }

    static generateDetailedSummary(combatant) {
        if (!combatant || !combatant.actions || combatant.actions.length === 0) return `<div style="color:#888; font-style:italic;">Nenhuma ação programada.</div>`;
        let html = `<div style="display:flex; flex-direction:column; gap:8px;">`;
        let totalPenalty = Math.max(0, combatant.actions.length - 1);
        combatant.actions.forEach((act, i) => {
            let color = act.type === 'ataque' ? '#f33' : act.type === 'defesa' ? '#08f' : '#a855f7';
            html += `<div style="background:#111; border-left:3px solid ${color}; padding:6px; border-radius:4px; font-size:11px;"><strong style="color:${color}">0${i+1} [${act.type.toUpperCase()}]</strong> `;
            if (act.type === 'ataque') {
                html += `(${act.style.toUpperCase()}) Dano base: <b style="color:#fff">${act.weapon.dmg}</b> | Pen: <b>${act.weapon.pen}</b>. `;
                if (act.tactics?.calledShot) { html += `<span style="color:#ffaa00">>> MIRA: Local ${act.tactics.targetLocation}</span>. `; totalPenalty += 1; }
            } else if (act.type === 'defesa') {
                if (act.defense?.style === 'block') html += `(Esquiva) Mecânica: <b style="color:#fff">${act.defense.defType.toUpperCase()}</b>. `;
                else html += `(Barreira) LAR: <b>${act.defense.lar}</b> | HAR: <b>${act.defense.har}</b>. `;
            } else if (act.type === 'utilidade') { html += `Ação Focada em: <b style="color:#fff">${act.utility.style.toUpperCase()}</b>. `; }
            if (act.maneuvers && act.maneuvers.length > 0) {
                totalPenalty += act.maneuvers.length; const mappedManeuvers = act.maneuvers.map(m => m.toUpperCase());
                html += `<div style="margin-top:4px; font-size:9px; color:#00ff41;"><i class="fas fa-dna"></i> EFEITOS: ${mappedManeuvers.join(' | ')}</div>`;
            }
            if (act.desc) html += `<div style="margin-top:4px; font-size:10px; color:#aaa; font-style:italic;">"${act.desc}"</div>`;
            html += `</div>`;
        });
        const p = combatant.poolToRoll || combatant.pool;
        html += `<div style="background:#000; border-top:1px dashed #333; padding:5px; font-size:10px; text-align:center;"><b>POOL EFETIVA:</b> <span style="color:#fff">${p.d}D</span> | <span style="color:#f33">${p.hd}H</span> | <span style="color:#fc0">${p.wd}W</span><br><span style="color:#ffaa00;">Custo Tático Total Estimado: -${totalPenalty}D</span></div></div>`;
        return html;
    }
}