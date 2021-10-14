'use strict';
const db = uniCloud.database()
exports.main = async (event, context) => {
	console.log('getOneDayDataByTimestamp event: ', event)

	let dataObj = {}
	if (event.requestContext) {
		// 变成网络接口请求时
		dataObj = JSON.parse(event.body);

	} else {
		// 本地运行请求
		dataObj = event;

	}

	const collection = db.collection('date-data')

	let dbCmd = db.command;
	let like_Json = {}
	like_Json['timestamp'] = dbCmd.and([
		dbCmd.gte(dataObj.startTime),
		dbCmd.lte(dataObj.endTime)
	])

	//limit() 腾讯云限制为最大1000条，阿里云为500

	let res

	if (dataObj.needDataList) {
		// 请求返回dataList字段
		res = await collection.where(like_Json).orderBy('timestamp', "asc").limit(1000).get();

	} else {
		// 不返回dataList字段。dataList字段数据太多，查询多日时会很慢
		// 按时间戳升序排列
		res = await collection.where(like_Json).field({
			'dataList': false
		}).orderBy('timestamp', "asc").limit(1000).get();

	}

	// console.log('==> getDataByTimestamp:', res)

	return res
};
