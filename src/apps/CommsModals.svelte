<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { CommsDatabase } from '../database/CommsDatabase.js';

    export let activeModal = null;
    export let showWarning = true;
    export let modalData = { input: "", input2: "", targetGroup: null };
    export let actor;

    const dispatch = createEventDispatcher();

    function closeModal() {
        dispatch('close');
    }

    function confirmPassword() {
        if (modalData.input === modalData.targetGroup.password) {
            dispatch('passwordSuccess', modalData.targetGroup);
        } else {
            ui.notifications.error("CHAVE_INVÁLIDA");
            modalData.input = "";
        }
    }
</script>

{#if activeModal || showWarning}
    <div class="modal-layer" transition:fade>
        {#if showWarning}
            <div class="terminal-card warning" in:scale>
                <header>⚠️ PROTOCOLO_CANÔNICO</header>
                <div class="card-content">
                    {@html CommsDatabase.getRPWarning()}
                    <button class="btn-full" on:click={() => dispatch('acceptWarning')}>AUTENTICAR</button>
                </div>
            </div>
        {:else if activeModal === 'password'}
            <div class="terminal-card small" in:scale>
                <header>SENHA REQUERIDA: {modalData.targetGroup.name}</header>
                <div class="card-content center">
                    <input type="password" maxlength="4" bind:value={modalData.input} class="hacker-input-large" autofocus on:keydown={e => e.key === 'Enter' && confirmPassword()}/>
                </div>
                <div class="card-footer">
                    <button class="btn-ghost" on:click={closeModal}>ABORTAR</button>
                    <button class="btn-main" on:click={confirmPassword}>ENTRAR</button>
                </div>
            </div>
        {:else if activeModal === 'add_contact'}
            <div class="terminal-card small" in:scale>
                <header>VINCULAR_NOVO_ID</header>
                <div class="card-content center">
                    <input type="text" bind:value={modalData.input} class="hacker-input" placeholder="MV-XXXX" />
                </div>
                <div class="card-footer">
                    <button class="btn-ghost" on:click={closeModal}>CANCELAR</button>
                    <button class="btn-main" on:click={() => { CommsDatabase.addContact(actor, modalData.input.toUpperCase()); closeModal(); }}>SINCRONIZAR</button>
                </div>
            </div>
        {:else if activeModal === 'create_group'}
            <div class="terminal-card" in:scale>
                <header>NOVA_FREQUÊNCIA</header>
                <div class="card-content">
                    <input type="text" bind:value={modalData.input} class="hacker-input" placeholder="NOME DO CANAL" />
                    <input type="password" maxlength="4" bind:value={modalData.input2} class="hacker-input" placeholder="SENHA (OPCIONAL)" style="margin-top:10px" />
                </div>
                <div class="card-footer">
                    <button class="btn-ghost" on:click={closeModal}>VOLTAR</button>
                    <button class="btn-main" on:click={() => { OnlineComms.createGroup(modalData.input, modalData.input2); closeModal(); }}>INICIALIZAR</button>
                </div>
            </div>
        {:else if activeModal === 'post_status'}
            <div class="terminal-card" in:scale>
                <header>TRANSMITIR_AO_FEED</header>
                <div class="card-content">
                    <input type="text" bind:value={modalData.input} class="hacker-input" placeholder="Mensagem..." />
                    <input type="text" bind:value={modalData.input2} class="hacker-input" placeholder="URL da Imagem..." style="margin-top:10px" />
                </div>
                <div class="card-footer">
                    <button class="btn-ghost" on:click={closeModal}>ABORTAR</button>
                    <button class="btn-main" on:click={() => { OnlineComms.updateStatus(actor, {text: modalData.input, image: modalData.input2}); closeModal(); }}>TRANSMITIR</button>
                </div>
            </div>
        {/if}
    </div>
{/if}

<style>
    /* Cole AQUI todo o CSS referente a .modal-layer, .terminal-card, .btn-main, etc. do seu código original */
    .modal-layer { position: absolute; inset: 0; z-index: 1000; background: rgba(0,0,0,0.9); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 40px; }
    .terminal-card { background: #050505; border: 1px solid var(--c-primary); width: 100%; max-width: 500px; box-shadow: 0 0 40px #000; display: flex; flex-direction: column; }
    .terminal-card header { padding: 12px 20px; background: var(--c-primary); color: #000; font-weight: bold; font-size: 12px; letter-spacing: 2px; }
    .card-content { padding: 30px; overflow-y: auto; max-height: 60vh; }
    .card-content.center { text-align: center; }
    .card-footer { padding: 15px; display: flex; justify-content: flex-end; gap: 15px; border-top: 1px solid #222; }
    .hacker-input-large { background: #000; border: 1px solid var(--c-primary); color: var(--c-primary); font-size: 32px; text-align: center; width: 200px; margin-top: 20px; letter-spacing: 10px; padding: 10px; }
    .hacker-input { width: 100%; background: #000; border: 1px solid #444; color: #fff; padding: 10px; font-family: inherit; }
    .btn-main { background: var(--c-primary); color: #000; border: none; padding: 10px 25px; font-weight: bold; cursor: pointer; }
    .btn-ghost { background: transparent; border: 1px solid #444; color: #666; padding: 10px 25px; cursor: pointer; }
    .btn-full { width: 100%; background: var(--c-primary); border: none; padding: 15px; font-weight: bold; cursor: pointer; }
</style>