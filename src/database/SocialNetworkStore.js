import { writable } from 'svelte/store';
import { SocialNetworkDB } from './SocialNetworkDB.js';

export const snPostsStore = writable([]);
export const snUsersStore = writable({});

export async function updateSNStore() {
    const data = await SocialNetworkDB.getData();
    snPostsStore.set([...data.posts]);
    snUsersStore.set({...data.users});
}
