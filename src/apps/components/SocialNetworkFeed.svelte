<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { slide, fade } from 'svelte/transition';
    import { SocialNetworkDB } from '../../database/SocialNetworkDB.js';
    import { snPostsStore, snUsersStore, updateSNStore } from '../../database/SocialNetworkStore.js';

    export let actor; 
    export let viewMode = "feed"; 

    $: currentActorId = actor?.id;
    $: allActors = Array.from(game.actors).filter(a => a.hasPlayerOwner);

    let composerText = "";
    let composerMediaArray = [];
    let isPostPrivate = false;
    
    const dispatch = createEventDispatcher();
    let socialVisibleActors = [];
    try { socialVisibleActors = game.settings.get("multiversus-rpg", "socialVisibleActors") || []; } catch(e){}
    
    let activeCommentPost = null;
    let viewingProfileOf = null;
    let viewingListType = null;
    let viewingListFor = null;
    let commentText = "";
    let emojiMenuOpenFor = null;

    let editProfileMode = false;
    let socialProfile = { socialName: "", bio: "", attachments: [], coverImage: "" };
    let followerEditAmount = 10;

    function startEditProfile() {
        if (actor) {
            const sp = actor.getFlag("multiversus-rpg", "social_profile") || {};
            socialProfile = { socialName: sp.socialName || "", bio: sp.bio || "", attachments: sp.attachments || [], coverImage: sp.coverImage || "" };
        }
        editProfileMode = true;
    }

    async function saveProfile() {
        if (!actor) return;
        await actor.setFlag("multiversus-rpg", "social_profile", socialProfile);
        ui.notifications.info("Perfil atualizado!");
        editProfileMode = false;
    }

    const EMOJIS = ["👍", "❤️", "😂", "😲", "😢", "😡", "🔥", "🫦"];

    onMount(() => {
        updateSNStore();
        Hooks.on("socialNetUpdate", () => {
            updateSNStore();
        });
    });

    $: posts = $snPostsStore || [];
    $: users = $snUsersStore || {};
    
    function isMutualFollow(uid1, uid2) {
        if (!users[uid1] || !users[uid2]) return false;
        return (users[uid1].following || []).includes(uid2) && (users[uid2].following || []).includes(uid1);
    }
    
    $: visiblePosts = posts.filter(p => {
        if (!p.isPrivate) return true;
        if (p.authorId === currentActorId) return true;
        if (game.user.isGM) return true;
        return isMutualFollow(currentActorId, p.authorId);
    }).sort((a, b) => {
        const fa = calculateTotalFollowers(a.authorId, users);
        const fb = calculateTotalFollowers(b.authorId, users);
        if (fb !== fa) return fb - fa; // Decrescente em seguidores
        return b.timestamp - a.timestamp; // Decrescente em data (mais recente primeiro)
    });

    const COOLDOWN_MS = 3 * 60 * 60 * 1000;
    // Opcionalmente, pode ser apenas 1 minuto para testar (comente e descomente para debug):
    // const COOLDOWN_MS = 60 * 1000; 
    
    $: myData = users[currentActorId] || { baseFollowers: 0, following: [], lastPostTime: 0 };
    $: timeSinceLastPost = Date.now() - (myData.lastPostTime || 0);
    $: canPost = timeSinceLastPost >= COOLDOWN_MS;
    
    $: timeLeftObj = canPost ? null : msToTime(COOLDOWN_MS - timeSinceLastPost);
    
    function msToTime(duration) {
        let minutes = Math.floor((duration / (1000 * 60)) % 60);
        let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        return hours + "h " + minutes + "m";
    }

    // Intervalo para atualizar o relógio
    let timerInterval;
    onMount(() => {
        timerInterval = setInterval(() => {
            timeSinceLastPost = Date.now() - (myData.lastPostTime || 0);
        }, 60000); // Atualiza a cada minuto
        return () => clearInterval(timerInterval);
    });

    function calculateTotalFollowers(uid, _u = users) {
        if (!_u[uid]) return 0;
        const base = _u[uid].baseFollowers || 0;
        let bonus = 0;
        for (const tid of (_u[uid].following || [])) {
            if (_u[tid]) {
                bonus += Math.floor((users[tid].baseFollowers || 0) * 0.25);
            }
        }
        return base + bonus + getFollowersList(uid).length;
    }

    function getFollowersList(uid) {
        let followers = [];
        for (const [id, data] of Object.entries(users)) {
            if ((data.following || []).includes(uid) && game.actors.get(id)) {
                followers.push(id);
            }
        }
        return followers;
    }

    function getFollowingList(uid, _u = users) {
        return (_u[uid]?.following || []).filter(id => game.actors.get(id));
    }

    async function handlePublish() {
        if (!canPost && !game.user.isGM) return ui.notifications.warn("Aguarde o cooldown da rede social.");
        if (!composerText && composerMediaArray.filter(m => m.trim().length > 0).length === 0) return;

        let modMult = 1;
        let currentFollowers = calculateTotalFollowers(currentActorId, users);
        let hyperSum = 0;

        if (actor) {
            const stats = actor.getFlag("multiversus-rpg", "stats") || {};
            const skills = actor.getFlag("multiversus-rpg", "skills") || {};
            
            const charmNormal = Number(stats.charm?.normal) || 0;
            const commandNormal = Number(stats.command?.normal) || 0;
            
            const hyperCharm = (Number(stats.charm?.h_normal) || 0) + (Number(stats.charm?.h_hard) || 0) + (Number(stats.charm?.h_wiggle) || 0);
            const hyperCommand = (Number(stats.command?.h_normal) || 0) + (Number(stats.command?.h_hard) || 0) + (Number(stats.command?.h_wiggle) || 0);
            
            const skC = skills.charm || [];
            const skCmd = skills.command || [];
            
            const getSkillNormal = (list, name) => {
                const s = list.find(x => x.name === name);
                return s ? (Number(s.normal) || 0) : 0;
            };
            const getSkillHyper = (list, name) => {
                const s = list.find(x => x.name === name);
                if (!s) return 0;
                return (Number(s.h_normal) || 0) + (Number(s.h_hard) || 0) + (Number(s.h_wiggle) || 0);
            };

            const normalSum = charmNormal + commandNormal + getSkillNormal(skC, "Persuasão") + getSkillNormal(skC, "Mentir") + getSkillNormal(skCmd, "Liderar");
            hyperSum = hyperCharm + hyperCommand + getSkillHyper(skC, "Persuasão") + getSkillHyper(skC, "Mentir") + getSkillHyper(skCmd, "Liderar");

            modMult = Math.max(1, Math.floor(normalSum / 2) + hyperSum);
        }

        let baseDiceQty = 1, baseDiceType = 6, extraPercent = 0;
        
        if (currentFollowers < 250) { baseDiceQty = 1; baseDiceType = 6; }
        else if (currentFollowers < 500) { baseDiceQty = 1; baseDiceType = 12; }
        else if (currentFollowers < 1000) { baseDiceQty = 2; baseDiceType = 6; }
        else if (currentFollowers < 2000) { baseDiceQty = 2; baseDiceType = 12; }
        else if (currentFollowers < 4000) { baseDiceQty = 4; baseDiceType = 12; }
        else if (currentFollowers < 8000) { baseDiceQty = 8; baseDiceType = 12; }
        else if (currentFollowers < 16000) { baseDiceQty = 8; baseDiceType = 12; extraPercent = 10; }
        else if (currentFollowers < 32000) { baseDiceQty = 10; baseDiceType = 12; extraPercent = 10; }
        else if (currentFollowers < 1000000) { baseDiceQty = 10; baseDiceType = 12; extraPercent = 10; }
        else {
            baseDiceQty = 10; baseDiceType = 12;
            if (hyperSum > 0) extraPercent = 10 + (hyperSum * 1);
            else extraPercent = 0;
        }

        let finalDiceQty = baseDiceQty * modMult;
        let gained = 0;

        if (!canPost && game.user.isGM) {
            ui.notifications.warn("Post publicado sem ganho de seguidores (Cooldown ignorado)");
        } else {
            const roll = new Roll(`${finalDiceQty}d${baseDiceType}`);
            await roll.evaluate();
            let percentBonus = Math.floor(currentFollowers * (extraPercent / 100));
            gained = roll.total + percentBonus;
        }

        const validMedia = composerMediaArray.filter(m => m.trim().length > 0);
        await SocialNetworkDB.publishPost(currentActorId, composerText, validMedia, gained, isPostPrivate);
        
        composerText = "";
        composerMediaArray = [];
        isPostPrivate = false;
        
        if (gained > 0) {
            ui.notifications.info(`Postagem enviada! Você ganhou ${gained} seguidores.`);
        }
    }

    async function toggleFollow(targetId) {
        await SocialNetworkDB.toggleFollow(currentActorId, targetId);
    }

    function isFollowing(targetId) {
        return (myData.following || []).includes(targetId);
    }

    async function react(postId, emoji) {
        await SocialNetworkDB.toggleReaction(postId, emoji, currentActorId);
        emojiMenuOpenFor = null;
    }

    async function sendComment(postId) {
        if (!commentText.trim()) return;
        await SocialNetworkDB.addComment(postId, currentActorId, commentText);
        commentText = "";
    }

    function isVideo(url) {
        if (!url) return false;
        return url.match(/\.(mp4|webm|ogg)$/i);
    }

    function getYoutubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function getUserName(uid) {
        const a = game.actors.get(uid);
        if (!a) return "Desconhecido";
        const sp = a.getFlag("multiversus-rpg", "social_profile");
        return (sp && sp.socialName) ? sp.socialName : a.name;
    }

    function getRealName(uid) {
        return game.actors.get(uid)?.name || "Desconhecido";
    }
    
    function getUserAvatar(uid) {
        return game.actors.get(uid)?.img || "icons/svg/mystery-man.svg";
    }

    function getBio(uid) {
        return game.actors.get(uid)?.getFlag("multiversus-rpg", "social_profile")?.bio || "";
    }

    function getFixedStatus(uid) {
        return game.actors.get(uid)?.getFlag("multiversus-rpg", "social_profile")?.attachments || [];
    }
    
    function getReactorsNames(usersReacted) {
        return usersReacted.map(id => getUserName(id)).join(', ');
    }
