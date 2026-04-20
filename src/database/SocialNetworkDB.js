const MODULE_ID = "multiversus-rpg";

export class SocialNetworkDB {
    static async getDB() {
        let entry = game.journal.getName("NEXUS_SOCIAL_DB");
        if (!entry && game.user.isGM) {
            entry = await JournalEntry.create({
                name: "NEXUS_SOCIAL_DB",
                ownership: { default: 3 } // Todos leem e escrevem
            });
            await entry.setFlag(MODULE_ID, "posts", []);
            await entry.setFlag(MODULE_ID, "users", {});
        }
        return entry;
    }

    static async notifyUpdate() {
        game.socket.emit(`module.${MODULE_ID}`, { type: "SOCIAL_NET_REFRESH" });
        Hooks.callAll("socialNetUpdate");
    }

    static async getData() {
        const db = await this.getDB();
        if (!db) return { posts: [], users: {} };
        const posts = db.getFlag(MODULE_ID, "posts") || [];
        const users = db.getFlag(MODULE_ID, "users") || {};
        return { posts, users };
    }

    static async publishPost(authorId, text, attachments, newFollowersGained) {
        const db = await this.getDB();
        if (!db) return;
        
        let { posts, users } = await this.getData();
        
        if (!users[authorId]) {
            users[authorId] = { id: authorId, baseFollowers: 0, following: [], lastPostTime: 0 };
        }
        
        users[authorId].baseFollowers += newFollowersGained;
        users[authorId].lastPostTime = Date.now();
        
        const newPost = {
            id: foundry.utils.randomID(),
            authorId,
            text,
            attachments,
            timestamp: Date.now(),
            reactions: {},
            comments: []
        };
        
        posts.unshift(newPost); // Adiciona no início (Feed em ordem cronológica reversa)
        if (posts.length > 500) posts.pop(); // Limita a 500 postagens na rede toda
        
        await db.setFlag(MODULE_ID, "posts", posts);
        await db.setFlag(MODULE_ID, "users", users);
        
        this.notifyUpdate();
        return newPost;
    }

    static async addComment(postId, authorId, text) {
        const db = await this.getDB();
        if (!db) return;
        let posts = db.getFlag(MODULE_ID, "posts") || [];
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.comments.push({
                id: foundry.utils.randomID(),
                authorId,
                text,
                timestamp: Date.now()
            });
            await db.setFlag(MODULE_ID, "posts", posts);
            this.notifyUpdate();
        }
    }

    static async deletePost(postId) {
        const db = await this.getDB();
        if (!db) return;
        let posts = db.getFlag(MODULE_ID, "posts") || [];
        posts = posts.filter(p => p.id !== postId);
        await db.setFlag(MODULE_ID, "posts", posts);
        this.notifyUpdate();
    }

    static async toggleReaction(postId, emoji, userId) {
        const db = await this.getDB();
        if (!db) return;
        let posts = db.getFlag(MODULE_ID, "posts") || [];
        const post = posts.find(p => p.id === postId);
        if (post) {
            if (!post.reactions) post.reactions = {};
            if (!post.reactions[emoji]) post.reactions[emoji] = [];
            
            const index = post.reactions[emoji].indexOf(userId);
            if (index > -1) {
                post.reactions[emoji].splice(index, 1);
                if (post.reactions[emoji].length === 0) delete post.reactions[emoji];
            } else {
                post.reactions[emoji].push(userId);
            }
            await db.setFlag(MODULE_ID, "posts", posts);
            this.notifyUpdate();
        }
    }

    static async toggleFollow(myId, targetId) {
        const db = await this.getDB();
        if (!db) return;
        let users = db.getFlag(MODULE_ID, "users") || {};
        
        if (!users[myId]) users[myId] = { id: myId, baseFollowers: 0, following: [], lastPostTime: 0 };
        if (!users[myId].following) users[myId].following = [];
        
        const index = users[myId].following.indexOf(targetId);
        if (index > -1) {
            users[myId].following.splice(index, 1);
        } else {
            users[myId].following.push(targetId);
        }
        
        await db.setFlag(MODULE_ID, "users", users);
        this.notifyUpdate();
    }
}
