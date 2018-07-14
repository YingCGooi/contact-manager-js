_ = function(array) {
	return {
		without(...values) {
			return array.filter(value => !values.includes(value));
		},
	}
}

_.debounce = (func, delay) => {
	let timeout;

	return function() {		
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => func(...arguments), delay);
	};
}
