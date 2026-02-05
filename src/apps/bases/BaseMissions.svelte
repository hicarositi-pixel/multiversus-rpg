<script>
    import { slide } from 'svelte/transition';
    import { GroupDatabase } from '../../database/GroupDatabase.js';

    // CORREÇÃO 1: Inicializa com null
    export let group = null;
    export let isGM;

    // CORREÇÃO 2: Reatividade Segura
    // Se group for nulo, retorna array vazio
    $: missions = (group && group.missions) ? group.missions : [];

    // Formulário de Criação (Só GM)
    let newMission = {
        title: "", difficulty: "NORMAL", desc: "", rewards: "",
        objectives: [{ text: "", hidden: false }] 
    };

    function addObjectiveRow() {
        newMission.objectives = [...newMission.objectives, { text: "", hidden: true }];
    }

    async function createMission() {
        if (!group) return;
        if (!newMission.title) return;
        await GroupDatabase.addMission(group.id, newMission);
        newMission = { title: "", difficulty: "NORMAL", desc: "", rewards: "", objectives: [{ text: "", hidden: false }] };
    }

    async function toggleObj(mId, idx, field) {
        if (!group) return;
        if (!isGM) return;
        await GroupDatabase.toggleObjective(group.id, mId, idx, field);
    }

    async function deleteMission(mId) {
        if (!group) return;
        await GroupDatabase.deleteMission(group.id, mId);
    }
</script>

{#if group && group.id}
    <div class="missions-container custom-scroll">
        
        {#if isGM}
            <div class="gm-creator">
                <h4>NOVA MISSÃO (GM)</h4>
                <div class="form-row">
                    <input type="text" bind:value={newMission.title} placeholder="Título da Missão" />
                    <select bind:value={newMission.difficulty}>
                        <option>FÁCIL</option>
                        <option>NORMAL</option>
                        <option>DIFÍCIL</option>
                        <option>SUICIDA</option>
                    </select>
                </div>
                <textarea bind:value={newMission.desc} placeholder="Descrição breve..." rows="2"></textarea>
                
                <div class="objs-list">
                    <small>OBJETIVOS:</small>
                    {#each newMission.objectives as obj, i}
                        <div class="obj-input">
                            <input type="text" bind:value={obj.text} placeholder="Objetivo {i+1}..." />
                            <label>
                                <input type="checkbox" bind:checked={obj.hidden} /> Secreto?
                            </label>
                        </div>
                    {/each}
                    <button class="small-btn" on:click={addObjectiveRow}>+ Add Objetivo</button>
                </div>
                
                <input type="text" bind:value={newMission.rewards} placeholder="Recompensas (Texto)..." />
                <button class="create-btn" on:click={createMission}>PUBLICAR MISSÃO</button>
            </div>
        {/if}

        <div class="missions-list">
            {#each missions as m}
                <div class="mission-card" transition:slide>
                    <div class="m-header">
                        <span class="diff-tag {m.difficulty}">{m.difficulty}</span>
                        <h3>{m.title}</h3>
                        {#if isGM}<button class="del-btn" on:click={()=>deleteMission(m.id)}>X</button>{/if}
                    </div>
                    <p class="desc">{m.desc}</p>
                    
                    <div class="objectives-box">
                        {#each m.objectives as obj, i}
                            <div class="obj-row {obj.completed ? 'done' : ''}">
                                <div class="check-area" on:click={() => isGM && toggleObj(m.id, i, 'completed')}>
                                    <i class="fas {obj.completed ? 'fa-check-square' : 'fa-square'}"></i>
                                </div>
                                
                                <span class="obj-text">
                                    {#if obj.hidden && !isGM}
                                        <span class="redacted">████████████ (SECRETO)</span>
                                    {:else}
                                        {obj.text} {#if obj.hidden}(👁️ GM: Oculto){/if}
                                    {/if}
                                </span>

                                {#if isGM}
                                    <i class="fas {obj.hidden ? 'fa-eye-slash' : 'fa-eye'} gm-eye" 
                                       on:click={() => toggleObj(m.id, i, 'hidden')} 
                                       title="Revelar/Ocultar"></i>
                                {/if}
                            </div>
                        {/each}
                    </div>

                    <div class="rewards">
                        <strong>RECOMPENSA:</strong> {m.rewards}
                    </div>
                </div>
            {:else}
                <div class="empty">Nenhuma missão ativa no momento.</div>
            {/each}
        </div>
    </div>
{:else}
    <div style="padding: 20px; color: #ccc; text-align: center;">Carregando Missões...</div>
{/if}

<style>
/* CSS Original (Mantido) */
    .missions-container { padding: 10px; color: #fff; font-family: monospace; }
    
    /* FORM GM */
    .gm-creator { background: #111; border: 1px solid #444; padding: 10px; margin-bottom: 20px; border-left: 3px solid orange; }
    .gm-creator h4 { margin: 0 0 10px 0; color: orange; }
    .form-row { display: flex; gap: 5px; margin-bottom: 5px; }
    input, select, textarea { background: #000; border: 1px solid #333; color: #fff; padding: 5px; width: 100%; font-family: inherit; }
    .obj-input { display: flex; gap: 5px; margin-bottom: 2px; align-items: center; }
    .small-btn { font-size: 10px; padding: 2px 5px; background: #222; border: 1px solid #555; color: #ccc; cursor: pointer; margin-bottom: 5px; }
    .create-btn { background: #004400; color: #00ff41; border: 1px solid #00ff41; width: 100%; padding: 8px; cursor: pointer; font-weight: bold; margin-top: 10px; }

    /* CARD MISSÃO */
    .mission-card { background: rgba(0,255,65,0.05); border: 1px solid #004400; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
    .m-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #004400; padding-bottom: 5px; margin-bottom: 10px; }
    .m-header h3 { margin: 0; font-size: 16px; color: #00ff41; }
    .diff-tag { font-size: 10px; padding: 2px 6px; border-radius: 2px; background: #333; }
    .diff-tag.FÁCIL { background: green; } .diff-tag.NORMAL { background: #555; } .diff-tag.DIFÍCIL { background: darkred; } .diff-tag.SUICIDA { background: purple; }
    .del-btn { background: transparent; border: none; color: #555; cursor: pointer; } .del-btn:hover { color: red; }

    .desc { font-style: italic; opacity: 0.8; font-size: 12px; margin-bottom: 15px; }

    .objectives-box { background: rgba(0,0,0,0.3); padding: 10px; margin-bottom: 10px; border-radius: 4px; }
    .obj-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; font-size: 13px; }
    .obj-row.done { text-decoration: line-through; opacity: 0.5; color: #00ff41; }
    .check-area { cursor: pointer; }
    .redacted { background: #000; color: #000; user-select: none; }
    .gm-eye { cursor: pointer; color: orange; margin-left: auto; opacity: 0.5; } .gm-eye:hover { opacity: 1; }

    .rewards { font-size: 12px; color: gold; border-top: 1px dashed #444; padding-top: 5px; }
    .empty { text-align: center; opacity: 0.5; margin-top: 20px; }
</style>