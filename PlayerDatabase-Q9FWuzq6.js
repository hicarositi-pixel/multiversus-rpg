const a = "multiversus-rpg", s = "player_lore_data", o = {
  // Carrega dados (Leitura é liberada para todos)
  getAll: () => game.settings.get(a, s) || [],
  // Jogador tenta salvar -> Manda Socket pro Mestre
  saveEntry: async (e) => {
    if (game.user.isGM) {
      let t = o.getAll();
      const i = t.findIndex((l) => l.id === e.id);
      i >= 0 ? t[i] = e : t.push(e), await game.settings.set(a, s, t);
    } else
      console.log("PlayerDB: Solicitando salvamento ao GM..."), game.socket.emit(`module.${a}`, {
        type: "PLAYER_DB_SAVE",
        entry: e
      }), ui.notifications.info("Enviado para aprovação do servidor...");
  },
  deleteEntry: async (e) => {
    if (game.user.isGM) {
      let t = o.getAll().filter((i) => i.id !== e);
      await game.settings.set(a, s, t);
    } else
      game.socket.emit(`module.${a}`, {
        type: "PLAYER_DB_DELETE",
        id: e
      }), ui.notifications.info("Solicitação de exclusão enviada...");
  }
};
export {
  o as PlayerDatabase
};
