/* Find greatest integer value x where predicate f(x) returns true */
/* Assumes value lies in range: lo <= x < hi */
module.exports = {
	exponentialSearch,
	binarySearch,
	hybridSearch,
	run
};

const filesize_ = require('filesize');
const filesize = size => filesize_(size, { symbols: { B: '' } });

/* Floor of base-2 logarithm */
function msbit(x) {
	if (x === 0) {
		return -1;
	}
	let bit = 0;
	while (x > 1) {
		x >>= 1;
		bit++;
	}
	return bit;
}

function exponentialSearch(test, lo, hi, verbose = false) {
	let l2lo = msbit(lo);
	let l2hi = msbit(hi);
	if (1 << l2hi < hi) {
		l2hi++;
	}
	if (l2lo === l2hi) {
		return hi + 1;
	}
	let value;
	if (l2lo === -1) {
		l2lo = 0;
		value = 0;
	}
	if (verbose) {
		console.info('Exponential search commencing');
	}
	for (let exp = l2lo; exp < l2hi; exp++) {
		value = 1 << exp;
		if (!test(value)) {
			break;
		}
	}
	if (verbose) {
		console.info(`Exponential search complete, range is ${filesize(value >> 1)} < x < ${filesize(value)}`);
	}
	return value;
}

function binarySearch(test, lo, hi, verbose = false) {
	let value;
	if (verbose) {
		console.info('Binary search commencing');
	}
	while (hi > lo + 1) {
		value = (hi + lo) / 2 | 0;
		if (test(value)) {
			lo = value;
		} else {
			hi = value;
		}
	}
	if (verbose) {
		console.info(`Binary search complete, result is ${lo}`);
	}
	return lo;
}

/*
 * Combine exponential search and binary search
 *
 * Useful when "test" becomes more resource-hungry with higher parameter, or
 * when search range is unknown, so a massive upper-bound has been given
 */
function hybridSearch(test, lo, hi, verbose = false) {
	const value = exponentialSearch(test, lo, hi, verbose);
	if (value > 2) {
		return binarySearch(test, Math.max(lo, value >> 1), Math.min(hi, value), verbose);
	} else {
		return value >> 1;
	}
}

/* Run the given search and track how many times the function is invoked */
function run(search, test, lo, hi, verbose = false) {
	let steps = 0;

	const testProxy = value => {
		if (verbose) {
			process.stderr.write(`Testing value ${filesize(value)} (${value})`);
		}
		const before = new Date().getTime();
		const result = test(value);
		const after = new Date().getTime();
		const delta = after - before;
		steps++;
		process.stderr.write(' — ' + (result ? '[✓]' : '[✗]') + ' - ' + delta + 'ms\n');
		return result;
	};

	const value = search(testProxy, lo, hi, verbose);

	if (verbose) {
		console.info(`Result ${value} found in ${steps} steps`);
	}

	return { value, steps };
}
