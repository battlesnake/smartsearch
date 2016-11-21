'use strict';

if (process.argv.length > 2) {

	testSize(+process.argv[2], () => process.exit(0));

} else {

	const manakin = require('manakin').global;
	const cp = require('child_process');

	const smartsearch = require('../' /* 'smartsearch' */);

	const subprocessTestSize = size =>
		cp.spawnSync('node', [module.filename, size]).status === 0;

	const { value, steps } = smartsearch.run(smartsearch.hybridSearch, subprocessTestSize, 1, 1 << 28, true);

}

/* Test function */
function testSize(bufSize) {

	const port = 32185;

	/* true/false && ... to enable/disable verbose logging */
	const verbose = str => false && console.info(str);

	const fs = require('fs');
	const http = require('http');

	const Client = require('ws');
	const Server = Client.Server;

	const httpServer = http.createServer();

	const assertEquals = (actual, expect) => {
		if (actual !== expect) {
			throw new Error(`Assertion failed: ${actual} === ${expect}`);
		}
	};

	/* Buffer of given size, filled with pseudorandom data */
	const makeBuf = size => {
		const BS = 1 << 16;
		const buf = Buffer.alloc(size);
		const fd = fs.openSync('/dev/urandom', 'r');
		let pos = 0;
		while (size > 0) {
			let bs = size > BS ? BS : size;
			assertEquals(fs.readSync(fd, buf, pos, bs, null), bs);
			pos += bs;
			size -= bs;
		}
		fs.closeSync(fd);
		return buf;
	};

	httpServer.listen(port);

	httpServer.on('listening', () => {
		verbose('Server started');
		const server = new Server({ server: httpServer });
		const client = new Client(`ws://localhost:${port}/`);

		client.on('open', () => {
			verbose('Client: Connection opened');
			const buf = makeBuf(bufSize);
			client.send(buf);
		});

		client.on('message', buf => {
			verbose('Client: Data received');
			assertEquals(buf.length, bufSize);
			client.close();
		});

		server.on('connection', ws => {
			verbose('Server: Connection received');
			ws.on('message', buf => {
				verbose('Server: Data received');
				assertEquals(buf.length, bufSize);
				ws.send(buf);
			});
			ws.on('close', () => {
				verbose('Server: Connection closed');
			});
		});

		client.on('close', () => {
			verbose('Client: Connection closed');
			server.close();
			httpServer.close();
		});

	});

	httpServer.on('close', () => {
		verbose('All done');
	});

}
