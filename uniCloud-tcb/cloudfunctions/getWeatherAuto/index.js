'use strict';

let util = require("./utils/index.js");

const db = uniCloud.database()
// let util = require("./utils/index.js");

let offsetTimstamp = 8 * 60 * 60 * 1000; // 服务器偏移的时间戳，8个小时

/**
 * 设定每天0点触发
 */
exports.main = async (event, context) => {
	//event为客户端上传的参数
	// console.log('event : ', event)

	// 更新昨天一整天的
	let resData = await getByTimestampLastday()

	await insertToDataBase(resData);

	//返回数据给客户端
	return resData
};

async function insertToDataBase(data) {
	console.log('data:', data)
	const collect = db.collection('weather-data')

	let dbCmd = db.command;

	let oneDayData = await collect.where({
		timestamp: data.timestamp
	}).get();


	if (oneDayData.data.length > 0) {
		// 找到这天的记录
		let findData = oneDayData.data[0];
		// 更新记录
		await collect.doc(findData._id).update(data);

	} else {
		// 没找到这天的记录
		await collect.add(data).then(res => {})

	}

}

async function getByTimestampLastday() {
	return new Promise(async resolve => {

		// 昨天的日期
		let day = new Date().getTime() - 60 * 60 * 24 * 1000;
		day = util.formatDate(new Date(day + offsetTimstamp), "yyyy-MM-dd");

		let appkey = "62110";
		let sign = "0543c988db3b078a67b85726b9b845de";
		let cityId = "101280301"; // 惠州cityId
		let date = day;

		const res = await uniCloud.httpclient.request(
			`http://api.k780.com/?app=weather.history&cityId=${cityId}&date=${date}&appkey=${appkey}&sign=${sign}&format=json`, {
				method: 'POST',
				dataType: 'text' // 指定返回值为text格式，自动进行parse
			})

		let resData = {};
		if (res && res.status === 200) {

			// 成功
			resData.weatherList = JSON.parse(res.data).result;
			resData.date = date;
			resData.timestamp = new Date(date).getTime() - offsetTimstamp;

			resolve(resData)

		} else {
			reject(false)
		}

	})
}
