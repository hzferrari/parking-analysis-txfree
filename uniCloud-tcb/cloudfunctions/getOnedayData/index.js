'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)

	insertToDataBase(event);

	//返回数据给客户端
	return event
};

async function insertToDataBase(data) {
	const collection = db.collection('date-data')

	let dbCmd = db.command;
	let like_Json = {}
	like_Json['timestamp'] = data.timestamp;

	//limit() 腾讯云限制为最大1000条，阿里云为500
	let oneDayData = await collection.where({
		timestamp: data.timestamp
	}).get();

	console.log('oneDayData:', oneDayData)
	if (oneDayData.data.length > 0) {
		// 找到这天的记录
		let findData = oneDayData.data[0];
		// 更新记录
		await collection.doc(findData._id).update(data);

	} else {
		// 没找到这天的记录
		collection.add(data).then(res => {})
	}

}
