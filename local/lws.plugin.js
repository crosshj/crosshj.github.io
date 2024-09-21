import * as fs from 'fs';
import { compile } from '../compile.js';

const sendCompiledHTML = async (ctx) => {
	ctx.set('Content-Type', 'text/html; charset=utf-8');
	const index = fs.readFileSync('index.html').toString();
	const modified = await compile({ index });
	ctx.body = modified;
	return;
};

class Plugin {
	middleware() {
		return async (ctx, next) => {
			const { request } = ctx;
			console.log(`${request.method}: ${request.path}`);

			if (['/', '/index.html'].includes(request.path)) {
				return sendCompiledHTML(ctx);
			}

			await next();
		};
	}
}

export default Plugin;
