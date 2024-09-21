const stack = ['local/lws.plugin.mjs', 'lws-rewrite', 'lws-static'];

console.log(''); // add a blank line for readability

export default {
	hostname: '127.0.0.1',
	port: 9090,
	rewrite: [{ from: '^/(.*)/$', to: '/$1/index.html' }],
	stack,
};
