import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { AUniswapV3_INTERFACE } from '../constants/abis/auniswapv3'
import { AWETH_INTERFACE } from '../constants/abis/aweth'
import { SWAP_ROUTER_ADDRESSES } from '../constants/addresses'
import { WETH9_EXTENDED } from '../constants/tokens'
import useENS from '../hooks/useENS'
import { tryParseAmount } from '../state/swap/hooks'
import { useSwapState } from '../state/swap/hooks'
import { TransactionType } from '../state/transactions/actions'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { getDragoContract } from '../utils'
import { useWETHContract } from './useContract'
import { useActiveWeb3React } from './web3'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined | null,
  outputCurrency: Currency | undefined | null,
  typedValue: string | undefined
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); inputError?: string } {
  const { account, chainId, library } = useActiveWeb3React()
  const wethContract = useWETHContract()

  // recipientLookup is drago address
  const { recipient } = useSwapState()
  const recipientLookup = useENS(recipient ?? undefined)
  const dragoAddress = recipientLookup.address

  const balance = useCurrencyBalance(dragoAddress ?? undefined, inputCurrency ?? undefined)

  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency ?? undefined), [inputCurrency, typedValue])
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!wethContract || !chainId || !library || !account || !recipient || !inputCurrency || !outputCurrency)
      return NOT_APPLICABLE
    const weth = WETH9_EXTENDED[chainId]
    if (!weth) return NOT_APPLICABLE

    const dragoContract = getDragoContract(chainId, library, account ?? undefined, dragoAddress ?? undefined)
    if (!dragoContract) {
      return NOT_APPLICABLE
    }

    const hasInputAmount = Boolean(inputAmount?.greaterThan('0'))
    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    if (inputCurrency.isNative && weth.equals(outputCurrency)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const calldata = AUniswapV3_INTERFACE.encodeFunctionData('wrapETH', [inputAmount.quotient.toString()])
                  const txReceipt = await dragoContract.operateOnExchange(SWAP_ROUTER_ADDRESSES[chainId], [calldata])
                  //const txReceipt = await wethContract.deposit({ value: `0x${inputAmount.quotient.toString(16)}` })
                  addTransaction(txReceipt, {
                    type: TransactionType.WRAP,
                    unwrapped: false,
                    currencyAmountRaw: inputAmount?.quotient.toString(),
                  })
                } catch (error) {
                  console.error('Could not deposit', error)
                }
              }
            : undefined,
        inputError: sufficientBalance ? undefined : hasInputAmount ? 'Insufficient ETH balance' : 'Enter ETH amount',
      }
    } else if (weth.equals(inputCurrency) && outputCurrency.isNative) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const calldata = AWETH_INTERFACE.encodeFunctionData('unwrapEth', [
                    wethContract.address,
                    inputAmount.quotient.toString(),
                  ])
                  const txReceipt = await dragoContract.operateOnExchange(wethContract.address, [calldata])
                  //const txReceipt = await wethContract.withdraw(`0x${inputAmount.quotient.toString(16)}`)
                  addTransaction(txReceipt, {
                    type: TransactionType.WRAP,
                    unwrapped: true,
                    currencyAmountRaw: inputAmount?.quotient.toString(),
                  })
                } catch (error) {
                  console.error('Could not withdraw', error)
                }
              }
            : undefined,
        inputError: sufficientBalance ? undefined : hasInputAmount ? 'Insufficient WETH balance' : 'Enter WETH amount',
      }
    } else {
      return NOT_APPLICABLE
    }
  }, [
    wethContract,
    chainId,
    library,
    account,
    recipient,
    dragoAddress,
    inputCurrency,
    outputCurrency,
    inputAmount,
    balance,
    addTransaction,
  ])
}
