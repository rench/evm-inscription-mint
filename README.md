# 兼容EVM链的铭文自动化Mint脚本

## 🛠 使用说明

### Step 1: 首先安装 nodejs

先去 Nodejs 官网下载安装自己电脑操作系统对应的版本

```bash
https://nodejs.org/en
```

然后看一下安装的版本，是否安装成功

```bash
node -v
npm -v
```

如果你更喜欢使用 yarn 则安装 yarn
```bash
npm i -g yarn
```

### Step 2: 下载脚本源代码
先用 git clone 源代码到本地
```bash
git clone https://github.com/rench/evm-inscription-mint.git

cd evm-inscription-mint
```
如果是 Windows 电脑没有安装 git，先去下面网站下载安装 git 软件
```bash
https://gitforwindows.org
```

### Step 3: 重命名当前目录下的 config.js.example 为 config.js 文件
```bash
cp config.js.example config.js
```

### Step 4: 修改当前目录下的 config.js 配置文件
```javascript
const config = {
    // 你想要打多少张，这里就设置多少，可以设置大一点，现在的做法是每批次批量发送6次，一般会打在一个block里面，如果因为gas上涨，没有打包，会自动去给之前pending的交易加gas
    repeatCount: 1000,

    // 在当前的 gas 基础上增加多少倍
    increaseGas: 1.03,

    // 每一笔交易停顿多久（毫秒为单位，1000=1秒）
    sleepTime: 1000,

    // 付费金额（默认为 0 转
    payPrice: "0",
    // 批量发送请求, 一般这个批次的请求会在一个区块, gas一样 都会被执行
    batchCount: 6,

    // gasLimit 最大上限, 一般同一类型交易gasLimit都一样，可以看别人打的limit是多少
    gasLimit: 22008,

    // gas 最大上限, 多个个Bone/ETH, 超过了就会等待，不会继续打
    gasTotal: 0.00016,

    // 你钱包的私钥
    privateKey: process.argv.slice(2)[0],

    // 接收地址（也可以是合约地址），如果为空就是给自己发。
    receiveAddress: "",

    // 铭文json数据（替换成你想打的铭文json格式数据）
    //tokenJson: 'data:,{"p":"fair-20","op":"mint","tick":"fair","amt":"1000"}',
	//tokenJson: data:,{"a":"NextInscription","p":"oprc-20","op":"mint","tick":"PoS","amt":"10"}
    //tokenJson: 'data:,{"p":"src-20","op":"mint","tick":"meme","amt":"1000"}',
    //tokenJson: 'data:,{"p":"src-20","op":"mint","tick":"pepe","amt":"10000000"}',
    tokenJson: 'data:,{"p":"src-20","op":"mint","tick":"punk","amt":"100000000"}',

    // RPC结点（兼容 evm 链都行）打哪条链就用哪条链的节点地址
    // eth =>  https://mainnet.infura.io/v3
    // arb => https://arb1.arbitrum.io/rpc
    // polygon => https://polygon-rpc.com
    // op => https://mainnet.optimism.io
    // linea => https://mainnet.infura.io/v3
    // scroll => https://rpc.scroll.io
    // zks => https://mainnet.era.zksync.io
    // bnbchain => https://bsc-dataseed1.bnbchain.org
    // conflux = > https://evm.confluxrpc.com

    // rpcUrl: "https://arb1.arbitrum.io/rpc"
    // shib => https://rpc.shibrpc.com
    // shib => https://www.shibrpc.com
    rpcUrl: "https://www.shibrpc.com"
}

module.exports = config

```

### Step 5: 安装依赖包
```bash
npm i
```
or
```bash
yarn install
```

### Step 6: 运行 Mint 脚本程序
```shell
node index.js
```
or
```shell
yarn start
```
or
```shell
npm run start
```
