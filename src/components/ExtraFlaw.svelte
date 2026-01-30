<script>
  import { EXTRAS_DB } from '../data/extras-data.js';
  import { FLAWS_DB } from '../data/flaws-data.js';
  import EffectCard from './EffectCard.svelte';
  
  // Importamos onDestroy para limpar o evento quando fechar a janela
  import { onDestroy } from 'svelte';

  export let item;
  export let qualityIndex;
  export let application;

  // --- REATIVIDADE DE TEMPO REAL ---
  
  // 1. Variáveis Reativas Básicas
  $: quality = item.system.qualities[qualityIndex];
  $: savedExtras = quality.extras || [];

  // 2. O Segredo do Tempo Real: Hook do Foundry
  // Toda vez que QUALQUER item atualizar no jogo, esse código roda.
  const hookId = Hooks.on("updateItem", (document, change, options, userId) => {
    // Verificamos se o item atualizado é O MESMO que estamos editando
    if (document.id === item.id) {
      // Atualizamos a referência local do item para a nova versão
      item = document;
      // O Svelte percebe que 'item' mudou e recalcula automaticamente 
      // as variáveis 'quality' e 'savedExtras' lá em cima ($:)
    }
  });

  // 3. Limpeza (Importante!)
  // Quando fechar essa janela, paramos de escutar para não pesar o jogo
  onDestroy(() => {
    Hooks.off("updateItem", hookId);
  });

  // --- RESTO DO CÓDIGO (Lógica de Update e Descrição) ---

  let selectedDescription = null;

  async function updateExtra(effectData, change = 0) {
    // Clona o array para evitar mutação direta antes do save
    let newEffects = savedExtras ? [...savedExtras] : [];
    const index = newEffects.findIndex(e => e.id === effectData.id);

    if (index >= 0) {
      if (change === 0) {
        newEffects.splice(index, 1); // Remover
      } else {
        let currentQty = newEffects[index].qty || 1;
        let newQty = currentQty + change;
        if (newQty < 1) newEffects.splice(index, 1);
        else newEffects[index].qty = newQty;
      }
    } else {
      if (change >= 0) {
        newEffects.push({
          id: effectData.id,
          name: effectData.name,
          cost: effectData.cost,
          qty: 1
        });
      }
    }

    // Prepara e Salva
    const qualities = [...item.system.qualities];
    qualities[qualityIndex].extras = newEffects;
    
    // O await aqui garante que o save termine.
    // Assim que terminar, o Hook lá em cima vai disparar e atualizar a tela visualmente.
    await item.update({ "system.qualities": qualities });
  }

  function showDescription(desc, name) {
    selectedDescription = { text: desc, title: name };
  }
</script>

<div class="manager-layout">
  
  <div class="column extras-col">
    <div class="col-header">
      <i class="fas fa-plus-circle"></i> EXTRAS
    </div>
    <div class="grid-container">
      {#each EXTRAS_DB as extra}
        <EffectCard 
          effect={extra} 
          savedExtras={savedExtras} 
          onUpdate={updateExtra} 
          onInfo={showDescription} 
          type="extra"
        />
      {/each}
    </div>
  </div>

  <div class="column flaws-col">
    <div class="col-header">
      <i class="fas fa-minus-circle"></i> FLAWS
    </div>
    <div class="grid-container">
      {#each FLAWS_DB as flaw}
        <EffectCard 
          effect={flaw} 
          savedExtras={savedExtras} 
          onUpdate={updateExtra} 
          onInfo={showDescription} 
          type="flaw"
        />
      {/each}
    </div>
  </div>

  {#if selectedDescription}
    <div class="modal-overlay" on:click={() => selectedDescription = null}>
      <div class="modal-card" on:click|stopPropagation>
        <h3 class="modal-title">{selectedDescription.title}</h3>
        <div class="modal-body">{@html selectedDescription.text}</div>
        <button class="modal-close" on:click={() => selectedDescription = null}>Close</button>
      </div>
    </div>
  {/if}

</div>

<style>
  /* MANTER O MESMO ESTILO QUE JÁ ESTAVA NO ARQUIVO ANTERIOR */
  /* (Copie o bloco <style> da resposta anterior se precisar, 
      mas o foco aqui foi a lógica do <script>) */

  .manager-layout {
    display: flex; height: 100%; background: #0a0a0a; color: #e0e0e0;
    font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; overflow: hidden;
  }
  .column { flex: 1; display: flex; flex-direction: column; border-right: 2px solid #222; min-width: 300px; }
  .column:last-child { border-right: none; }
  .col-header { padding: 12px; text-align: center; font-weight: 700; font-size: 1.1em; background: #111; border-bottom: 2px solid #222; }
  .extras-col .col-header { color: #00e676; border-bottom-color: #00e676; }
  .flaws-col .col-header { color: #ff5252; border-bottom-color: #ff5252; }
  
  .grid-container {
    flex: 1; overflow-y: auto; padding: 10px; display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    grid-auto-rows: min-content; gap: 8px;
    background: radial-gradient(circle at center, #151515 0%, #0a0a0a 100%);
  }

  /* Scrollbar */
  .grid-container::-webkit-scrollbar { width: 8px; }
  .grid-container::-webkit-scrollbar-track { background: #000; }
  .grid-container::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }

  /* Modal */
  .modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 500; display: flex; align-items: center; justify-content: center; }
  .modal-card { background: #1a1a1a; border: 1px solid #444; box-shadow: 0 0 25px rgba(0,0,0,0.8); border-radius: 8px; padding: 20px; max-width: 400px; width: 90%; text-align: center; }
  .modal-title { margin-top: 0; color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px; }
  .modal-body { color: #ccc; line-height: 1.5; margin-bottom: 20px; text-align: left; }
  .modal-close { background: #333; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
  .modal-close:hover { background: #555; }
</style>