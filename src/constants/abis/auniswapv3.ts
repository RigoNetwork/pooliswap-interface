import { Interface } from '@ethersproject/abi'

import AUniswapV3_ABI from './auniswapv3.json'

const AUniswapV3_INTERFACE = new Interface(AUniswapV3_ABI)

export default AUniswapV3_INTERFACE
export { AUniswapV3_ABI, AUniswapV3_INTERFACE }
