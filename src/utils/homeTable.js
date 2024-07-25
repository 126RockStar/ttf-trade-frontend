export function checkNegative(number) {
  if (number === 0) {
    return ['zero', number]
  }
  return number < 0 ? ['negative', number * -1] : ['positive', number]
}

export function currencyFormat(n, currency) {
  return currency + n.toFixed(5).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
}