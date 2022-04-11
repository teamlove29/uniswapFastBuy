var Web3 = require("web3");
const SWAP_ROUTER_ABI = require("./abi/swapRouter02.json");
const { Interface } = require("readline");
require('dotenv').config()

const privateKey = process.env.PRIVATE_KEY
const myAddress = process.env.PUBLIC_KEY

const data = {
    POOL_FEE : "3000",
    SLIPPAGE: "0",
    GAS_PRICE_TO_USE: "5",
    GAS_LIMIT_TO_USE: "1000000", //at least 21000
    AMOUNT_IN : "100"
}

const addresses = {
    WETH: process.env.WETH, // rinkeby
    DAI: process.env.DAI, // rinkeby
    router: process.env.ROUTER, // rinkeby
}

const providers = {
    mainnet : `https://mainnet.infura.io/v3/${process.env.PROVIDERS}`,
    rinkeby : `https://rinkeby.infura.io/v3/${process.env.PROVIDERS}`,
    kovan : `https://kovan.infura.io/v3/${process.env.PROVIDERS}`
}

const createWeb3 = async () => {
    try {
        const provider = new Web3.providers.HttpProvider(providers.rinkeby);
        web3 = new Web3(provider);
        userWallet = web3.eth.accounts.privateKeyToAccount(privateKey);
        return true
    } catch (error) {
        console.log('web3 ERROR :', error);
        return false
    }
}

const snipe = async () => {

    if (!await createWeb3()) {
        process.exit(1);
    }

    console.log('================ Start ==================');

    const routerContract = new web3.eth.Contract(SWAP_ROUTER_ABI, addresses.router) // v2 used swapExactTokensForETH
    AMOUNT_IN = Web3.utils.toWei(data.AMOUNT_IN, "ether")

    const params = {
        tokenIn : addresses.DAI,
        tokenOut : addresses.WETH,
        fee : data.POOL_FEE,
        recipient : myAddress,
        deadline : Date.now() + 1000 * 60 * 10, // 10 minutes from now
        amountIn : AMOUNT_IN,
        amountOutMinimum : 0, // V2 used getAmountOut
        sqrtPriceLimitX96 : 0,
    }
    
    const swapRouter = routerContract.methods.exactInputSingle(params);

    const tx = {
        from: myAddress,
        to: addresses.router,
        value:0,
        gas: data.GAS_LIMIT_TO_USE,
        gasPrice: web3.utils.toWei(data.GAS_PRICE_TO_USE, "shannon"),
        data: swapRouter.encodeABI(),
    };


    let signed = await userWallet.signTransaction(tx)
    let transaction = web3.eth.sendSignedTransaction(signed.rawTransaction)

    transaction.once('receipt', async receipt => {
        if (receipt) {
            console.log('receipt :', receipt);
        }
    })
    transaction.on('error', error => {
            console.log('ERROR:', error);
    });
}

snipe()