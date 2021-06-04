//SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";


interface IKSWPRouter {
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
        
    function WOKT() external pure returns (address);
}

contract ARB {
    
    address internal owner;
    
    event Received(address sender, uint amount);
    event Buy(address sender,address router,uint amountIn,uint amountOut);
    event Sell(address sender,address router,uint amountIn,uint amountOut);
    event BuyAndSell(uint amountIn,uint amountOut);
    
    constructor() {
        owner = msg.sender; // 'msg.sender' is sender of current call, contract deployer for a constructor
        }
    
    //owner
    modifier isOwner(){
        require(msg.sender == owner, "Caller is not owner");
        _;
        }
        
        
    function EthToTokensWithPaths(address router,address tokenAddress,address[] memory paths,uint amountIn,uint amountOutMin,uint deadline)
        public 
        payable
         returns (uint[] memory amounts)
        {
       // uint deadline = block.timestamp + 10 *60;
            
         amounts = IUniswapV2Router02(router).swapExactETHForTokens{ value: amountIn }(amountOutMin, paths, address(this), deadline);
        
         emit Buy(msg.sender,router,amounts[0],amounts[amounts.length-1]);    
        }
    
    function TokensToEthWithPaths(address router,address tokenAddress, address[] memory paths,uint TokenInAmount,uint amountOutMin,uint deadline) 
        public 
        payable 
        returns (uint[] memory amounts)
        {
       //uint deadline = block.timestamp + 10 *60;
        IERC20 token = IERC20(tokenAddress);
        token.approve(router, TokenInAmount);
        amounts = IUniswapV2Router02(router).swapExactTokensForETH(TokenInAmount, amountOutMin, getPathForTokenToEth(router,tokenAddress), address(this), deadline);
        
        emit Sell(msg.sender,router,amounts[0],amounts[amounts.length-1]); 
        }
    
    function getPathForEthToToken(address router,address tokenAddress) public pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = IUniswapV2Router02(router).WETH();
        path[1] = tokenAddress;
        return path;
        }    
        
    function getPathForTokenToEth(address router,address tokenAddress) public pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = IUniswapV2Router02(router).WETH();
        return path;
        }
        
    
    function withdrawEther(uint amount) public payable isOwner{
        payable(msg.sender).transfer(amount);
    }
    
    function withToken(address payable _addr,uint amount) public isOwner {
        IERC20(_addr).transfer(owner,amount);
    }
    
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    
    function KSWPEthToTokens(address router,address tokenAddress,uint amountOutMin,uint deadline) public payable {
       // uint deadline = block.timestamp + 10 *60;
 
        IKSWPRouter(router).swapExactETHForTokens{ value: msg.value }(amountOutMin, kswpgetPathForEthToToken(router,tokenAddress), address(this), deadline);
        
        
    }
    
    function KSWPTokensToEth(address router,address tokenAddress, uint TokenInAmount,uint amountOutMin,uint deadline) public payable {
       //uint deadline = block.timestamp + 10 *60;
        IERC20 token = IERC20(tokenAddress);
        token.approve(router, TokenInAmount);
        IKSWPRouter(router).swapExactTokensForETH(TokenInAmount, amountOutMin, kswpgetPathForTokenToEth(router,tokenAddress), address(this), deadline);
        }
    
    function kswpgetPathForEthToToken(address router,address tokenAddress) private pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = IKSWPRouter(router).WOKT();
        path[1] = tokenAddress;
        return path;
        }    
        
    function kswpgetPathForTokenToEth(address router,address tokenAddress) private pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = IKSWPRouter(router).WOKT();
        return path;
        }
        
    function ArbBuyAndSell(address[] memory _routers,address tokenAddress,address[] memory inPaths,address[] memory outPaths,uint deadline) 
        public payable isOwner {
           uint[] memory amounts = EthToTokensWithPaths(_routers[0],tokenAddress,inPaths,msg.value,0,deadline);

            uint[] memory sellAmounts = TokensToEthWithPaths(_routers[1],tokenAddress,outPaths,amounts[amounts.length-1],0,deadline);
           //require(amounts[0] - sellAmounts[1] > 0.02 gwei);
            emit BuyAndSell(amounts[0],sellAmounts[sellAmounts.length-1]);
        }
}
