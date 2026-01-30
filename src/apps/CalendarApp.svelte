<script>
    import { onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { GroupDatabase } from '../database/GroupDatabase.js';

    const MODULE_ID = "multiversus-rpg";
    
    // --- DADOS ---
    // Garante estrutura inicial se for a primeira vez
    let calendarData = game.settings.get(MODULE_ID, "calendarData") || { 
        currentDate: { day: 1, month: 0, year: 1 }, 
        events: {}, 
        notes: {} 
    };
    
    // Estado Visual
    let viewDate = { ...calendarData.currentDate }; 
    let selectedDay = null; 
    let allGroups = [];

    // Estado do Modal de Notas
    let showNoteModal = false;
    let editingNote = { id: null, title: "", desc: "", color: "#f59e0b" };

    // Constantes
    const MONTHS = [
        "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
        "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
    ];
    const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

    // --- INICIALIZAÇÃO ---
    onMount(async () => {
        refreshGroups();
        // Ouve atualizações de grupos para manter a lista sincronizada
        Hooks.on("groupSystemUpdate", refreshGroups);
    });

    function refreshGroups() {
        try {
            // Usa o método correto da GroupDatabase atualizada
            allGroups = GroupDatabase.getGroups() || [];
        } catch (e) { console.warn("Erro ao carregar grupos no calendário:", e); }
    }

    // --- REATIVIDADE DO CALENDÁRIO ---
    $: daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
    $: startDayOfWeek = new Date(viewDate.year, viewDate.month, 1).getDay();
    $: calendarGrid = generateGrid(daysInMonth, startDayOfWeek);

    function generateGrid(days, start) {
        let grid = [];
        for(let i=0; i<start; i++) grid.push(null);
        for(let i=1; i<=days; i++) grid.push(i);
        return grid;
    }

    // --- FUNÇÕES DE DATA ---
    function changeMonth(dir) {
        viewDate.month += dir;
        if (viewDate.month > 11) { viewDate.month = 0; viewDate.year++; }
        if (viewDate.month < 0) { viewDate.month = 11; viewDate.year--; }
    }

    function setToday() {
        calendarData.currentDate = { ...viewDate, day: selectedDay };
        save();
    }

    function getKey(day) {
        return `${viewDate.year}-${viewDate.month}-${day}`;
    }

    // --- GESTÃO DE ANOTAÇÕES (POP-UP) ---
    
    function openNoteModal(note = null) {
        if (note) {
            // Editar existente
            editingNote = { ...note };
        } else {
            // Criar nova
            editingNote = { 
                id: foundry.utils.randomID(), 
                title: "", 
                desc: "", 
                color: "#f59e0b" // Amarelo padrão
            };
        }
        showNoteModal = true;
    }

    function saveNote() {
        if (!selectedDay || !editingNote.title) return ui.notifications.warn("A nota precisa de um título.");
        
        const key = getKey(selectedDay);
        if (!calendarData.notes[key]) calendarData.notes[key] = [];

        const index = calendarData.notes[key].findIndex(n => n.id === editingNote.id);
        
        if (index > -1) {
            // Atualiza
            calendarData.notes[key][index] = editingNote;
        } else {
            // Cria
            calendarData.notes[key].push(editingNote);
        }

        save();
        showNoteModal = false;
    }

    function deleteNote(noteId) {
        const key = getKey(selectedDay);
        if (!calendarData.notes[key]) return;

        calendarData.notes[key] = calendarData.notes[key].filter(n => n.id !== noteId);
        if (calendarData.notes[key].length === 0) delete calendarData.notes[key];
        
        // Se estava editando essa nota, fecha o modal
        if (showNoteModal && editingNote.id === noteId) showNoteModal = false;
        
        save();
    }

    // --- GESTÃO DE GRUPOS ---
    function assignGroupToDate(groupId) {
        if (!selectedDay) return;
        const key = getKey(selectedDay);
        
        // Remove de outros dias (opcional: garante que a base só está em um dia por vez cronologicamente)
        // Se quiser permitir histórico (rastro), comente este loop.
        for (const k in calendarData.events) {
            calendarData.events[k] = calendarData.events[k].filter(id => id !== groupId);
            if (calendarData.events[k].length === 0) delete calendarData.events[k];
        }

        if (!calendarData.events[key]) calendarData.events[key] = [];
        if (!calendarData.events[key].includes(groupId)) {
            calendarData.events[key].push(groupId);
        }
        
        save();
    }

    function removeGroupFromDate(groupId) {
        const key = getKey(selectedDay);
        if (calendarData.events[key]) {
            calendarData.events[key] = calendarData.events[key].filter(id => id !== groupId);
            if (calendarData.events[key].length === 0) delete calendarData.events[key];
            save();
        }
    }

    async function save() {
        // Força reatividade do Svelte
        calendarData = calendarData; 
        await game.settings.set(MODULE_ID, "calendarData", calendarData);
    }

    function getGroup(id) {
        return allGroups.find(g => g.id === id) || { name: "Desconhecido/Deletado", icon: "fa-question", isNomad: false };
    }

</script>

<div class="calendar-app" in:fade>
    
    <div class="cal-main">
        <header class="cal-header">
            <button on:click={() => changeMonth(-1)}><i class="fas fa-chevron-left"></i></button>
            <div class="date-display">
                <span class="month">{MONTHS[viewDate.month]}</span>
                <span class="year">ANO {viewDate.year}</span>
            </div>
            <button on:click={() => changeMonth(1)}><i class="fas fa-chevron-right"></i></button>
        </header>

        <div class="weekdays">
            {#each WEEKDAYS as d} <span>{d}</span> {/each}
        </div>

        <div class="days-grid">
            {#each calendarGrid as day}
                {#if day === null}
                    <div class="day empty"></div>
                {:else}
                    {@const key = `${viewDate.year}-${viewDate.month}-${day}`}
                    {@const isToday = calendarData.currentDate.day === day && calendarData.currentDate.month === viewDate.month && calendarData.currentDate.year === viewDate.year}
                    {@const hasNotes = calendarData.notes[key]?.length > 0}
                    {@const hasEvents = calendarData.events[key]?.length > 0}
                    
                    <div class="day {isToday ? 'today' : ''} {selectedDay === day ? 'selected' : ''}" 
                         on:click={() => selectedDay = day}>
                        
                        <span class="day-num">{day}</span>
                        
                        <div class="indicators">
                            {#if hasNotes} <span class="dot note"></span> {/if}
                            {#if hasEvents} <span class="dot event"></span> {/if}
                        </div>

                        {#if isToday} <div class="today-marker">HOJE</div> {/if}
                    </div>
                {/if}
            {/each}
        </div>
    </div>

    <div class="cal-sidebar">
        {#if selectedDay}
            <div class="day-header">
                <h3>{selectedDay} DE {MONTHS[viewDate.month]}</h3>
                {#if !(calendarData.currentDate.day === selectedDay && calendarData.currentDate.month === viewDate.month)}
                    <button class="set-today-btn" on:click={setToday}>DEFINIR COMO HOJE</button>
                {/if}
            </div>

            <div class="section">
                <div class="sec-head">
                    <h4><i class="fas fa-sticky-note"></i> REGISTROS</h4>
                    <button class="add-btn" on:click={() => openNoteModal()}>+</button>
                </div>
                
                <div class="notes-list custom-scroll">
                    {#each (calendarData.notes[getKey(selectedDay)] || []) as note}
                        <div class="note-item" on:click={() => openNoteModal(note)}>
                            <div class="note-content">
                                <strong>{note.title || note.text}</strong> <span class="preview">{note.desc ? note.desc.substring(0, 30) + '...' : ''}</span>
                            </div>
                            <button class="del-btn" on:click|stopPropagation={() => deleteNote(note.id)}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    {/each}
                    {#if !(calendarData.notes[getKey(selectedDay)]?.length)}
                        <small style="color:#666; font-style:italic;">Sem registros.</small>
                    {/if}
                </div>
            </div>

            <div class="section">
                <h4><i class="fas fa-map-marker-alt"></i> POSIÇÃO DE GRUPOS</h4>
                
                <div class="events-list">
                    {#each (calendarData.events[getKey(selectedDay)] || []) as grpId}
                        {@const grp = getGroup(grpId)}
                        <div class="group-tag">
                            <div class="grp-label">
                                <i class="fas {grp.isNomad ? 'fa-user-secret' : 'fa-warehouse'}"></i> 
                                {grp.name}
                            </div>
                            <button on:click={() => removeGroupFromDate(grpId)}>✕</button>
                        </div>
                    {/each}
                    {#if !(calendarData.events[getKey(selectedDay)]?.length)}
                        <small style="color:#666">Nenhum grupo nesta data.</small>
                    {/if}
                </div>

                <hr style="border-color: #333; margin: 10px 0;">
                
                <div class="assign-group">
                    <small>Mover grupo para cá:</small>
                    <div class="group-select custom-scroll">
                        {#each allGroups as grp}
                            <button class="grp-option" on:click={() => assignGroupToDate(grp.id)}>
                                <span>{grp.name}</span>
                                {#if grp.isNomad}<i class="fas fa-user-secret" title="Nômade"></i>{/if}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

        {:else}
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <p>Selecione um dia.</p>
            </div>
        {/if}
    </div>

    {#if showNoteModal}
        <div class="modal-backdrop" transition:fade>
            <div class="modal-box" in:scale>
                <div class="modal-header">
                    <span>{editingNote.id ? 'EDITAR REGISTRO' : 'NOVO REGISTRO'}</span>
                    <button class="close-modal" on:click={() => showNoteModal = false}>✕</button>
                </div>
                <div class="modal-body">
                    <label>TÍTULO</label>
                    <input type="text" bind:value={editingNote.title} placeholder="Assunto..." autofocus>
                    
                    <label>DETALHES / DESCRIÇÃO</label>
                    <textarea bind:value={editingNote.desc} placeholder="Escreva os detalhes do evento..."></textarea>
                </div>
                <div class="modal-footer">
                    {#if editingNote.id && calendarData.notes[getKey(selectedDay)]?.find(n => n.id === editingNote.id)}
                        <button class="btn-del-modal" on:click={() => deleteNote(editingNote.id)}>DELETAR</button>
                    {/if}
                    <div class="spacer"></div>
                    <button class="btn-save" on:click={saveNote}>SALVAR</button>
                </div>
            </div>
        </div>
    {/if}

</div>

<style>
    .calendar-app {
        display: flex; height: 100%; width: 100%;
        background: rgba(0,0,0,0.5);
        font-family: 'Share Tech Mono', monospace;
        position: relative;
    }

    /* MAIN CALENDAR */
    .cal-main { flex: 2; display: flex; flex-direction: column; border-right: 1px solid var(--c-primary); padding: 20px; }
    
    .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .cal-header button { background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); cursor: pointer; padding: 5px 15px; }
    .cal-header button:hover { background: var(--c-primary); color: #000; }
    .date-display { text-align: center; font-size: 1.5em; font-weight: bold; color: #fff; text-shadow: 0 0 10px var(--c-primary); }
    .year { display: block; font-size: 0.6em; color: var(--c-primary); }

    .weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 10px; color: #666; font-weight: bold; }
    
    .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; flex: 1; align-content: start; }
    .day { 
        aspect-ratio: 1; border: 1px solid #333; background: rgba(0,0,0,0.5); 
        cursor: pointer; position: relative; padding: 5px; transition: 0.2s;
        display: flex; flex-direction: column; justify-content: space-between;
    }
    .day:hover { border-color: #fff; background: rgba(255,255,255,0.05); }
    .day.empty { border: none; background: transparent; pointer-events: none; }
    
    .day.selected { border-color: var(--c-primary); box-shadow: inset 0 0 15px rgba(0, 255, 65, 0.2); background: rgba(var(--c-primary), 0.1); }
    .day.today { border: 2px solid #fff; }
    
    .day-num { font-size: 1.2em; font-weight: bold; color: #ccc; }
    .today-marker { font-size: 0.6em; background: #fff; color: #000; padding: 2px; text-align: center; font-weight: bold; }

    .indicators { display: flex; gap: 3px; justify-content: flex-end; }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .dot.note { background: #f59e0b; }
    .dot.event { background: #00bfff; box-shadow: 0 0 5px #00bfff; }

    /* SIDEBAR */
    .cal-sidebar { flex: 1; background: rgba(0,0,0,0.8); padding: 20px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; min-width: 300px; }
    
    .day-header { border-bottom: 1px solid var(--c-primary); padding-bottom: 10px; margin-bottom: 10px; }
    .day-header h3 { margin: 0; color: var(--c-primary); }
    .set-today-btn { width: 100%; margin-top: 10px; background: #222; border: 1px dashed var(--c-primary); color: #ccc; cursor: pointer; padding: 5px; font-size: 0.8em; }
    .set-today-btn:hover { background: var(--c-primary); color: #000; }

    .section { margin-bottom: 20px; }
    .sec-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 10px; }
    .section h4 { color: #888; margin: 0; }
    .add-btn { background: var(--c-primary); border: none; color: #000; font-weight: bold; cursor: pointer; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 2px; }

    .notes-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; }
    .note-item { 
        display: flex; justify-content: space-between; align-items: center; 
        background: #222; padding: 8px; border-left: 3px solid #f59e0b; 
        font-size: 0.9em; cursor: pointer; transition: 0.2s;
    }
    .note-item:hover { background: #333; }
    .note-content { display: flex; flex-direction: column; overflow: hidden; }
    .note-content strong { color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .note-content .preview { font-size: 0.8em; color: #888; }
    .del-btn { background: none; border: none; color: #f55; cursor: pointer; opacity: 0.5; }
    .del-btn:hover { opacity: 1; }

    .group-tag { 
        background: rgba(0, 191, 255, 0.1); border: 1px solid #00bfff; color: #00bfff; 
        padding: 8px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; 
    }
    .grp-label { display: flex; align-items: center; gap: 5px; font-weight: bold; }
    .group-tag button { background: none; border: none; color: #fff; cursor: pointer; }

    .group-select { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
    .grp-option { background: #111; border: none; padding: 8px; text-align: left; color: #888; cursor: pointer; display: flex; justify-content: space-between; }
    .grp-option:hover { background: #222; color: #fff; }

    .empty-state { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #444; text-align: center; }
    .empty-state i { font-size: 3em; margin-bottom: 10px; }

    /* MODAL */
    .modal-backdrop { 
        position: absolute; inset: 0; background: rgba(0,0,0,0.85); z-index: 50; 
        display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);
    }
    .modal-box { 
        width: 400px; background: #050505; border: 1px solid var(--c-primary); 
        box-shadow: 0 0 30px rgba(0,0,0,0.8); display: flex; flex-direction: column; 
    }
    .modal-header { 
        background: rgba(var(--c-primary), 0.1); padding: 10px 15px; border-bottom: 1px solid var(--c-primary);
        display: flex; justify-content: space-between; align-items: center; color: var(--c-primary); font-weight: bold;
    }
    .close-modal { background: none; border: none; color: #f55; cursor: pointer; font-weight: bold; }
    
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .modal-body label { font-size: 0.7em; color: #888; margin-bottom: -5px; }
    .modal-body input, .modal-body textarea { 
        background: #111; border: 1px solid #333; color: #fff; padding: 10px; 
        font-family: inherit; width: 100%; box-sizing: border-box; 
    }
    .modal-body input:focus, .modal-body textarea:focus { border-color: var(--c-primary); outline: none; }
    .modal-body textarea { height: 150px; resize: none; }

    .modal-footer { padding: 15px; border-top: 1px solid #222; display: flex; gap: 10px; }
    .spacer { flex: 1; }
    .btn-save { background: var(--c-primary); color: #000; border: none; padding: 8px 20px; font-weight: bold; cursor: pointer; }
    .btn-save:hover { box-shadow: 0 0 10px var(--c-primary); }
    .btn-del-modal { background: #300; border: 1px solid #500; color: #f55; padding: 8px 15px; cursor: pointer; }

    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; }
</style>