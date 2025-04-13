const {
  EthCallQueryRequest,
  PerChainQueryRequest,
  QueryProxyMock,
  QueryRequest,
  QueryResponse,
} = require('@wormhole-foundation/wormhole-query-sdk');
const axios = require('axios');
const { ethers } = require('ethers');

const rpc = 'https://ethereum.publicnode.com';
const TOKENS = [
  {
    name: 'WETH',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },
  {
    name: 'USDC',
    address: '0xA0b86991C6218B36c1D19D4a2e9Eb0cE3606eB48'
  },
  {
    name: 'DAI',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  }
];

(async () => {
  try {
    const latestBlock = (
      await axios.post(rpc, {
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
        id: 1,
        jsonrpc: '2.0',
      })
    ).data.result?.number;

    if (!latestBlock) {
      console.error('Block number does not exist');
      process.exit(1);
    }

    const allCallData = [];
    for (const token of TOKENS) {
      allCallData.push(
        { to: token.address, data: '0x06fdde03' }, // name()
        { to: token.address, data: '0x95d89b41' }, // symbol()
        { to: token.address, data: '0x313ce567' }, // decimals()
        { to: token.address, data: '0x18160ddd' }  // totalSupply()
      );
    }

    const request = new QueryRequest(0, [
      new PerChainQueryRequest(
        2,
        new EthCallQueryRequest(latestBlock, allCallData)
      )
    ]);

    const mock = new QueryProxyMock({ 2: rpc });
    const mockData = await mock.mock(request);
    const mockQueryResponse = QueryResponse.from(mockData.bytes);
    const results = mockQueryResponse.responses[0].response.results;

    const abi = new ethers.AbiCoder();
    const decodedTokens = {};

    for (let i = 0; i < TOKENS.length; i++) {
      const base = i * 4;
      const name = abi.decode(['string'], results[base])[0];
      const symbol = abi.decode(['string'], results[base + 1])[0];
      const decimals = BigInt(results[base + 2]).toString();
      const totalSupply = BigInt(results[base + 3]).toString();

      decodedTokens[TOKENS[i].name] = {
        name,
        symbol,
        decimals,
        totalSupply
      };
    }

    console.log(JSON.stringify(decodedTokens));
  } catch (err) {
    console.error('Error occured:', err.message);
    process.exit(1);
  }
})();
