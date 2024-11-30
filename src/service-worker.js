import { build, files, version } from "$service-worker";

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files, // everything in `static`
];

self.addEventListener("install", (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener("activate", (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener("fetch", (event) => {
	// ignore POST requests etc
	if (event.request.method !== "GET") return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);
		console.log(url.pathname);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error("invalid response from fetch");
			}

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}

	event.respondWith(respond());
});

self.addEventListener("push", (event) => {
	const { title, body, url } = event.data.json();
	const icon = "/images/icon.png";
	const badge = "/images/badge.png";
	self.registration.showNotification(title, {
		body,
		icon,
		badge,
		data: { url },
	});
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const url = event.notification.data.url || "/";

	event.waitUntil(
		clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clientList) => {
				for (const client of clientList) {
					if (client.url === url && "focus" in client) {
						return client.focus();
					}
				}
				if (clients.openWindow) {
					return clients.openWindow(url);
				}
			}),
	);
});
