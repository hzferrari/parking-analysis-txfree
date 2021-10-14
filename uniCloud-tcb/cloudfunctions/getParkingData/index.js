'use strict';
const db = uniCloud.database()
let util = require("./utils/index.js");

exports.main = async (event, context) => {
	//event为客户端上传的参数
	// console.log('event : ', event)

	let resData;

	const res = await uniCloud.httpclient.request("http://parking.desaysv.com:8080/retrieve.php", {
		method: 'GET',
		dataType: 'text' // 指定返回值为text格式，自动进行parse
	})


	if (res && res.status === 200) {

		// 成功
		resData = res.data;

		handleResData(resData)
	}

	//返回数据给客户端
	return resData
};

function handleResData(resStr) {
	let parkingLot = {
		time: "",
		timestamp: "",
		countNum: {}
	};

	let resStrSpl = resStr.split(" ");

	parkingLot.countNum = {
		p5: JSON.parse(resStrSpl[0]).countNum, // 西门南侧
		p6: JSON.parse(resStrSpl[1]).countNum, // 宿舍区
		p7: JSON.parse(resStrSpl[2]).countNum, // 二期天面
	};

	let timestamp = new Date().getTime(); // 记录当前时间戳
	// 可读时间。(unicloud的云函数时区为utc+0，中国需要加8小时偏移)
	let time = util.formatDate(util.getOffsetDate(8), "yyyy-MM-dd hh:mm:ss"); 

	parkingLot.timestamp = timestamp;
	parkingLot.time = time;

	console.log("==> parkingLot:", parkingLot)


	insertToDataBase(parkingLot)
}

function insertToDataBase(parkingLot) {
	const collection = db.collection('parking-data')

	let data = {
		timestamp: parkingLot.timestamp,
		time: parkingLot.time,
		p5: parkingLot.countNum.p5,
		p6: parkingLot.countNum.p6,
		p7: parkingLot.countNum.p7
	}
	collection.add(data).then(res => {
		// console.log('==> insertToDataBase:', res)
	})

	// return res
}
