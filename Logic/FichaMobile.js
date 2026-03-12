import { ResumoLogic } from './resumo.js';
import { EffectLogic } from './effect.js';

export const FichaMobileLogic = {
    resolveActiveActor: (explicitActorId = null) => {
        if (explicitActorId) return game.actors.get(explicitActorId);
        if (game.user.targets.size > 0) return game.user.targets.values().next().value.actor;
        if (canvas.tokens?.controlled.length > 0) return canvas.tokens.controlled[0].actor;
        return game.user.character || null;
    },

    compileDashboardData: (actor) => {
        if (!actor) return null;
        console.log(`Nexus HUD | Processando: ${actor.name}`);

        try {
            return {
                actorId: actor.id,
                isGM: game.user.isGM,
                header: ResumoLogic.getIdentityData(actor),
                resources: ResumoLogic.getWillpowerData(actor),
                stats: ResumoLogic.getActiveStatsAndSkills(actor),
                powers: ResumoLogic.getActivePowers(actor).map(p => ({
                    ...p,
                    qualitiesData: ResumoLogic.getPowerCapacities(p.rawItem)
                })),
                tactical: {
                    combatBody: { base: ResumoLogic.getBodyData(actor, 'base') },
                    physical: EffectLogic.calculateBodyMetrics(actor) || {},
                    powerMaximums: EffectLogic.getMaxPowerCapacities(actor) || { maxAttackRange: "N/A", maxTravelSpeed: "N/A" }
                }
            };
        } catch (err) {
            console.error("Nexus HUD | Erro na compilação de dados:", err);
            return null;
        }
    },

    preparePowerRoll: (actor, powerId) => {
        const powerObj = ResumoLogic.getActivePowers(actor).find(p => p.id === powerId);
        if (!powerObj) return null;
        return {
            actionName: `ATIVAR: ${powerObj.name.toUpperCase()}`,
            imageUrl: powerObj.img,
            pool: ResumoLogic.buildPowerRollPool(powerObj, 0),
            mods: { buffs: 0, debuffs: 0 }
        };
    }
};