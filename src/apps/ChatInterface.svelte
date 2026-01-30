<script>
  import { onMount, tick } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { CHAT_THEME_DB } from '../components/ChatThemeDB.js';

  export let log; 

  let messages = [];
  let chatInput = "";
  let currentNick = game.user.name;
  let useCustomNick = false;
  let showThemeSettings = false;

  // TEMA
  let savedTheme = game.settings.get("multiversus-rpg", "chatTheme") || "neon-link"; 
  $: activeThemeKey = CHAT_THEME_DB[savedTheme] ? savedTheme : "neon-link";
  $: currentTheme = CHAT_THEME_DB[activeThemeKey];

  async function setChatTheme(key) {
      savedTheme = key;
      await game.settings.set("client", "chatTheme", key);
      showThemeSettings = false;
  }

  // REATIVIDADE DE MENSAGENS
  function updateMessages() {
    // Pegamos as mensagens e garantimos que as nativas do Foundry (como as do seu print) sejam processadas
    messages = game.messages.contents.map(m => ({
        id: m.id,
        user: m.user,
        alias: m.getFlag("multiversus-rpg", "customNick") || m.alias, 
        content: m.content,
        flavor: m.flavor,
        isRoll: m.isRoll,
        timestamp: new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        color: m.user.color,
        isMe: m.isAuthor,
        isWhisper: m.whisper.length > 0 && !m.isRoll
    }));
    scrollToBottom();
  }

  onMount(() => {
    updateMessages();
    Hooks.on('createChatMessage', updateMessages);
    Hooks.on('updateChatMessage', updateMessages);
    Hooks.on('deleteChatMessage', updateMessages);
    Hooks.on('renderChatMessage', updateMessages);
    
    return () => {
      Hooks.off('createChatMessage', updateMessages);
      Hooks.off('updateChatMessage', updateMessages);
      Hooks.off('deleteChatMessage', updateMessages);
      Hooks.off('renderChatMessage', updateMessages);
    };
  });

  let scrollDiv;
  async function scrollToBottom() {
    await tick();
    if(scrollDiv) scrollDiv.scrollTop = scrollDiv.scrollHeight;
  }

  async function sendMessage() {
    if (!chatInput.trim()) return;
    
    // O Speaker nativo do Foundry
    const speaker = ChatMessage.getSpeaker();
    
    // Prepara flags se houver nick customizado
    const flags = useCustomNick ? { "multiversus-rpg": { "customNick": currentNick } } : {};

    // Manda pro log do Foundry processar (aceita /roll, etc)
    log.processMessage(chatInput).then(() => {
        // Se a mensagem for processada, limpamos o input
        chatInput = "";
    });
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Funções Nativas Re-expostas (Opcional, se quiser botões extras)
  function clearChat() { log.deleteAll(); }
</script>

<div class="nexus-chat-ui" style="{Object.entries(currentTheme.vars).map(([k,v]) => `${k}:${v}`).join(';')}">
  
  <div class="nexus-sub-header">
      <div class="nick-box">
          {#if useCustomNick}
            <input type="text" class="nick-edit" bind:value={currentNick} />
            <button class="icon-action active" on:click={()=>useCustomNick=false}><i class="fas fa-mask"></i></button>
          {:else}
            <span class="nick-display">{game.user.name}</span>
            <button class="icon-action" on:click={()=>useCustomNick=true}><i class="fas fa-user-secret"></i></button>
          {/if}
      </div>
      <button class="icon-action" on:click={()=>showThemeSettings = !showThemeSettings}><i class="fas fa-palette"></i></button>
  </div>

  {#if showThemeSettings}
      <div class="theme-overlay" transition:fade on:click|self={()=>showThemeSettings=false}>
          <div class="theme-popout" transition:scale>
              {#each Object.entries(CHAT_THEME_DB) as [key, theme]}
                  <button on:click={()=>setChatTheme(key)} class:active={activeThemeKey === key}>
                      {theme.label}
                  </button>
              {/each}
          </div>
      </div>
  {/if}

  <div class="msg-scroller custom-scroll" bind:this={scrollDiv}>
    {#each messages as msg (msg.id)}
      <div class="msg-item {msg.isMe ? 'mine' : 'theirs'} {msg.isRoll ? 'roll' : ''}" transition:fly={{y: 5}}>
          <div class="msg-bubble">
              <div class="meta">
                  <span class="name" style="color: {msg.isMe ? 'var(--chat-accent)' : msg.color}">{msg.alias}</span>
                  <span class="time">{msg.timestamp}</span>
              </div>
              <div class="content">
                  {#if msg.flavor}<div class="flavor">{@html msg.flavor}</div>{/if}
                  <div class="text">{@html msg.content}</div>
              </div>
          </div>
      </div>
    {/each}
  </div>

  <footer class="nexus-input-area">
      <textarea bind:value={chatInput} on:keydown={handleKey} placeholder="Transmitir..."></textarea>
      <button class="btn-send" on:click={sendMessage}><i class="fas fa-paper-plane"></i></button>
  </footer>
</div>

<style>
  .nexus-chat-ui {
    display: flex; flex-direction: column; height: 100%;
    background: var(--chat-bg); font-family: var(--font); color: var(--chat-text);
  }

  .nexus-sub-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 5px 10px; background: rgba(0,0,0,0.4); border-bottom: 1px solid var(--chat-border);
  }
  .nick-box { display: flex; align-items: center; gap: 8px; flex: 1; }
  .nick-display { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--chat-accent); }
  .nick-edit { background: #000; border: 1px solid var(--chat-accent); color: var(--chat-accent); font-size: 10px; padding: 2px 5px; width: 80px; }
  
  .icon-action { background: none; border: none; color: #555; cursor: pointer; font-size: 12px; }
  .icon-action:hover, .icon-action.active { color: var(--chat-accent); }

  .theme-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; }
  .theme-popout { background: #111; padding: 10px; border: 1px solid var(--chat-accent); display: flex; flex-direction: column; gap: 5px; }
  .theme-popout button { background: #222; border: none; color: #fff; padding: 8px; cursor: pointer; text-align: left; }
  .theme-popout button.active { background: var(--chat-accent); color: #000; font-weight: bold; }

  .msg-scroller { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
  
  .msg-item { display: flex; max-width: 90%; }
  .msg-item.mine { align-self: flex-end; }
  .msg-item.theirs { align-self: flex-start; }
  
  .msg-bubble { 
      background: var(--msg-theirs-bg); border: 1px solid var(--msg-theirs-border); 
      padding: 8px; border-radius: var(--radius); width: 100%;
  }
  .mine .msg-bubble { background: var(--msg-mine-bg); border-color: var(--msg-mine-border); }
  .msg-item.roll { max-width: 100%; width: 100%; }
  .roll .msg-bubble { background: var(--msg-roll-bg); border: 1px dashed var(--chat-accent); text-align: center; }

  .meta { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 4px; opacity: 0.7; }
  .name { font-weight: bold; }
  .flavor { font-size: 11px; font-style: italic; color: var(--chat-accent); margin-bottom: 5px; }
  .text { font-size: 13px; line-height: 1.4; }

  /* Estilos para o HTML nativo das rolagens */
  .text :global(.dice-formula) { background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 3px; }
  .text :global(.dice-total) { font-size: 1.2em; font-weight: bold; color: var(--chat-accent); }

  .nexus-input-area { 
      display: flex; gap: 8px; padding: 10px; background: var(--input-bg); 
      border-top: 1px solid var(--chat-border); 
  }
  .nexus-input-area textarea { 
      flex: 1; background: #000; border: 1px solid var(--chat-border); color: #fff; 
      padding: 8px; resize: none; border-radius: var(--radius); height: 36px;
  }
  .nexus-input-area textarea:focus { border-color: var(--chat-accent); outline: none; }
  
  .btn-send { 
      width: 36px; height: 36px; background: var(--chat-accent); border: none; 
      border-radius: var(--radius); cursor: pointer; color: #000;
  }

  .custom-scroll::-webkit-scrollbar { width: 3px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: var(--chat-accent); }
</style>