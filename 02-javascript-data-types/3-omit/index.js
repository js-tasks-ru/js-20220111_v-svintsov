/**
 * omit - creates an object composed of enumerable property fields
 * @param {object} obj - the source object
 * @param {...string} fields - the properties paths to omit
 * @returns {object} - returns the new object
 */
export const omit = (obj, ...fields) => {
  let requiredObj = {};
  Object.assign(requiredObj, obj);

  for (let forbiddenField of fields) {
    if (forbiddenField in requiredObj) {
      delete requiredObj[forbiddenField];
    }
  }

  return requiredObj;
};
