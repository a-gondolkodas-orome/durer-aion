/*
  * Deep merge two objects (later object's properties overwrite properties from the earlier one).
  * Arrays are not merged, but overwritten.
  * (Not unittested yet!)
  */
export const deepMergeObj = (target: any, source: any) => {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // Recursively merge objects if there's (truely) an object under the key in source
        target[key] = deepMergeObj(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}