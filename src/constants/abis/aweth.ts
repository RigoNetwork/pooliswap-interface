import { Interface } from '@ethersproject/abi'

import AWETH_ABI from './aweth.json'

const AWETH_INTERFACE = new Interface(AWETH_ABI)

export default AWETH_INTERFACE
export { AWETH_ABI, AWETH_INTERFACE }
