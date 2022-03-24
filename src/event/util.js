export function removeArrayItem(array, item) {
  const i = array.indexOf(item);
  if (i > -1) {
    array.splice(i, 1);
  }
}

export function deepFreeze(obj) {
  const props = Object.getOwnPropertyNames(obj);
  for (const prop of props) {
    const value = obj[prop];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }
  return Object.freeze(obj);
}

export function tryGet(fn) {
  try {
    return fn();
  } catch(_) {}
}
