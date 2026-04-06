const MODULE_ID = "multiversus-rpg";

export const SystemBookDB = {
    // Inicializa a configuração no Foundry VTT
    init: () => {
        // Banco de Livros
        if (!game.settings.settings.has(`${MODULE_ID}.srd_books`)) {
            game.settings.register(MODULE_ID, "srd_books", {
                scope: "world",
                config: false,
                type: Array,
                default: []
            });
        }
        
        // Banco de Dados do Glossário Global (A "Matriz")
        if (!game.settings.settings.has(`${MODULE_ID}.srd_glossary`)) {
            game.settings.register(MODULE_ID, "srd_glossary", {
                scope: "world",
                config: false,
                type: Object,
                default: {}
            });
        }
    },

    getBooks: () => { return game.settings.get(MODULE_ID, "srd_books") || []; },
    saveBooks: async (booksArray) => { await game.settings.set(MODULE_ID, "srd_books", booksArray); },

    getGlossary: () => { return game.settings.get(MODULE_ID, "srd_glossary") || {}; },
    saveGlossary: async (glossaryObj) => { await game.settings.set(MODULE_ID, "srd_glossary", glossaryObj); },

    // Cria um livro novo estruturado
    createNewBook: async (title = "Novo Livro do Sistema") => {
        const books = SystemBookDB.getBooks();
        const newBook = {
            id: foundry.utils.randomID(),
            type: 'book',             
            category: "GERAL",        
            title: title,
            summary: "Sinopse do livro de regras...", 
            image: "https://placehold.co/400x200/0a0a0c/00ff41?text=LIVRO+DE+REGRAS",
            chapters: [
                { 
                    id: foundry.utils.randomID(), 
                    folder: "Introdução", // Categoria para o Índice
                    title: "Página Inicial", 
                    content: "# Bem-vindo\nEscreva as regras aqui...",
                    customHtml: ""
                }
            ]
        };
        books.push(newBook);
        await SystemBookDB.saveBooks(books);
        return newBook;
    }
};