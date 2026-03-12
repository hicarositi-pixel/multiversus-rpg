/**
 * CombatEffect.js
 * Gerenciador Mestre Unificado de Efeitos e Táticas de Combate (Nexus Tactical OS / ORE)
 * Caminho: src/Logic/CombatEffect.js
 */

export const CombatEffect = {

    // =========================================================================
    // 1. ORÇAMENTO DE MANOBRAS (CUSTO EM DADOS)
    // =========================================================================

    /**
     * calculateManeuverCost(maneuversList, freeManeuverBuffs)
     * * O que faz: Calcula a penalidade de dados para colocar na UI.
     * Toda manobra custa 1 Dado da Pool. Se o jogador tiver "dados extras para manobras" (Buffs),
     * eles absorvem o custo antes de penalizar a pool real de ataque.
     */
    calculateManeuverCost: (maneuversList = [], freeManeuverBuffs = 0) => {
        let totalCost = maneuversList.length; // 1 dado por manobra listada
        let realPenalty = Math.max(0, totalCost - freeManeuverBuffs);

        return {
            cost: totalCost,
            absorbed: totalCost - realPenalty,
            actualDicePenalty: realPenalty // Quantos dados normais (D) remover da rolagem
        };
    },

    // =========================================================================
    // 2. TÁTICAS DE PRÉ-ROLAGEM E AMBIENTE (MODIFICAM A POOL ANTES DO ROLAMENTO)
    // =========================================================================

    /**
     * applyPreRollTactics(basePool, tactics, env, weapon)
     * * O que faz: Aplica bônus de preparo (Mira, Surpresa) e penalidades de ambiente (Distância, Movimento).
     * * Processa também a mecânica de Armas de Fogo (Spray, Fogo Rápido, Supressão).
     */
    applyPreRollTactics: (basePool, tactics = {}, env = {}, weapon = {}) => {
        let modifiedPool = { d: basePool.d || 0, hd: basePool.hd || 0, wd: basePool.wd || 0 };
        let selfGobble = 0; // Dados que o próprio jogador perde (cancelam seus melhores acertos)
        let ammoUsed = 1;
        let isSuppressing = false;

        // --- A. ARMAS AUTOMÁTICAS E SUPRESSÃO ---
        if (tactics.suppressingFire && weapon.spray > 0) {
            // Fogo de Supressão: Ignora a pool base. Rola 2d + Spray. Acerta área inteira.
            modifiedPool = { d: 2 + weapon.spray, hd: 0, wd: 0 };
            ammoUsed = 'ALL'; // Esvazia o pente
            isSuppressing = true;
            tactics.aimingTurns = 0; // Supressão anula mira
            tactics.calledShot = false; // Supressão anula tiro chamado

        } else if (tactics.useSpray && weapon.spray > 0) {
            // Ataque Spray: Soma os dados de Spray na Pool. Qualquer conjunto acerta.
            modifiedPool.d += weapon.spray;
            ammoUsed = modifiedPool.d; // Gasta balas igual ao total de dados rolados
            tactics.aimingTurns = 0; // Spray anula mira
            tactics.calledShot = false;

        } else if (tactics.rapidFire && !weapon.isSlow) {
            // Tiro Rápido (Semi-auto): +1d, gasta balas = pool. (Na Resolução, só pega 1 conjunto).
            modifiedPool.d += 1;
            ammoUsed = modifiedPool.d;
        }

        // --- B. BÔNUS DE TÁTICA ---
        // Mira (Max +2d).
        if (tactics.aimingTurns > 0) modifiedPool.d += Math.min(tactics.aimingTurns, 2);
        
        // Alvo Grande/Estacionário a curta distância (+2d automático)
        if (tactics.largeStationaryTarget && env.range === 'curta') modifiedPool.d += 2;

        // Ataque Surpresa (Sneak Attack) ou Sniping (+1d)
        if (tactics.sneakAttack || tactics.sniping) modifiedPool.d += 1;


        // --- C. PENALIDADES DE EXECUÇÃO ---
        // Desarmar e Ataque Direcionado já devem ter seu custo cobrado pelo `calculateManeuverCost`
        // Mas se a interface não cobrar lá, garantimos a cobrança aqui:
        if (tactics.calledShotPenalty) modifiedPool.d = Math.max(0, modifiedPool.d - 1);
        if (tactics.disarmPenalty) modifiedPool.d = Math.max(0, modifiedPool.d - 1);


        // --- D. PENALIDADES DE AMBIENTE (ALCANCE E MOVIMENTO) ---
        // Distância
        if (env.range === 'longa') {
            if (tactics.useSpray) selfGobble += 1; // Spray sofre gobble em distância
            else modifiedPool.d = Math.max(0, modifiedPool.d - 1); // Armas normais perdem 1d
        } else if (env.range === 'extrema') {
            if (tactics.useSpray) selfGobble += 2; 
            else selfGobble += 1; // Armas normais sofrem gobble em distância extrema
        }

        // Movimento do Atirador
        if (env.movement === 'lento') {
            modifiedPool.d = Math.max(0, modifiedPool.d - 1); // Moveu < 50% = perde 1d
        } else if (env.movement === 'rapido') {
            selfGobble += 1; // Moveu > 50% = 1 Gobble Die contra si mesmo
        }

        return { pool: modifiedPool, selfGobble, ammoUsed, isSuppressing };
    },

    // =========================================================================
    // 3. VELOCIDADE E DANO OFENSIVO (CALCULADOR BASE)
    // =========================================================================
    
    calculateEffectiveSpeed: (baseWidth, speedBonus = 0) => {
        return baseWidth + speedBonus; // Usado para reordenar a Timeline de Ações
    },
    
    calculateTotalDamage: (baseWidth, weaponDamage = 0, skillBonus = 0) => {
        return baseWidth + weaponDamage + skillBonus;
    },

    // =========================================================================
    // 4. MANOBRAS DE PÓS-ROLAGEM E EFEITOS DE STATUS
    // =========================================================================
    
    /**
     * processManeuvers(actionSet, maneuversList, targetLimb, isThrownObject)
     * * O que faz: Modifica os atributos do acerto e insere condições físicas/táticas no alvo.
     */
    processManeuvers: (actionSet, maneuversList = [], targetLimb = null, isThrownObject = false) => {
        let modifiedAction = { 
            width: actionSet.width, height: actionSet.height,
            shock: actionSet.rawShock || 0, kill: actionSet.rawKill || 0, pen: actionSet.pen || 0,
            speedBonus: 0
        };

        let conditions = []; 
        let targetPenalty = 0; // Quantos dados remover da melhor rolagem do alvo (Finta/Empurrão)

        // Regra ORE: Arremesso de Objeto Grande (Carro, Lixeira)
        if (isThrownObject) {
            conditions.push({ type: 'crushed', label: 'Esmagado', icon: 'fa-car-crash' });
        }

        maneuversList.forEach(maneuver => {
            switch(maneuver.toLowerCase()) {
                
                // --- ALTERAÇÕES DE DANO E HIT ---
                case 'cuidadoso': // Careful attack: Kill vira Shock
                    modifiedAction.shock += modifiedAction.kill; modifiedAction.kill = 0; break;
                case 'cruel': // Vicious attack: Shock vira Kill
                    modifiedAction.kill += modifiedAction.shock; modifiedAction.shock = 0; break;
                case 'poderoso': // Powerful attack / Powerful shot: +1 Width apenas para Dano
                    modifiedAction.shock += 1; break; 
                case 'rapido': // Fast attack / Fast shot: +1 Width apenas para Iniciativa
                    modifiedAction.speedBonus += 1; break;
                case 'sniping': // Tiro de Precisão
                    if (modifiedAction.kill > 0) conditions.push({ type: 'trauma_check', label: 'Trauma: Assassinato a Sangue Frio' });
                    break;
                case 'finta': // Feint (Ataque falso)
                    targetPenalty += 1; // Alvo perde 1 dado da melhor rolagem dele
                    break;

                // --- CONTROLE DE GRUPO (CC) E STATUS CORPO A CORPO ---
                case 'knockdown': // Derrubar
                    modifiedAction.shock += 1; conditions.push({ type: 'prone', label: 'Derrubado (Caído)' }); break;
                case 'atordoar': // Daze
                    conditions.push({ type: 'daze', label: 'Atordoado', penalty: modifiedAction.width, duration: modifiedAction.width }); break;
                case 'empurrar': // Shove
                    targetPenalty += 1; conditions.push({ type: 'shoved', label: 'Empurrado (Fora de Posição)' }); break;
                
                case 'lutar': // Wrestle
                    modifiedAction.shock += 1; conditions.push({ type: 'pinned', label: 'Imobilizado (Agarrado)' }); break;
                
                case 'estrangulamento': // Choke (Requer imobilização ou tiro na cabeça)
                    modifiedAction.shock += 1; 
                    conditions.push({ type: 'choking', label: 'Asfixiando (1 Shock/Turno)', damagePerTurn: 1 }); break;
                
                case 'estrangulamento_letal': // Strangling (Sufocamento sanguíneo)
                    modifiedAction.shock += 1; 
                    conditions.push({ type: 'strangling', label: 'Sufocando (2 Shock/Turno)', damagePerTurn: 2 }); break;
            }
        });

        return { finalDamage: modifiedAction, conditions, targetPenalty };
    },

    // =========================================================================
    // 5. FÍSICA DE IMPACTO: RECUO (KNOCKBACK)
    // =========================================================================
    
    calculateKnockback: (attackerStats, targetStats, totalDamage, resistBodyUsed = 0) => {
        let canKnockback = false;
        let referenceDice = 0;

        if (attackerStats.isPower && attackerStats.hasMassCap && attackerStats.dice >= 6) {
            canKnockback = true; referenceDice = attackerStats.dice;
        } else if (attackerStats.bodyStat >= 6) {
            canKnockback = true; referenceDice = attackerStats.bodyStat;
        }

        if (!canKnockback) return { distance: 0, selfDamage: 0, impactDamage: 0 };

        let kbDistance = totalDamage;
        if (referenceDice > 6) kbDistance += (referenceDice - 6) * 2;

        const tMass = targetStats.massKg || 100;
        if (tMass > 100) { kbDistance -= (Math.floor(Math.log2(tMass / 100)) * 2); } 
        else if (tMass < 50) { kbDistance += (Math.floor(Math.log2(100 / tMass)) * 2); }

        let selfDamage = 0;
        if (resistBodyUsed > 0) { kbDistance -= resistBodyUsed; selfDamage = resistBodyUsed; }

        kbDistance = Math.max(0, kbDistance);
        
        let impactDamage = 0;
        if (kbDistance > targetStats.wallDistance) {
            impactDamage = kbDistance - targetStats.wallDistance; // Dano de colisão ORE
            kbDistance = targetStats.wallDistance; 
        }

        return { distance: kbDistance, selfDamage, impactDamage };
    },

    // =========================================================================
    // 6. ARMADURA E PENETRAÇÃO
    // =========================================================================
    
    calculateEffectiveArmor: (har, lar, armorType, penValue, penType) => {
        let effectivePen = 0;

        if (penType === 'verdadeira') { effectivePen = penValue; } 
        else if (armorType === 'blindada') { effectivePen = 0; } 
        else if (armorType === penType) { effectivePen = penValue; } 
        else { effectivePen = 0; }

        let effectiveHAR = Math.max(0, har - effectivePen);
        let remainingPen = Math.max(0, effectivePen - har);
        let effectiveLAR = Math.max(0, lar - remainingPen);

        return { effectiveHAR, effectiveLAR, ignoredArmor: (har - effectiveHAR) + (lar - effectiveLAR) };
    },

    // =========================================================================
    // 7. SISTEMA DE CURA E REGENERAÇÃO
    // =========================================================================
    
    processLimbHealing: (limb, healAmount) => {
        let remainingHeal = healAmount;
        let currentK = limb.killing || 0;
        let currentS = limb.shock || 0;

        // Prioridade: Curar Killing Damage
        while (remainingHeal > 0 && currentK > 0) { currentK--; remainingHeal--; }
        // Depois: Curar Shock Damage
        while (remainingHeal > 0 && currentS > 0) { currentS--; remainingHeal--; }

        return { ...limb, killing: currentK, shock: currentS, healedAmount: healAmount - remainingHeal, wastedHeal: remainingHeal };
    },

    processFullBodyHealing: (allLimbs, totalHealAmount) => {
        let remainingHeal = totalHealAmount;
        let updatedLimbs = JSON.parse(JSON.stringify(allLimbs));
        let damagedLimbs = updatedLimbs.filter(l => l.killing > 0 || l.shock > 0);

        // Espalha a cura pelo corpo, focando nos locais mais feridos letalmente
        while (remainingHeal > 0 && damagedLimbs.length > 0) {
            damagedLimbs.sort((a, b) => b.killing - a.killing || b.shock - a.shock);
            let targetLimb = damagedLimbs[0];

            if (targetLimb.killing > 0) { targetLimb.killing--; } 
            else if (targetLimb.shock > 0) { targetLimb.shock--; }
            
            remainingHeal--;
            damagedLimbs = updatedLimbs.filter(l => l.killing > 0 || l.shock > 0);
        }
        return updatedLimbs;
    }
};