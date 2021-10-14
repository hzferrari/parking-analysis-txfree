'use strict';
const db = uniCloud.database()
exports.main = async (event, context) => {
	console.log('event: ', event)

	let dataObj = {}
	if (event.requestContext) {
		// 变成网络接口请求时
		dataObj = JSON.parse(event.body);

	} else {
		// 本地运行请求
		dataObj = event;

	}

	const collection = db.collection('parking-data')

	let dbCmd = db.command;
	let like_Json = {}
	like_Json['timestamp'] = dbCmd.and([
		dbCmd.gte(dataObj.startTime),
		dbCmd.lte(dataObj.endTime)
	])

	//limit() 腾讯云限制为最大1000条，阿里云为500
	let res = await collection.where(like_Json).orderBy('timestamp', "asc").limit(1000).get();

	res.startTime = dataObj.startTime;
	res.endTime = dataObj.endTime;

	// console.log('==> getDataByTimestamp:', res)

	return res
};
