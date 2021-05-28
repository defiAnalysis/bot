const ethers = require('ethers');
const eamil = require('./email');

const addresses = {
  WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', 
  router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  recipient: '0x2197bd43a119565836d2fc6cc4fcf1a029fd5f9b',
  target:   '0x84ab3da404041c0776e4f3eb9492f9e5701503fe',
  Zero:     '0x0000000000000000000000000000000000000000'
}

const mnemonic = 'urban assume glimpse file stand uncover face uphold gadget charge melt phone';

const provider = new ethers.providers.WebSocketProvider('wss://bsc.getblock.io/mainnet/?api_key=6824ca15-ca20-453f-b1fe-6d454a76a470');
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const account = wallet.connect(provider);
const factory = new ethers.Contract(
  addresses.factory,
  [
    'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
  ],
  account
);


const router = new ethers.Contract(
  addresses.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

factory.on('PairCreated', async (token0, token1, pairAddress) => {
  console.log(Date.now() + "\n");
  console.log(`
    New pair detected
    =================
    token0: ${token0}
    token1: ${token1}
    pairAddress: ${pairAddress}
    -----------------------------
  `);

    const pair = new ethers.Contract(
      pairAddress,
      [
        'event Mint(address indexed sender, uint amount0, uint amount1)',
      ],
      account
    );

    pair.on('Mint',async (sender, amount0, amount1) => {
      let min = 0;

    
      if(a0 < a1) {
        min = a0;
      }else{
        min = a1;
      }

      console.log('amount0: ',ethers.BigNumber(amount0).toNumber());
      console.log('amount1: ',ethers.BigNumber(amount0).toNumber());

      console.log('min: ',min);

      if(min < 10) {
          console.log('min: ',min);
          return
      }

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

     const aamsg = `
      AddLiquidity
       pairAddress:   ${pairAddress}
       sender: ${sender}
       amount0: ${amount0}
       amount1: ${amount1}
     `;

     console.log('send email');

      eamil('duanchuanfu00@163.com','hayden','916140875@qq.com','AddLiquidity',aamsg);
    })
    

  

  });


  

  
  
  //The quote currency needs to be WETH (we will pay with WETH)
  // let tokenIn, tokenOut;
  // if(token0 === addresses.WBNB) {
  //   tokenIn = token0; 
  //   tokenOut = token1;
  // }

  // if(token1 == addresses.WBNB) {
  //   tokenIn = token1; 
  //   tokenOut = token0;
  // }

  // //The quote currency is not WETH
  // if(typeof tokenIn === 'undefined') {
  //   return;
  // }

  // if(tokenOut != addresses.target) {
  //   return
  // }

  // //We buy for 0.1 ETH of the new token
  // const amountIn = ethers.utils.parseUnits('0.1', 'ether');
  // const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
  // //Our execution price will be a bit different, we need some flexbility
  // const amountOutMin = amounts[1].sub(amounts[1].div(10));
  // console.log(`
  //   Buying new token
  //   =================
  //   tokenIn: ${amountIn.toString()} ${tokenIn} (WETH)
  //   tokenOut: ${amounOutMin.toString()} ${tokenOut}
  // `);
  // const tx = await router.swapExactTokensForTokens(
  //   amountIn,
  //   amountOutMin,
  //   [tokenIn, tokenOut],
  //   addresses.recipient,
  //   Date.now() + 1000 * 60 * 10 //10 minutes
  // );
  // const receipt = await tx.wait(); 
  // console.log('Transaction receipt');
  // console.log(receipt);


console.log("listening for pair to created!!!");
