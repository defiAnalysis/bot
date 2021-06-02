const ethers = require('ethers');

require('dotenv').config();

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

//king kong swap
const addresses = {
  WOKT: '0x70c1c53E991F31981d592C2d865383AC0d212225',
  factory: '0xDcAA842dC9515CA4d2bB939d8AF96DD1e8607482', 
  router: '0xD9Ee582C00E2f6b0a5A0F4c18c88a30e49C0304b',
  recipient: '0x40ee5F79fc7c370b082B16E836bEF74b8A3D9Ad2',
  target:   '0x40ee5F79fc7c370b082B16E836bEF74b8A3D9Ad2',
  USDT:     '0xe579156f9decc4134b5e3a30a24ac46bb8b01281',
  ORACLE:   '0xaEAaf9bE4F49aFb38801dd6aA43e4Fb324894761'
}

// const addresses = {
//   WOKT: '0x2219845942d28716c0f7c605765fabdca1a7d9e0',
//   factory: '0xD68B1DCDe3bAeB3FF1483Ad33c3efC6B6e0A8E4C', 
//   router: '0x2f46e5ff1f616cfc00f4e6fa2effba4b0aaa7b6f',
//   recipient: '0x40ee5F79fc7c370b082B16E836bEF74b8A3D9Ad2',
//   target:   '0x40ee5F79fc7c370b082B16E836bEF74b8A3D9Ad2'
// }

const provider = new ethers.providers.WebSocketProvider('wss://exchaintestws.okex.org:8443');
const wallet = ethers.Wallet.fromMnemonic(mnemonic);

const app = ethers.utils.parseUnits('1000000', 'ether');

const account = wallet.connect(provider);

const factory = new ethers.Contract(
  addresses.factory,
  ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
  account
);

const router = new ethers.Contract(
  addresses.router,
  [
    'function WETH() external pure returns (address)',
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);


const kswp_route = new ethers.Contract(
    '0x2f46e5ff1f616cfc00f4e6fa2effba4b0aaa7b6f',
    [
      'function WETH() external pure returns (address)',
    ],
    account
)



const wokt = new ethers.Contract(
  addresses.WOKT,
  [
    'function approve(address spender, uint amount) public returns(bool)',
  ],
  account
);

const init = async () => {
  const tx = await wokt.approve(
    router.address, 
    app
  );

  const receipt = await tx.wait(); 
  console.log('Transaction receipt');
  console.log(receipt.status);
}

(async()=>{
  let amountIn = ethers.utils.parseUnits('1','ether');
  const okt_address = await router.WETH();
  const amounts = await router.getAmountsOut(amountIn, [okt_address,addresses.USDT]);
  console.log('1 price: ',amounts[1].toString());

  // const wokt = await kswp_route.WETH();
  // console.log('wokt address: ',wokt);
  const wokt = '0x2219845942d28716c0f7c605765fabdca1a7d9e0';
  const price = await kswp_oracle.getCurrentPrice(wokt);
  console.log('kswap price: ',price.toString());

})()


factory.on('PairCreated', async (token0, token1, pairAddress) => {
  console.log(`
    New pair detected
    =================
    token0: ${token0}
    token1: ${token1}
    pairAddress: ${pairAddress}
  `);

  //The quote currency needs to be WBNB (we will pay with WBNB)
  let tokenIn, tokenOut;
  if(token0 === addresses.WOKT) {
    tokenIn = token0; 
    tokenOut = token1;
  }

  if(token1 == addresses.WOKT) {
    tokenIn = token1; 
    tokenOut = token0;
  }

  //The quote currency is not WBNB
  if(typeof tokenIn === 'undefined') {
    console.log('undefined',tokenIn);

    return;
  }

//   if(tokenOut.toLowerCase() != addresses.target.toLowerCase ) {
//     console.log('tokenOut: ',tokenOut);
//     console.log('target: ',addresses.target);

//     return
//  }

 console.log('check target success...');

 const pair = new ethers.Contract(
  pairAddress,
  [
    'event Mint(address indexed sender, uint amount0, uint amount1)',
  ],
  account
);

pair.on('Mint',async (sender, amount0, amount1) => {

  let aa = ethers.BigNumber(amount0).toNumber();
  console.log('amount0: ',ethers.BigNumber(amount0).toNumber());
  console.log('amount1: ',ethers.BigNumber(amount1).toNumber());

  let min = ethers.utils.formatEther(aa)
  console.log('min: ',min);

  // if(min < 10) {
  //     console.log('min: ',min);
  //     return
  // }

  console.log(`
   AddLiquidity
    =================
          +
          +
          +
          +
          +
          +
   =================

    pairAddress:   ${pairAddress}
    sender: ${sender}
    amount0: ${amount0}
    amount1: ${amount1}
    -----------------------------
  `);
});

 return

  //We buy for 0.1 BNB of the new token
  //ethers was originally created for Ethereum, both also work for BSC
  //'ether' === 'bnb' on BSC
  const amountIn = ethers.utils.parseUnits('0.1', 'ether');
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
  //Our execution price will be a bit different, we need some flexbility
  const amountOutMin = amounts[1].sub(amounts[1].div(10));
  console.log(`
    Buying new token
    =================
    tokenIn: ${amountIn.toString()} ${tokenIn} (WOKT)
    tokenOut: ${amountOutMin.toString()} ${tokenOut}
  `);

  const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [tokenIn, tokenOut],
    addresses.recipient,
    Date.now() + 1000 * 60 * 10 ,//10 minutes
    { gasLimit:  270197}
  );

  const receipt = await tx.wait(); 
  console.log('Transaction receipt');
  console.log(receipt);
});

init();
console.log("okexchain test listening for pair to created!!!");

setInterval(getGasprice,50000);


 function getGasprice() {
  // let gasPrice=  provider.getGasPrice();
  // console.log("gas price:",gasPrice);
  provider.getGasPrice().then(function(res) {
    console.log(res.toString())
  })
}