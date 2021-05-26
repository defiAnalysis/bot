const ethers = require('ethers');

const addresses = {
  WOKT: '0x2219845942d28716c0F7C605765fABDcA1a7d9E0',
  factory: '0xDcAA842dC9515CA4d2bB939d8AF96DD1e8607482', 
  router: '0xD9Ee582C00E2f6b0a5A0F4c18c88a30e49C0304b',
  recipient: '0x2197bd43a119565836d2fc6cc4fcf1a029fd5f9b',
  target:   '0x84ab3da404041c0776e4f3eb9492f9e5701503fe',
}

const mnemonic = 'urban assume glimpse file stand uncover face uphold gadget charge melt phone';

const provider = new ethers.providers.WebSocketProvider('wss://exchaintestws.okex.org:8443');
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const account = wallet.connect(provider);
const factory = new ethers.Contract(
  addresses.factory,
  [
    'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
  ],
  account
);

// const router = new ethers.Contract(
//   addresses.router,
//   [
//     'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
//     'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
//   ],
//   account
// );

factory.on('PairCreated', async (token0, token1, pairAddress) => {
  console.log(Date.now() + "\n");
  console.log(`
    New pair detected
    =================
    token0: ${token0}
    token1: ${token1}
    pairAddress: ${pairAddress}
  `);  

  const pair = new ethers.Contract(
    pairAddress,
    [
      'event Mint(address indexed sender, uint amount0, uint amount1)',
    ],
    account
  );


  pair.on('Mint', async (sender, amount0, amount1) => {

    console.log(`
     First AddLiquidity
        =================
        sender: ${sender}
        amount0: ${amount0}
        amount1: ${amount1}
    `);
  
})
});

console.log("okexchain test listening for pair to created!!!");

setInterval(getGasprice, 170000);


async function getGasprice() {
  let gasPrice= await provider.getGasPrice();
  console.log("gas price:",gasPrice);
}