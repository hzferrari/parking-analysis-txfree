/*
 * 工具类
 */

var util = {};

/*
* 日期格式化
  @param  date: Date()对象
          fmt: 'yyyy-MM-dd' ,'MM-dd'等格式
  @return
*/
util.formatDate = (date, fmt) => {
	fmt = fmt ? fmt : "yyyy/MM/dd hh:mm:ss";
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	var o = {
		"M+": date.getMonth() + 1,
		"d+": date.getDate(), //日
		"h+": date.getHours(), //小时
		"m+": date.getMinutes(), //分
		"s+": date.getSeconds(), //秒
		// "q+": Math.floor((this.getMonth() + 3) / 3), //季度
		// "S": this.getMilliseconds() //毫秒
	};

	for (var k in o) {
		if (new RegExp(`(${k})`).test(fmt)) {
			var str = o[k] + "";
			fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : padLeftZero(str));
		}
	}
	return fmt;
};

function padLeftZero(str) {
	return ("00" + str).substr(str.length);
}

/**
 * https://uniapp.dcloud.io/uniCloud/quickstart?id=%e8%b0%83%e7%94%a8%e6%9c%ac%e5%9c%b0%e4%ba%91%e5%87%bd%e6%95%b0%e6%b3%a8%e6%84%8f%e4%ba%8b%e9%a1%b9
 * 获取偏移后的Date对象，例如utc+x时offset就传x
 * @param {Object} offset
 */
util.getOffsetDate = function(offset) {
  return new Date(
    Date.now() + (new Date().getTimezoneOffset() + (offset || 0) * 60) * 60000
  )
}

/**
 * 根据时间戳返回星期几
 * @param {timestamp} timestamp 时间戳
 * @return {string} 星期几
 */
util.getWeekByTimestamp = function(timestamp) {
  if (timestamp) {
    let week;
    switch (new Date(timestamp).getDay()) {
      case 0:
        week = "星期日";
        break;
      case 1:
        week = "星期一";
        break;
      case 2:
        week = "星期二";
        break;
      case 3:
        week = "星期三";
        break;
      case 4:
        week = "星期四";
        break;
      case 5:
        week = "星期五";
        break;
      case 6:
        week = "星期六";
        break;

      default:
        break;
    }

    return week;
  }
  return false;
};


module.exports = util;
