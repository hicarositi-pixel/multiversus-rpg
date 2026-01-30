<script>
    import { onMount, tick } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { TestamentoDatabase } from '../database/TestamentoDatabase.js';

    export let actor;
    export let themeStyle = "";

    const MODULE_ID = "multiversus-rpg";

    // --- ESTADOS INTERNOS ---
    let showOverlay = true; // Força a defesa toda vez que monta o componente
    let activeNoteId = null;

    // --- DADOS REATIVOS DO FOUNDRY ---
    // Monitoramos as flags diretamente. Se mudar no banco, muda aqui.
    $: testamentoFlags = actor?.flags?.[MODULE_ID]?.testamento || {};
    $: isPublic = testamentoFlags.isPublic || false;
    $: notes = Array.isArray(testamentoFlags.notes) ? testamentoFlags.notes : [
        { id: foundry.utils.randomID(), title: "MEMORIAL_PRINCIPAL", content: "" }
    ];

    // Lógica para manter sempre uma nota ativa válida
    $: if (!activeNoteId && notes.length > 0) {
        activeNoteId = notes[0].id;
    }

    // Nota que está sendo exibida no editor
    $: activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

    onMount(() => {
        showOverlay = true;
    });

    // --- FUNÇÕES DE PERSISTÊNCIA (AUTO-SAVE) ---
    async function updateDatabase(newNotes, newPublicState = null) {
        const update = {
            notes: newNotes,
            isPublic: newPublicState !== null ? newPublicState : isPublic
        };
        // O save() customizado do seu main.js garante que a ficha não resete
        await actor.setFlag(MODULE_ID, "testamento", update);
    }

    function addNote() {
        const newNote = { 
            id: foundry.utils.randomID(), 
            title: `ENTRADA_0${notes.length + 1}`, 
            content: "" 
        };
        const newNotes = [...notes, newNote];
        activeNoteId = newNote.id; // Foca na nova nota imediatamente
        updateDatabase(newNotes);
    }

    function deleteNote(id) {
        if (notes.length <= 1) return ui.notifications.warn("O NÚCLEO EXIGE AO MENOS UM REGISTRO.");
        const newNotes = notes.filter(n => n.id !== id);
        if (activeNoteId === id) activeNoteId = newNotes[0].id;
        updateDatabase(newNotes);
    }

    function handleContentInput(e) {
        const updatedNotes = notes.map(n => {
            if (n.id === activeNoteId) return { ...n, content: e.target.value };
            return n;
        });
        updateDatabase(updatedNotes);
    }

    function handleTitleBlur(e, id) {
        const updatedNotes = notes.map(n => {
            if (n.id === id) return { ...n, title: e.target.value.toUpperCase().replace(/\s+/g, '_') };
            return n;
        });
        updateDatabase(updatedNotes);
    }

    function togglePublic() {
        const msg = isPublic 
            ? "RESELAR MEMORIAL? (O conteúdo voltará a ser privado)" 
            : "⚠️ ROMPER LACRE DE MORTE? Isso tornará suas últimas palavras visíveis para outros jogadores e mestres.";
        
        new Dialog({
            title: "SISTEMA DE SEGURANÇA",
            content: `<p style="font-family: 'Share Tech Mono', monospace;">${msg}</p>`,
            buttons: {
                confirm: { 
                    label: "CONFIRMAR", 
                    callback: () => updateDatabase(notes, !isPublic)
                },
                cancel: { label: "ABORTAR" }
            }
        }).render(true);
    }
</script>

