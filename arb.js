const ethers = require('ethers');
const fs = require('fs');


const mnemonic = fs.readFileSync(".secret").toString().trim();

const provider = new ethers.providers.WebSocketProvider('wss://exchaintestws.okex.org:8443');
const wallet = ethers.Wallet.fromMnemonic(mnemonic);

const account = wallet.connect(provider);

const KKT_ROUTE = "0xD9Ee582C00E2f6b0a5A0F4c18c88a30e49C0304b";
const KSP_ROUTE = "0x2f46e5ff1f616cfc00f4e6fa2effba4b0aaa7b6f";
const USDT = "0xe579156f9dEcc4134B5E3A30a24Ac46BB8B01281";

const ksp_wokt = '0x2219845942d28716c0f7c605765fabdca1a7d9e0';
const kks_wokt = '0x70c1c53e991f31981d592c2d865383ac0d212225';

const buy_path= [kks_wokt,USDT];
const sell_path= [USDT,ksp_wokt];

const amountIn = ethers.utils.parseUnits('1','ether');

let buy_amount;

const expireDate = Date.now() + 1000 * 60 * 10 ;//10 minutes

let flag = 0;

//-------------------------------------get king kong swap price-----------------------------------------------------------//
const kkt_router = new ethers.Contract (
    KKT_ROUTE,
    [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
        'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
    ],
    account
)


//king kong swap getprice
let getKKSPrices=(async() => {
    const path = [kks_wokt,USDT];
    const price = await kkt_router.getAmountsOut(amountIn,path);
    
    return price[price.length-1].div(10000000000);
})
//-------------------------------------------------------------------------------------------------------------------------//


//---------------------------------get kswap price-------------------------------------------------------------------------------------//
  const kswp_router = new ethers.Contract (
    KSP_ROUTE,
    [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
        'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
    ],
    account
)
    
let getKSPPrice=(async() => {

    const path = [ksp_wokt,USDT];
    const price = await kswp_router.getAmountsOut(amountIn,path);
    
    
    return price[price.length-1].div(10000000000);
});


let checkDifference=async() => {
    const kktPrice = await  getKKSPrices();
    const kspPrice = await getKSPPrice();

    console.log("kktPrice: ",kktPrice.toString());
    console.log("kspPrice: ",kspPrice.toString());

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
    const nonce = await provider.getTransactionCount(wallet.address);
    let tx = await kkt_router.swapExactTokensForETH(
        buy_amount,
        0,
        sell_path,
        wallet.address,
        expireDate,
        {
            nonce: nonce+1,
            gasLimit:500000,
            gasPrice: ethers.utils.parseUnits("0.2", "gwei")
        }
    )

    ret = await tx.wait();
    console.log('sellUSDT ret: ',ret);
}

let doSwap= function() {
   
    buyUSDT();
    console.log('buy USDT Success');
    sellUSDT();
    console.log('sell USDT Success');
}


setInterval(function(){
    calcPrice();
    if(flag ==  1) {
        console.log('============');
        doSwap();
    }
},3000)
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