import { Interface } from '@ethersproject/abi'
import AUniswapV3NPM_ABI from './auniswapv3npm.json'

const AUniswapV3NPM_INTERFACE = new Interface(AUniswapV3NPM_ABI)

export default AUniswapV3NPM_INTERFACE
export { AUniswapV3NPM_ABI, AUniswapV3NPM_INTERFACE }
