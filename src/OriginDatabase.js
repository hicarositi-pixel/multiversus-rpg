export const OriginDatabase = {
    // Função simples que retorna os dados fixos abaixo
    load: async () => {
        return ORIGINS;
    }
};

/**
 * DATABASE DE ORIGENS
 * Edite aqui manualmente. Use crases (`) para textos longos.
 */
const ORIGINS = {
    
    // --- SLOT 1: SEMI-DIVINO (Já configurado com seu texto) ---
// --- SLOT 2: SEMI-DIVINO (Atualizado) ---
    "semi-divino": {
        id: "semi-divino",
        name: "Semi-Divino",
        icon: "⚡",
        type: "Mítico (80+)",
        
        desc: `
            <p>O Semi-Deus é um ser que não pertence inteiramente ao mundo mortal nem ao plano conceitual que o originou. Ele existe como a manifestação parcial de um conceito, princípio ou ideia elevada — algo que acredita, exige e observa. Aqui também se enquadram os <b>Semi-Demônios</b>, que carregam conceitos parecidos, porém invertidos.</p>
            <p>Diferente de Jogadores ou Experimentos, ele não foi criado artificialmente; foi reconhecido por algo maior. Sua força vem da coerência entre ação, crença e propósito.</p>
            <p><em>Nota: Esta origem não possui acesso a classes, recebendo exclusivamente o Poder Mítico Fisiologia Semi-Divina.</em></p>
        `,

        mechanic: {
            name: "Fé",
            desc: `
                <p>O Semi-Deus substitui Lealdades e Paixões por uma <b>Fé</b> (3 a 5 conceitos como Julgamento, Ordem Absoluta, etc).</p>
                <ul>
                    <li><b>Recuperação de WP:</b> +1 WP ao agir alinhado aos conceitos; +1 WP (máx 1/cena) ao convencer outros a não agirem contra sua Fé.</li>
                    <li><b>Perda de Base Will:</b> -1 Base Will permanentemente ao agir diretamente contra sua Fé.</li>
                </ul>
            `
        },

        traits: [
            {
                name: "Corpo Consagrado",
                effect: "O Semi-Deus possui um corpo parcialmente ancorado em algo além da realidade comum. Uma vez por cena, ele pode escolher ignorar um efeito debilitante físico ou mental leve relacionado a medo, dor ou intimidação. Em contrapartida, sempre que sofrer dano extremo ou efeitos que desafiem diretamente sua Fé, ele sofre −2 Dados em ações subsequentes até o fim da cena, pois sua natureza divina reage mal à contradição, assim como, o usuário nunca teve risco real de vida desde o momento de sua existência."
            },
            {
                name: "Milagre Menor",
                effect: "Uma vez por sessão, o Semi-Deus pode declarar um Milagre Menor coerente com sua Fé, concedendo um efeito narrativo ou mecânico moderado, como bônus temporários, alteração leve do ambiente ou proteção momentânea, em termos sistematicos, ele usa de forma variavel um poder Raro, e usaria de sistematicas relacionados a esse poder. O Milagre não pode causar dano direto alto nem anular consequências graves. Após o uso, o personagem entra em Silêncio Divino, ficando incapaz de recuperar Willpower por Fé até o fim da cena seguinte."
            },
            {
                name: "Julgamento Inerente",
                effect: "A presença do Semi-Deus carrega peso conceitual. Sempre que interagir com criaturas, NPCs ou entidades que contrariem diretamente sua Fé, o personagem recebe +2 Dados Normais em testes de Intimidação, Autoridade ou Confronto Moral. Em contrapartida, ele sofre −2 Dados Normais em testes de Charm ou manipulação social com indivíduos que não reconhecem, respeitam ou compreendem sua natureza divina."
            },
            {
                name: "Vínculo de Adoração",
                effect: "O Semi-Deus pode formar vínculos com seguidores, cultos menores ou indivíduos que acreditam em sua Fé. Enquanto possuir ao menos um seguidor ativo na narrativa, ele recebe +1 WD em testes de Estabilidade. No entanto, sempre que um seguidor morre, é corrompido ou abandona a Fé por consequência direta das ações do Semi-Deus, ele não pode recuperar Willpower por Fé até o fim da próxima sessão."
            },
            {
                name: "Corpo Semi-Divino",
                effect: "A mesma essência que fortalece o Semi-Deus o torna rígido. Seu corpo possui naturalmente +1 HP em todas as partes e 1 ponto de LAR (Impenetrável), refletindo sua resistência sobrenatural. Em contrapartida, essa natureza parcialmente absoluta dificulta adaptação, improviso e concessões mundanas. Sempre que tentar agir de forma ambígua, relativizar sua Fé, ocultar sua natureza ou contornar dilemas conceituais, o personagem sofre −2 Dados Normais nesses testes. Quebrar conscientemente sua coerência divina pode evitar essa penalidade, mas sempre implica perda de Willpower Base, a critério da gravidade da violação.."
            }
        ],

        powers: `
            <hr>
            <h3>FISIOLOGIA SEMI-DIVINA: [CONCEITO] (2 ND)</h3>
            <p><strong>Poder Principal Mítico (Custo: 8 Pontos por Dado)</strong></p>
            
            <p><b>Fraqueza Clara & Nêmesis:</b> O usuário deve escolher um Nêmesis (Evento, Matéria ou Deus rival). 
            Contato mínimo desativa este poder completamente. Exposição considerável ou ataques do Nêmesis causam 1 Killing Damage no Torso instantaneamente. 
            Contra o Deus rival ou suas criações, o usuário causa +2 de dano e recebe +2 de dano.</p>
            
            <p><b>Hyper Stat (Conceito):</b> Este poder substitui um atributo à escolha. 
            Permite ultrapassar o limite inicial de 5 no atributo. O jogador deve escolher entre investir XP puramente na Fisiologia (Pool do Poder) ou em pontos adicionais de atributo (garantidos pelo poder).</p>
            
            <h4>AÇÕES ESPECIAIS (Se Atributo for diferente de Body)</h4>
            <ul>
                <li><b>Ataque:</b> Toque ou Distância (Dano Shock = W). Usa o Super Atributo. Pode gastar custo variável para efeitos temáticos até o fim da cena.</li>
                <li><b>Defesa:</b> Defesa natural baseada no conceito. Gaste 2 WP para proteger aliados (capacidade dura até o fim da cena).</li>
                <li><b>Movimento:</b> Calcula distância de deslocamento baseada no Atributo escolhido (conforme tabela de Sprint de Body).</li>
            </ul>
        `
    },

   // --- SLOT 2: HUMANO (Atualizado) ---
    "humano": {
        id: "humano",
        name: "Humano",
        icon: "👤",
        type: "Mundano (Não-Anômalo)",
        desc: `<p>O Humano não foi tocado pelo Lobby, não carrega fragmentos do sistema e não herdou sangue divino. Ele é o resultado do mundo como ele é: imperfeito, limitado e insistente. Enquanto outras origens dobram a realidade, o Humano aprende a sobreviver dentro dela, compensando a ausência de milagres com preparo, repetição e especialização.</p>
               <p>É a única origem completamente desconectada de fenômenos sobrenaturais (Fé, System Points ou Fragmentos), possuindo em troca uma ficha mais ampla e flexível.</p>`,
        
        mechanic: { 
            name: "Adaptação Mental", 
            desc: "O Humano não se transforma, ele se acostuma. Sempre que realizar um Teste Mental, Emocional ou de Estabilidade sob pressão (dor, medo, horror, etc.) e obtiver Largura 3 ou maior, ele registra a situação em sua Lista de Adaptações. Cada Adaptação concede +1 Dado de Buff em testes relacionados (máx +2) ou reduz penalidades recorrentes em -1. Limite de Adaptações: Nível +1." 
        },

        classes: [
            { name: "Combatente", benefit: "2 Poderes Principais Combativos (Temática: Hyper Skill)" },
            { name: "Profissional", benefit: "2 Poderes Principais Não Combativos (Temática: Hyper Skill)" },
            { name: "Faz-Tudo", benefit: "1 Poder Principal Combativo e 1 Não Combativo (Temática: Hyper Skill)" }
        ],

        traits: [
            { 
                name: "Corpo Frágil", 
                effect: "-1 HP permanente em todas as partes do corpo. Se sofrer dano médio/alto, teste de Estabilidade física ou -1 Dado Normal em ações físicas até o fim da cena.",
                bonus: "+10 Pontos Iniciais" 
            },
            { 
                name: "Mente Cética", 
                effect: "-2 Dados Normais em testes para compreender fenômenos anômalos, paradoxais ou não humanos.",
                bonus: "+10 Pontos Iniciais" 
            },
            { 
                name: "Dependência de Recursos", 
                effect: "-2 Dados Normais em ações complexas realizadas sem ferramentas ou equipamentos apropriados.",
                bonus: "+10 Pontos Iniciais" 
            },
            { 
                name: "Cansaço Real", 
                effect: "Após 2 cenas consecutivas de esforço intenso ou risco contínuo, sofre 1 de Exaustão (aplicada como Dados de Debuff em todas as rolagens) até que haja descanso.",
                bonus: "+10 Pontos Iniciais" 
            },
            { 
                name: "Psicologia Comum", 
                effect: "-1 Dado Normal adicional contra medo extremo e horror. Willpower só é recuperado por meios narrativos (descanso, conforto, segurança).",
                bonus: "+10 Pontos Iniciais" 
            }
        ],

        powers: "<p>Humanos não acessam poderes anômalos. Suas capacidades vêm de <b>Hyper Skills</b>: o ápice do treinamento humano. Eles devem escolher uma das três classes (Combatente, Profissional ou Faz-Tudo) para definir seus poderes iniciais.</p>"
    },

    // --- SLOT 3: ESPAÇO VAZIO ---
"experimento": {
        id: "experimento",
        name: "Experimento",
        icon: "🧪",
        type: "Lendário (Híbrido)",
        
        desc: `
            <p>Você não foi moldado para escolher, foi moldado para responder. Durante um período da sua vida, cada dia foi reduzido a protocolos, testes e reações observadas de forma clínica. O medo não era um risco, era uma ferramenta; a dor era apenas um dado coletado.</p>
            <p>Seu corpo aprendeu a funcionar sem pedir permissão à sua mente. Você carrega um legado silencioso: funciona melhor no caos e no perigo do que na normalidade ou no conforto. Você é uma arma ou uma ferramenta que sobreviveu ao seu propósito original.</p>
            <p><em>Nota: Esta origem possui uma classe única ("Experimento"), recebendo 1 Poder Principal Raro variável e o Poder Lendário Fisiologia Experimental.</em></p>
        `,

        mechanic: {
            name: "Adaptação Física",
            desc: `
                <p>O corpo do Experimento aprende com o dano. Sempre que for exposto a condições adversas (frio, toxinas, radiação, etc.) e obtiver <b>Largura 3 ou maior</b> em um Teste de Resistência, ele registra uma Adaptação Física.</p>
                <ul>
                    <li><b>Efeito:</b> +1 Dado de Buff ou +1 de Resistência direta contra aquela condição (Máx +2).</li>
                    <li><b>Limite:</b> Pode manter um número de adaptações igual a Nível +1.</li>
                </ul>
            `
        },

        traits: [
            {
                name: "Condicionamento Forçado",
                effect: "+1 WD em Estabilidade (medo/intimidação) e Resistência Mental 1. Em cenas sociais ou seguras: -2 Dados em Charm e recupera -1 WP."
            },
            {
                name: "Dossiê",
                effect: "1x por sessão, recebe informações privilegiadas do Mestre sobre ameaças/dificuldades. Contudo, organizações podem rastreá-lo e conhecem suas fraquezas."
            },
            {
                name: "Tolerância à Dor",
                effect: "+1 WD contra dor; não desmaia por dano e ações não são interrompidas. Penalidade: O jogador NÃO sabe seu HP atual (apenas o Mestre controla)."
            },
            {
                name: "Marcas do Experimento (Obrigatória)",
                effect: "Possui 3 cicatrizes. Cada cicatriz em um membro causa +1 Killing Damage extra ao receber dano ali. Concede +2 Dados em Intimidação."
            },
            {
                name: "Dependência de Estrutura",
                effect: "-1 Dado se agir sem ordens claras. Se receber instruções (gasta 1 período), ganha +1 Dado em todos os testes para cumprir aquela função por 24h."
            }
        ],

        powers: `
            <hr>
            <h3>FISIOLOGIA EXPERIMENTAL (2 HD)</h3>
            <p><strong>Poder Principal Lendário (Custo: 8 Pontos por Dado)</strong></p>
            
            <p><b>Fraqueza Biológica:</b> Escolha uma matéria/evento (Sol, Lua, Madeira, Pedra, Fogo, Vento, Areia, Terra, Água, Metal ou Sangue). Contato mínimo desativa o poder; exposição considerável causa 1 Killing Damage no Torso imediatamente.</p>
            
            <p><b>Resistência Sobre-humana:</b> +2 Dados em Resistência. Se a pool exceder 10 dados, os excedentes tornam-se HD. Imunidade a venenos e toxinas convencionais.</p>
            
            <p><b>Vitalidade Sintética:</b> O personagem recebe +W (2) de HP em todas as partes do corpo.</p>
            
            <p><b>Hyper Stat (Body):</b> Este poder substitui o atributo Body. Permite ultrapassar o limite de 5. O XP pode ser gasto para evoluir a Pool do Poder ou comprar pontos permanentes de Body acima do limite.</p>
            
            <p><b>Combate & Bloqueio:</b> Ataques com Briga causam +1 de Dano. Bloqueios recebem +1 Dado e anulam a penalidade de múltipla ação uma vez por rodada.</p>
            
            <p><b>Poder Adicional:</b> O jogador deve escolher 1 Poder Principal Raro (Variavel) que combine com seu tema de experimento.</p>
        `
    },

    // --- SLOT 4 ---
// --- SLOT 4: MAGO ---
    "mago": {
        id: "mago",
        name: "Mago",
        icon: "🔮",
        type: "Arcano (Especializado)",
        
        desc: `
            <p>O Mago é alguém que aprendeu a interagir conscientemente com a Energia Nexus, uma força instável que permeia realidades e conceitos. Diferente de outras entidades, o Mago não impõe sua vontade ao sistema — ele negocia com ele.</p>
            <p>Cada magia é um cálculo imperfeito e cada ritual um risco controlado. O Mago é definido pelo estudo, prática e pelos limites que ousa desafiar, sabendo que o uso excessivo pode levar ao colapso físico ou mental.</p>
        `,

        mechanic: {
            name: "Adaptação Mágica",
            desc: `
                <p>O Mago é moldado pela magia. Sempre que for exposto a estressores mágicos (conjuração excessiva, falhas arcanas, ressonância) e obtiver <b>Largura 3 ou maior</b> em testes relacionados, ele registra uma Adaptação.</p>
                <ul>
                    <li><b>Efeito:</b> +1 Dado de Buff ou +1 de Resistência Mágica contra aquela situação específica (Máx +2).</li>
                    <li><b>Limite:</b> Pode manter um número de adaptações igual a Nível +1.</li>
                </ul>
            `
        },

        classes: [
            { name: "Feiticeiro", benefit: "1 Poder Principal e 1 Habilidade Especial." },
            { name: "Mago", benefit: "2 Poderes Secundários Mágicos." },
            { name: "Bruxo", benefit: "1 Poder Principal e 1 Poder Secundário." }
        ],

        traits: [
            {
                name: "Condutor Nexus",
                effect: "-1 WP no custo de magias ativas. Contudo, a cada 3 magias no mesmo dia, recebe -1 Dado de Debuff (cumulativo) em conjuração pelo resto do dia e o dia seguinte."
            },
            {
                name: "Estrutura Arcana",
                effect: "Exige gestos/foco para conjurar. Recebe +1 Dado Normal ao usar a estrutura, e +1 adicional por rodada de preparação (Máx +3 Dados totais)."
            },
            {
                name: "Conhecimento Especializado",
                effect: "Escolha uma Escola de Magia. Magias fora dela sofrem -2 Dados Normais. Magias dentro dela negam até 2 Dados de Debuff de conjuração."
            },
            {
                name: "O Custo do Poder",
                effect: "Falha Crítica gera retrocesso (1d6: perda de WP, Exaustão ou Killing Damage). Acerto Crítico permite escolher um desses efeitos e ganhar o dobro em bônus positivo."
            },
            {
                name: "Sensibilidade Nexus",
                effect: "+1 Dado Normal em testes de magia, rituais ou fenômenos anômalos. Sofre -1 Dado Normal em Percepção ou Investigação de elementos mundanos."
            }
        ],

        powers: `
            <hr>
            <h3>SISTEMÁTICA ARCANIA</h3>
            <p>Diferente de outras origens, o Mago deve escolher uma das três vertentes de aprendizado para definir seus poderes iniciais:</p>
            <ul>
                <li><strong>Feiticeiro:</strong> Focado em um grande poder central e uma técnica utilitária.</li>
                <li><strong>Mago:</strong> Um generalista acadêmico com múltiplos poderes menores.</li>
                <li><strong>Bruxo:</strong> Equilíbrio entre um poder de grande escala e um suporte secundário.</li>
            </ul>
            <p>O uso de magias consome Willpower e está sujeito à <i>Tabela de Retrocesso</i> em caso de falhas críticas, conforme a Trait 'O Custo do Poder'.</p>
        `
    },

    // --- SLOT 5 ---
// --- SLOT 5: SÓCIA ---
    "socia": {
        id: "socia",
        name: "Sócia",
        icon: "🧬",
        type: "Lendário (Replicante)",
        
        desc: `
            <p>Você nunca esteve no Lobby. Ainda assim, tudo em você foi feito a partir dele. O Sócia nasce como algo montado a partir de registros e fragmentos de lógica extraídos de um Jogador verdadeiro.</p>
            <p>Seu corpo, mente e memórias são herdados, não vividos. Os Sócias falam e pensam como Jogadores, compartilhando a sensação de que o mundo real é "errado", mas são, no fundo, cópias tentando validar sua própria existência.</p>
            <p><em>Regra de Poder: Independentemente da classe, o Sócia possui 1 Poder Lendário e os demais são Raros.</em></p>
        `,

        mechanic: {
            name: "Fragmentos de Sistema",
            desc: `
                <p>Resíduos do Lobby que permitem ao Sócia mitigar falhas. Um Fragmento surge em uma <b>Sorte de Principiante</b> (todos os dados > 5, com pelo menos 2 dados na pool).</p>
                <ul>
                    <li><b>Uso:</b> Alivia desgaste mental ou impede que uma falha seja final.</li>
                    <li><b>Restrição:</b> Não aumentam dano, não garantem sucesso e não protegem contra controle mental. São instáveis e não acumulam entre sessões.</li>
                </ul>
            `
        },

        classes: [
            { name: "Aprimorado", benefit: "1 Poder Principal e 1 Habilidade Especial." },
            { name: "Combatente", benefit: "2 Poderes Secundários Combativos." },
            { name: "Mago", benefit: "2 Poderes Secundários Mágicos." },
            { name: "Profissional", benefit: "2 Poderes Principais (Hyper Skill)." },
            { name: "Anormal", benefit: "1 Poder Principal e 1 Secundário." },
            { name: "Casual", benefit: "1 Poder Principal e 1 Item Exclusivo." }
        ],

        traits: [
            {
                name: "Aprendizado Constante",
                effect: "Após observar uma ação por 1 rodada, ganha +1 Dado Normal para reproduzi-la. Sofre -2 Dados em Estabilidade e Autodeterminação."
            },
            {
                name: "Corpo Replicado",
                effect: "1x/cena, reduz gravidade de dano/debuff por 1 WP. Se encontrar outro Sócia: -1 Base Will. Se encontrar o Original: Sua Base Will cai para 0 imediatamente."
            },
            {
                name: "Desacoplamento da Realidade",
                effect: "Perde 1 WP em Falhas Críticas ou rolagens de apenas 1 dado. Dá acesso ao uso de Fragmentos de Sistema."
            },
            {
                name: "Identidade Herdada",
                effect: "1x/sessão: +2 Dados se agir conforme o histórico do Original. Se falhar em 'testes de legitimidade' de Jogador: -2 WP por falha."
            },
            {
                name: "Recém-Nascido",
                effect: "Sem perícias de profissão/backstory. -2 Dados na primeira rolagem de cada cena. Recupera 1 WP por período acordado (curiosidade)."
            }
        ],

        powers: `
            <hr>
            <h3>TABELA DE ORIGEM HERDADA (1d33)</h3>
            <p>O jogador deve rolar para definir de qual Jogador Lendário ele é uma cópia:</p>
            <small>
                1. Batman | 2. Kirito | 3. Barba Loira | 4. Plunder Uchiha | 5. Thanatos Kenpachi | 6. Son Kami | 7. John Wick | 8. Imortal | 9. Maioral | 10. Midra | 11. Kaiba | 12. Dumbledore | 13. One Volheim | 14. Eufrazino | 15. Theodore Valentine | 16. Ryujin | 17. Arthur (Hollow) | 18. Bad | 19. Qiang Ming | 20. Jihan | 21. Omellum | 22. Aharadak | 23. Park | 24. Anaak | 25. William | 26. Blue | 27. Enjin | 28. Akari | 29. Nox Veritas | 30. Dante | 31. Zarath | 32. Shizume | 33. Seykor
            </small>
            <p><strong>Nota Narrativa:</strong> O Fragmento de Sistema é o Sócia "quase" funcionando como deveria — e falhando logo em seguida. Ele não muda o passado, apenas impede que o erro seja o fim da sua história.</p>
        `
    },

    // --- SLOT 6 ---
// --- SLOT 6: MONSTRO ---
    "monstro": {
        id: "monstro",
        name: "Monstro",
        icon: "👹",
        type: "Aberrante (Mutável)",
        
        desc: `
            <p>O Monstro não nasceu para ocupar um lugar no mundo — ele nasceu fora dele. Sua existência lembra a todos que nem tudo pode ser domado ou aceito. Ele é visto antes de ser ouvido; olhares se desviam e mãos procuram armas.</p>
            <p>Seu corpo é "errado" aos olhos comuns: ossos, músculos e carne que se movem ou se regeneram de formas estranhas. O Monstro sobrevive porque aguenta mais do que deveria, vivendo na tensão entre o instinto selvagem e a centelha de escolha.</p>
            <p><em>Nota: Esta origem não possui arquétipos, iniciando obrigatoriamente com 1 Poder Principal Universal.</em></p>
        `,

        mechanic: {
            name: "Natureza Monstruosa",
            desc: `
                <p>O Monstro provoca rejeição instintiva. Sofre <b>−5 Dados Normais</b> em testes de Charm com humanos/sociedade comum. Em contrapartida, possui um corpo em mutação:</p>
                <ul>
                    <li><b>Mutações Iniciais:</b> Começa com 3 Mutações em locais específicos (Benefícios: +2 HP, +2 LAR, +1 Regen, +1 HAR, +1 Passo de Dano ou +1 Dado Normal no local).</li>
                    <li><b>Evolução Extrema:</b> Pode trocar 3 mutações de um mesmo membro por um <b>Novo Membro</b> (Poder Secundário).</li>
                    <li><b>Progressão:</b> Não ganha bônus de HD em Status ao subir de nível; em vez disso, ganha <b>1 nova Mutação Corporal</b> por nível.</li>
                </ul>
            `
        },

        traits: [
            {
                name: "Aberração",
                effect: "-2 Base Will. Recebe +1 HP em todas as partes. Ignora penalidades leves de dor/mutilação e não tem ações interrompidas ao sofrer dano médio/alto na rodada."
            },
            {
                name: "Presença Ameaçadora",
                effect: "1x/cena: Intimidação + 2 Dados para tentar Traumatizar o alvo. Penalidade: -2 Dados em Furtividade e Ocultação (aura de perigo constante)."
            },
            {
                name: "Criatura Instintiva",
                effect: "Usa (1+Nível) p/ cena: +1 Dado Normal em ação instintiva. Consequência: Na próxima rodada, o Mestre assume o controle do personagem (ação puramente animal). -1 Dado em Mind."
            },
            {
                name: "Regeneração Imperfeita",
                effect: "1x/cena: Cura (1+Nível) HP em um local. Custo: Exaustão (Nível do dano - 1). Curar estado 'Morrendo' custa +1 Exaustão adicional."
            },
            {
                name: "Caçado pelo Mundo",
                effect: "O Mestre introduz ameaças recorrentes (caçadores/autoridades). Em contrapartida, o Monstro recebe +1 WD em Resistência e Sobrevivência enquanto estiver sendo caçado ou encurralado."
            }
        ],

        powers: `
            <hr>
            <h3>TABELA DE MUTAÇÕES DISPONÍVEIS</h3>
            <p>Ao criar o personagem (3 iniciais) ou subir de nível (1 nova), escolha um local do corpo e um efeito:</p>
            <ul>
                <li><strong>Vitalidade:</strong> +2 de HP no local escolhido.</li>
                <li><strong>Couraça:</strong> +2 de LAR (Impenetrável) no local escolhido.</li>
                <li><strong>Cura Adaptativa:</strong> +1 de Regeneração Constante no local escolhido.</li>
                <li><strong>Blindagem:</strong> +1 de HAR (Armadura) no local escolhido.</li>
                <li><strong>Instinto Assassino:</strong> +1 de Dano e avanço de Passo (S > K > SK) com o local mutado.</li>
                <li><strong>Eficiência Biológica:</strong> +1 Dado Normal em testes relacionados ao uso do local.</li>
            </ul>
            <p><strong>Nota:</strong> As mutações são visíveis e justificam o preconceito social sofrido pela criatura.</p>
        `
    },

    // --- SLOT 7 ---
// --- SLOT 7: JOGADOR ---
    "jogador": {
        id: "jogador",
        name: "Jogador",
        icon: "🕹️",
        type: "Sistêmico (Lobby)",
        
        desc: `
            <p>Seres sequestrados de seus universos e mantidos no Lobby, um espaço fora da realidade onde necessidades físicas não existiam e tudo era percebido como valores matemáticos.</p>
            <p>Libertados recentemente, os Jogadores carregam resíduos desse estado absoluto e falhas severas de adaptação ao mundo físico. Eles veem a realidade como um sistema a ser manipulado, mas sofrem quando o mundo real não segue as regras lógicas do Lobby.</p>
            <p><em>Regra de Poder: Ao menos 1 Poder deve ser Universal, sendo os demais de padrão Lendário.</em></p>
        `,

        mechanic: {
            name: "System Points (SP)",
            desc: `
                <p>Recurso especial oriundo da experiência no Lobby. System Points permitem vencer circunstâncias anormais e alterar resultados extremos (resistir a danos fatais ou aumentar rolagens efetuadas).</p>
                <ul>
                    <li><b>Recuperação:</b> Obtidos ao realizar um <b>Sucesso Crítico</b>.</li>
                    <li><b>Uso:</b> Manipulação direta da probabilidade e sobrevivência sistêmica conforme documento específico.</li>
                </ul>
            `
        },

        classes: [
            { name: "Aprimorado", benefit: "1 Poder Principal e 1 Habilidade Especial." },
            { name: "Combatente", benefit: "2 Poderes Secundários Combativos." },
            { name: "Mago", benefit: "2 Poderes Secundários Mágicos." },
            { name: "Profissional", benefit: "2 Poderes Principais (Hyper Skill)." },
            { name: "Anormal", benefit: "1 Poder Principal e 1 Secundário." },
            { name: "Casual", benefit: "1 Poder Principal e 1 Item Exclusivo." },
            { name: "Destruidor de Sistemas", benefit: "EXCLUSIVO SEASON 0: 4 Poderes (Principais/Secundários/Hab) e 1 Item." }
        ],

        traits: [
            {
                name: "Consciência Sistêmica",
                effect: "1x/cena: O Mestre revela se você está em desvantagem, paridade ou vantagem mecânica. Penalidade: -2 Dados em empatia, leitura emocional e improviso social."
            },
            {
                name: "Corpo Inicializado",
                effect: "1x/cena: Anula completamente um dano ou efeito físico negativo. Ao fim da cena, sofre Exaustão proporcional (1 para leve, 2 para médio, 3 para extremo)."
            },
            {
                name: "Eco de Poder Absoluto",
                effect: "1x/sessão: +2 Dados Normais em rolagens de um Poder específico até o fim da cena. Ao final, sofre 1 de Exaustão obrigatoriamente."
            },
            {
                name: "Desacoplamento da Realidade",
                effect: "Perde 1 WP se obtiver Falha Crítica (todos < 5) ou se precisar rolar apenas 1 dado. Garante o uso de System Points."
            },
            {
                name: "Jogador Descontrolado",
                effect: "Requisitos secretos e isolamento podem ativar capacidades poderosas. Se ativado, o personagem perde a individualidade e torna-se uma marionete do Guia."
            }
        ],

        powers: `
            <hr>
            <h3>ARQUIVO LOG: LOBBY_DATA</h3>
            <p><strong>Criptografia Binária:</strong><br>
            01010010 01101111 01100010 01101111 01110011 00100000 01101110 11100011 01101111 00100000 01110100 01100101 01101101 00100000 01100001 00100000 01110011 01100101 01101110 01101000 01100001<br>
            01001110 11100011 01101111 00100000 01100101 01110010 01100001 01101101 00100000 00110110 00100000 01101100 01100101 01110100 01110010 01100001 01110011 00111111</p>
            
            <p><strong>Sinal de Saída (Morse):</strong><br>
            --- / .. -- .--. . .-. .. --- / -. .- ... -.-. . / -.. . / ..- -- / -. --- -- . / -....- / .---- ...--</p>
            
            <p><strong>Descrição Sistemática (Cifra):</strong><br>
            <em>Zr Raivr n Erfcbfgn, r ryn fr pbagrz rz zvaun ribyhçãb, qrfqr dhr cbffhn n punir.</em><br>
            <em>Xdlê ryrnbnnnv é wb Soarfda?</em></p>
        `
    },

    // --- SLOT 8 ---
// --- SLOT 8: ENCARNAÇÃO ---
    "encarnacao": {
        id: "encarnacao",
        name: "Encarnação",
        icon: "🎇",
        type: "Divindade Fragmentada (Transcendental)",
        
        desc: `
            <p>A Encarnação não é um escolhido; ela é o retorno incompleto de algo que já foi absoluto. Um deus morreu ou foi expulso da realidade, e seu fragmento encontrou um corpo capaz de suportar a ideia de divindade.</p>
            <p>Diferente do Semi-Deus, que é inspirado por um conceito, a Encarnação <b>é</b> o conceito tentando existir novamente. Ela não pode ser criada no início do jogo, surgindo apenas por ascensão narrativa, sacrifício ou colapso de um Semi-Deus.</p>
            <p><em>Nota: Inicia com a Fisiologia Semi-Divina Mítica e um Poder Principal Universal baseado no deus escolhido.</em></p>
        `,

        mechanic: {
            name: "Fé Encarnada",
            desc: `
                <p>Substituição total de Lealdades e Paixões por Aspectos do Deus Original (Domínios ou Absolutos).</p>
                <ul>
                    <li><b>Recuperação:</b> +1 WP ao reafirmar um Aspecto (máx 2/cena).</li>
                    <li><b>Penalidade:</b> Agir contra um Aspecto custa -1 Base Will e impõe -2 Dados em todas as rolagens até o fim da cena (conflito de identidade).</li>
                </ul>
            `
        },

        divindades: [
            "1. Orfeu (Morto)", "2. Ryujin (Reencarnando)", "3. Saci (Morto)", "4. Erlang Shen (Reencarnando)",
            "5. Fenrir (Morto)", "6. Zeus (Vivo)", "7. Poseidon (Vivo)", "8. Hades (Vivo)", "9. Ares (Vivo)",
            "10. Guia (Vivo)", "11. Mãe Amorfa (Vivo)", "12. Pai Sem Rosto (Vivo)", "13. Midra (Vivo)",
            "14. Pele Divina (Vivo)", "15. Dumbledore (Vivo)", "16. Dragão Ancestral (Vivo)", "17. Aliado (Vivo)",
            "18. Mew (Vivo)", "19. Arceus (Vivo)"
        ],

        traits: [
            {
                name: "Corpo da Ideia Viva",
                effect: "+2 HP em todas as partes e 2 LAR. 1x/cena: reduz gravidade de dano se o ataque contrariar sua Fé. Se o dano for do mesmo domínio do deus original, sofre +1 Exaustão."
            },
            {
                name: "Milagre Manifesto",
                effect: "1x/sessão: recria temporariamente um Poder Lendário para um único uso. Após isso, entra em Eco Divino (-2 Dados em ações não alinhadas e não recupera WP até o fim da sessão)."
            },
            {
                name: "Autoridade Primordial",
                effect: "+1 WD e +2 Dados contra mortais/criações. Contra divindades, jogadores descontrolados ou conceitos equivalentes, o bônus desaparece e Falhas Críticas tiram 1 WP."
            },
            {
                name: "Memória Fragmentada do Absoluto",
                effect: "1x/sessão: obtém informações privilegiadas sobre locais/rituais ligados ao seu domínio. Risco: O Mestre pode impor Intrusões de Memória ou Testes de Trauma."
            },
            {
                name: "Forma Divina & Colapso",
                effect: "1x/sessão: +2 Dados em um poder até o fim da cena. Se encontrar o Deus Original, sua Base Will cai para 0 instantaneamente (Colapso Metafísico)."
            }
        ],

        powers: `
            <hr>
            <h3>FISIOLOGIA SEMI-DIVINA (4 ND)</h3>
            <p><strong>Poder Principal Mítico (Custo: 8 Pontos por Dado)</strong></p>
            
            <p><b>Nêmesis e Fraqueza:</b> Definidos conforme o Deus Encarnado. Contato mínimo desativa o poder; exposição considerável ou ataques do Nêmesis causam 1 Killing Damage no Torso e +2 de dano recebido.</p>
            
            <p><b>Hyper Stat:</b> Este poder atua como um atributo à escolha, permitindo quebrar o limite de 5. Pode-se comprar dados com XP tanto para a pool do poder quanto para o atributo puro.</p>
            
            <h4>AÇÕES DE DOMÍNIO</h4>
            <ul>
                <li><b>Ataque:</b> Dano Shock equivalente a W. Usa o Hyper Stat. Pode gastar custo variável para efeitos temáticos.</li>
                <li><b>Defesa:</b> Defesa natural. Pode gastar 2 WP para salvar terceiros e manter a capacidade até o fim da cena.</li>
                <li><b>Movimento:</b> Distância calculada via Hyper Stat (Tabela de Sprint).</li>
            </ul>
            <p><strong>Nota de Coerência:</strong> Tentar viver de forma mundana ou negar a natureza divina impõe -2 Dados em todas as rolagens da cena por perda de coerência ontológica.</p>
        `
    },

    // --- SLOT 9 ---
// --- SLOT 10: PACTADO ---
    "pactado": {
        id: "pactado",
        name: "Pactado",
        icon: "👺",
        type: "Sobrenatural (Vinculado)",
        
        desc: `
            <p>O Pactado não conquistou seu poder através de treino, herança ou sorte; ele o comprou. Ele é alguém que, em um momento de necessidade, ambição ou desespero, aceitou os termos de uma entidade superior — um Diabo, um Espírito ou uma Vontade Nexus.</p>
            <p>Seus poderes não lhe pertencem; são ferramentas emprestadas que exigem uma manutenção constante de coerência e sacrifício. O Pactado caminha com uma sombra que não é sua, ouvindo uma voz que não dorme, ciente de que cada milagre realizado aumenta o peso de uma dívida que, cedo ou tarde, será cobrada.</p>
        `,

        mechanic: {
            name: "Devil Points (DP)",
            desc: `
                <p>Representam picos de poder que distorcem a realidade. Diferente de outros pontos, DP são obtidos apenas ao aceitar um <b>Débito</b> (concessão narrativa à entidade). Limite Máximo: 2 + Nível.</p>
                <ul>
                    <li><b>Gastar 1 DP permite:</b> +10 WP; +1 Largura; +2 Altura; +1 WD na pool; Sobreviver 1h a dano letal (coma); Anular Trauma; Resistir a Controle Mental; Melhorar Stats/Poderes momentaneamente.</li>
                    <li><b>Dívida Viva:</b> O personagem inicia com 3 DP adicionais (além do limite) como crédito de serviços passados.</li>
                </ul>
            `
        },

        traits: [
            {
                name: "Ativando o Pacto",
                effect: "Os poderes não são passivos. Deve gastar 1 DP ou 1 Base WP para liberar acesso aos poderes por uma cena (ou 3 rodadas). Os poderes ativos possuem 10 Dados Normais (ou 5 HD) por padrão."
            },
            {
                name: "Contato com o Diabo",
                effect: "+1 WD para resistir a medo e coerção. Em contrapartida, Falhas Críticas nesses testes permitem que a entidade cause lapsos de controle ou impulsos estranhos no personagem."
            },
            {
                name: "Contrato",
                effect: "O jogador define um eixo moral/direção com o Mestre. Agir conforme o contrato concede +1 Dado de bônus. Agir contra o contrato impõe -2 Dados pelo resto da sessão."
            },
            {
                name: "Segunda Voz",
                effect: "A entidade fala ativamente com o jogador (via Mestre). Obedecer à voz concede +1 WD na ação. Desobedecer conscientemente impõe -2 Dados Normais na cena/ação por resistência do pacto."
            },
            {
                name: "Dívida Viva",
                effect: "Gastar DP nunca alivia a dívida, apenas movimenta termos. Cada novo débito torna a entidade mais exigente e presente, manifestando cobranças narrativas e pressões indiretas."
            }
        ],

        powers: `
            <hr>
            <h3>SISTEMÁTICA DO VÍNCULO</h3>
            <p>O Pactado possui <b>1 Poder Principal</b> e <b>1 Variável do Pacto</b> (Item, Habilidade ou Poder Secundário) de qualidade <b>Lendária</b>. Estes só podem ser utilizados enquanto o Pacto estiver Ativo.</p>
            <ul>
                <li><strong>Poderes Adormecidos:</strong> Quando o pacto não está ativo, o personagem é funcionalmente mundano em termos de poderes sobrenaturais.</li>
                <li><strong>Progressão:</strong> Embora iniciem com 10 Dados/5 HD, esses valores podem ser aprimorados com XP em níveis superiores conforme as regras de Poderes Lendários.</li>
            </ul>
            <p><strong>Nota:</strong> Zerar a reserva de Devil Points torna o Pactado vulnerável a intervenções diretas da entidade, pois não há mais "crédito" para negociar sua autonomia.</p>
        `
    },

    // --- SLOT 10 (IGNORADO / EXEMPLO / NOVO) ---
    "custom": {
        id: "custom",
        name: "Raça Customizada",
        icon: "🛠️",
        type: "Homebrew",
        desc: "<p>Espaço reservado para novas criações.</p>",
        mechanic: { name: "Em Construção", desc: "..." },
        traits: [],
        powers: ""
    },

    // --- SLOT: ARMADURADO ---
    "armadurado": {
        id: "armadurado",
        name: "Armadurado",
        icon: "🛡️",
        type: "Simbiótico (Conquista)",
        
        desc: `
            <p>O Armadurado não veste uma armadura; ele coexiste com ela. A <b>Casca Irremovível</b> é uma entidade viva, semi-viva ou plenamente inteligente, ligada permanentemente ao corpo e à mente do hospedeiro.</p>
            <p>Esta é uma origem de conquista, não acessível no início do jogo, representando um pacto irreversível. Sem a Casca, o Armadurado é um indivíduo comum, privado de todos os seus poderes e considerado funcionalmente inferior a um humano comum devido à sua dependência.</p>
            <p><em>Exemplos: Venom (Eddie Brock), Homem de Ferro (Tony Stark), Couraça (Hexatombe).</em></p>
        `,

        mechanic: {
            name: "Casca Irremovível",
            desc: `
                <p>A armadura possui vontade própria e uma reserva de <b>Willpower independente (Nível + 2)</b>, sustentada por duas Paixões exclusivas da Casca. O usuário compartilha os ganhos e perdas de WP com a armadura.</p>
                <ul>
                    <li><b>Dependência:</b> Se separado da Casca, todos os poderes e vantagens da origem ficam inativos.</li>
                    <li><b>Equipamento Base:</b> Recebe 1 Poder Principal (Focus Universal - Item com dados) e 1 Poder Principal Mítico (Qualidades gerais da armadura).</li>
                </ul>
            `
        },

        traits: [
            {
                name: "Corpo Revestido",
                effect: "+2 HP em todas as partes e 2 LAR (Impenetrável). 1x/cena: reduz categoria de dano em um nível ao custo de 1 Exaustão. A Exaustão só é removida seguindo as Paixões da Armadura (sem ganhar WP). Se a Casca chegar a 0 HP, ela entra em estado de Morrendo/Destruição."
            },
            {
                name: "Vontade Sobreposta",
                effect: "O usuário nunca sofre Falhas Críticas. Em vez disso, a Casca assume o controle da ação (conduzida pelo Mestre) para cumprir seus próprios objetivos. Cada uso sequente na mesma sessão custa 1 Willpower."
            },
            {
                name: "Núcleo de Persistência Artificial",
                effect: "1x/sessão: ao chegar a 0 HP ou morrer, permanece ativo por 1 rodada adicional ignorando penalidades (agindo de forma mecânica). Ao fim da rodada, cai e a Casca perde 1 de Base Will. Pode conceder 1 rodada de 'Morrendo' contra dano massivo."
            },
            {
                name: "Interposição Blindada",
                effect: "(1+Nível)x/cena: Converte uma defesa Self em Range para interceptar ataques contra aliados. O aliado ignora o dano se você mitigar com sucesso. Penalidade: -1 Dado Normal em ações ofensivas até o fim da cena."
            },
            {
                name: "Fusão Forçada",
                effect: "A Casca possui Estabilidade própria (4 Dados + Nível) que funciona como Augment para o usuário contra medo, controle mental ou coerção. Se o efeito passar, a Casca perde 1 de Base Will por sobrecarga cognitiva."
            }
        ],

        powers: `
            <hr>
            <h3>SISTEMÁTICA DA ARMADURA</h3>
            <p>A armadura é tratada como um ser vivo e um objeto ao mesmo tempo. Para repará-la ou salvá-la de um estado crítico, é necessário um teste de <b>Conhecimento</b> apropriado à sua natureza:</p>
            <ul>
                <li><strong>Mecânica:</strong> Engenharia / Tecnologia.</li>
                <li><strong>Orgânica:</strong> Primeiros Socorros / Medicina.</li>
                <li><strong>Mística:</strong> Ocultismo / Arcanismo.</li>
            </ul>
            <p><strong>Foco e Mítico:</strong> O poder de Focus representa a durabilidade e ferramentas da armadura, enquanto o poder Mítico representa as capacidades sobre-humanas que ela concede ao hospedeiro.</p>
        `
    },

    // --- SLOT: CIDADÃO DE NEW TOKYO ---
    "cidadao-new-tokyo": {
        id: "cidadao-new-tokyo",
        name: "Cidadão de New Tokyo",
        icon: "🏮",
        type: "Urbano (Legado)",
        
        desc: `
            <p>New Tokyo não é apenas uma localização; é um estado de espírito onde a tradição ancestral colide com a saturação absoluta da Energia Nexus. Seus cidadãos — sejam humanos, alienígenas ou constructos — são moldados pela disciplina, pela pressão social e pelo ritmo frenético da metrópole.</p>
            <p>Eles carregam o "Peso do Aço e do Espírito", herdando costumes rígidos e uma conexão única com a tecnologia saturada de Nexus da cidade. São conhecidos por sua busca pela perfeição e por navegar nas complexas redes de influência da maior cidade do mundo.</p>
            <p><em>Equipamento: Inicia com 1 Poder Principal Lendário (Personalizado) e 1 Item Raro.</em></p>
        `,

        mechanic: {
            name: "Cidade Grande (Recursos e Contatos)",
            desc: `
                <p>O personagem sabe como a engrenagem urbana gira. Ele possui uma reserva de <b>5 Dados de Riqueza (+1 por Nível)</b> por sessão.</p>
                <ul>
                    <li><b>Uso de Recursos:</b> Pode gastar esses dados para obter equipamentos, subornar NPCs, acessar informações restritas ou garantir transporte imediato.</li>
                    <li><b>Intervenção Narrativa:</b> Uma vez por sessão, pode declarar uma "Aparição de Recurso" ou "Contato Conveniente" para mudar o rumo da cena (ex: um aliado aparece com um veículo, ou uma dívida antiga é cobrada para abrir uma porta selada).</li>
                    <li><b>Dívida:</b> O uso excessivo desses recursos implica em cobranças futuras, favores devidos ou drenagem financeira narrativa.</li>
                </ul>
            `
        },

        traits: [
            {
                name: "Código de Honra (Giri)",
                effect: "+1 Dado Normal em testes para proteger sua honra, cumprir uma promessa direta ou defender um inocente. Se quebrar sua palavra ou agir com covardia, sofre −2 Dados em Estabilidade e Mind até realizar uma reparação."
            },
            {
                name: "Espírito de Resiliência (Gambare)",
                effect: "Sempre que for alvo de um Trama Check (Teste de Trauma/Medo) de um oponente e for bem-sucedido em resistir, recebe +2 Dados Normais em Combate e Resistência até o fim da luta. Penalidade: Sofre Exaustão em dobro em esforços prolongados e não pode declarar desistência voluntária."
            },
            {
                name: "Caligrafia do Nexus",
                effect: "Recebe 2 pontos de Willpower Temporário por sessão, que podem ser gastos exclusivamente para ativar ou fortalecer seu Poder Principal Lendário inicial. Penalidade: Sofre −1 Dado Normal em áreas de 'Silêncio Mágico' ou poluição não-Nexus."
            },
            {
                name: "Técnica do Artesão (Shokunin)",
                effect: "Escolha uma Perícia ou o uso do seu Item Raro: recebe +2 Dados Normais fixos nessa escolha (o item é indestrutível por meios comuns). Penalidade: Sofre −2 Dados em qualquer ação complexa em que não possua ao menos 2 dados de perícia (medo da mediocridade)."
            },
            {
                name: "Máscara Social (Tatemae)",
                effect: "+2 Dados Normais para esconder emoções, intenções ou resistir a Intimidação e Leitura de Mente. Penalidade: Recupera 1 ponto de Willpower a menos por descanso (necessita de isolamento ou hobbies específicos para recuperar plenamente)."
            }
        ],

        powers: `
            <hr>
            <h3>ESTRUTURA DE PODER</h3>
            <p>O Cidadão de New Tokyo possui uma construção de poder focada em refinamento e especialização:</p>
            <ul>
                <li><strong>Legado de New Tokyo:</strong> Um Poder Principal de qualidade <b>Lendária</b> definido pelo jogador. Representa uma técnica suprema, uma herança biológica ou uma modificação cibernética avançada saturada pelo Nexus.</li>
                <li><strong>Relíquia Urbana:</strong> Um <b>Item Raro</b> inicial que faz parte da identidade do personagem (ex: uma Katana de vibração, um terminal hacker customizado ou um amuleto espiritual moderno).</li>
            </ul>
        `
    },

    // --- SLOT: MESTRE DE JOGO (CONQUISTA) ---
    "mestre-de-jogo": {
        id: "mestre-de-jogo",
        name: "Mestre de Jogo",
        icon: "🎭",
        type: "Conquista (Arquiteto)",
        
        desc: `
            <p>Você não apenas habita a realidade; você a gerencia. O Mestre de Jogo é alguém que conquistou o controle sobre um Nó de Nexus tão puro que sua percepção se tornou "Meta-Sistêmica". Ele enxerga a vida como uma sucessão de cenas, encontros e estatísticas.</p>
            <p>Sua presença no campo de batalha é como a de um diretor em um set de filmagem: ele não é o herói que desfere o golpe final, mas é quem garante que a luz esteja no lugar certo, que o cenário desabe sobre o vilão e que o diálogo tenha o impacto necessário. É uma existência solitária e cerebral, onde o controle absoluto cobra o preço da espontaneidade e da vitalidade física.</p>
            <p><em>Condição de Conquista: Derrotar um Guardião de Nó ou transcender a percepção humana através de um Bug Sistêmico proposital.</em></p>
        `,

        mechanic: {
            name: "Jurisdição do Diretor (Pontos de Enredo)",
            desc: `
                <p>O Mestre de Jogo possui uma reserva de <b>Dados de Enredo (Nível + 3)</b> por sessão. Ele pode gastar esses dados para realizar "Edições de Cena":</p>
                <ul>
                    <li><b>Inserção Narrativa:</b> Gastar 1 dado para declarar a existência de um objeto comum ou conveniência ambiental, desde que tenha impacto menor narrativamente. Como dizer que a porta está destrancada, que tinha uma ultima maça guardada no estoque de comida, e etc</li>
                    <li><b>Retcon Menor:</b> Gastar 2 dados para anular uma ação de um NPC menor ou mudar um detalhe que acabou de ser narrado e que não envolva dano direto.</li>
                    <li><b>Direcionamento de Foco:</b> Pode gastar dados para dar bônus de +1 de Altura (Height) para a ação de um aliado, narrando como o ambiente ou a sorte conspiram a favor dele.</li>
                </ul>
            `
        },

        traits: [
            {
                name: "Consciência Meta-Sistêmica",
                effect: "O personagem sempre sabe o HP aproximado e o nível de perigo de qualquer criatura que veja. Penalidade: Distanciamento Emocional. Sofre −2 Dados em testes de Empatia ou Socialização genuína (ele vê pessoas como fichas)."
            },
            {
                name: "Cenografia Viva",
                effect: "Uma vez por rodada, ele pode conceder +1 WD (Wiggle Die) para a Defesa de um aliado ao editar o cenário (ex: um galho cai na frente do tiro). Penalidade: Fragilidade do Diretor. O personagem sofre −1 HP em todas as partes do corpo; ele não foi feito para estar na frente das câmeras."
            },
            {
                name: "Voz do Narrador",
                effect: "Sua fala possui autoridade absoluta sobre seres de mente fraca ou figurantes. Caso o Inimigo seja considerado um Minion, o mesmo pode gastar 1 de WP para comanda-lo de forma absoluta por 1 comando unico, que pode ser: Ação (uma das ações que ele faz), fugir, parar, largar. Penalidade: Falta de Sutileza. Ele é incapaz de sussurrar ou ser discreto; suas intenções são sempre percebidas como ordens, impondo −2 Dados em Furtividade e Lábia Social."
            },
            {
                name: "Preparação de Cenário",
                effect: "Se o personagem passar uma rodada inteira sem realizar ações físicas (apenas observando), na próxima rodada ele pode aplicar dois Dados de Debuff em qualquer inimigo da cena apenas narrando sua falha de script. Penalidade: Inércia Crítica. Sofre −2 Dados em qualquer teste de Iniciativa ou reação puramente instintiva."
            },
            {
                name: "Plot Armor (Sacrifício de Figurante)",
                effect: "Uma vez por sessão, ao receber um dano que o levaria ao estado 'Morrendo', o Mestre de Jogo pode declarar que um objeto ou um NPC menor próximo recebeu o golpe em seu lugar. Penalidade: Custo Sistêmico. Após usar este efeito, o NPC ou Item narrado é Perdido."
            }
        ],

        powers: `
            <hr>
            <h3>ESTATÍSTICAS DO ARQUITETO</h3>
            <p>O Mestre de Jogo não busca poder bruto, mas sim a manipulação das variáveis alheias:</p>
            <ul>
                <li><strong>Poder Principal (Autoridade Narrativa):</strong> Um poder de qualidade <b>Universal</b> O Usuário pode escolher o tema do poder baseado no que preferir </li>
            </ul>
        `
    },
    // --- SLOT: SEQUESTRADO ---
    "sequestrado": {
        id: "sequestrado",
        name: "Sequestrado",
        icon: "📉",
        type: "Instável (Resíduo de Dados)",
        
        desc: `
            <p>Você foi levado. Seus dados foram minerados, replicados e espalhados por incontáveis realidades de teste no Lobby, mas, por algum motivo, você foi rotulado como "Valor Zero". Você não é um Jogador, pois sua conexão foi cortada; você não é um Sócia, pois o sistema se recusou a estabilizar sua forma.</p>
            <p>Sua existência é um erro de cache. Sua aparência flutua, seu histórico é uma colagem de memórias de versões suas que nunca existiram nesta linha do tempo, e o mundo parece ter dificuldade em registrar sua presença permanente. Você é o Glitch que o sistema desistiu de corrigir.</p>
            <p><em>Equipamento: Inicia com 1 Poder Principal Mítico (Tema Personalizado).</em></p>
        `,

        mechanic: {
            name: "Renderização Instável (Aparência Aleatória)",
            desc: `
                <p>O Sequestrado não possui uma forma física fixa. Seus dados de "textura" e "modelo" mudam constantemente.</p>
                <ul>
                    <li><b>Mudança de Estilo:</b> O Usuário pode acabar mudando sua aparencia, o usuário terá 3 artes diferentes, 1 no tema da mesa, uma pixelada, e uma versao realista, e ele pode alterar isso ao longo da sessao. Toda sessao deve rolar 1d3 para definir qual aparencia é.</li>
                    <li><b>Vantagem de Anonimato:</b> Devido a essa mutação visual, testes para reconhecer ou identificar o Sequestrado por meios convencionais sofrem <b>-2 Dados Normais</b>. Ele nunca é a mesma pessoa por muito tempo. O Usuário tambem recebe os seguintes bonificações de acordo com a aparencia: 1 - O Usuário recebe +1 dado em Todos os testes fisicos (body e cordenation) na sessao, mas perde 1 dado em todos as mentais. (sentidos e mind) 2 - recebe +1 dado em todos os testes mentais (mind e sense), e menos 1 dado em todos os testes de carisma ou comando. 3 - recebe +1 em testes de carisma ou comando, e recebe -1 em testes fisicos (body e coordenation)</li>
                </ul>
            `
        },

        traits: [
            {
                name: "Avaliação: Valor Zero",
                effect: "Para o sistema do Lobby e entidades de rastreamento (Robôs, Vigilantes), você é invisível ou considerado um 'objeto inanimado' até que use um poder. Recebe +2 Dados em Furtividade contra tecnologia. Penalidade: Invisibilidade Social. NPCs importantes tendem a ignorar sua opinião ou esquecer seu nome minutos após a conversa caso tenha uma relacao recente ou não relevante o bastante.."
            },
            {
                name: "Eco de Realidades Replicadas",
                effect: "Uma vez por cena, você pode acessar uma 'memória de réplica'. Voce pode descrever o uso de uma pericia que voce nao tem dados, e realizar ela como se tivesse +2 dados, checando uma das milhares de variantes que voce podia ter se tornado. Penalidade: Fragmentação Mental. Se falhar nesse teste, você perde 1 de Willpower e sofre confusão narrativa (Lag existencial) pelo resto da cena, perdendo 1 dado em todas as ações"
            },
            {
                name: "Corpo de Baixa Prioridade",
                effect: "Sendo 'lixo de dados', o dano letal demora a se fixar em você. Você ignora o primeiro ponto de Killing Damage que receber em cada rodada. Penalidade: Rejeição Curativa. Curas de origem tecnológica ou sistêmica (Nexus) recuperam -1 de HP a menos em você, pois seu código não aceita 'patches' oficiais."
            },
            {
                name: "Distorção de Colisão (Noclip)",
                effect: "Uma vez por cena, você pode se mover através de objetos sólidos ou pessoas por uma única rodada como se fosse um holograma falho. Penalidade: Instabilidade Física. Após usar este efeito, você não pode carregar itens pesados ou usar armas de duas mãos até o fim da cena, pois sua densidade molecular flutua perigosamente."
            },
            {
                name: "Saturação de Erro",
                effect: "Sempre que você utiliza seu Poder Mítico, a realidade ao redor 'glitcha' (luzes piscam, sons distorcem), o que concede +1 WD em Intimidação na rodada seguinte. Penalidade: Alerta de Erro. O uso de seu poder atrai a atenção de entidades que buscam 'limpar' resíduos de dados, aumentando o risco de encontros perigosos com o sistema."
            }
        ],

        powers: `
            <hr>
            <h3>MANIFESTAÇÃO MÍTICA</h3>
            <p>O Sequestrado canaliza o vazio de sua existência descartada em um poder de escala massiva:</p>
            <ul>
                <li><strong>Poder Principal Mítico:</strong> Um poder de <b>Nível Mítico (8 pontos por dado)</b> com tema totalmente livre. Este poder representa a única parte do seu código que o Lobby não conseguiu replicar — sua essência original corrompida.</li>
                <li><strong>Propriedade 'Glitch':</strong> O jogador pode descrever visualmente seus efeitos como erros de sistema, distorções de voxels ou código binário vazando para a realidade física.</li>
            </ul>
        `
    },
};
