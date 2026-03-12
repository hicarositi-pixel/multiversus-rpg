/**
 * CombatEngine.js
 * O Cérebro Autônomo de Combate do Nexus Tactical OS.
 * Une os resultados dos dados (ORE.js) com as regras físicas (CombatEffect.js) 
 * e aplica as consequências no banco de dados do Foundry VTT.
 */

import { ORE } from './ORE.js';
import { ResumoLogic } from './resumo.js';
import { CombatEffect } from './CombatEffect.js';

const MODULE_ID = "multiversus-rpg";

export const CombatEngine = {

    // =========================================================================
    // FASE 1: DECLARATION PHASE (INICIATIVA)
    // =========================================================================
    
    /**
     * buildDeclarationQueue(combatants)
     * * O que faz: Ordena quem fala primeiro. No ORE, quem tem MENOS "Sentidos" 
     * declara primeiro. Quem tem mais Sentidos declara por último (pois lê o ambiente e reage ao que os outros vão fazer).
     * * Regra de Desempate: Sentidos -> Comando -> Mente -> Coordenação -> Sorte.
     */
    buildDeclarationQueue: (combatants) => {
        return combatants.sort((a, b) => {
            const statsA = a.stats || {};
            const statsB = b.stats || {};
            
            if (statsA.sense !== statsB.sense) return (statsA.sense || 0) - (statsB.sense || 0);
            if (statsA.command !== statsB.command) return (statsA.command || 0) - (statsB.command || 0);
            if (statsA.mind !== statsB.mind) return (statsA.mind || 0) - (statsB.mind || 0);
            if (statsA.coordination !== statsB.coordination) return (statsA.coordination || 0) - (statsB.coordination || 0);
            return Math.random() - 0.5; // Empate absoluto
        });
    },

    // =========================================================================
    // FASE 2: COMBAT PHASE (RESOLUÇÃO E TIMELINE)
    // =========================================================================

    /**
     * buildTimeline(combatants)
     * * O que faz: Pega os dados que já foram rolados no HUD e transforma em uma fila de ações.
     * * Novidade: Lê as manobras (ex: Ataque Rápido) pelo CombatEffect e altera a "Velocidade Efetiva"
     * para que alguém com [2x10] e Ataque Rápido aja ANTES de alguém com [2x10] normal.
     */
    buildTimeline: (combatants) => {
        let timeline = [];
        
        combatants.forEach(c => {
            // 1. Extrai Conjuntos Válidos (usando a lógica ORE)
            const parsed = ORE.parseResults(c.pool);
            c.currentSets = parsed.validSets;

            // 2. Mapeia cada Conjunto para a Ação Declarada
            c.currentSets.forEach((set, i) => {
                // Se ele rolou 3 sets, mas só declarou 1 ação, as outras viram "Ação Extra" genérica
                let action = c.actions[i] || { type: 'utilidade', text: 'Ação Extra', maneuvers: [] };
                
                // 3. Pré-calcula as manobras APENAS para descobrir a Velocidade Efetiva (Go First)
                let preCalc = CombatEffect.processManeuvers(set, action.maneuvers || []);
                let effectiveSpeed = CombatEffect.calculateEffectiveSpeed(set.width, preCalc.finalDamage.speedBonus);
                
                timeline.push({
                    uniqueId: `${c.id}-${set.height}-${set.width}`,
                    actorId: c.id,
                    name: c.name,
                    img: c.img,
                    width: set.width,
                    effectiveWidth: effectiveSpeed, // A LARGURA REAL QUE VALE PRA INICIATIVA
                    height: set.height,
                    action: action,
                    setIndex: i
                });
            });
        });

        // 4. Ordenação Global ORE: Velocidade Efetiva (Maior primeiro) > Impacto/Altura (Maior primeiro)
        return timeline.sort((a, b) => b.effectiveWidth - a.effectiveWidth || b.height - a.height);
    },


    // =========================================================================
    // FASE 3: EXECUÇÃO AUTÔNOMA DE DEFESA
    // =========================================================================

    /**
     * resolveDefense(defItem, atkItem)
     * * O que faz: Aplica a regra de Gobble Dice. O Defensor consome dados do Atacante.
     * * Considera se o defensor ativou a flag 'interferencia' na declaração.
     */
    resolveDefense: (defItem, atkItem) => {
        let isInterference = defItem.action.params?.defType === 'interferencia';
        
        // Usa a matemática cega da camada Effect
        let defResult = CombatEffect.resolveDefense(
            { width: defItem.effectiveWidth }, 
            { width: atkItem.width }, 
            isInterference
        );

        return defResult; // O HUD vai ler isso e apagar os dados do inimigo na tela
    },


    // =========================================================================
    // FASE 4: EXECUÇÃO AUTÔNOMA DE ATAQUE (A MÁGICA ACONTECE AQUI)
    // =========================================================================

    /**
     * executeAttack(attackerActor, targetActor, timelineItem, weaponData)
     * * O que faz: Junta tudo. Pega o local do tiro, aplica os buffs da arma, 
     * processa as manobras (ex: cruel, atordoar), fura a armadura e aplica no HP.
     */
    executeAttack: async (attackerActor, targetActor, timelineItem, weaponData = {}) => {
        if (!targetActor || !attackerActor) return { error: "Combatentes inválidos." };

        // 1. DADOS BÁSICOS DO ATAQUE
        const hitHeight = timelineItem.height; // Define onde bateu (ex: 10 = Cabeça)
        const baseWidth = timelineItem.width;  // O dano Shock base (Width)

        // Puxa as manobras declaradas na UI (ex: ['cuidadoso', 'knockdown'])
        const maneuvers = timelineItem.action.maneuvers || [];

        // 2. ENCONTRA O MEMBRO ALVO
        const limb = ResumoLogic.getLimbByHitLocation(targetActor, hitHeight, 'base');
        if (!limb) return { error: `Alvo não possui anatomia no local ${hitHeight}.` };

        // 3. CALCULA O DANO BRUTO (Arma + Width)
        // No ORE, o Shock base é igual à Largura (Width). A arma adiciona bônus em S ou K.
        let rawShock = CombatEffect.calculateTotalDamage(baseWidth, weaponData.shock || 0, weaponData.skillBonus || 0);
        let rawKill = weaponData.kill || 0;

        // 4. PROCESSA MANOBRAS ESPECIAIS (Altera o dano e cria Status)
        // Ex: Se for "Cruel", o rawShock inteiro vira rawKill aqui dentro.
        const maneuverResult = CombatEffect.processManeuvers(
            { width: baseWidth, height: hitHeight, rawShock: rawShock, rawKill: rawKill, pen: weaponData.pen || 0 },
            maneuvers, 
            limb,
            weaponData.isThrownObject || false
        );

        let sIn = maneuverResult.finalDamage.shock;
        let kIn = maneuverResult.finalDamage.kill;
        let pen = maneuverResult.finalDamage.pen;

        // 5. CALCULA A ARMADURA DO ALVO (Blindagem vs Penetração)
        const targetArmorType = targetActor.getFlag(MODULE_ID, 'armorType') || 'fisica';
        const armorMath = CombatEffect.calculateEffectiveArmor(
            limb.har || 0, 
            limb.lar || 0, 
            targetArmorType, 
            pen, 
            weaponData.penType || 'fisica'
        );

        // 6. MATEMÁTICA FINAL DO ORE (Armadura vs Dano)
        // HAR reduz dano letal e de choque
        if (armorMath.effectiveHAR > 0) {
            sIn = Math.max(0, sIn - (armorMath.effectiveHAR * 2));
            kIn = Math.max(0, kIn - armorMath.effectiveHAR);
        }
        // LAR converte Kill em Shock e bloqueia Shock
        let sFinal = Math.max(0, sIn - armorMath.effectiveLAR);
        let convertedK = Math.min(kIn, armorMath.effectiveLAR);
        let kFinal = kIn - convertedK;
        sFinal += convertedK; // Killing convertido vira Shock

        // 7. APLICA NAS CAIXAS DE VIDA DO ALVO
        let curK = limb.killing || 0;
        let curS = limb.shock || 0;
        const hp = limb.hp || 4;
        const occupiedTrauma = (limb.trauma || []).length;

        let tempK = curK + kFinal;
        let resultK = tempK;
        let resultS = curS;
        let isDestroyed = false;

        if (tempK >= hp) {
            resultK = hp; 
            resultS = 0;
            isDestroyed = true;
        } else {
            let tempS = curS + sFinal;
            let totalSpace = hp - occupiedTrauma;
            let totalDamage = tempK + tempS;

            if (totalDamage > totalSpace) {
                // Overflow de Shock vira Kill
                let overflow = totalDamage - totalSpace;
                tempK += overflow;
                resultK = Math.min(totalSpace, tempK);
                resultS = Math.max(0, totalSpace - resultK);
            } else {
                resultK = tempK;
                resultS = tempS;
            }
        }
        if (resultK >= hp) isDestroyed = true;

        // 8. SALVA OS DADOS DO MEMBRO NO FOUNDRY (Banco de Dados)
        const allLimbs = targetActor.getFlag(MODULE_ID, 'limbs_base') || [];
        const updatedLimbs = allLimbs.map(l => (l.id === limb.id) ? { ...l, killing: resultK, shock: resultS } : l);
        await targetActor.update({ [`flags.${MODULE_ID}.limbs_base`]: updatedLimbs }, { render: false });

        // 9. SALVA CONDIÇÕES (STATUS) NO ALVO
        // Se a manobra gerou status (ex: Atordoado), salva na ficha do alvo
        if (maneuverResult.conditions.length > 0) {
            const currentConditions = targetActor.getFlag(MODULE_ID, 'combatConditions') || [];
            await targetActor.update({ [`flags.${MODULE_ID}.combatConditions`]: [...currentConditions, ...maneuverResult.conditions] }, { render: false });
        }

        // 10. RECUO (KNOCKBACK) - Apenas se acionar as regras
        const atkBody = attackerActor.system?.stats?.body?.value || 1;
        const tgtMass = targetActor.getFlag(MODULE_ID, 'massKg') || 100;
        const resistBody = timelineItem.action.params?.resistKnockbackDice || 0; // Se o alvo gastou dados pra não voar

        const knockbackResult = CombatEffect.calculateKnockback(
            { isPower: weaponData.isPower, dice: timelineItem.width + timelineItem.action.poolSize, hasMassCap: weaponData.hasMassCap, bodyStat: atkBody },
            { massKg: tgtMass, wallDistance: 10 }, // 10 jardas até a parede (pode vir do mapa no futuro)
            kFinal + sFinal,
            resistBody
        );

        // RETORNA O RELATÓRIO COMPLETO PARA O SVELTE MONTAR O CHAT
        return {
            limbName: limb.name,
            hitHeight: hitHeight,
            effectiveWidth: timelineItem.effectiveWidth,
            damageApplied: { kill: kFinal, shock: sFinal },
            destroyed: isDestroyed,
            conditions: maneuverResult.conditions,
            knockback: knockbackResult
        };
    },

    // =========================================================================
    // FASE 5: CURA AUTOMATIZADA
    // =========================================================================

    /**
     * executeHealing(targetActor, healAmount, limbId = null)
     * * O que faz: Regenera a vida. Prioriza dano letal. Pode curar um membro ou o corpo todo.
     */
    executeHealing: async (targetActor, healAmount, limbId = null) => {
        if (!targetActor) return;
        const allLimbs = targetActor.getFlag(MODULE_ID, 'limbs_base') || [];
        let updatedLimbs = [];

        if (limbId) {
            // Cura Localizada
            updatedLimbs = allLimbs.map(l => {
                if (l.id === limbId) return CombatEffect.processLimbHealing(l, healAmount);
                return l;
            });
        } else {
            // Cura Geral (Corpo Inteiro - Prioriza os mais feridos letalmente)
            updatedLimbs = CombatEffect.processFullBodyHealing(allLimbs, healAmount);
        }

        await targetActor.update({ [`flags.${MODULE_ID}.limbs_base`]: updatedLimbs }, { render: false });
        return true;
    },

    // =========================================================================
    // FASE 6: CONSUMO DE WILLPOWER
    // =========================================================================

    consumeWillpower: async (actor, cost) => {
        if (!actor || cost <= 0) return true;
        const currentWP = actor.getFlag(MODULE_ID, 'currWillpower') || 0;
        
        if (currentWP < cost) {
            ui.notifications.warn("Reserva de Willpower insuficiente!");
            return false; // Bloqueia a ação na UI
        }

        await actor.update({ [`flags.${MODULE_ID}.currWillpower`]: currentWP - cost }, { render: false });
        return true;
    }
};