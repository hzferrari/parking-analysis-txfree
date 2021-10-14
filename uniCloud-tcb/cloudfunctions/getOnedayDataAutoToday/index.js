'use strict';
let util = require("./utils/index.js");

const db = uniCloud.database()

let offsetTimstamp = 8 * 60 * 60 * 1000; // 服务器偏移的时间戳，8个小时

/**
 * 设定每天早上9点触发
 */
exports.main = async (event, context) => {
	// console.log('new Date(): ', new Date())
	// console.log('new Date().getTime(): ', new Date().getTime())
	// console.log('new Date(new Date().getTime()): ', new Date(new Date().getTime()))
	// console.log('new Date(1626741635483) 2021-7-20 8:40:xx ：', new Date(1626741635483))
	// console.log('new Date("2021-7-19 12:00:00"): ', new Date("2021-7-19 12:00:00"))
	// console.log('new Date("2021-7-19 12:00:00").getTime(): ', new Date("2021-7-19 12:00:00").getTime())
	// return

	let res = await getByTimestampToday()

	let oneDay = await handleData(res);
	// console.log('oneDay: ', oneDay)

	await insertToDataBase(oneDay);

	//返回数据给客户端
	return event
};

async function insertToDataBase(data) {

	const collect = db.collection('date-data')

	let dbCmd = db.command;
	let like_Json = {}
	like_Json['timestamp'] = data.timestamp;

	//limit() 腾讯云限制为最大1000条，阿里云为500
	let oneDayData = await collect.where({
		timestamp: data.timestamp
	}).get();

	// console.log('oneDayData:', oneDayData)
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

function handleData(res) {
	return new Promise(resolve => {
		let oneDay = {};
		oneDay.dataList = res.data;
		// 当天0点的timestamp
		oneDay.timestamp = oneDay.dataList[0].timestamp;
		// 设置当天是星期几
		oneDay.week = util.getWeekByTimestamp(oneDay.dataList[0].timestamp + offsetTimstamp);
		// 设置当天日期字符串
		oneDay.date = util.formatDate(new Date(oneDay.timestamp + offsetTimstamp), "yyyy-MM-dd")

		// p7
		let rushTimeStartIndex, p7first0Index, p7firstNot0Index;
		// p6
		let p6first0Index, p6firstNot0Index;
		// p5
		let p5first0Index, p5firstNot0Index;

		for (let i = 0, len = oneDay.dataList.length; i < len; i++) {
			// 计算早高峰终点
			if (!p7first0Index && oneDay.dataList[i].p7 === 0) {
				p7first0Index = i;
			} else if (
				!p7firstNot0Index &&
				p7first0Index &&
				oneDay.dataList[i].p7 > 0
			) {
				p7firstNot0Index = i;
				// 到这里就可以结束了
				// break;
			}

			// 计算早高峰起点（假设p7剩余车位300时是早高峰的开始）
			if (!rushTimeStartIndex && oneDay.dataList[i].p7 <= 300) {
				rushTimeStartIndex = i;
			}

			// p6
			if (!p6first0Index && oneDay.dataList[i].p6 === 0) {
				p6first0Index = i;
			} else if (!p6firstNot0Index &&
				p6first0Index &&
				oneDay.dataList[i].p6 > 0) {
				p6firstNot0Index = i;
			}

			// p5
			if (!p5first0Index && oneDay.dataList[i].p5 === 0) {
				p5first0Index = i;
			} else if (!p5firstNot0Index &&
				p5first0Index &&
				oneDay.dataList[i].p5 > 0) {
				p5firstNot0Index = i;
			}
		}

		// 记录index
		oneDay.rushTimeStartIndex = rushTimeStartIndex;
		oneDay.p7first0Index = p7first0Index;
		oneDay.p7firstNot0Index = p7firstNot0Index;

		// 时间转换成数值
		if (rushTimeStartIndex !== undefined) {
			oneDay.rushTimeStartTimestamp =
				oneDay.dataList[rushTimeStartIndex].timestamp;

			oneDay.rushTimeStartValue = _normalizeDatetime(
				oneDay.rushTimeStartTimestamp
			);
		}
		if (p7first0Index !== undefined) {
			oneDay.p7first0Timestamp = oneDay.dataList[p7first0Index].timestamp;

			oneDay.p7first0Value = _normalizeDatetime(
				oneDay.p7first0Timestamp
			);
		}
		if (p7firstNot0Index !== undefined) {
			oneDay.p7firstNot0Timestamp =
				oneDay.dataList[p7firstNot0Index].timestamp;

			oneDay.p7firstNot0Value = _normalizeDatetime(
				oneDay.p7firstNot0Timestamp
			);
		}
		// 计算高峰期时间起止插值，用于图表stack
		if (oneDay.p7first0Value && oneDay.rushTimeStartValue) {
			let shift = 100; // 人为造一个偏移量，让柱子离折线之间产生一点距离，比较好看

			oneDay.diffInRushTimeValue =
				oneDay.p7first0Value - oneDay.rushTimeStartValue - shift;
		}

		// p6
		if (p6first0Index !== undefined) {
			oneDay.p6first0Timestamp = oneDay.dataList[p6first0Index].timestamp;

			oneDay.p6first0Value = _normalizeDatetime(
				oneDay.p6first0Timestamp
			);
		}
		if (p6firstNot0Index !== undefined) {
			oneDay.p6firstNot0Timestamp =
				oneDay.dataList[p6firstNot0Index].timestamp;

			oneDay.p6firstNot0Value = _normalizeDatetime(
				oneDay.p6firstNot0Timestamp
			);
		}

		// p5
		if (p5first0Index !== undefined) {
			oneDay.p5first0Timestamp = oneDay.dataList[p5first0Index].timestamp;

			oneDay.p5first0Value = _normalizeDatetime(
				oneDay.p5first0Timestamp
			);
		}
		if (p5firstNot0Index !== undefined) {
			oneDay.p5firstNot0Timestamp =
				oneDay.dataList[p5firstNot0Index].timestamp;

			oneDay.p5firstNot0Value = _normalizeDatetime(
				oneDay.p5firstNot0Timestamp
			);
		}

		// return oneDay
		resolve(oneDay)
	})
}

/**
 * 将时间戳转换为归一化的值，即全部转换为秒（忽略年月日，只看小时分钟秒）
 */
function _normalizeDatetime(timestamp) {
	let newDate = new Date(timestamp + offsetTimstamp);
	let hour = newDate.getHours();
	let minute = newDate.getMinutes();
	let second = newDate.getSeconds();

	let totalSecond = hour * 3600 + minute * 60 + second;

	return totalSecond;
}

function getByTimestampToday() {
	return new Promise(resolve => {

		// 今天
		let day = util.formatDate(util.getOffsetDate(8), "yyyy-MM-dd");

		uniCloud.callFunction({
			name: 'getDataByTimestamp',
			data: {
				startTime: new Date(day + ' 00:00:00').getTime() - offsetTimstamp,
				endTime: new Date(day + ' 9:00:00').getTime() - offsetTimstamp,
			}
		}).then((res) => {

			let totalRes = {
				"startTime": res.result.startTime,
				"endTime": res.result.endTime,
				data: res.result.data
			}

			resolve(totalRes)

		}).catch((err) => {
			resolve(false)
			
			console.error('getDataByTimestamp:', err)
		})

	})
}
