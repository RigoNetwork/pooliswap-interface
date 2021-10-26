import { Currency } from '@uniswap/sdk-core'

import { WETH9_EXTENDED } from '../constants/tokens'

export function currencyId(currency: Currency): string {
  if (currency.isNative) return WETH9_EXTENDED[currency.chainId].address
  if (currency.isToken) return currency.address
  throw new Error('invalid currency')
}
