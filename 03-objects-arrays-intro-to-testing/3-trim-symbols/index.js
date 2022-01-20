/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size === undefined) {
    return string;
  }

  let lastSymbol = null;
  let lastSymbolAmount = 1;
  let result = "";
  for (const symbol of string) {
    if (lastSymbol !== symbol) {
      lastSymbol = symbol;
      lastSymbolAmount = 1;
    }
    if (lastSymbolAmount <= size) {
      lastSymbolAmount += 1;
      result += symbol;
    }
  }
  return result;
}
