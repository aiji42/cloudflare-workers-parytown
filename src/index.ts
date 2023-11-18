import { Hono } from 'hono'

const app = new Hono()

app.all('*', async (c) => {
	const res = await fetch(proxy(c.req.url), c.req.raw)
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
