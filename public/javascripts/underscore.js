_ = function(array) {
  return {
    without(...values) {
      return array.filter(value => !values.includes(value));
    },
  }
}

_.uniq = (array) => {
  const uniqKeysObj = {};
  array.forEach(value => uniqKeysObj[value] = true);
  return Object.keys(uniqKeysObj);
}

_.deepClone = (array) => {
  const cloned = [];

  array.forEach(obj => {
    const newObj = {};
    for (let prop in obj) {
      newObj[prop] = obj[prop]; // primitive types are copied 
    }
    cloned.push(newObj);
  });

  return cloned;
}

_.debounce = (func, delay) => {
  let timeout;

  return function() {   
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...arguments), delay);
  };
}