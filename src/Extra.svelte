<script>
    export let item;
    $: system = item.system;
    $: themeColor = item.actor?.getFlag("multiversus-rpg", "themeColor") || "#00ff41";

    async function update(path, val) {
        await item.update({ [path]: val });
    }
</script>

<div class="matrix-extra-sheet" style="--theme: {themeColor}">
    <header class="extra-header">
        <div class="icon">E</div>
        <input type="text" value={item.name} on:change={e => update('name', e.target.value)} />
    </header>

    <main class="extra-body">
        <div class="stat-grid">
            <div class="stat-input">
                <label>MODIFICADOR_PB</label>
                <input type="number" value={system.pointCost} on:change={e => update('system.pointCost', Number(e.target.value))} />
            </div>
            
            <div class="toggle-list">
                <label class="matrix-check">
                    <input type="checkbox" checked={system.multibuy} on:change={e => update('system.multibuy', e.target.checked)} />
                    <span>COMPRA_MÚLTIPLA</span>
                </label>
                <label class="matrix-check">
                    <input type="checkbox" checked={system.fociOnly} on:change={e => update('system.fociOnly', e.target.checked)} />
                    <span>APENAS_FOCO (EQUIP)</span>
                </label>
            </div>
        </div>

        <div class="desc-box">
            <label>:: DOCUMENTAÇÃO_TÉCNICA</label>
            <textarea value={system.notes} on:input={e => update('system.notes', e.target.value)}></textarea>
        </div>
    </main>
</div>

<style>
    .matrix-extra-sheet {
        position: absolute; inset: 0; background: #050505; color: var(--theme);
        font-family: 'Share Tech Mono', monospace; display: flex; flex-direction: column;
        border: 2px solid var(--theme); padding: 15px;
    }
    .extra-header { display: flex; gap: 15px; align-items: center; border-bottom: 1px solid var(--theme); padding-bottom: 10px; }
    .icon { background: var(--theme); color: #000; font-weight: bold; padding: 5px 12px; font-size: 20px; }
    .extra-header input { background: transparent; border: none; color: #fff; font-size: 20px; outline: none; flex: 1; }

    .extra-body { flex: 1; padding-top: 20px; display: flex; flex-direction: column; gap: 20px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .stat-input label { display: block; font-size: 10px; opacity: 0.6; margin-bottom: 5px; }
    .stat-input input { background: #000; border: 1px solid #333; color: var(--theme); padding: 8px; width: 100%; font-size: 18px; }

    .toggle-list { display: flex; flex-direction: column; gap: 10px; justify-content: center; }
    .matrix-check { display: flex; align-items: center; gap: 10px; font-size: 11px; cursor: pointer; }
    .matrix-check input { accent-color: var(--theme); }

    .desc-box { flex: 1; display: flex; flex-direction: column; }
    .desc-box label { font-size: 10px; opacity: 0.6; margin-bottom: 5px; }
    .desc-box textarea { flex: 1; background: #000; border: 1px solid #222; color: #ccc; padding: 10px; resize: none; outline: none; font-family: inherit; }
</style>