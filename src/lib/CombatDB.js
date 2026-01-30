export class CombatDB {
    // Retorna a lista de membros garantindo que seja um Array limpo
    static getSilhouette(actor) {
        const raw = actor.system.silhouette || [];
        const list = Array.isArray(raw) ? raw : Object.values(raw);
        
        // Garante que cada item tenha os campos necessários e IDs únicos
        return list.map(p => ({
            id: p.id || foundry.utils.randomID(),
            name: p.name || "Membro",
            loc: p.loc || "0",
            hp: Number(p.hp || 3),
            killing: Number(p.killing || 0),
            shock: Number(p.shock || 0),
            lar: Number(p.lar || 0),
            har: Number(p.har || 0)
        }));
    }

    // O "Hard Save": Salva no banco e impede que o Foundry tente "adivinhar" mudanças
    static async save(actor, newList) {
        // Remove referências circulares e limpa para salvar
        const cleanList = JSON.parse(JSON.stringify(newList));
        
        await actor.update({
            "system.silhouette": cleanList
        }, { diff: false, recursive: false, render: false }); 
        // render: false impede que a janela "pisque" ao salvar
    }
}