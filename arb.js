const ethers = require('ethers');
const fs = require('fs');


const mnemonic = fs.readFileSync(".secret").toString().trim();
const TEST_NETWORK = 'wss://exchaintestws.okex.org:8443'
const MAIN_NETWORK = 'wss://exchainws.okex.org:8443'
const provider = new ethers.providers.WebSocketProvider(MAIN_NETWORK);
const wallet = ethers.Wallet.fromMnemonic(mnemonic);

const account = wallet.connect(provider);

const KKT_ROUTE = "0xD9Ee582C00E2f6b0a5A0F4c18c88a30e49C0304b";
const KSP_ROUTE = "0x2f46e5fF1F616cfc00F4e6fA2eFFbA4B0AAA7b6F";
const USDT = "0xe579156f9dEcc4134B5E3A30a24Ac46BB8B01281";

const ksp_wokt = '0x2219845942d28716c0f7c605765fabdca1a7d9e0';
const kks_wokt = '0x70c1c53e991f31981d592c2d865383ac0d212225';
// const kst = '0x97019205d81ed9302f349f18116fe3ddec37d384';

const main_usdt = '0x382bb369d343125bfb2117af9c149795c6c65c50';
const AI_ROUTER = '0x7457197c455fCf4d454Df2C06ecD05DbF25Efb92';
const SUSHI_RPUTER = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';

const buy_path= [kks_wokt,USDT];
const sell_path= [USDT,ksp_wokt];

const amountIn = ethers.utils.parseUnits('1','ether');

let buy_amount;

const expireDate = Date.now() + 1000 * 60 * 10 ;//10 minutes

let flag = 0;

//-------------------------------------get king kong swap price-----------------------------------------------------------//
const airouter = new ethers.Contract (
    AI_ROUTER,
    [
        'function WETH() external pure returns (address)',
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
    ],
    account
)

//king kong swap getprice
let getAIPrices=(async() => {
   const wokt = '0x8f8526dbfd6e38e3d8307702ca8469bae6c56c15';
    const path = [wokt,main_usdt];
    const price = await airouter.getAmountsOut(amountIn,path);

    console.log('price:========',price);
    
    return price[price.length-1].div(10000000000);
})
//-------------------------------------------------------------------------------------------------------------------------//


//---------------------------------get kswap price-------------------------------------------------------------------------------------//
  const sushirouter = new ethers.Contract (
    SUSHI_RPUTER,
    [
        'function WETH() external pure returns (address)',
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
        'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
    ],
    account
)
    
let getSuShiPrice=(async() => {
    let wokt = await sushirouter.WETH();
    const path = [wokt,main_usdt];
    const price = await kswp_router.getAmountsOut(amountIn,path);
    
    
    return price[price.length-1].div(10000000000);
});


let checkDifference=async() => {
    const kktPrice = await  getAIPrices();
    const kspPrice = await getSuShiPrice();

    console.log("AIPrice: ",kktPrice.toString());
    console.log("SuShiPrice: ",kspPrice.toString());

    const Difference = kktPrice-kspPrice;
    console.log("Difference: ",Difference);

    if(Difference > 10) {
        buy_amount = ethers.utils.parseUnits('1','ether');
    }else if(Difference > 5) {
        buy_amount = ethers.utils.parseUnits('0.5','ether');
    }else{
        buy_amount = ethers.utils.parseUnits('0.1','ether');
    }

    return Difference;
}

let calcPrice=async()=>{
    let differ = await checkDifference();

    console.log('flag: ',differ);

    //free 
    if(differ > 0.05) {
        flag = 1;
    }else{
        flag = 0;
    }
}

/*
const txn = await uniswapV2Contract.swapExactETHForTokens(
    0,
    path,
    user.address,
    expiryDate,
    {
        gasLimit: 1000000,
        gasPrice: ethers.utils.parseUnits("10", "gwei"),
        value: ethAmount
    }
)
const res = await txn.wait();
*/

//okt ---> usdt
let buyUSDT=async() =>{
    const nonce = await provider.getTransactionCount(wallet.address);
    let tx = await kkt_router.swapExactETHForTokens(
        0,
        buy_path,
        wallet.address,
        expireDate,
        {
            gasLimit:500000,
            gasPrice: ethers.utils.parseUnits("0.2", "gwei"),
            value: buy_amount
        }
    )

    ret = await tx.wait();
    console.log('buyUSDT ret: ',ret);
}

//usdt ---> okt
let sellUSDT=async() =>{
    let tx = await kswp_router.swapExactTokensForETH(
        1000000000,
        0,
        sell_path,
        wallet.address,
        expireDate,
        {
            gasLimit:500000,
            gasPrice: ethers.utils.parseUnits("0.2", "gwei")
        }
    )

    ret = await tx.wait();
    console.log('sellUSDT ret: ',ret);
}

let doSwap= async()=> {
    // const ret = await buyUSDT();
    // console.log('buy USDT Success');
    // ret = await sellUSDT();
    // console.log('sell USDT Success');
}

let callback=async()=>{
    const ret = await calcPrice();
    // if(flag ==  1) {
    //     console.log('============');
    //     ret = await doSwap();
    // }
}

setInterval(callback,3000);

/*
//SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

interface Router{
    function getAmountsOut(uint amountIn, address[] memory path) external view  returns (uint[] memory amounts);
    //okt --> usdt
     function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);

    //usdk --> okt
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
        
    function WETH() external pure returns (address);
}

contract arb {
    address usdt;
    //king kong swap route address
    address kks;
    //kswap route address
    address ksp;
    
    address kks_wokt;
    
    address ksp_wokt;
    
    address owner;
    
    event BuyUSDT(address to,uint amountIn,uint amountOut);
    event sellUSDT(address to,uint amountIn,uint amountOut);

    constructor() public {
        usdt = 0xe579156f9dEcc4134B5E3A30a24Ac46BB8B01281;

        kks = 0xD9Ee582C00E2f6b0a5A0F4c18c88a30e49C0304b;

        ksp = 0x2f46e5fF1F616cfc00F4e6fA2eFFbA4B0AAA7b6F;
        
        kks_wokt= 0x70c1c53E991F31981d592C2d865383AC0d212225;
        
        ksp_wokt = 0x2219845942d28716c0F7C605765fABDcA1a7d9E0;
        
        owner = msg.sender;
        
    }
    
    modifier onlyOwner() {
        require(
            msg.sender==owner,
            "sender not owner"
        );
        _;
    }
    
    function arbChange() public payable {
        uint deadline = block.timestamp + 1000 * 60 * 10;
        
        address[] memory buy_path = new address[](2);
        buy_path[0] = kks_wokt;
        buy_path[1] = usdt;
        uint[] memory amountsBuy = Router(kks).swapExactETHForTokens{value: msg.value}(0,buy_path,msg.sender,deadline);
        emit BuyUSDT(msg.sender,amountsBuy[amountsBuy.length-2],amountsBuy[amountsBuy.length-1]);
        
        address[] memory sell_path = new address[](2);
        buy_path[0] = usdt;
        buy_path[1] = ksp_wokt;
        uint[] memory amountsSell = Router(ksp).swapExactTokensForETH(amountsBuy[amountsBuy.length-1],0,sell_path,msg.sender,deadline);
        emit sellUSDT(msg.sender,amountsSell[amountsSell.length-2],amountsSell[amountsSell.length-1]);
    }

   
}

*/