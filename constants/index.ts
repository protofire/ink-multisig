export const CHAINS = ['astar', 'shibuya-testnet', 'rococo-contracts-testnet']
export type ALL_CHAINS = typeof CHAINS[number]

export const CHAIN_CONTRACTS_ADDRESS: Record<ALL_CHAINS, string> = {
    'shibuya-testnet': 'YkPXYiL26Tg3G8BxxnAhrPfmDxb5ojNQDqPiSMZKt2Wcfgk',
    'rococo-contracts-testnet': 'XYmu1eoskyj83bSWqhTW2DUzuRCHHgrFGXUv3yxhBVBd3tT'
}
 
export function isValidChain(key: string): key is ALL_CHAINS {
    return CHAINS.includes(key)
}
