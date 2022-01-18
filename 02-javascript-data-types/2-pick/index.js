/**
 * pick - Creates an object composed of the picked object properties:
 * @param {object} obj - the source object
 * @param {...string} fields - the properties paths to pick
 * @returns {object} - returns the new object
 */
export const pick = (obj, ...fields) => {
  let requiredObj = {};

  for (let requiredField of fields) {
    if (requiredField in obj) {
      requiredObj[requiredField] = obj[requiredField];
    }
  }

  return requiredObj;
};
