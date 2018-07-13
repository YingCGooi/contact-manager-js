_ = {
	debounce(func, delay) {
		let timeout;

		return function() {
			const args = arguments;			
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => func(...arguments), delay);
		};
	},
}