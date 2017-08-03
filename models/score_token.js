var config = require('config');
var Tx = require('ethereumjs-tx');
var Web3 = require('web3');

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));
}

const scr_token_bytecode = '6060604052604060405190810160405280600381526020017f312e30000000000000000000000000000000000000000000000000000000000081525060029080519060200190610050929190610099565b505b33600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505b61013e565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106100da57805160ff1916838001178555610108565b82800160010185558215610108579182015b828111156101075782518255916020019190600101906100ec565b5b5090506101159190610119565b5090565b61013b91905b8082111561013757600081600090555060010161011f565b5090565b90565b610f118061014d6000396000f300606060405236156100d9576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde03146100db578063095ea7b31461017457806318160ddd146101cb57806323b872dd146101f1578063286f5aea14610267578063313ce567146102b957806354fd4d50146102df57806370a08231146103785780637770bd15146103c25780638da5cb5b1461041457806395d89b4114610466578063a9059cbb146104ff578063c85e0be214610556578063dd62ed3e1461058c578063f2fde38b146105f5575bfe5b34156100e357fe5b6100eb61062b565b604051808060200182810382528381815181526020019150805190602001908083836000831461013a575b80518252602083111561013a57602082019150602081019050602083039250610116565b505050905090810190601f1680156101665780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561017c57fe5b6101b1600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050610665565b604051808215151515815260200191505060405180910390f35b34156101d357fe5b6101db610711565b6040518082815260200191505060405180910390f35b34156101f957fe5b61024d600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050610717565b604051808215151515815260200191505060405180910390f35b341561026f57fe5b61027761078b565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34156102c157fe5b6102c96107b1565b6040518082815260200191505060405180910390f35b34156102e757fe5b6102ef6107b6565b604051808060200182810382528381815181526020019150805190602001908083836000831461033e575b80518252602083111561033e5760208201915060208101905060208303925061031a565b505050905090810190601f16801561036a5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561038057fe5b6103ac600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610854565b6040518082815260200191505060405180910390f35b34156103ca57fe5b6103d261089e565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b341561041c57fe5b6104246108c4565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b341561046e57fe5b6104766108ea565b60405180806020018281038252838181518152602001915080519060200190808383600083146104c5575b8051825260208311156104c5576020820191506020810190506020830392506104a1565b505050905090810190601f1680156104f15780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561050757fe5b61053c600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050610924565b604051808215151515815260200191505060405180910390f35b341561055e57fe5b61058a600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610937565b005b341561059457fe5b6105df600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff169060200190919050506109da565b6040518082815260200191505060405180910390f35b34156105fd57fe5b610629600480803573ffffffffffffffffffffffffffffffffffffffff169060200190919050506109e7565b005b604060405190810160405280601181526020017f496e646f7273652053435220546f6b656e00000000000000000000000000000081525081565b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415156106c45760006000fd5b82600560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600190505b5b92915050565b60035481565b600060008473ffffffffffffffffffffffffffffffffffffffff161415610747576107428383610ac1565b61077f565b60008373ffffffffffffffffffffffffffffffffffffffff161415610775576107708483610c90565b61077e565b60009050610784565b5b600190505b9392505050565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600181565b60028054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561084c5780601f106108215761010080835404028352916020019161084c565b820191906000526020600020905b81548152906001019060200180831161082f57829003601f168201915b505050505081565b6000600460008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490505b919050565b600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b604060405190810160405280600381526020017f534352000000000000000000000000000000000000000000000000000000000081525081565b60006000151561093057fe5b5b92915050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415156109945760006000fd5b80600660006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505b5b50565b6000600090505b92915050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141515610a445760006000fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141515610abc5780600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505b5b5b50565b600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161480610b6a5750600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16145b1515610b765760006000fd5b60008273ffffffffffffffffffffffffffffffffffffffff1614151515610b9d5760006000fd5b610be6600460008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205482610e99565b600460008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610c3560035482610e99565b6003819055508173ffffffffffffffffffffffffffffffffffffffff1660007fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35b5050565b6000600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141515610cef5760006000fd5b60008373ffffffffffffffffffffffffffffffffffffffff1614151515610d165760006000fd5b600460008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020548211610d625781610da3565b600460008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020545b9050610dee600460008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205482610ec5565b600460008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610e3d60035482610ec5565b60038190555060008373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35b505050565b600060008284019050838110158015610eb25750828110155b1515610eba57fe5b8091505b5092915050565b60006000828410151515610ed557fe5b82840390508091505b50929150505600a165627a7a72305820695642f8e7901a609a142a622850942a9dea16644dc7f2ede6821c41cf2dd3880029'
const scr_token_abi = [{
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{
        "name": "",
        "type": "string"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "_crowdSale",
        "type": "address"
    }, {
        "name": "",
        "type": "uint256"
    }],
    "name": "approve",
    "outputs": [{
        "name": "ok",
        "type": "bool"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "from",
        "type": "address"
    }, {
        "name": "to",
        "type": "address"
    }, {
        "name": "value",
        "type": "uint256"
    }],
    "name": "transferFrom",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "indorsePlatform",
    "outputs": [{
        "name": "",
        "type": "address"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "version",
    "outputs": [{
        "name": "",
        "type": "string"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [{
        "name": "who",
        "type": "address"
    }],
    "name": "balanceOf",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "crowdSale",
    "outputs": [{
        "name": "",
        "type": "address"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [{
        "name": "",
        "type": "address"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{
        "name": "",
        "type": "string"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "",
        "type": "address"
    }, {
        "name": "",
        "type": "uint256"
    }],
    "name": "transfer",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "_indorsePlatform",
        "type": "address"
    }],
    "name": "setHost",
    "outputs": [],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [{
        "name": "",
        "type": "address"
    }, {
        "name": "",
        "type": "address"
    }],
    "name": "allowance",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "newOwner",
        "type": "address"
    }],
    "name": "transferOwnership",
    "outputs": [],
    "payable": false,
    "type": "function"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "name": "from",
        "type": "address"
    }, {
        "indexed": true,
        "name": "to",
        "type": "address"
    }, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
    }],
    "name": "Transfer",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "name": "owner",
        "type": "address"
    }, {
        "indexed": true,
        "name": "spender",
        "type": "address"
    }, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
    }],
    "name": "Approval",
    "type": "event"
}]

