/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);


module.exports = {
	
	// Persist data with LevelDB	
	addBlockToDB(key, value) {
		return new Promise((resolve, reject) => {
			db.put(key, value, (err) => {
				if (err) reject(err)
				resolve(console.log(`Added block #${key}`))
			})
		})
	},

	// Get data from LevelDB
	getBlockFromDB(key) {
		return new Promise((resolve, reject) => {
			db.get(key, (err, value) => {
				if (value === undefined) {
					return reject('Not found')
				} else if (err) {
					return reject(err)
				}
				return resolve(value)
			})
		})
	},

	// Get Block Height from LevelDB
	getBlockHeightFromDB() {
		return new Promise((resolve, reject) => {
			let chainHeight = -1
			db.createReadStream().on('data', (data) => {
				chainHeight++
			}).on('err', (err) => {
				reject(err)
			}).on('close', () => {
				resolve(chainHeight)
			})
		})
	}
}