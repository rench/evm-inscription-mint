const { ethers } = require("ethers");
const readline = require('readline');

const config = require("./config")

// 连接到结点
let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

// 创建钱包
let wallet

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 转成16进制
const convertToHexa = (str = '') => {
  const res = [];
  const { length: len } = str;
  for (let n = 0, l = len; n < l; n++) {
    const hex = Number(str.charCodeAt(n)).toString(16);
    res.push(hex);
  };
  return `0x${res.join('')}`;
}

// 获取当前账户的 nonce
async function getCurrentNonce(wallet) {
  try {
    const nonce = await wallet.getTransactionCount("pending");
    // console.log("pending Nonce:", nonce);
    return nonce;
  } catch (error) {
    console.error("Error fetching nonce:", error.message);
    throw error;
  }
}

// 获取当前账户 latest的 nonce
async function getLatestNonce(wallet) {
  try {
    const nonce = await wallet.getTransactionCount('latest');
    // console.log("latest Nonce:", nonce);
    return nonce;
  } catch (error) {
    console.error("Error fetching nonce:", error.message);
    throw error;
  }
}

// 获取当前主网 gas 价格
async function getGasPrice() {
  const gasPrice = await provider.getGasPrice();
  return gasPrice;
}

// 获取链上实时 gasLimit
async function getGasLimit(hexData, address) {
  const gasLimit = await provider.estimateGas({
    to: address,
    value: ethers.utils.parseEther("0"),
    data: hexData,
  });

  return gasLimit.toNumber();
}

// 转账交易
async function sendTransaction(nonce, gasPrice, balance) {
  const hexData = convertToHexa(config.tokenJson.trim());

  // 获取钱包地址
  let address = await wallet.getAddress();
  if (config.receiveAddress !== "") {
    address = config.receiveAddress;
  }
  // 获取当前 gasLimit 限制
  const gasLimit = await getGasLimit(hexData, address);
  // 付费金额
  const payPrice = config.payPrice

  const transaction = {
    to: address,
    // 替换为你要转账的金额
    value: ethers.utils.parseEther(payPrice),
    // 十六进制数据
    data: hexData,
    // 设置 nonce
    nonce: nonce,
    // 设置 gas 价格
    gasPrice: gasPrice,
    // 限制gasLimit，根据当前网络转账的设置，不知道设置多少的去区块浏览器看别人转账成功的是多少
    gasLimit: gasLimit,
  };

  try {
    let gasWei = ethers.BigNumber.from(gasPrice * gasLimit);
    let gasTotal = ethers.utils.formatEther(gasWei);
    console.log(`Transaction with nonce ${nonce} , gasPrice: ${gasPrice}, gasLimit: ${gasLimit}, gasTotal: ${gasTotal} Bone`)
    if (gasLimit > config.gasLimit || parseFloat(gasTotal) > config.gasTotal) {
      console.error(`gas limit: ${gasLimit} > ${config.gasLimit} or gas total: ${gasTotal} > ${config.gasTotal} Bone`)
      return 'gas';
    }
    if (parseFloat(balance) !== 0 && parseFloat(balance) < parseFloat(gasTotal)) {
      console.error(`gasTotal: ${gasTotal} > ${balance} Bone`)
      return 'balance'
    }

    const promises = []
    const batch = config.batchCount
    for (let i = 0; i < batch; i++) {
      let transactionCopy = { ...transaction };
      transactionCopy.nonce = transactionCopy.nonce + i;
      promises.push(wallet.sendTransaction(transactionCopy));
    }
    return Promise.all(promises).then(res => {
      res.forEach(tx => {
        /**
         * {
            type: 2,
            chainId: 109,
            nonce: 684,
            maxPriorityFeePerGas: BigNumber { _hex: '0xc41a2c33', _isBigNumber: true },
            maxFeePerGas: BigNumber { _hex: '0xc41a2c33', _isBigNumber: true },
            gasPrice: null,
            gasLimit: BigNumber { _hex: '0x55b8', _isBigNumber: true },
            to: 'xxxx',
            value: BigNumber { _hex: '0x00', _isBigNumber: true },
            data: 'xxxxxxx',
            accessList: [],
            hash: 'xxxxxx',
            v: 0,
            r: 'xxxx',
            s: 'xxxx',
            from: 'xxxx',
            confirmations: 0,
            wait: [Function (anonymous)]
          }
         */
        console.log(`Transaction with nonce ${tx.nonce} hash:`, tx.hash);
      })
    });
  } catch (error) {
    console.error(`Error in transaction with nonce ${nonce}:`, error.message);
  }
  return true
}

let exceptNonce = null;
let retryCount = 0;
let increaseGas = config.increaseGas;
// 发送多次交易
async function sendTransactions() {
  const sleepTime = config.sleepTime
  console.log('start mint : ' + config.tokenJson);
  for (let i = 0; i < config.repeatCount;) {
    try {
      let currentNonce = await getCurrentNonce(wallet);
      const latestNonce = await getLatestNonce(wallet);
      console.log(`current nonce pending: ${currentNonce} , latest: ${latestNonce}, exceptNonce: ${exceptNonce}`);
      if (currentNonce >= latestNonce + config.batchCount * 2 && exceptNonce === null) {
        console.log(`wait until latest confirm...`)
        retryCount++;
        if (retryCount > config.batchCount) {
          // uppper gas to help pass
          exceptNonce = latestNonce;
          increaseGas = config.increaseGas + 0.03
          console.log(`help to reset gas for ${exceptNonce}`)
          continue;
        }
        await sleep(sleepTime * 3)
        continue;
      }
      if (currentNonce == 0 && latestNonce != 0) {
        currentNonce = latestNonce;
      }
      let balance = ethers.utils.formatEther(await wallet.getBalance('latest'));

      // 获取实时 gasPrice
      const currentGasPrice = await getGasPrice();
      // 在当前 gasPrice 上增加 一定倍数
      const gasMultiple = parseInt(String(increaseGas * 100));
      const increasedGasPrice = currentGasPrice.div(100).mul(gasMultiple);
      console.log(`current gasPrice: ${currentGasPrice}, gasMultiple: ${gasMultiple}, increasedGasPrice: ${increasedGasPrice}`);
      console.log(`will send tx for nonce: ${exceptNonce == null ? currentNonce : exceptNonce}, balance: ${balance} Bone`);
      let result = await sendTransaction(exceptNonce == null ? currentNonce : exceptNonce, increasedGasPrice, balance);
      exceptNonce = null
      increaseGas = config.increaseGas
      retryCount = 0;
      await sleep(sleepTime)
      if (result === 'gas') {
        continue;
      }
      if (result === 'balance') {
        process.exit(1)
        return
      }
      i++;
    } catch (e) {
      console.error('run error')
      exceptNonce = null
      increaseGas = config.increaseGas
      retryCount = 0;
      provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
      wallet = new ethers.Wallet(config.privateKey.trim(), provider);
      await sleep(sleepTime)
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter your privateKey: ', function (privateKey) {
  console.log('\nPassword entered, start sendTransactions...');
  config.privateKey = privateKey;
  rl.close();
  wallet = new ethers.Wallet(config.privateKey.trim(), provider);
  sendTransactions();
});

rl._writeToOutput = function _writeToOutput() {
  rl.output.write('*');
};
