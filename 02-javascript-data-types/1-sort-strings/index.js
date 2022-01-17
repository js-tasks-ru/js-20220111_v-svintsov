/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
  let newArray = [...arr];

  newArray.sort(function (a, b) {
    return a.localeCompare(b, ["ru-RU", "en-US"], {sensitivity: "variant", caseFirst: "upper"});
  });

  if (param === "desc") {
    newArray.reverse();
  }

  return newArray;
}