</script>

<div class="sn-root">
    
    <!-- FEED MODE -->
    {#if viewMode === 'feed'}
        <div class="sn-header" style="padding: 10px 15px;">
            <div class="my-profile" style="border:none;">
                <img src={getUserAvatar(currentActorId)} alt="Eu" on:click={() => viewingProfileOf = currentActorId} style="cursor:pointer;" title="Meu Perfil"/>
                <div class="my-info">
                    <h3>FEED DO NEXUS</h3>
                    <span>Bem-vindo(a), {getUserName(currentActorId)}</span>
                </div>
            </div>
        </div>

        <div class="composer-card">
            <textarea bind:value={composerText} placeholder="No que você está pensando?"></textarea>
            
            {#if composerMediaArray.length > 0}
                <div class="composer-media-list">
                    {#each composerMediaArray as m, i}
                        <div style="display:flex; gap:10px; margin-bottom:5px; align-items:center;">
                            <input type="text" bind:value={composerMediaArray[i]} class="media-input" placeholder="URL da Mídia (Imagem/Vídeo/YouTube)..." />
                            <button class="btn-remove-media" on:click={() => composerMediaArray.splice(i, 1) && (composerMediaArray = composerMediaArray)} title="Remover"><i class="fas fa-times"></i></button>
                        </div>
                    {/each}
                </div>
            {/if}

            <div class="composer-actions">
                <button class="btn-add-media" on:click={() => composerMediaArray = [...composerMediaArray, ""]}><i class="fas fa-paperclip"></i> Adicionar Anexo</button>
                <label style="color:#aaa; font-size:11px; margin-left:10px; cursor:pointer; display:flex; align-items:center; gap:5px;">
                    <input type="checkbox" bind:checked={isPostPrivate} />
                    <i class="fas fa-lock"></i> Post Privado
                </label>
                
                <div style="display:flex; gap:10px; align-items:center; margin-left:auto;">
                    {#if !canPost}
                        <span class="cooldown-text" title="Tempo até a próxima postagem"><i class="fas fa-clock"></i> {timeLeftObj}</span>
                    {/if}
                    
                    {#if !canPost && game.user.isGM}
                        <button class="btn-publish force" on:click={handlePublish} title="O Mestre pode pular o cooldown"><i class="fas fa-exclamation-triangle"></i> FORÇAR POST</button>
                    {:else}
                        <button class="btn-publish" disabled={!canPost} on:click={handlePublish}>POSTAR</button>
                    {/if}
                </div>
            </div>
        </div>

        <div class="feed-container custom-scroll">
            {#each visiblePosts as p (p.id)}
                <div class="post-card" in:fade>
                    {#if p.authorId === currentActorId || game.user.isGM}
                        <button class="btn-delete" on:click={() => SocialNetworkDB.deletePost(p.id)}><i class="fas fa-trash"></i></button>
                    {/if}
                    
                    <div class="post-header">
                        <img src={getUserAvatar(p.authorId)} alt="av" on:click={() => viewingProfileOf = p.authorId} style="cursor:pointer;" title="Ver Perfil"/>
                        <div class="post-meta">
                            <b on:click={() => viewingProfileOf = p.authorId} style="cursor:pointer;">{getUserName(p.authorId)}</b>
                            <span style="display:flex; align-items:center; gap:5px;">
                                {new Date(p.timestamp).toLocaleString()}
                                {#if p.isPrivate}<i class="fas fa-lock" style="color:#ff9800; font-size:10px;" title="Privado (Mutual Followers)"></i>{/if}
                            </span>
                        </div>
                    </div>
                    
                    <div class="post-content">
                        {#if p.text}<p>{@html p.text.replace(/\n/g, '<br>')}</p>{/if}
                        {#if p.attachments && p.attachments.length > 0}
                            <div class="media-gallery">
                                {#each p.attachments as att}
                                    {#if getYoutubeId(att)}
                                        <iframe class="post-media yt-frame" src="https://www.youtube.com/embed/{getYoutubeId(att)}" frameborder="0" allowfullscreen></iframe>
                                    {:else if isVideo(att)}
                                        <!-- svelte-ignore a11y-media-has-caption -->
                                        <video src={att} controls class="post-media" loop autoplay muted></video>
                                    {:else}
                                        <img src={att} class="post-media" alt="post" />
                                    {/if}
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <div class="post-actions">
                        <!-- REAÇÕES DISPLAY -->
                        <div class="reactions-list">
                            {#each Object.entries(p.reactions || {}) as [emoji, usersReacted]}
                                {#if usersReacted.length > 0}
                                    <button class="reaction-badge {usersReacted.includes(currentActorId) ? 'mine' : ''}" title={getReactorsNames(usersReacted)} on:click={() => react(p.id, emoji)}>
                                        {emoji} {usersReacted.length}
                                    </button>
                                {/if}
                            {/each}
                        </div>

                        <div class="action-buttons">
                            <div class="relative-box">
                                <button class="btn-action" on:click={() => emojiMenuOpenFor = emojiMenuOpenFor === p.id ? null : p.id}><i class="far fa-smile"></i> Reagir</button>
                                {#if emojiMenuOpenFor === p.id}
                                    <div class="emoji-popover" in:fade={{duration: 100}}>
                                        {#each EMOJIS as emoji}
                                            <button class="emoji-btn" on:click={() => react(p.id, emoji)}>{emoji}</button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            <button class="btn-action" on:click={() => activeCommentPost = activeCommentPost === p.id ? null : p.id}>
                                <i class="far fa-comment"></i> {(p.comments || []).length}
                            </button>
                        </div>
                    </div>

                    {#if activeCommentPost === p.id}
                        <div class="comments-section" transition:slide={{duration: 200}}>
                            {#each p.comments || [] as c}
                                <div class="comment-row">
                                    <img src={getUserAvatar(c.authorId)} alt="av" />
                                    <div class="comment-bubble">
                                        <b>{getUserName(c.authorId)}</b>
                                        <p>{c.text}</p>
                                    </div>
                                </div>
                            {/each}
                            <div class="comment-composer">
                                <input type="text" bind:value={commentText} placeholder="Escreva um comentário..." on:keydown={e => e.key === 'Enter' && sendComment(p.id)} />
                                <button on:click={() => sendComment(p.id)}><i class="fas fa-paper-plane"></i></button>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}

    <!-- EXPLORE MODE -->
    {#if viewMode === 'explore'}
        <div class="sn-header" style="padding: 10px 15px;">
            <div class="my-info">
                <h3>EXPLORAR</h3>
                <span>Descubra novos personagens para seguir</span>
            </div>
        </div>
        <div class="feed-container custom-scroll">
            <div class="explore-grid">
                {#each allActors as a}
                    {#if a.id !== currentActorId && (game.user.isGM || socialVisibleActors.includes(a.id))}
                        <div class="explore-card">
                            <img src={a.img} alt="user" on:click={() => viewingProfileOf = a.id} style="cursor:pointer;" title="Ver Perfil"/>
                            <h4>{getUserName(a.id)}</h4>
                            <span class="real-name">@{getRealName(a.id)}</span>
                            <span class="follower-count"><i class="fas fa-users"></i> {calculateTotalFollowers(a.id, users)} Seguidores</span>
                            <button class="btn-follow {isFollowing(a.id, users) ? 'on' : ''}" style="margin-top:10px; width:100%; font-size:12px;" on:click={() => toggleFollow(a.id)}>
                                {isFollowing(a.id, users) ? 'Seguindo' : 'Seguir'}
                            </button>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}

    <!-- PROFILE MODE (My Profile) -->
    {#if viewMode === 'profile'}
        <div class="profile-page custom-scroll">
            {#if editProfileMode}
                <div class="edit-profile-box" in:fade>
                    <h3>EDITAR PERFIL</h3>
                    <div class="form-group"><label>Nome de Exibição</label><input type="text" bind:value={socialProfile.socialName} class="hacker-input" placeholder={actor?.name}/></div>
                    <div class="form-group"><label>Imagem de Capa (URL)</label><input type="text" bind:value={socialProfile.coverImage} class="hacker-input" placeholder="http://..."/></div>
                    <div class="form-group"><label>Biografia</label><textarea bind:value={socialProfile.bio} class="hacker-input" style="height: 80px; resize: none;"></textarea></div>
                    <div class="form-group">
                        <label>Status Fixos (Links de Mídia)</label>
                        {#each socialProfile.attachments as att, i}
                            <div style="display:flex; gap:5px; margin-bottom:5px;">
                                <input type="text" bind:value={socialProfile.attachments[i]} class="hacker-input" placeholder="http://..." />
                                <button class="btn-ghost" on:click={() => socialProfile.attachments.splice(i, 1) && (socialProfile = socialProfile)} style="color:red; border-color:red; padding: 5px 10px;"><i class="fas fa-trash"></i></button>
                            </div>
                        {/each}
                        <button class="btn-ghost" style="width:100%; margin-top:5px;" on:click={() => socialProfile.attachments = [...socialProfile.attachments, ""]}>+ Adicionar Anexo</button>
                    </div>
                    <div style="display:flex; gap:10px; margin-top:15px;">
                        <button class="btn-publish" style="flex:1" on:click={saveProfile}>SALVAR</button>
                        <button class="btn-ghost" style="flex:1" on:click={() => editProfileMode = false}>CANCELAR</button>
                    </div>
                </div>
            {:else}
                <div class="p-modal-header" style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
                    <img src={getUserAvatar(currentActorId)} alt="avatar" style="width: 100px; height: 100px;" />
                    <div class="p-modal-info" style="flex:1;">
                        <h2 style="font-size: 24px;">{getUserName(currentActorId)}</h2>
                        <span class="real-name">({getRealName(currentActorId)})</span>
                        <div class="p-stats">
                            <span class="clickable-stat" on:click={() => { viewingListType = 'followers'; viewingListFor = currentActorId; }}><i class="fas fa-users"></i> {calculateTotalFollowers(currentActorId, users)} Seguidores</span>
                            <span class="clickable-stat" on:click={() => { viewingListType = 'following'; viewingListFor = currentActorId; }}> | <b>{getFollowingList(currentActorId, users).length}</b> Seguindo</span>
                        </div>
                        {#if game.user.isGM}
                            <div style="margin-top:10px; display:flex; gap:5px; align-items:center;">
                                <input type="number" bind:value={followerEditAmount} class="hacker-input" style="width:60px; height:26px; padding:0; text-align:center;">
                                <button class="btn-ghost" style="width:26px; height:26px; padding:0; display:flex; align-items:center; justify-content:center; color:#00ff41; border-color:#00ff41;" on:click={() => SocialNetworkDB.updateBaseFollowers(currentActorId, followerEditAmount)}><i class="fas fa-plus"></i></button>
                                <button class="btn-ghost" style="width:26px; height:26px; padding:0; display:flex; align-items:center; justify-content:center; color:#ff4444; border-color:#ff4444;" on:click={() => SocialNetworkDB.updateBaseFollowers(currentActorId, -followerEditAmount)}><i class="fas fa-minus"></i></button>
                            </div>
                        {/if}
                        <button class="btn-ghost" style="margin-top:10px; font-size:11px;" on:click={startEditProfile}><i class="fas fa-edit"></i> Editar Perfil</button>
                    </div>
                </div>

                {#if getBio(currentActorId)}
                    <div class="p-modal-bio" style="margin-top: 15px;">
                        <label>BIOGRAFIA</label>
                        <p>{getBio(currentActorId)}</p>
                    </div>
                {/if}

                {#if getFixedStatus(currentActorId).length > 0}
                    <div class="p-modal-fixed" style="margin-top: 15px;">
                        <label><i class="fas fa-thumbtack"></i> STATUS FIXADOS</label>
                        <div class="media-gallery">
                            {#each getFixedStatus(currentActorId) as att}
                                {#if getYoutubeId(att)}
                                    <iframe class="post-media yt-frame" src="https://www.youtube.com/embed/{getYoutubeId(att)}" frameborder="0" allowfullscreen></iframe>
                                {:else if isVideo(att)}
                                    <video src={att} controls class="post-media" loop autoplay muted></video>
                                {:else}
                                    <img src={att} class="post-media" alt="post" />
                                {/if}
                            {/each}
                        </div>
                    </div>
                {/if}

                <div class="p-modal-posts" style="margin-top: 15px; background: transparent; padding:0; border:none;">
                    <label style="margin-bottom: 10px; font-size: 14px;">MEUS POSTS RECENTES</label>
                    {#each visiblePosts.filter(p => p.authorId === currentActorId) as p}
                        <div class="mini-post" style="background: rgba(0,0,0,0.4); padding: 10px; border-radius:6px; border-left: 3px solid var(--chat-accent); margin-bottom: 10px;">
                            <span>{new Date(p.timestamp).toLocaleString()}</span>
                            <p style="white-space: normal;">{@html p.text ? p.text.replace(/\n/g, '<br>') : "<i>Post com mídia</i>"}</p>
                            <span style="font-size: 10px; color:#aaa; margin-top:5px; display:block;"><i class="far fa-heart"></i> {Object.keys(p.reactions||{}).length} Reações | <i class="far fa-comment"></i> {(p.comments||[]).length} Comentários</span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <!-- MODAL DE PERFIL -->
    {#if viewingProfileOf}
        <div class="profile-overlay" transition:fade={{duration: 150}} on:click={() => viewingProfileOf = null}>
            <div class="profile-modal custom-scroll" on:click|stopPropagation>
                <button class="btn-close-modal" on:click={() => viewingProfileOf = null}><i class="fas fa-times"></i></button>
                
                <div class="p-modal-header">
                    <img src={getUserAvatar(viewingProfileOf)} alt="avatar" />
                    <div class="p-modal-info">
                        <h2>{getUserName(viewingProfileOf)}</h2>
                        <span class="real-name">({getRealName(viewingProfileOf)})</span>
                        <div class="p-stats">
                            <span class="clickable-stat" on:click={() => { viewingListType = 'followers'; viewingListFor = viewingProfileOf; }}><i class="fas fa-users"></i> {calculateTotalFollowers(viewingProfileOf, users)} Seguidores</span>
                            <span class="clickable-stat" on:click={() => { viewingListType = 'following'; viewingListFor = viewingProfileOf; }}> | <b>{getFollowingList(viewingProfileOf, users).length}</b> Seguindo</span>
                        </div>
                        {#if game.user.isGM}
                            <div style="margin-top:10px; display:flex; gap:5px; align-items:center;">
                                <input type="number" bind:value={followerEditAmount} class="hacker-input" style="width:60px; height:26px; padding:0; text-align:center;">
                                <button class="btn-ghost" style="width:26px; height:26px; padding:0; display:flex; align-items:center; justify-content:center; color:#00ff41; border-color:#00ff41;" on:click={() => SocialNetworkDB.updateBaseFollowers(viewingProfileOf, followerEditAmount)}><i class="fas fa-plus"></i></button>
                                <button class="btn-ghost" style="width:26px; height:26px; padding:0; display:flex; align-items:center; justify-content:center; color:#ff4444; border-color:#ff4444;" on:click={() => SocialNetworkDB.updateBaseFollowers(viewingProfileOf, -followerEditAmount)}><i class="fas fa-minus"></i></button>
                            </div>
                        {/if}
                        {#if viewingProfileOf !== currentActorId}
                            <button class="btn-follow {isFollowing(viewingProfileOf) ? 'on' : ''}" style="margin-top:10px; width:100%; font-size:12px;" on:click={() => toggleFollow(viewingProfileOf)}>
                                {isFollowing(viewingProfileOf) ? 'Seguindo' : 'Seguir'}
                            </button>
                            <button class="btn-ghost" style="margin-top:5px; width:100%; font-size:12px; color:var(--chat-accent); border-color:var(--chat-accent);" on:click={() => dispatch('openDM', viewingProfileOf)}>
                                <i class="fas fa-paper-plane"></i> Mensagem (DM)
                            </button>
                        {/if}
                    </div>
                </div>

                {#if getBio(viewingProfileOf)}
                    <div class="p-modal-bio">
                        <label>BIOGRAFIA</label>
                        <p>{getBio(viewingProfileOf)}</p>
                    </div>
                {/if}

                {#if getFixedStatus(viewingProfileOf).length > 0}
                    <div class="p-modal-fixed">
                        <label><i class="fas fa-thumbtack"></i> STATUS FIXADOS</label>
                        <div class="media-gallery">
                            {#each getFixedStatus(viewingProfileOf) as att}
                                {#if getYoutubeId(att)}
                                    <iframe class="post-media yt-frame" src="https://www.youtube.com/embed/{getYoutubeId(att)}" frameborder="0" allowfullscreen></iframe>
                                {:else if isVideo(att)}
                                    <video src={att} controls class="post-media" loop autoplay muted></video>
                                {:else}
                                    <img src={att} class="post-media" alt="post" />
                                {/if}
                            {/each}
                        </div>
                    </div>
                {/if}

                <div class="p-modal-posts">
                    <label>POSTAGENS RECENTES</label>
                    {#each visiblePosts.filter(p => p.authorId === viewingProfileOf).slice(0, 5) as p}
                        <div class="mini-post">
                            <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                            <p>{p.text || "Mídia Adicionada"} {#if p.isPrivate}<i class="fas fa-lock" style="color:#ff9800; font-size:9px;"></i>{/if}</p>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}

    <!-- MODAL DE LISTA (FOLLOWERS / FOLLOWING) -->
    {#if viewingListType && viewingListFor}
        <div class="profile-overlay" transition:fade={{duration: 150}} on:click={() => viewingListType = null} style="z-index: 300;">
            <div class="profile-modal custom-scroll" on:click|stopPropagation style="max-height: 400px;">
                <button class="btn-close-modal" on:click={() => viewingListType = null}><i class="fas fa-times"></i></button>
                <h3 style="margin-top:0; color:var(--chat-accent); font-family:'Share Tech Mono';">
                    {viewingListType === 'followers' ? 'SEGUIDORES' : 'SEGUINDO'}
                </h3>
                <div class="user-list">
                    {#each (viewingListType === 'followers' ? getFollowersList(viewingListFor) : getFollowingList(viewingListFor)) as id}
                        {#if game.actors.get(id)}
                            <div class="user-row" style="display:flex; align-items:center; gap:10px; margin-bottom:15px; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <img src={getUserAvatar(id)} style="width:40px; height:40px; border-radius:50%; object-fit:cover; cursor:pointer;" alt="av" on:click={() => { viewingProfileOf = id; viewingListType = null; }} />
                                <div style="flex:1; cursor:pointer;" on:click={() => { viewingProfileOf = id; viewingListType = null; }}>
                                    <b style="display:block; font-size:14px; color:#fff;">{getUserName(id)}</b>
                                    <span style="font-size:10px; color:#888;">@{getRealName(id)}</span>
                                </div>
                                {#if id !== currentActorId}
                                    <button class="btn-follow {isFollowing(id) ? 'on' : ''}" style="font-size:10px; padding: 4px 10px;" on:click={() => toggleFollow(id)}>
                                        {isFollowing(id) ? 'Seguindo' : 'Seguir'}
                                    </button>
                                {/if}
                            </div>
                        {/if}
                    {/each}
                    {#if (viewingListType === 'followers' ? getFollowersList(viewingListFor) : getFollowingList(viewingListFor)).length === 0}
                        <p style="font-size:12px; color:#888; text-align:center;">Nenhuma ficha encontrada.</p>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .sn-root { display: flex; flex-direction: column; height: 100%; width: 100%; background: rgba(0,0,0,0.4); }
    
    .sn-header { display: flex; background: rgba(0,0,0,0.6); border-bottom: 1px solid var(--chat-border); padding: 15px; gap: 20px; flex-shrink: 0;}
    .my-profile { display: flex; align-items: center; gap: 15px; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 20px; min-width: 200px;}
    .my-profile img { width: 60px; height: 60px; border-radius: 50%; border: 2px solid var(--chat-accent); object-fit: cover; }
    .my-info h3 { margin: 0 0 5px 0; color: var(--chat-accent); font-family: 'Share Tech Mono'; font-size: 16px;}
    .my-info span { display: block; font-size: 13px; color: #fff; }
    .my-info .base-followers { font-size: 10px; color: #888; margin-top: 2px;}

    .following-list { flex: 1; overflow-x: auto; display: flex; flex-direction: column; }
    .section-title { font-size: 10px; color: #888; margin-bottom: 5px; font-weight: bold;}
    .user-strip { display: flex; gap: 10px; }
    .user-chip { display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); width: 80px; flex-shrink: 0;}
    .user-chip img { width: 35px; height: 35px; border-radius: 50%; margin-bottom: 5px; object-fit: cover;}
    .user-chip span { font-size: 10px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 100%; margin-bottom: 5px;}
    .btn-follow { font-size: 9px; padding: 3px 8px; border-radius: 10px; border: 1px solid var(--chat-accent); background: transparent; color: var(--chat-accent); cursor: pointer; transition: 0.2s;}
    .btn-follow.on { background: var(--chat-accent); color: #000; }

    .composer-card { position: relative; background: rgba(255,255,255,0.03); border: 1px solid var(--chat-border); margin: 15px; border-radius: 8px; overflow: hidden; flex-shrink: 0;}
    .cooldown-text { font-size: 11px; color: #ff9800; font-family: 'Share Tech Mono'; font-weight: bold;}
    .composer-card textarea { width: 100%; height: 70px; background: transparent; border: none; color: #fff; padding: 15px; resize: none; font-family: inherit; font-size: 14px;}
    .composer-media-list { padding: 10px 15px; background: rgba(0,0,0,0.1); border-top: 1px solid rgba(255,255,255,0.05); }
    .media-input { flex: 1; width: 100%; min-width: 50px; background: #000; border: 1px solid #333; padding: 10px; color: #fff; font-family: inherit; font-size: 13px; border-radius: 4px;}
    .btn-remove-media { background: transparent; border: none; color: #ff5555; cursor: pointer; padding: 0 10px; font-size: 16px; }
    .composer-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); padding: 5px;}
    .btn-add-media { background: transparent; border: 1px solid var(--chat-accent); color: var(--chat-accent); padding: 8px 15px; font-weight: bold; cursor: pointer; margin-left: 10px; font-size: 11px;}
    .btn-publish { background: var(--chat-accent); color: #000; border: none; font-weight: bold; padding: 10px 20px; cursor: pointer; transition: 0.2s; font-family: 'Share Tech Mono';}
    .btn-publish.force { background: #ff4444; color: #fff;}
    .btn-publish:disabled { background: #333; color: #666; cursor: not-allowed; }

    .feed-container { flex: 1; padding: 0 15px 15px 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
    .post-card { background: rgba(0,0,0,0.5); border: 1px solid var(--chat-border); border-radius: 8px; padding: 15px; position: relative; }
    .btn-delete { position: absolute; top: 10px; right: 10px; background: transparent !important; border: none !important; color: #ff5555 !important; cursor: pointer; opacity: 0.5; transition: 0.2s; box-shadow: none !important; width: auto !important; padding: 5px !important; margin: 0 !important; height: auto !important; line-height: 1 !important;}
    .btn-delete:hover { opacity: 1; transform: scale(1.2); }
    
    .post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .post-header img { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; }
    .post-meta { display: flex; flex-direction: column; }
    .post-meta b { font-size: 14px; color: var(--chat-accent); }
    .post-meta b:hover { text-decoration: underline; }
    .post-meta span { font-size: 11px; color: #888; }

    .post-content p { margin: 0 0 10px 0; font-size: 14px; line-height: 1.4; color: #ddd; }
    .media-gallery { display: flex; flex-direction: column; gap: 10px; }
    .post-media { max-width: 100%; max-height: 400px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); object-fit: contain; background: #000; }
    .yt-frame { width: 100%; height: 250px; }

    .post-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; }
    .reactions-list { display: flex; gap: 5px; flex-wrap: wrap;}
    .reaction-badge { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; padding: 3px 8px; font-size: 12px; cursor: pointer; transition: 0.2s; color: #fff;}
    .reaction-badge:hover { background: rgba(255,255,255,0.1); }
    .reaction-badge.mine { border-color: var(--chat-accent); background: rgba(var(--chat-accent), 0.1); color: var(--chat-accent); }

    .action-buttons { display: flex; gap: 10px; }
    .relative-box { position: relative; }
    .btn-action { background: transparent; border: none; color: #888; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 5px;}
    .btn-action:hover { color: var(--chat-accent); }
    
    .emoji-popover { position: absolute; bottom: 100%; top: auto; right: 0; left: auto; background: #111; border: 1px solid var(--chat-border); border-radius: 8px; display: flex; flex-direction: row; flex-wrap: nowrap; padding: 5px; gap: 5px; margin-bottom: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.8); z-index: 100; align-items: center; justify-content: flex-end;}
    .emoji-btn { background: transparent; border: none; font-size: 16px; cursor: pointer; padding: 5px; transition: 0.2s; border-radius: 4px; }
    .emoji-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.2); }

    .explore-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; padding: 10px; }
    .explore-card { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; align-items: center; text-align: center; }
    .explore-card img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 2px solid rgba(255,255,255,0.1); transition: 0.2s; }
    .explore-card img:hover { border-color: var(--chat-accent); transform: scale(1.05); }
    .explore-card h4 { margin: 0 0 2px 0; font-size: 13px; color: #fff; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .follower-count { font-size: 10px; color: #888; margin-top: 5px; }

    .profile-page { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; }
    .edit-profile-box { background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 1px solid var(--chat-border); }
    .hacker-input { width: 100%; background: #000; border: 1px solid #333; padding: 10px; color: #fff; font-family: inherit; font-size: 13px; border-radius: 4px; margin-bottom: 10px; pointer-events: auto; user-select: text; }
    .form-group label { display: block; font-size: 11px; color: #aaa; margin-bottom: 5px; }

    .comments-section { margin-top: 15px; background: rgba(0,0,0,0.3); border-radius: 6px; padding: 10px; border: 1px solid rgba(255,255,255,0.05); }
    .comment-row { display: flex; gap: 10px; margin-bottom: 10px; }
    .comment-row img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
    .comment-bubble { background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; border-top-left-radius: 0; flex: 1; }
    .comment-bubble b { font-size: 12px; color: #aaa; margin-bottom: 2px; display: block; }
    .comment-bubble p { margin: 0; font-size: 13px; color: #ddd; }
    .comment-composer { display: flex; gap: 10px; margin-top: 10px; }
    .comment-composer input { flex: 1; background: #000; border: 1px solid #333; color: #fff; padding: 8px 12px; border-radius: 20px; font-size: 13px; }
    .comment-composer button { background: var(--chat-accent); color: #000; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;}
    .comment-composer button:hover { transform: scale(1.1); }

    .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--chat-accent); border-radius: 3px; }

    /* Modal de Perfil */
    .profile-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; display: flex; justify-content: center; align-items: center; padding: 20px;}
    .profile-modal { width: 100%; max-width: 400px; background: #111; border: 1px solid var(--chat-accent); border-radius: 8px; padding: 20px; position: relative; max-height: 100%; overflow-y: auto;}
    .btn-close-modal { position: absolute; top: 10px; right: 10px; background: transparent !important; border: none !important; color: #fff !important; font-size: 16px; cursor: pointer; box-shadow: none !important; width: auto !important; padding: 5px !important; margin: 0 !important; height: auto !important; line-height: 1 !important;}
    .btn-close-modal:hover { color: var(--chat-accent) !important; transform: scale(1.2); }
    .p-modal-header { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; }
    .p-modal-header img { width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--chat-accent); object-fit: cover;}
    .p-modal-info h2 { margin: 0; color: var(--chat-accent); font-family: 'Share Tech Mono';}
    .real-name { font-size: 11px; color: #888; display: block; margin-bottom: 5px;}
    .p-stats { font-size: 12px; color: #ccc;}
    .clickable-stat { cursor: pointer; transition: 0.2s; }
    .clickable-stat:hover { color: var(--chat-accent); }
    
    .p-modal-bio, .p-modal-fixed, .p-modal-posts { margin-bottom: 20px; background: rgba(0,0,0,0.4); padding: 15px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);}
    .p-modal-bio label, .p-modal-fixed label, .p-modal-posts label { display: block; font-size: 10px; color: #888; font-weight: bold; margin-bottom: 5px;}
    .p-modal-bio p { margin: 0; font-size: 13px; line-height: 1.4;}
    
    .mini-post { border-left: 2px solid var(--chat-accent); padding-left: 10px; margin-bottom: 10px;}
    .mini-post span { font-size: 10px; color: #888; }
    .mini-post p { margin: 5px 0 0 0; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
</style>
