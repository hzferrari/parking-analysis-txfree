<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">{{title}}</text>
		</view>

		<button type="primary" :loading="isBtnLoading" @click="getParkingData">getParkingData</button>

		<view style="margin:30rpx auto;">
			<button type="primary" :loading="isBtnLoading" @click="getByTimestamp(false)">getDataByTimestamp</button>
			<button type="primary" :loading="isBtnLoading" @click="getByTimestamp(true)">getDataByTimestamp and
				download</button>
			<picker mode="date" :value="date" :start="startDate" :end="endDate" @change="bindDateChange">
				<view class="uni-input">getDataByTimestamp: {{date}}</view>
			</picker>
		</view>

		<view style="margin:30rpx auto;">
			<button type="primary" :loading="isBtnLoading" @click="getWeatherByDate()">getWeatherByDate</button>
			<picker mode="date" :value="date" :start="startDate" :end="endDate" @change="bindDateChange">
				<view class="uni-input">getWeatherByDate: {{date}}</view>
			</picker>
		</view>

		<button type="primary" :loading="isBtnLoading" @click="handleOnedayData">handleOnedayData</button>

		<button type="primary" :loading="isBtnLoading" @click="handleOnedayDataAll">handleOnedayDataAll</button>

		<button type="primary" :loading="isBtnLoading"
			@click="testGetOnedayDataByTimestamp">testGetOnedayDataByTimestamp</button>
	</view>
</template>

