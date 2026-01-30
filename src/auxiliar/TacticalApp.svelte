<script>
    import { AuxiliarSystem } from './AuxiliarSystem.js';

</script>

<div class="app-window">
    <div class="grid">
        <button class="btn gold" on:click={() => run('coins')}>
            <i class="fas fa-coins"></i> <span>STIMULUS (+100)</span>
        </button>
        <button class="btn health" on:click={() => run('heal')}>
            <i class="fas fa-medkit"></i> <span>SUPORTE MÉDICO</span>
        </button>
        <button class="btn util">
            <i class="fas fa-eye"></i> <span>REVELAR ÁREA</span>
        </button>
    </div>
</div>

<style>
    .app-window { padding: 10px; height: 100%; background: #050505; }
    .grid { display: grid; gap: 10px; }
    .btn { 
        padding: 15px; background: #111; border: 1px solid #333; color: #ccc; 
        display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.2s;
    }
    .btn:hover { transform: translateX(5px); }
    .btn i { width: 20px; text-align: center; }
    
    .gold:hover { border-color: #ffcc00; color: #ffcc00; }
    .health:hover { border-color: #ff3333; color: #ff3333; }
    .util:hover { border-color: #00fbff; color: #00fbff; }
</style>