<script>
    import NexusApp from './NexusApp.svelte';
    export let themeStyle = ""; 
    export let actor = null; // mantendo a compatibilidade de props da Ficha.svelte
</script>

<div style="{themeStyle}; height: 100%; width: 100%;">
    <!-- Usa a nova arquitetura unificada nativa baseada em Folders e Journals -->
    <NexusApp />
</div>