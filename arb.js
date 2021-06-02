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



//balance 6.6801
//0x6AED11801Aae0C43E31448B7209acF77593b30d2