<div class="testamento-root" style="{themeStyle}">
    
    {#if showOverlay}
        <div class="sacred-overlay" transition:fade={{duration: 200}}>
            <div class="barrier-card" in:scale={{duration: 300, start: 0.95}}>
                <div class="barrier-content">
                    {@html TestamentoDatabase.getSacredWarning()}
                    <div class="auth-section">
                        <div class="status-blink">SISTEMA_AGUARDANDO_AUTENTICAÇÃO...</div>
                        <button class="auth-btn" on:click={() => showOverlay = false}>
                            <i class="fas fa-fingerprint"></i> RECONHECER IDENTIDADE E ACESSAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <aside class="test-sidebar">
        <div class="sidebar-header">
            <div class="header-title"><i class="fas fa-database"></i> MEMORIAL</div>
            <button class="btn-add" on:click={addNote} title="Nova Página">+</button>
        </div>
        
        <div class="notes-list">
            {#each notes as note (note.id)}
                <div class="note-tab" class:active={activeNoteId === note.id} on:click={() => activeNoteId = note.id}>
                    <div class="tab-indicator"></div>
                    <input 
                        value={note.title} 
                        on:blur={(e) => handleTitleBlur(e, note.id)}
                        spellcheck="false" 
                    />
                    <button class="btn-del" on:click|stopPropagation={() => deleteNote(note.id)}>×</button>
                </div>
            {/each}
        </div>

        <div class="sidebar-footer">
            <button class="btn-lacre" class:exposed={isPublic} on:click={togglePublic}>
                <i class="fas {isPublic ? 'fa-unlock' : 'fa-lock'}"></i>
                {isPublic ? 'STATUS: EXPOSTO' : 'STATUS: SELADO'}
            </button>
        </div>
    </aside>

    <main class="test-editor-container">
        {#if activeNote}
            <div class="editor-header">
                <span class="path">root/memorial/logs/{activeNote.title.toLowerCase()}.data</span>
                <span class="encryption">{isPublic ? 'DECRYPTED' : 'AES-256_ENCRYPTED'}</span>
            </div>
            
            <textarea 
                class="main-textarea" 
                value={activeNote.content} 
                on:input={handleContentInput}
                placeholder="Insira aqui seus relatos, pensamentos finais ou instruções de legado..."
                spellcheck="false"
            ></textarea>
        {/if}
    </main>
</div>

<style>
    .testamento-root {
        display: flex;
        width: 100%;
        height: 100%;
        background: #000;
        color: #fff;
        font-family: 'Share Tech Mono', monospace;
        position: relative;
        overflow: hidden;
    }

    /* BARREIRA DE SEGURANÇA GIGANTE */
    .sacred-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }

    .barrier-card {
        width: 85%;
        max-width: 850px;
        background: #050505;
        border: 2px solid var(--c-primary);
        box-shadow: 0 0 40px rgba(0,0,0,1), 0 0 20px var(--c-primary);
        padding: 40px;
        position: relative;
    }

    .auth-section {
        margin-top: 30px;
        text-align: center;
        border-top: 1px solid rgba(var(--c-primary), 0.2);
        padding-top: 30px;
    }

    .auth-btn {
        background: var(--c-primary);
        color: #000;
        border: none;
        padding: 15px 30px;
        font-weight: bold;
        font-family: inherit;
        cursor: pointer;
        transition: 0.3s;
        margin-top: 15px;
    }

    .auth-btn:hover { filter: brightness(1.2); transform: translateY(-2px); }

    /* SIDEBAR */
    .test-sidebar {
        width: 260px;
        background: rgba(10, 10, 10, 0.8);
        border-right: 1px solid rgba(var(--c-primary), 0.2);
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(var(--c-primary), 0.1);
    }

    .header-title { color: var(--c-primary); font-weight: bold; font-size: 14px; }
    
    .btn-add {
        background: transparent;
        border: 1px solid var(--c-primary);
        color: var(--c-primary);
        width: 24px; height: 24px;
        cursor: pointer;
    }

    .notes-list { flex: 1; overflow-y: auto; padding: 10px; }

    .note-tab {
        display: flex;
        align-items: center;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        margin-bottom: 5px;
        cursor: pointer;
        position: relative;
    }

    .note-tab.active { background: rgba(var(--c-primary), 0.1); color: var(--c-primary); }
    .tab-indicator { position: absolute; left: 0; width: 3px; height: 0; background: var(--c-primary); transition: 0.3s; }
    .note-tab.active .tab-indicator { height: 100%; }

    .note-tab input {
        background: transparent;
        border: none;
        color: inherit;
        font-family: inherit;
        width: 100%;
        outline: none;
        font-size: 12px;
    }

    .btn-del { background: transparent; border: none; color: #ff4444; opacity: 0; cursor: pointer; }
    .note-tab:hover .btn-del { opacity: 1; }

    .sidebar-footer { padding: 15px; }

    .btn-lacre {
        width: 100%;
        padding: 10px;
        background: transparent;
        border: 1px solid #444;
        color: #555;
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
    }

    .btn-lacre.exposed { border-color: #ff4444; color: #ff4444; }

    /* EDITOR */
    .test-editor-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 25px;
        background: rgba(255,255,255,0.01);
    }

    .editor-header {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        opacity: 0.4;
        margin-bottom: 15px;
    }

    .main-textarea {
        flex: 1;
        background: transparent;
        border: none;
        color: #ccc;
        font-family: inherit;
        font-size: 16px;
        line-height: 1.6;
        resize: none;
        outline: none;
    }

    .status-blink { font-size: 10px; color: var(--c-primary); animation: blink 1.5s infinite; }
    @keyframes blink { 50% { opacity: 0.3; } }
</style>