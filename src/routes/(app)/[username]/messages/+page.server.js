import { auth, get } from "$lib/utils";

export async function load({ cookies, params, parent, url }) {
  let { user, subject } = await parent();
  let { pubkey } = subject;
  let { since = 0 } = params;

  let messages = [],
    notes = [];

  if (pubkey) {
    if (user) {
      try {
        messages = await get(`/${user.pubkey}/${since}/messages`);
        messages = messages.sort((a, b) => b.created_at - a.created_at);
      } catch (e) {
        console.log(`failed to fetch nostr messages`, e);
      }
    }

    try {
      notes = await get(`/${pubkey}/notes`);
    } catch (e) {
      console.log(`failed to fetch nostr notes for ${pubkey}`, e);
    }

    notes.map((e) => {
      e.seen = e.created_at;
    });
  }

  return { messages, notes }
}
