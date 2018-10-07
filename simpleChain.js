/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/
const SHA256 = require('crypto-js/sha256');
const leveldb = require('./levelSandbox');
const Block = require('./block');


class Blockchain {

	// Constructor function, also create genesis block persist as the first block in the blockchain using LevelDB.
	constructor(){
		this.getBlockHeight().then((height) => {
			if (height === -1) {
				this.addBlock(new Block("First block in the chain - Genesis block")).then(() => console.log("Genesis block added!"))
			}
		})
	}

	// Store New Block within LevelDB.
	async addBlock(newBlock) {
		const chainHeight = parseInt(await this.getBlockHeight())

		newBlock.height = chainHeight + 1
		newBlock.time = new Date().getTime().toString().slice(0, -3)

		if (newBlock.height > 0) {
			const prevBlock = await this.getBlock(chainHeight)
			newBlock.previousBlockHash = prevBlock.hash
			console.log(`Previous hash: ${newBlock.previousBlockHash}`)
		}

		newBlock.hash = SHA256(JSON.stringify(newBlock)).toString()
		console.log(`New hash: ${newBlock.hash}`)

		await leveldb.addBlockToDB(newBlock.height, JSON.stringify(newBlock))
	}

	// Retrieves current block height within the LevelDB chain.
	async getBlockHeight() {
		return await leveldb.getBlockHeightFromDB()
	}

	// Retrieves a block by block heigh within the LevelDB chain.
	async getBlock(blockHeight) {
		return JSON.parse(await leveldb.getBlockFromDB(blockHeight))
	}

	// Validate a block stored within levelDB
	async validateBlock(blockHeight) {
		let block = await this.getBlock(blockHeight);
		let blockHash = block.hash;
		block.hash = '';

		let validBlockHash = SHA256(JSON.stringify(block)).toString();

		if (blockHash === validBlockHash) {
			return true;
		} 
		else {
			console.log(`Block #${blockHeight} invalid hash: ${blockHash} <> ${validBlockHash}`);
			return false;
		}
	}

	// Validate blockchain stored within levelDB
	async validateChain() {
		let errorLog = [];
		let previousHash = '';
		let isValidBlock = false;
		let promiseList = [];


		// Use a temp chain array to store temporary data. 
		let tempChain = [];

		console.log("Start to validate the Blockchain...");
		const chainHeight = await leveldb.getBlockHeightFromDB()

		// Push all Promises into promiseList 
		for (let i = 0; i < chainHeight; i++) {
			promiseList.push(new Promise((resolve,reject)=>{
				this.getBlock(i).then((block) => {
					tempChain[i] = block;
					isValidBlock = this.validateBlock(block.height)
					if(!isValidBlock) {
						return false;
					}
					resolve(isValidBlock);
				})
			}))
		}

		// Use Promise.all resolve all the promises in the promiseList
		Promise.all(promiseList).then(function(results) {
			if (results.every((result) => { if(result) return result})) {
				for (let i = 1; i < chainHeight; i++) {
					if (tempChain[i].previousBlockHash !== tempChain[i-1].hash) errorLog.push(i);
				}
				if (errorLog.length > 0) {
					console.log(`These blocks have invalid previous hash contained: ${errorLog}`)
				} 
				else {
					console.log('No errors, the blockchain is valid.')  
				}
			} 
			else {
				console.log('The blockchain is invalid.')
			}
		})
		}
	}

module.exports = Blockchain
