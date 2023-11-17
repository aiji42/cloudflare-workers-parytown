export interface Env {}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const res = await fetch(proxy(request.url), request)
		if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) return res

		return res
	},
};

const proxy = (_url: string) => {
	const url = new URL(_url)
	url.protocol = 'https'
	url.hostname = 'lifedot.jp'
	url.port = ''

	return url
}
