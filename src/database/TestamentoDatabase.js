const MODULE_ID = "multiversus-rpg";

export const TestamentoDatabase = {
    // Busca todos os dados do Testamento salvos na ficha
    getTestData: (actor) => {
        return actor.getFlag(MODULE_ID, "testamento") || {
            isLocked: true,
            isPublic: false,
            notes: [
                { id: foundry.utils.randomID(), title: "ÚLTIMAS_VONTADES", content: "Escreva aqui o que deve ser feito com seus pertences..." },
                { id: foundry.utils.randomID(), title: "DIÁRIO_PESSOAL", content: "" }
            ]
        };
    },

    // Salva uma alteração completa no Testamento
    saveTestData: async (actor, data) => {
        await actor.setFlag(MODULE_ID, "testamento", data);
    },

    // AVISO MAXIMIZADO - FUNCIONA COMO UMA BARREIRA VISUAL
getSacredWarning: () => `
        <div style="font-family: 'Share Tech Mono', monospace; text-align: center;">
            <div style="font-size: 70px; color: var(--c-primary); margin-bottom: 10px;">
                <i class="fas fa-user-secret"></i>
            </div>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #fff; margin-bottom: 20px; border-bottom: 2px solid var(--c-primary); display: inline-block; padding-bottom: 10px;">
                ACESSO RESTRITO
            </h1>
            
            <div style="background: rgba(255, 0, 0, 0.1); border: 1px solid #ff4444; padding: 25px; text-align: left; margin: 20px 0;">
                <h3 style="color: #ff4444; margin-top: 0; font-size: 20px;">⚠️ PROTOCOLO DE PRIVACIDADE NÍVEL 5</h3>
                <p style="font-size: 16px; line-height: 1.5; color: #ffbcbc;">
                    Este ambiente contém dados da <b>PSIQUE PRIVADA</b> do jogador. O acesso não autorizado por mestres ou auxiliares sem o rompimento do "Lacre de Morte" narrativo é uma <b>VIOLAÇÃO GRAVE</b> das regras da Multiversus RPG.
                </p>
                <p style="font-size: 14px; color: #ffbcbc; opacity: 0.8;">
                    O descumprimento resultará em banimento administrativo e quebra permanente de confiança.
                </p>
            </div>

            <p style="font-style: italic; opacity: 0.5; margin-top: 20px;">
                "O que aqui reside pertence apenas ao portador do código e ao destino final."
            </p>
        </div>
    `
};