var methods = {};

methods.increase_score = function(arr, callback) {
    var args = Array.prototype.slice.call(arguments);
    // console.log(args[0][1]);
    for (var i = 0; i < arr.length; i++) {
        // Now the actual call to the contract ==============================
        var address_SCR = "0xc21931a3e96f859A52B89f38e13E6eE17e6eE602";
        console.log("Address of the user = ", arr[i]);
        var SCRContract = web3.eth.contract(scr_token_abi);
        var SCR_instance = SCRContract.at(address_SCR);
        // console.log(SCR_instance);
        var scr_call_data = SCR_instance.transferFrom.getData(0x0, arr[i], 1);

        var privateKey = new Buffer(process.env.exp_priv_key, 'hex');

        nonce = web3.eth.getTransactionCount('0xca6a8f8424c5002e994014c98044b6e68b998821');
        nonceHex = web3.toHex(nonce);
        var gasLimit = web3.toHex('300000');

        console.log('nonce (transaction count on 0xca6a8f8424c5002e994014c98044b6e68b998821): ' + nonce + '(' + nonceHex + ')');

        var rawTx = {
            nonce: nonceHex,
            gasPrice: '0x09184e72a000',
            gasLimit: gasLimit,
            to: address_SCR,
            value: 0,
            data: scr_call_data
        }

        var tx = new Tx(rawTx);
        tx.sign(privateKey);

        var serializedTx = tx.serialize();

        var hex_serialized = '0x' + serializedTx.toString('hex');
        console.log("TXN serialized =", hex_serialized);

        web3.eth.sendRawTransaction(hex_serialized, function(err, hash) {
            if (!err) {
                console.log("Hash of the TXN = ", hash);
            } else {
                console.log(err);
            }
        });
        // Done with the actual call to the contract ==============================
        if(i == arr.length - 1){
            callback(null, "Increased the score of all addresses");
        }
    }
    
}

exports.data = methods;

/*
function scores(arr) {
    //var arr = ['0x00A232459F6626Cf5a64f7daA155a4999EF1eA38', '0x790e33f19e42A380bF9Ae50662874560C020CFDE'];
    increase_score(arr, function(err, result){
        console.log(result);
    });
    //res.send("In the function");
}*/