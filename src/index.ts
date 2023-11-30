import { Hono } from 'hono';

const app = new Hono();

app.get('/~partytown/:file', (c, next) => {
	return fetch(`https://www.unpkg.com/@builder.io/partytown@0.8.1/lib/${c.req.param('file')}`, { cf: { cacheEverything: true } });
});

app.get('/proxy', async (c) => {
	const url = c.req.query('url');
	if (!url) return c.notFound();

	const res = await fetch(url, c.req.raw);

	return new Response(res.body, {
		headers: {
			...Object.fromEntries(res.headers.entries()),
			'Access-Control-Allow-Origin': '*',
		},
	});
});

app.all('*', async (c) => {
	const res = await fetch(proxy(c.req.url), { method: c.req.method });
	if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) return res;

	const detector = new DetectGtm();
	await new HTMLRewriter().on(DetectGtm.selector, detector).transform(res.clone()).arrayBuffer();

	return new HTMLRewriter()
		.on(DetectGtm.selector, new DetectGtm(true))
		.on(GTMToPartytown.selector, new GTMToPartytown(detector.sctips))
		.transform(res);
});

export default app;

const proxy = (_url: string) => {
	const url = new URL(_url);
	url.protocol = 'https';
	url.hostname = '<your site hostname>';
	url.port = '';

	return url;
};

class DetectGtm implements HTMLRewriterElementContentHandlers {
	static selector = 'script';
	public sctips: string[] = [];
	private remove = false;
	constructor(remove = false) {
		this.remove = remove;
	}
	text(element: Text): void | Promise<void> {
		if (element.text.includes('https://www.googletagmanager.com/gtm.js')) {
			this.sctips.push(element.text);
			if (this.remove) element.remove();
		}
	}
}

class GTMToPartytown implements HTMLRewriterElementContentHandlers {
	static selector = 'head';
	private scripts: string[] = [];
	constructor(scripts: string[]) {
		this.scripts = scripts;
	}
	async element(element: Element): Promise<void> {
		if (!this.scripts.length) return;
		const partytownScript = await fetch('https://www.unpkg.com/@builder.io/partytown@0.8.1/lib/partytown.js', {
			cf: { cacheEverything: true },
		});
		element.prepend(
			`<script>${await partytownScript.text()}</script><script>
partytown = {
	forward: ["dataLayer.push"],
	resolveUrl: function (url, location, type) {
    if (type === 'script' && !url.href.startsWith('https://www.googletagmanager.com')) {
			var proxyUrl = new URL(location.origin);
			proxyUrl.pathname = '/proxy'
      proxyUrl.searchParams.append('url', url.href);
      return proxyUrl;
    }
    return url;
  },
}</script>`,
			{ html: true },
		);
		this.scripts.forEach((script) => {
			element.append(`<script type="text/partytown">${script}</script>`, { html: true });
		});
	}
}
