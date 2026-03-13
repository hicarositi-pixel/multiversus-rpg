import { writable, get } from 'svelte/store';
import { OnlineCombat } from './OnlineCombat.js';

// ========================================================
// SVELTE STORES: AS VARIÁVEIS GLOBAIS (Acessíveis de qualquer arquivo)
// ========================================================
export const combatQueue = writable([]);
export const combatPhase = writable('declaration');
export const activeTurnId = writable(null);

export class CombatManager {
    
    // --- 1. MUDANÇA DE TURNO & AUTO-DESTRAVAMENTO ---
    static setTurn(turnId) {
        activeTurnId.set(turnId);
        
        // Magia: Se o turno passar para você, o sistema destrava sua ação automaticamente pra você narrar/alterar!
        combatQueue.update(queue => {
            const current = queue.find(c => c.id === turnId);
            if (current && current.submitted) {
                current.submitted = false; // Destrava
                current.ready = false;
                ui.notifications.info(`[TURNO ATIVO] Os vetores de ${current.name} foram destravados para narração.`);
            }
            return queue;
        });

        // Avisa a internet instantaneamente
        OnlineCombat.broadcastTurn(turnId);
    }

    // --- 2. TRAVAMENTO DE AÇÃO (LOCK) ---
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
        OnlineCombat.broadcastLock(actorId);
    }

    // --- 3. RELATÓRIO ESPIÃO DETALHADO (AAA) ---
    // Calcula TUDO e gera um texto rico para o Painel do Mestre
    static generateDetailedSummary(combatant) {
        if (!combatant || !combatant.actions || combatant.actions.length === 0) {
            return `<div style="color:#888; font-style:italic;">Nenhuma ação programada ainda.</div>`;
        }

        let html = `<div style="display:flex; flex-direction:column; gap:8px;">`;
        let totalPenalty = Math.max(0, combatant.actions.length - 1); // Custo base de múltiplas ações

        combatant.actions.forEach((act, i) => {
            let color = act.type === 'ataque' ? '#f33' : act.type === 'defesa' ? '#08f' : '#a855f7';
            html += `<div style="background:#111; border-left:3px solid ${color}; padding:6px; border-radius:4px; font-size:11px;">`;
            html += `<strong style="color:${color}">0${i+1} [${act.type.toUpperCase()}]</strong> `;

            // Detalhes por tipo
            if (act.type === 'ataque') {
                html += `(${act.style.toUpperCase()}) Dano base: <b style="color:#fff">${act.weapon.dmg}</b> | Pen: <b>${act.weapon.pen}</b>. `;
                if (act.tactics?.calledShot) {
                    html += `<span style="color:#ffaa00">>> MIRA: Local ${act.tactics.targetLocation}</span>. `;
                    totalPenalty += 1;
                }
            } 
            else if (act.type === 'defesa') {
                if (action.defense?.style === 'block') {
                    html += `(Esquiva) Mecânica: <b style="color:#fff">${act.defense.defType.toUpperCase()}</b>. `;
                } else {
                    html += `(Barreira) LAR: <b>${act.defense.lar}</b> | HAR: <b>${act.defense.har}</b>. `;
                }
            } 
            else if (act.type === 'utilidade') {
                html += `Ação Focada em: <b style="color:#fff">${act.utility.style.toUpperCase()}</b>. `;
            }

            // Lista Efeitos Especiais (Mutações) com destaque!
            if (act.maneuvers && act.maneuvers.length > 0) {
                totalPenalty += act.maneuvers.length; // Soma as penalidades
                const mappedManeuvers = act.maneuvers.map(m => m.toUpperCase());
                html += `<div style="margin-top:4px; font-size:9px; color:#00ff41;">
                            <i class="fas fa-dna"></i> EFEITOS: ${mappedManeuvers.join(' | ')}
                         </div>`;
            }

            // Mostra a narrativa do jogador se houver
            if (act.desc) {
                html += `<div style="margin-top:4px; font-size:10px; color:#aaa; font-style:italic;">"${act.desc}"</div>`;
            }

            html += `</div>`;
        });

        // Rodapé do relatório mostrando a Pool real que o jogador vai rolar
        const p = combatant.poolToRoll || combatant.pool;
        html += `<div style="background:#000; border-top:1px dashed #333; padding:5px; font-size:10px; text-align:center;">
                    <b>POOL EFETIVA:</b> <span style="color:#fff">${p.d}D</span> | <span style="color:#f33">${p.hd}H</span> | <span style="color:#fc0">${p.wd}W</span><br>
                    <span style="color:#ffaa00;">Custo Tático Total Estimado: -${totalPenalty}D</span>
                 </div>`;
        html += `</div>`;

        return html;
    }
}