import { Hono } from 'hono'

const app = new Hono()

app.get('/~partytown/:file', (c, next) => {
	return fetch(`https://www.unpkg.com/@builder.io/partytown@0.8.1/lib/${c.req.param('file')}`)
})

app.all('*', async (c) => {
	const res = await fetch(proxy(c.req.url), { method: c.req.method })
	if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) return res

	return res
})

export default app

const proxy = (_url: string) => {
	const url = new URL(_url)
	url.protocol = 'https'
	url.hostname = 'lifedot.jp'
	url.port = ''

	return url
}