<script>
	import util from "../../src/util/util.js"

	export default {
		computed: {
			startDate() {
				return this.getDate('start');
			},
			endDate() {
				return this.getDate('end');
			}
		},
		data() {
			const currentDate = this.getDate({
				format: true
			})

			return {
				title: 'Hello',
				isBtnLoading: false,
				date: currentDate,
			}
		},
		onLoad() {

		},
		methods: {
			/**
			 * 根据picker选择的日期，获取某一天的天气数据，存到数据库
			 */
			getWeatherByDate() {
				uniCloud.callFunction({
					name: 'getWeatherByTimestamp',
					data: {
						startTime: new Date('2021-10-01 00:00:00').getTime(),
						endTime: new Date('2021-10-03 00:00:00').getTime()
					}
				}).then((res) => {
					console.log("res:", res)

				})
				
				return
				
				
				let day = this.date;

				uniCloud.callFunction({
					name: 'getWeatherByDate',
					data: {
						date: util.formatDate(new Date(day), "yyyy-MM-dd")
					}
				}).then((res) => {
					console.log("res:", res)

				}).catch((err) => {

					console.error('getWeatherByDate:', err)
				})

			},
			/**
			 * 从2021-06-19开始，获取每一天的天气数据，存到数据库
			 */
			getAllWeather() {
				let timestamp = new Date("2021-06-19 00:00:00").getTime();
				let oneDay = 60 * 60 * 24 * 1000;

				let index = 0;
				let inter = setInterval(() => {

					let day = util.formatDate(new Date(timestamp), "yyyy-MM-dd");

					console.log(day);

					uniCloud.callFunction({
						name: 'getWeatherByDate',
						data: {
							date: util.formatDate(new Date(day), "yyyy-MM-dd")
						}
					}).then((res) => {}).catch((err) => {
						console.error('getWeatherByDate:', err)
					})

					timestamp += oneDay;
					index++;
					if (timestamp >= Date.now()) {
						clearInterval(inter)
					}
				}, 5000)
			},
			/**
			 * picker用
			 */
			getDate(type) {
				const date = new Date();
				let year = date.getFullYear();
				let month = date.getMonth() + 1;
				let day = date.getDate();

				if (type === 'start') {
					year = year - 60;
				} else if (type === 'end') {
					year = year + 2;
				}
				month = month > 9 ? month : '0' + month;;
				day = day > 9 ? day : '0' + day;
				return `${year}-${month}-${day}`;
			},
			bindDateChange: function(e) {
				this.date = e.target.value
				console.log('日期：', this.date)
			},
			async getParkingData() {
				await uniCloud.callFunction({
					name: 'getParkingData',

				}).then(res => {
					console.log('getParkingData res:', res)
					if (res && res.result.status === 200) {
						console.log(res.result.data)
					}
				})
			},
			/**
			 * 
			 */
			getByTimestamp(isDownload) {
				return new Promise(resolve => {

					this.isBtnLoading = true;

					let day = this.date;

					uniCloud.callFunction({
						name: 'getDataByTimestamp',
						data: {
							startTime: new Date(day + ' 00:00:00').getTime(),
							endTime: new Date(day + ' 8:59:59').getTime()
						}
					}).then((res) => {

						// 每次获取半天的数据，因为腾讯云数据库每次最多只能获取1000条数据
						uniCloud.callFunction({
							name: 'getDataByTimestamp',
							data: {
								startTime: new Date(day + ' 9:00:00').getTime(),
								endTime: new Date(day + ' 23:59:59').getTime()
							}
						}).then((res2) => {

							this.isBtnLoading = false;

							// 两次数据组合成一天的数据保存
							let totalRes = {
								"startTime": res.result.startTime,
								"endTime": res2.result.endTime,
								data: res.result.data.concat(res2.result.data)
							}
							// console.log("totalRes: ", totalRes)

							resolve(totalRes)

							if (isDownload) {
								this.saveDataAsJson(totalRes);
							}

						}).catch((err) => {
							resolve(false)
							this.isBtnLoading = false;
							console.error('getDataByTimestamp2:', err)
						})

					}).catch((err) => {
						resolve(false)
						this.isBtnLoading = false;
						console.error('getDataByTimestamp:', err)
					})

				})
			},
			/**
			 * 保存为JSON数据
			 */
			saveDataAsJson(data) {

				let dataStr;

				if (typeof data === "object") {
					dataStr = JSON.stringify(data);
				} else {
					alert("数据格式不是object")
				}

				let blob = new Blob([dataStr], {
					type: "text/json"
				});
				let a = document.createElement("a");

				if (window.navigator.msSaveOrOpenBlob) {
					// 兼容IE下载
					navigator.msSaveBlob(
						blob,
						"parking_data_bytime_" + util.formatDate(new Date(data.startTime), "yyyy-MM-dd") + ".json"
					);
				} else {
					// 设置文件名
					a.download =
						"parking_data_bytime_" + util.formatDate(new Date(data.startTime), "yyyy-MM-dd") + ".json";

					a.href = window.URL.createObjectURL(blob);
					a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
					// console.log("a: ", a);
					a.click();
				}
			},
			testGetOnedayDataByTimestamp() {
				return new Promise(resolve => {


					this.isBtnLoading = true;

					let day = this.date;

					uniCloud.callFunction({
						name: 'getOnedayDataByTimestamp',
						data: {
							startTime: new Date('2021-07-01' + ' 00:00:00').getTime(),
							endTime: new Date("2021-07-13" + ' 23:59:59').getTime()
						}
					}).then((res) => {
						this.isBtnLoading = false;

					}).catch((err) => {
						resolve(false)
						this.isBtnLoading = false;
						console.error('getOnedayDataByTimestamp:', err)
					})

				})

			},
			handleOnedayData() {
				this.getByTimestamp(false).then(res => {

					if (res) {
						let oneDay = handleData(res);
						console.log('oneDay: ', oneDay)

						uniCloud.callFunction({
							name: 'getOnedayData',
							data: oneDay
						}).then((res2) => {

							this.isBtnLoading = false;

						}).catch((err) => {

							this.isBtnLoading = false;
							console.error('getOnedayData:', err)
						})
					}
				});

				let vm = this;

				function handleData(res) {

					let oneDay = {};
					oneDay.dataList = res.data;
					// 当天0点的timestamp
					oneDay.timestamp = oneDay.dataList[0].timestamp;
					// 设置当天是星期几
					oneDay.week = util.getWeekByTimestamp(oneDay.dataList[0].timestamp);
					// 设置当天日期字符串
					oneDay.date = util.formatDate(new Date(oneDay.timestamp), "yyyy-MM-dd")

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
						// 计算p7早高峰起点（假设p7剩余车位300时是早高峰的开始）
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
					oneDay.p6first0Index = p6first0Index;
					oneDay.p6firstNot0Index = p6firstNot0Index;
					oneDay.p5first0Index = p5first0Index;
					oneDay.p5firstNot0Index = p5firstNot0Index;

					// 时间转换成数值
					if (rushTimeStartIndex !== undefined) {
						oneDay.rushTimeStartTimestamp =
							oneDay.dataList[rushTimeStartIndex].timestamp;

						oneDay.rushTimeStartValue = vm._normalizeDatetime(
							oneDay.rushTimeStartTimestamp
						);
					}
					if (p7first0Index !== undefined) {
						oneDay.p7first0Timestamp = oneDay.dataList[p7first0Index].timestamp;

						oneDay.p7first0Value = vm._normalizeDatetime(
							oneDay.p7first0Timestamp
						);
					}
					if (p7firstNot0Index !== undefined) {
						oneDay.p7firstNot0Timestamp =
							oneDay.dataList[p7firstNot0Index].timestamp;

						oneDay.p7firstNot0Value = vm._normalizeDatetime(
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

						oneDay.p6first0Value = vm._normalizeDatetime(
							oneDay.p6first0Timestamp
						);
					}
					if (p6firstNot0Index !== undefined) {
						oneDay.p6firstNot0Timestamp =
							oneDay.dataList[p6firstNot0Index].timestamp;

						oneDay.p6firstNot0Value = vm._normalizeDatetime(
							oneDay.p6firstNot0Timestamp
						);
					}

					// p5
					if (p5first0Index !== undefined) {
						oneDay.p5first0Timestamp = oneDay.dataList[p5first0Index].timestamp;

						oneDay.p5first0Value = vm._normalizeDatetime(
							oneDay.p5first0Timestamp
						);
					}
					if (p5firstNot0Index !== undefined) {
						oneDay.p5firstNot0Timestamp =
							oneDay.dataList[p5firstNot0Index].timestamp;

						oneDay.p5firstNot0Value = vm._normalizeDatetime(
							oneDay.p5firstNot0Timestamp
						);
					}

					return oneDay
				}

			},
			handleOnedayDataAll() {
				let list = ['2021-06-19', '2021-06-20', '2021-06-21', '2021-06-22', '2021-06-23', '2021-06-24',
					'2021-06-25', '2021-06-26', '2021-06-27', '2021-06-28', '2021-06-29', '2021-06-30', '2021-07-01',
					'2021-07-02', '2021-07-03', '2021-07-04', '2021-07-05', '2021-07-06', '2021-07-07', '2021-07-08',
					'2021-07-09', '2021-07-10', '2021-07-11', '2021-07-12', '2021-07-13', '2021-07-14', '2021-07-15',
					'2021-07-16', '2021-07-17', '2021-07-18', '2021-07-19', '2021-07-20'
				]

				let index = 0;
				let inter = setInterval(() => {

					this.date = list[index];
					console.log(this.date);
					this.handleOnedayData();

					index++;
					if (index >= list.length) {
						clearInterval(inter)
					}
				}, 5000)
			},
			/**
			 * 将时间戳转换为归一化的值，即全部转换为秒（忽略年月日，只看小时分钟秒）
			 */
			_normalizeDatetime(timestamp) {
				let newDate = new Date(timestamp);
				let hour = newDate.getHours();
				let minute = newDate.getMinutes();
				let second = newDate.getSeconds();

				let totalSecond = hour * 3600 + minute * 60 + second;

				return totalSecond;
			},

		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}

	button {
		margin-top: 10rpx;
		margin-bottom: 10rpx;
	}
</style>
