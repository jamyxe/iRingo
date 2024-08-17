/* README: https://github.com/VirgilClyne/iRingo */
/* https://www.lodashjs.com */
class Lodash {
	static name = "Lodash";
	static version = "1.2.2";
	static about() { return console.log(`\n🟧 ${this.name} v${this.version}\n`) };

	static get(object = {}, path = "", defaultValue = undefined) {
		// translate array case to dot case, then split with .
		// a[0].b -> a.0.b -> ['a', '0', 'b']
		if (!Array.isArray(path)) path = this.toPath(path);

		const result = path.reduce((previousValue, currentValue) => {
			return Object(previousValue)[currentValue]; // null undefined get attribute will throwError, Object() can return a object 
		}, object);
		return (result === undefined) ? defaultValue : result;
	}

	static set(object = {}, path = "", value) {
		if (!Array.isArray(path)) path = this.toPath(path);
		path
			.slice(0, -1)
			.reduce(
				(previousValue, currentValue, currentIndex) =>
					(Object(previousValue[currentValue]) === previousValue[currentValue])
						? previousValue[currentValue]
						: previousValue[currentValue] = (/^\d+$/.test(path[currentIndex + 1]) ? [] : {}),
				object
			)[path[path.length - 1]] = value;
		return object
	}

	static unset(object = {}, path = "") {
		if (!Array.isArray(path)) path = this.toPath(path);
		let result = path.reduce((previousValue, currentValue, currentIndex) => {
			if (currentIndex === path.length - 1) {
				delete previousValue[currentValue];
				return true
			}
			return Object(previousValue)[currentValue]
		}, object);
		return result
	}

	static toPath(value) {
		return value.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
	}

	static escape(string) {
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
		};
		return string.replace(/[&<>"']/g, m => map[m])
	};

	static unescape(string) {
		const map = {
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&quot;': '"',
			'&#39;': "'",
		};
		return string.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => map[m])
	}

}

/* https://developer.mozilla.org/zh-CN/docs/Web/API/Storage/setItem */
class $Storage {
	static name = "$Storage";
	static version = "1.0.9";
	static about() { return console.log(`\n🟧 ${this.name} v${this.version}\n`) };
	static data = null
	static dataFile = 'box.dat'
	static #nameRegex = /^@(?<key>[^.]+)(?:\.(?<path>.*))?$/;

	static #platform() {
		if ('undefined' !== typeof $environment && $environment['surge-version'])
			return 'Surge'
		if ('undefined' !== typeof $environment && $environment['stash-version'])
			return 'Stash'
		if ('undefined' !== typeof module && !!module.exports) return 'Node.js'
		if ('undefined' !== typeof $task) return 'Quantumult X'
		if ('undefined' !== typeof $loon) return 'Loon'
		if ('undefined' !== typeof $rocket) return 'Shadowrocket'
		if ('undefined' !== typeof Egern) return 'Egern'
	}

    static getItem(keyName = new String, defaultValue = null) {
        let keyValue = defaultValue;
        // 如果以 @
		switch (keyName.startsWith('@')) {
			case true:
				const { key, path } = keyName.match(this.#nameRegex)?.groups;
				//console.log(`1: ${key}, ${path}`);
				keyName = key;
				let value = this.getItem(keyName, {});
				//console.log(`2: ${JSON.stringify(value)}`)
				if (typeof value !== "object") value = {};
				//console.log(`3: ${JSON.stringify(value)}`)
				keyValue = Lodash.get(value, path);
				//console.log(`4: ${JSON.stringify(keyValue)}`)
				try {
					keyValue = JSON.parse(keyValue);
				} catch (e) {
					// do nothing
				}				//console.log(`5: ${JSON.stringify(keyValue)}`)
				break;
			default:
				switch (this.#platform()) {
					case 'Surge':
					case 'Loon':
					case 'Stash':
					case 'Egern':
					case 'Shadowrocket':
						keyValue = $persistentStore.read(keyName);
						break;
					case 'Quantumult X':
						keyValue = $prefs.valueForKey(keyName);
						break;
					case 'Node.js':
						this.data = this.#loaddata(this.dataFile);
						keyValue = this.data?.[keyName];
						break;
					default:
						keyValue = this.data?.[keyName] || null;
						break;
				}				try {
					keyValue = JSON.parse(keyValue);
				} catch (e) {
					// do nothing
				}				break;
		}		return keyValue ?? defaultValue;
    };

	static setItem(keyName = new String, keyValue = new String) {
		let result = false;
		//console.log(`0: ${typeof keyValue}`);
		switch (typeof keyValue) {
			case "object":
				keyValue = JSON.stringify(keyValue);
				break;
			default:
				keyValue = String(keyValue);
				break;
		}		switch (keyName.startsWith('@')) {
			case true:
				const { key, path } = keyName.match(this.#nameRegex)?.groups;
				//console.log(`1: ${key}, ${path}`);
				keyName = key;
				let value = this.getItem(keyName, {});
				//console.log(`2: ${JSON.stringify(value)}`)
				if (typeof value !== "object") value = {};
				//console.log(`3: ${JSON.stringify(value)}`)
				Lodash.set(value, path, keyValue);
				//console.log(`4: ${JSON.stringify(value)}`)
				result = this.setItem(keyName, value);
				//console.log(`5: ${result}`)
				break;
			default:
				switch (this.#platform()) {
					case 'Surge':
					case 'Loon':
					case 'Stash':
					case 'Egern':
					case 'Shadowrocket':
						result = $persistentStore.write(keyValue, keyName);
						break;
					case 'Quantumult X':
						result =$prefs.setValueForKey(keyValue, keyName);
						break;
					case 'Node.js':
						this.data = this.#loaddata(this.dataFile);
						this.data[keyName] = keyValue;
						this.#writedata(this.dataFile);
						result = true;
						break;
					default:
						result = this.data?.[keyName] || null;
						break;
				}				break;
		}		return result;
	};

    static removeItem(keyName){
		let result = false;
		switch (keyName.startsWith('@')) {
			case true:
				const { key, path } = keyName.match(this.#nameRegex)?.groups;
				keyName = key;
				let value = this.getItem(keyName);
				if (typeof value !== "object") value = {};
				keyValue = Lodash.unset(value, path);
				result = this.setItem(keyName, value);
				break;
			default:
				switch (this.#platform()) {
					case 'Surge':
					case 'Loon':
					case 'Stash':
					case 'Egern':
					case 'Shadowrocket':
						result = false;
						break;
					case 'Quantumult X':
						result = $prefs.removeValueForKey(keyName);
						break;
					case 'Node.js':
						result = false;
						break;
					default:
						result = false;
						break;
				}				break;
		}		return result;
    }

    static clear() {
		let result = false;
		switch (this.#platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Egern':
			case 'Shadowrocket':
				result = false;
				break;
			case 'Quantumult X':
				result = $prefs.removeAllValues();
				break;
			case 'Node.js':
				result = false;
				break;
			default:
				result = false;
				break;
		}		return result;
    }

	static #loaddata(dataFile) {
		if (this.isNode()) {
			this.fs = this.fs ? this.fs : require('fs');
			this.path = this.path ? this.path : require('path');
			const curDirDataFilePath = this.path.resolve(dataFile);
			const rootDirDataFilePath = this.path.resolve(
				process.cwd(),
				dataFile
			);
			const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
			const isRootDirDataFile =
				!isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
			if (isCurDirDataFile || isRootDirDataFile) {
				const datPath = isCurDirDataFile
					? curDirDataFilePath
					: rootDirDataFilePath;
				try {
					return JSON.parse(this.fs.readFileSync(datPath))
				} catch (e) {
					return {}
				}
			} else return {}
		} else return {}
	}

	static #writedata(dataFile = this.dataFile) {
		if (this.isNode()) {
			this.fs = this.fs ? this.fs : require('fs');
			this.path = this.path ? this.path : require('path');
			const curDirDataFilePath = this.path.resolve(dataFile);
			const rootDirDataFilePath = this.path.resolve(
				process.cwd(),
				dataFile
			);
			const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
			const isRootDirDataFile =
				!isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
			const jsondata = JSON.stringify(this.data);
			if (isCurDirDataFile) {
				this.fs.writeFileSync(curDirDataFilePath, jsondata);
			} else if (isRootDirDataFile) {
				this.fs.writeFileSync(rootDirDataFilePath, jsondata);
			} else {
				this.fs.writeFileSync(curDirDataFilePath, jsondata);
			}
		}
	};

}

class ENV {
	static name = "ENV"
	static version = '1.8.3'
	static about() { return console.log(`\n🟧 ${this.name} v${this.version}\n`) }

	constructor(name, opts) {
		console.log(`\n🟧 ${ENV.name} v${ENV.version}\n`);
		this.name = name;
		this.logs = [];
		this.isMute = false;
		this.isMuteLog = false;
		this.logSeparator = '\n';
		this.encoding = 'utf-8';
		this.startTime = new Date().getTime();
		Object.assign(this, opts);
		this.log(`\n🚩 开始!\n${name}\n`);
	}
	
	environment() {
		switch (this.platform()) {
			case 'Surge':
				$environment.app = 'Surge';
				return $environment
			case 'Stash':
				$environment.app = 'Stash';
				return $environment
			case 'Egern':
				$environment.app = 'Egern';
				return $environment
			case 'Loon':
				let environment = $loon.split(' ');
				return {
					"device": environment[0],
					"ios": environment[1],
					"loon-version": environment[2],
					"app": "Loon"
				};
			case 'Quantumult X':
				return {
					"app": "Quantumult X"
				};
			case 'Node.js':
				process.env.app = 'Node.js';
				return process.env
			default:
				return {}
		}
	}

	platform() {
		if ('undefined' !== typeof $environment && $environment['surge-version'])
			return 'Surge'
		if ('undefined' !== typeof $environment && $environment['stash-version'])
			return 'Stash'
		if ('undefined' !== typeof module && !!module.exports) return 'Node.js'
		if ('undefined' !== typeof $task) return 'Quantumult X'
		if ('undefined' !== typeof $loon) return 'Loon'
		if ('undefined' !== typeof $rocket) return 'Shadowrocket'
		if ('undefined' !== typeof Egern) return 'Egern'
	}

	isNode() {
		return 'Node.js' === this.platform()
	}

	isQuanX() {
		return 'Quantumult X' === this.platform()
	}

	isSurge() {
		return 'Surge' === this.platform()
	}

	isLoon() {
		return 'Loon' === this.platform()
	}

	isShadowrocket() {
		return 'Shadowrocket' === this.platform()
	}

	isStash() {
		return 'Stash' === this.platform()
	}

	isEgern() {
		return 'Egern' === this.platform()
	}

	async getScript(url) {
		return await this.fetch(url).then(response => response.body);
	}

	async runScript(script, runOpts) {
		let httpapi = $Storage.getItem('@chavy_boxjs_userCfgs.httpapi');
		httpapi = httpapi?.replace?.(/\n/g, '')?.trim();
		let httpapi_timeout = $Storage.getItem('@chavy_boxjs_userCfgs.httpapi_timeout');
		httpapi_timeout = (httpapi_timeout * 1) ?? 20;
		httpapi_timeout = runOpts?.timeout ?? httpapi_timeout;
		const [password, address] = httpapi.split('@');
		const request = {
			url: `http://${address}/v1/scripting/evaluate`,
			body: {
				script_text: script,
				mock_type: 'cron',
				timeout: httpapi_timeout
			},
			headers: { 'X-Key': password, 'Accept': '*/*' },
			timeout: httpapi_timeout
		};
		await this.fetch(request).then(response => response.body, error => this.logErr(error));
	}

	initGotEnv(opts) {
		this.got = this.got ? this.got : require('got');
		this.cktough = this.cktough ? this.cktough : require('tough-cookie');
		this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar();
		if (opts) {
			opts.headers = opts.headers ? opts.headers : {};
			if (undefined === opts.headers.Cookie && undefined === opts.cookieJar) {
				opts.cookieJar = this.ckjar;
			}
		}
	}

	async fetch(request = {} || "", option = {}) {
		// 初始化参数
		switch (request.constructor) {
			case Object:
				request = { ...option, ...request };
				break;
			case String:
				request = { ...option, "url": request };
				break;
		}		// 自动判断请求方法
		if (!request.method) {
			request.method = "GET";
			if (request.body ?? request.bodyBytes) request.method = "POST";
		}		// 移除请求头中的部分参数, 让其自动生成
		delete request.headers?.Host;
		delete request.headers?.[":authority"];
		delete request.headers?.['Content-Length'];
		delete request.headers?.['content-length'];
		// 定义请求方法（小写）
		const method = request.method.toLocaleLowerCase();
		// 判断平台
		switch (this.platform()) {
			case 'Loon':
			case 'Surge':
			case 'Stash':
			case 'Egern':
			case 'Shadowrocket':
			default:
				// 转换请求参数
				if (request.timeout) {
					request.timeout = parseInt(request.timeout, 10);
					if (this.isSurge()) ; else request.timeout = request.timeout * 1000;
				}				if (request.policy) {
					if (this.isLoon()) request.node = request.policy;
					if (this.isStash()) Lodash.set(request, "headers.X-Stash-Selected-Proxy", encodeURI(request.policy));
					if (this.isShadowrocket()) Lodash.set(request, "headers.X-Surge-Proxy", request.policy);
				}				if (typeof request.redirection === "boolean") request["auto-redirect"] = request.redirection;
				// 转换请求体
				if (request.bodyBytes && !request.body) {
					request.body = request.bodyBytes;
					delete request.bodyBytes;
				}				// 发送请求
				return await new Promise((resolve, reject) => {
					$httpClient[method](request, (error, response, body) => {
						if (error) reject(error);
						else {
							response.ok = /^2\d\d$/.test(response.status);
							response.statusCode = response.status;
							if (body) {
								response.body = body;
								if (request["binary-mode"] == true) response.bodyBytes = body;
							}							resolve(response);
						}
					});
				});
			case 'Quantumult X':
				// 转换请求参数
				if (request.policy) Lodash.set(request, "opts.policy", request.policy);
				if (typeof request["auto-redirect"] === "boolean") Lodash.set(request, "opts.redirection", request["auto-redirect"]);
				// 转换请求体
				if (request.body instanceof ArrayBuffer) {
					request.bodyBytes = request.body;
					delete request.body;
				} else if (ArrayBuffer.isView(request.body)) {
					request.bodyBytes = request.body.buffer.slice(request.body.byteOffset, request.body.byteLength + request.body.byteOffset);
					delete object.body;
				} else if (request.body) delete request.bodyBytes;
				// 发送请求
				return await $task.fetch(request).then(
					response => {
						response.ok = /^2\d\d$/.test(response.statusCode);
						response.status = response.statusCode;
						return response;
					},
					reason => Promise.reject(reason.error));
			case 'Node.js':
				let iconv = require('iconv-lite');
				this.initGotEnv(request);
				const { url, ...option } = request;
				return await this.got[method](url, option)
					.on('redirect', (response, nextOpts) => {
						try {
							if (response.headers['set-cookie']) {
								const ck = response.headers['set-cookie']
									.map(this.cktough.Cookie.parse)
									.toString();
								if (ck) {
									this.ckjar.setCookieSync(ck, null);
								}
								nextOpts.cookieJar = this.ckjar;
							}
						} catch (e) {
							this.logErr(e);
						}
						// this.ckjar.setCookieSync(response.headers['set-cookie'].map(Cookie.parse).toString())
					})
					.then(
						response => {
							response.statusCode = response.status;
							response.body = iconv.decode(response.rawBody, this.encoding);
							response.bodyBytes = response.rawBody;
							return response;
						},
						error => Promise.reject(error.message));
		}	};

	/**
	 *
	 * 示例:$.time('yyyy-MM-dd qq HH:mm:ss.S')
	 *    :$.time('yyyyMMddHHmmssS')
	 *    y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
	 *    其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
	 * @param {string} format 格式化参数
	 * @param {number} ts 可选: 根据指定时间戳返回格式化日期
	 *
	 */
	time(format, ts = null) {
		const date = ts ? new Date(ts) : new Date();
		let o = {
			'M+': date.getMonth() + 1,
			'd+': date.getDate(),
			'H+': date.getHours(),
			'm+': date.getMinutes(),
			's+': date.getSeconds(),
			'q+': Math.floor((date.getMonth() + 3) / 3),
			'S': date.getMilliseconds()
		};
		if (/(y+)/.test(format))
			format = format.replace(
				RegExp.$1,
				(date.getFullYear() + '').substr(4 - RegExp.$1.length)
			);
		for (let k in o)
			if (new RegExp('(' + k + ')').test(format))
				format = format.replace(
					RegExp.$1,
					RegExp.$1.length == 1
						? o[k]
						: ('00' + o[k]).substr(('' + o[k]).length)
				);
		return format
	}

	/**
	 * 系统通知
	 *
	 * > 通知参数: 同时支持 QuanX 和 Loon 两种格式, EnvJs根据运行环境自动转换, Surge 环境不支持多媒体通知
	 *
	 * 示例:
	 * $.msg(title, subt, desc, 'twitter://')
	 * $.msg(title, subt, desc, { 'open-url': 'twitter://', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
	 * $.msg(title, subt, desc, { 'open-url': 'https://bing.com', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
	 *
	 * @param {*} title 标题
	 * @param {*} subt 副标题
	 * @param {*} desc 通知详情
	 * @param {*} opts 通知参数
	 *
	 */
	msg(title = name, subt = '', desc = '', opts) {
		const toEnvOpts = (rawopts) => {
			switch (typeof rawopts) {
				case undefined:
					return rawopts
				case 'string':
					switch (this.platform()) {
						case 'Surge':
						case 'Stash':
						case 'Egern':
						default:
							return { url: rawopts }
						case 'Loon':
						case 'Shadowrocket':
							return rawopts
						case 'Quantumult X':
							return { 'open-url': rawopts }
						case 'Node.js':
							return undefined
					}
				case 'object':
					switch (this.platform()) {
						case 'Surge':
						case 'Stash':
						case 'Egern':
						case 'Shadowrocket':
						default: {
							let openUrl =
								rawopts.url || rawopts.openUrl || rawopts['open-url'];
							return { url: openUrl }
						}
						case 'Loon': {
							let openUrl =
								rawopts.openUrl || rawopts.url || rawopts['open-url'];
							let mediaUrl = rawopts.mediaUrl || rawopts['media-url'];
							return { openUrl, mediaUrl }
						}
						case 'Quantumult X': {
							let openUrl =
								rawopts['open-url'] || rawopts.url || rawopts.openUrl;
							let mediaUrl = rawopts['media-url'] || rawopts.mediaUrl;
							let updatePasteboard =
								rawopts['update-pasteboard'] || rawopts.updatePasteboard;
							return {
								'open-url': openUrl,
								'media-url': mediaUrl,
								'update-pasteboard': updatePasteboard
							}
						}
						case 'Node.js':
							return undefined
					}
				default:
					return undefined
			}
		};
		if (!this.isMute) {
			switch (this.platform()) {
				case 'Surge':
				case 'Loon':
				case 'Stash':
				case 'Egern':
				case 'Shadowrocket':
				default:
					$notification.post(title, subt, desc, toEnvOpts(opts));
					break
				case 'Quantumult X':
					$notify(title, subt, desc, toEnvOpts(opts));
					break
				case 'Node.js':
					break
			}
		}
		if (!this.isMuteLog) {
			let logs = ['', '==============📣系统通知📣=============='];
			logs.push(title);
			subt ? logs.push(subt) : '';
			desc ? logs.push(desc) : '';
			console.log(logs.join('\n'));
			this.logs = this.logs.concat(logs);
		}
	}

	log(...logs) {
		if (logs.length > 0) {
			this.logs = [...this.logs, ...logs];
		}
		console.log(logs.join(this.logSeparator));
	}

	logErr(error) {
		switch (this.platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Egern':
			case 'Shadowrocket':
			case 'Quantumult X':
			default:
				this.log('', `❗️ ${this.name}, 错误!`, error);
				break
			case 'Node.js':
				this.log('', `❗️${this.name}, 错误!`, error.stack);
				break
		}
	}

	wait(time) {
		return new Promise((resolve) => setTimeout(resolve, time))
	}

	done(object = {}) {
		const endTime = new Date().getTime();
		const costTime = (endTime - this.startTime) / 1000;
		this.log("", `🚩 ${this.name}, 结束! 🕛 ${costTime} 秒`, "");
		switch (this.platform()) {
			case 'Surge':
				if (object.policy) Lodash.set(object, "headers.X-Surge-Policy", object.policy);
				$done(object);
				break;
			case 'Loon':
				if (object.policy) object.node = object.policy;
				$done(object);
				break;
			case 'Stash':
				if (object.policy) Lodash.set(object, "headers.X-Stash-Selected-Proxy", encodeURI(object.policy));
				$done(object);
				break;
			case 'Egern':
				$done(object);
				break;
			case 'Shadowrocket':
			default:
				$done(object);
				break;
			case 'Quantumult X':
				if (object.policy) Lodash.set(object, "opts.policy", object.policy);
				// 移除不可写字段
				delete object["auto-redirect"];
				delete object["auto-cookie"];
				delete object["binary-mode"];
				delete object.charset;
				delete object.host;
				delete object.insecure;
				delete object.method; // 1.4.x 不可写
				delete object.opt; // $task.fetch() 参数, 不可写
				delete object.path; // 可写, 但会与 url 冲突
				delete object.policy;
				delete object["policy-descriptor"];
				delete object.scheme;
				delete object.sessionIndex;
				delete object.statusCode;
				delete object.timeout;
				if (object.body instanceof ArrayBuffer) {
					object.bodyBytes = object.body;
					delete object.body;
				} else if (ArrayBuffer.isView(object.body)) {
					object.bodyBytes = object.body.buffer.slice(object.body.byteOffset, object.body.byteLength + object.body.byteOffset);
					delete object.body;
				} else if (object.body) delete object.bodyBytes;
				$done(object);
				break;
			case 'Node.js':
				process.exit(1);
				break;
		}
	}
}

var Settings$7 = {
	Switch: true
};
var Configs$3 = {
	Storefront: [
		[
			"AE",
			"143481"
		],
		[
			"AF",
			"143610"
		],
		[
			"AG",
			"143540"
		],
		[
			"AI",
			"143538"
		],
		[
			"AL",
			"143575"
		],
		[
			"AM",
			"143524"
		],
		[
			"AO",
			"143564"
		],
		[
			"AR",
			"143505"
		],
		[
			"AT",
			"143445"
		],
		[
			"AU",
			"143460"
		],
		[
			"AZ",
			"143568"
		],
		[
			"BA",
			"143612"
		],
		[
			"BB",
			"143541"
		],
		[
			"BD",
			"143490"
		],
		[
			"BE",
			"143446"
		],
		[
			"BF",
			"143578"
		],
		[
			"BG",
			"143526"
		],
		[
			"BH",
			"143559"
		],
		[
			"BJ",
			"143576"
		],
		[
			"BM",
			"143542"
		],
		[
			"BN",
			"143560"
		],
		[
			"BO",
			"143556"
		],
		[
			"BR",
			"143503"
		],
		[
			"BS",
			"143539"
		],
		[
			"BT",
			"143577"
		],
		[
			"BW",
			"143525"
		],
		[
			"BY",
			"143565"
		],
		[
			"BZ",
			"143555"
		],
		[
			"CA",
			"143455"
		],
		[
			"CD",
			"143613"
		],
		[
			"CG",
			"143582"
		],
		[
			"CH",
			"143459"
		],
		[
			"CI",
			"143527"
		],
		[
			"CL",
			"143483"
		],
		[
			"CM",
			"143574"
		],
		[
			"CN",
			"143465"
		],
		[
			"CO",
			"143501"
		],
		[
			"CR",
			"143495"
		],
		[
			"CV",
			"143580"
		],
		[
			"CY",
			"143557"
		],
		[
			"CZ",
			"143489"
		],
		[
			"DE",
			"143443"
		],
		[
			"DK",
			"143458"
		],
		[
			"DM",
			"143545"
		],
		[
			"DO",
			"143508"
		],
		[
			"DZ",
			"143563"
		],
		[
			"EC",
			"143509"
		],
		[
			"EE",
			"143518"
		],
		[
			"EG",
			"143516"
		],
		[
			"ES",
			"143454"
		],
		[
			"FI",
			"143447"
		],
		[
			"FJ",
			"143583"
		],
		[
			"FM",
			"143591"
		],
		[
			"FR",
			"143442"
		],
		[
			"GA",
			"143614"
		],
		[
			"GB",
			"143444"
		],
		[
			"GD",
			"143546"
		],
		[
			"GF",
			"143615"
		],
		[
			"GH",
			"143573"
		],
		[
			"GM",
			"143584"
		],
		[
			"GR",
			"143448"
		],
		[
			"GT",
			"143504"
		],
		[
			"GW",
			"143585"
		],
		[
			"GY",
			"143553"
		],
		[
			"HK",
			"143463"
		],
		[
			"HN",
			"143510"
		],
		[
			"HR",
			"143494"
		],
		[
			"HU",
			"143482"
		],
		[
			"ID",
			"143476"
		],
		[
			"IE",
			"143449"
		],
		[
			"IL",
			"143491"
		],
		[
			"IN",
			"143467"
		],
		[
			"IQ",
			"143617"
		],
		[
			"IS",
			"143558"
		],
		[
			"IT",
			"143450"
		],
		[
			"JM",
			"143511"
		],
		[
			"JO",
			"143528"
		],
		[
			"JP",
			"143462"
		],
		[
			"KE",
			"143529"
		],
		[
			"KG",
			"143586"
		],
		[
			"KH",
			"143579"
		],
		[
			"KN",
			"143548"
		],
		[
			"KP",
			"143466"
		],
		[
			"KR",
			"143466"
		],
		[
			"KW",
			"143493"
		],
		[
			"KY",
			"143544"
		],
		[
			"KZ",
			"143517"
		],
		[
			"TC",
			"143552"
		],
		[
			"TD",
			"143581"
		],
		[
			"TJ",
			"143603"
		],
		[
			"TH",
			"143475"
		],
		[
			"TM",
			"143604"
		],
		[
			"TN",
			"143536"
		],
		[
			"TO",
			"143608"
		],
		[
			"TR",
			"143480"
		],
		[
			"TT",
			"143551"
		],
		[
			"TW",
			"143470"
		],
		[
			"TZ",
			"143572"
		],
		[
			"LA",
			"143587"
		],
		[
			"LB",
			"143497"
		],
		[
			"LC",
			"143549"
		],
		[
			"LI",
			"143522"
		],
		[
			"LK",
			"143486"
		],
		[
			"LR",
			"143588"
		],
		[
			"LT",
			"143520"
		],
		[
			"LU",
			"143451"
		],
		[
			"LV",
			"143519"
		],
		[
			"LY",
			"143567"
		],
		[
			"MA",
			"143620"
		],
		[
			"MD",
			"143523"
		],
		[
			"ME",
			"143619"
		],
		[
			"MG",
			"143531"
		],
		[
			"MK",
			"143530"
		],
		[
			"ML",
			"143532"
		],
		[
			"MM",
			"143570"
		],
		[
			"MN",
			"143592"
		],
		[
			"MO",
			"143515"
		],
		[
			"MR",
			"143590"
		],
		[
			"MS",
			"143547"
		],
		[
			"MT",
			"143521"
		],
		[
			"MU",
			"143533"
		],
		[
			"MV",
			"143488"
		],
		[
			"MW",
			"143589"
		],
		[
			"MX",
			"143468"
		],
		[
			"MY",
			"143473"
		],
		[
			"MZ",
			"143593"
		],
		[
			"NA",
			"143594"
		],
		[
			"NE",
			"143534"
		],
		[
			"NG",
			"143561"
		],
		[
			"NI",
			"143512"
		],
		[
			"NL",
			"143452"
		],
		[
			"NO",
			"143457"
		],
		[
			"NP",
			"143484"
		],
		[
			"NR",
			"143606"
		],
		[
			"NZ",
			"143461"
		],
		[
			"OM",
			"143562"
		],
		[
			"PA",
			"143485"
		],
		[
			"PE",
			"143507"
		],
		[
			"PG",
			"143597"
		],
		[
			"PH",
			"143474"
		],
		[
			"PK",
			"143477"
		],
		[
			"PL",
			"143478"
		],
		[
			"PT",
			"143453"
		],
		[
			"PW",
			"143595"
		],
		[
			"PY",
			"143513"
		],
		[
			"QA",
			"143498"
		],
		[
			"RO",
			"143487"
		],
		[
			"RS",
			"143500"
		],
		[
			"RU",
			"143469"
		],
		[
			"RW",
			"143621"
		],
		[
			"SA",
			"143479"
		],
		[
			"SB",
			"143601"
		],
		[
			"SC",
			"143599"
		],
		[
			"SE",
			"143456"
		],
		[
			"SG",
			"143464"
		],
		[
			"SI",
			"143499"
		],
		[
			"SK",
			"143496"
		],
		[
			"SL",
			"143600"
		],
		[
			"SN",
			"143535"
		],
		[
			"SR",
			"143554"
		],
		[
			"ST",
			"143598"
		],
		[
			"SV",
			"143506"
		],
		[
			"SZ",
			"143602"
		],
		[
			"UA",
			"143492"
		],
		[
			"UG",
			"143537"
		],
		[
			"US",
			"143441"
		],
		[
			"UY",
			"143514"
		],
		[
			"UZ",
			"143566"
		],
		[
			"VC",
			"143550"
		],
		[
			"VE",
			"143502"
		],
		[
			"VG",
			"143543"
		],
		[
			"VN",
			"143471"
		],
		[
			"VU",
			"143609"
		],
		[
			"XK",
			"143624"
		],
		[
			"YE",
			"143571"
		],
		[
			"ZA",
			"143472"
		],
		[
			"ZM",
			"143622"
		],
		[
			"ZW",
			"143605"
		]
	]
};
var Default = {
	Settings: Settings$7,
	Configs: Configs$3
};

var Default$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Configs: Configs$3,
	Settings: Settings$7,
	default: Default
});

var Settings$6 = {
	Switch: true,
	PEP: {
		GCC: "US"
	}
};
var Location = {
	Settings: Settings$6
};

var Location$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Settings: Settings$6,
	default: Location
});

var Settings$5 = {
	Switch: true,
	UrlInfoSet: {
		Dispatcher: "AutoNavi",
		Directions: "AutoNavi",
		RAP: "Apple",
		LocationShift: "AUTO"
	},
	TileSet: {
		"Map": "CN",
		Satellite: "HYBRID",
		Traffic: "CN",
		POI: "CN",
		Flyover: "XX",
		Munin: "XX"
	},
	GeoManifest: {
		Dynamic: {
			Config: {
				CountryCode: {
					"default": "CN",
					iOS: "AUTO",
					iPadOS: "AUTO",
					watchOS: "US",
					macOS: "AUTO"
				}
			}
		}
	},
	Config: {
		Announcements: {
			"Environment:": {
				"default": "AUTO",
				iOS: "AUTO",
				iPadOS: "AUTO",
				watchOS: "AUTO",
				macOS: "AUTO"
			}
		}
	}
};
var Configs$2 = {
	CN: {
		attribution: [
			{
				region: [
				],
				name: "AutoNavi",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-cn2-66.html",
				resource: [
					{
						region: [
						],
						filter: [
						],
						checksum: {
							"0": 61,
							"1": 130,
							"2": 126,
							"3": 203,
							"4": 170,
							"5": 234,
							"6": 91,
							"7": 182,
							"8": 191,
							"9": 120,
							"10": 72,
							"11": 19,
							"12": 46,
							"13": 58,
							"14": 235,
							"15": 55,
							"16": 221,
							"17": 53,
							"18": 252,
							"19": 219
						},
						updateMethod: 0,
						validationMethod: 0,
						filename: "autonavi-4.png",
						resourceType: 6
					},
					{
						region: [
						],
						filter: [
						],
						checksum: {
							"0": 101,
							"1": 191,
							"2": 219,
							"3": 234,
							"4": 178,
							"5": 237,
							"6": 6,
							"7": 231,
							"8": 236,
							"9": 110,
							"10": 3,
							"11": 82,
							"12": 194,
							"13": 129,
							"14": 29,
							"15": 221,
							"16": 225,
							"17": 55,
							"18": 26,
							"19": 203
						},
						updateMethod: 0,
						validationMethod: 0,
						filename: "autonavi-4@2x.png",
						resourceType: 6
					},
					{
						region: [
						],
						filter: [
						],
						checksum: {
							"0": 101,
							"1": 191,
							"2": 219,
							"3": 234,
							"4": 178,
							"5": 237,
							"6": 6,
							"7": 231,
							"8": 236,
							"9": 110,
							"10": 3,
							"11": 82,
							"12": 194,
							"13": 129,
							"14": 29,
							"15": 221,
							"16": 225,
							"17": 55,
							"18": 26,
							"19": 203
						},
						updateMethod: 0,
						validationMethod: 0,
						filename: "autonavi-4@2x.png",
						resourceType: 6
					},
					{
						region: [
						],
						filter: [
						],
						checksum: {
							"0": 247,
							"1": 152,
							"2": 81,
							"3": 90,
							"4": 135,
							"5": 206,
							"6": 171,
							"7": 138,
							"8": 151,
							"9": 37,
							"10": 167,
							"11": 77,
							"12": 112,
							"13": 223,
							"14": 89,
							"15": 164,
							"16": 242,
							"17": 201,
							"18": 164,
							"19": 74
						},
						updateMethod: 0,
						validationMethod: 0,
						filename: "autonavi-logo-mask-1.png",
						resourceType: 5
					},
					{
						region: [
						],
						filter: [
						],
						checksum: {
							"0": 54,
							"1": 203,
							"2": 95,
							"3": 5,
							"4": 82,
							"5": 108,
							"6": 189,
							"7": 170,
							"8": 124,
							"9": 255,
							"10": 39,
							"11": 153,
							"12": 245,
							"13": 47,
							"14": 224,
							"15": 93,
							"16": 202,
							"17": 181,
							"18": 11,
							"19": 127
						},
						updateMethod: 0,
						validationMethod: 0,
						filename: "autonavi-logo-mask-1@2x.png",
						resourceType: 5
					},
					{
						region: [
						],
						filter: [
						],
						checksum: {
							"0": 131,
							"1": 225,
							"2": 158,
							"3": 241,
							"4": 69,
							"5": 218,
							"6": 172,
							"7": 162,
							"8": 166,
							"9": 241,
							"10": 48,
							"11": 174,
							"12": 31,
							"13": 104,
							"14": 225,
							"15": 155,
							"16": 97,
							"17": 143,
							"18": 15,
							"19": 99
						},
						updateMethod: 0,
						validationMethod: 0,
						filename: "autonavi-logo-mask-1@3x.png",
						resourceType: 5
					}
				]
			},
			{
				region: [
					{
						maxX: 225,
						minZ: 8,
						minX: 218,
						maxY: 104,
						minY: 102,
						maxZ: 21
					},
					{
						maxX: 228,
						minZ: 8,
						minX: 221,
						maxY: 101,
						minY: 98,
						maxZ: 21
					},
					{
						maxX: 231,
						minZ: 8,
						minX: 226,
						maxY: 97,
						minY: 91,
						maxZ: 21
					}
				],
				name: "© GeoTechnologies, Inc.",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-cn2-66.html",
				resource: [
				]
			}
		],
		releaseInfo: "PROD-CN (24.20)",
		tileSet: [
			{
				scale: 0,
				style: 1,
				checksumType: 0,
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: "IN"
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					}
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles?flags=8",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							}
						],
						identifier: 2197,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 1,
				style: 7,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 1,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-2-cn-ssl.ls.apple.com/2/tiles",
				validVersion: [
					{
						genericTile: [
							{
								resourceIndex: 1971,
								textureIndex: 0,
								tileType: 2
							}
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 224,
								minZ: 8,
								minX: 179,
								maxY: 128,
								minY: 80,
								maxZ: 8
							},
							{
								maxX: 449,
								minZ: 9,
								minX: 359,
								maxY: 257,
								minY: 161,
								maxZ: 9
							},
							{
								maxX: 898,
								minZ: 10,
								minX: 719,
								maxY: 915,
								minY: 323,
								maxZ: 10
							},
							{
								maxX: 1797,
								minZ: 11,
								minX: 1438,
								maxY: 1031,
								minY: 646,
								maxZ: 11
							},
							{
								maxX: 3594,
								minZ: 12,
								minX: 2876,
								maxY: 2062,
								minY: 1292,
								maxZ: 12
							},
							{
								maxX: 7188,
								minZ: 13,
								minX: 5752,
								maxY: 4124,
								minY: 2584,
								maxZ: 13
							},
							{
								maxX: 14376,
								minZ: 14,
								minX: 11504,
								maxY: 8248,
								minY: 5168,
								maxZ: 14
							},
							{
								maxX: 28752,
								minZ: 15,
								minX: 23008,
								maxY: 16496,
								minY: 10336,
								maxZ: 15
							},
							{
								maxX: 57504,
								minZ: 16,
								minX: 46016,
								maxY: 32992,
								minY: 20672,
								maxZ: 16
							},
							{
								maxX: 115008,
								minZ: 17,
								minX: 92032,
								maxY: 65984,
								minY: 41344,
								maxZ: 17
							},
							{
								maxX: 230016,
								minZ: 18,
								minX: 184064,
								maxY: 131976,
								minY: 82668,
								maxZ: 18
							}
						],
						identifier: 52
					}
				]
			},
			{
				scale: 2,
				style: 7,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 1,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-2-cn-ssl.ls.apple.com/2/tiles",
				validVersion: [
					{
						genericTile: [
							{
								resourceIndex: 1971,
								textureIndex: 0,
								tileType: 2
							}
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 224,
								minZ: 8,
								minX: 179,
								maxY: 128,
								minY: 80,
								maxZ: 8
							},
							{
								maxX: 449,
								minZ: 9,
								minX: 359,
								maxY: 257,
								minY: 161,
								maxZ: 9
							},
							{
								maxX: 898,
								minZ: 10,
								minX: 719,
								maxY: 915,
								minY: 323,
								maxZ: 10
							},
							{
								maxX: 1797,
								minZ: 11,
								minX: 1438,
								maxY: 1031,
								minY: 646,
								maxZ: 11
							},
							{
								maxX: 3594,
								minZ: 12,
								minX: 2876,
								maxY: 2062,
								minY: 1292,
								maxZ: 12
							},
							{
								maxX: 7188,
								minZ: 13,
								minX: 5752,
								maxY: 4124,
								minY: 2584,
								maxZ: 13
							},
							{
								maxX: 14376,
								minZ: 14,
								minX: 11504,
								maxY: 8248,
								minY: 5168,
								maxZ: 14
							},
							{
								maxX: 28752,
								minZ: 15,
								minX: 23008,
								maxY: 16496,
								minY: 10336,
								maxZ: 15
							},
							{
								maxX: 57504,
								minZ: 16,
								minX: 46016,
								maxY: 32992,
								minY: 20672,
								maxZ: 16
							},
							{
								maxX: 115008,
								minZ: 17,
								minX: 92032,
								maxY: 65984,
								minY: 41344,
								maxZ: 17
							},
							{
								maxX: 230016,
								minZ: 18,
								minX: 184064,
								maxY: 131976,
								minY: 82668,
								maxZ: 18
							}
						],
						identifier: 52
					}
				]
			},
			{
				scale: 0,
				style: 11,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles?flags=1",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 476
					}
				]
			},
			{
				scale: 0,
				style: 12,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe12-cn-ssl.ls.apple.com/traffic",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 2196,
						timeToLiveSeconds: 120,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 13,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles?flags=2",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 2176,
						timeToLiveSeconds: 604800,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 18,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 2197,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 20,
				checksumType: 0,
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: "IN"
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					}
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 2197,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 22,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 2197
					}
				]
			},
			{
				scale: 0,
				style: 30,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 262143,
								minZ: 18,
								minX: 0,
								maxY: 262143,
								minY: 0,
								maxZ: 18
							}
						],
						identifier: 152,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 37,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles?flags=2",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 1983,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 47,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 1983,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 48,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 1983
					}
				]
			},
			{
				scale: 0,
				style: 53,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 2197,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 54,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 2197
					}
				]
			},
			{
				scale: 0,
				style: 56,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 57,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gsp76-cn-ssl.ls.apple.com/api/tile",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 0,
						timeToLiveSeconds: 3600,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 58,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 149
					}
				]
			},
			{
				scale: 0,
				style: 59,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/asset/v3/model",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							}
						],
						identifier: 86
					}
				]
			},
			{
				scale: 0,
				style: 60,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/asset/v3/material",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							}
						],
						identifier: 30
					}
				]
			},
			{
				scale: 0,
				style: 61,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							}
						],
						identifier: 30
					}
				]
			},
			{
				scale: 0,
				style: 64,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 65,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe79-cn-ssl.ls.apple.com/65/v1",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							}
						],
						identifier: 2,
						timeToLiveSeconds: 3600,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 66,
				checksumType: 0,
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: "IN"
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					}
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 2197,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 67,
				checksumType: 0,
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: "IN"
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					}
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							}
						],
						identifier: 2197,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 68,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 2176,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 69,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 21
					}
				]
			},
			{
				scale: 0,
				style: 72,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							}
						],
						identifier: 2,
						timeToLiveSeconds: 3600,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 73,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 476
					}
				]
			},
			{
				scale: 0,
				style: 76,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe79-cn-ssl.ls.apple.com/sis/v1",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 524287,
								minZ: 19,
								minX: 0,
								maxY: 524287,
								minY: 0,
								maxZ: 19
							}
						],
						identifier: 0,
						timeToLiveSeconds: 86400,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 79,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							}
						],
						identifier: 29
					}
				]
			},
			{
				scale: 0,
				style: 83,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-cn-ssl.ls.apple.com/tiles",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							}
						],
						identifier: 3
					}
				]
			},
			{
				scale: 0,
				style: 84,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe19-2-cn-ssl.ls.apple.com/poi_update",
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 2176,
						timeToLiveSeconds: 1800,
						genericTile: [
						]
					}
				]
			}
		],
		urlInfoSet: [
			{
				backgroundRevGeoURL: {
					url: "https://dispatcher.is.autonavi.com/dispatcher",
					supportsMultipathTCP: false
				},
				searchAttributionManifestURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/search-attribution-1323",
					supportsMultipathTCP: false
				},
				analyticsSessionlessURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				poiBusynessActivityCollectionURL: {
					url: "https://gsp53-ssl.ls.apple.com/hvr/rt_poi_activity",
					supportsMultipathTCP: false
				},
				offlineDataDownloadBaseURL: {
					url: "https://gspe121-cn-ssl.ls.apple.com",
					supportsMultipathTCP: false
				},
				wifiConnectionQualityProbeURL: {
					url: "https://gsp10-ssl-cn.ls.apple.com/hvr/wcq",
					supportsMultipathTCP: false
				},
				junctionImageServiceURL: {
					url: "https://direction2.is.autonavi.com/direction",
					supportsMultipathTCP: false
				},
				etaURL: {
					url: "https://direction2.is.autonavi.com/direction",
					supportsMultipathTCP: false
				},
				analyticsCohortSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				resourcesURL: {
					url: "https://gspe21-ssl.ls.apple.com/",
					supportsMultipathTCP: false
				},
				feedbackLookupURL: {
					url: "https://rap.is.autonavi.com/lookup",
					supportsMultipathTCP: false
				},
				batchTrafficProbeURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/v2/loc",
					supportsMultipathTCP: false
				},
				batchReverseGeocoderURL: {
					url: "https://batch-rgeo.is.autonavi.com/batchRGeo",
					supportsMultipathTCP: false
				},
				spatialLookupURL: {
					url: "https://spatialsearch.is.autonavi.com/spatialsearch",
					supportsMultipathTCP: false
				},
				realtimeTrafficProbeURL: {
					url: "https://gsp9-ssl.apple.com/hvr/v2/rtloc",
					supportsMultipathTCP: false
				},
				wifiQualityTileURL: {
					url: "https://gspe85-cn-ssl.ls.apple.com/wifi_request_tile",
					supportsMultipathTCP: false
				},
				problemSubmissionURL: {
					url: "https://rap.is.autonavi.com/rap",
					supportsMultipathTCP: false
				},
				reverseGeocoderVersionsURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/revgeo-version-11.plist",
					supportsMultipathTCP: false
				},
				problemCategoriesURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/com.apple.GEO.BusinessLocalizedCategories-482.plist",
					supportsMultipathTCP: false
				},
				batchReverseGeocoderPlaceRequestURL: {
					url: "https://dispatcher.is.autonavi.com/dispatcher",
					supportsMultipathTCP: false
				},
				wifiQualityURL: {
					url: "https://gsp85-cn-ssl.ls.apple.com/wifi_request",
					supportsMultipathTCP: false
				},
				polyLocationShiftURL: {
					url: "https://shift.is.autonavi.com/localshift",
					supportsMultipathTCP: false
				},
				problemStatusURL: {
					url: "https://rap.is.autonavi.com/rapstatus",
					supportsMultipathTCP: false
				},
				feedbackSubmissionURL: {
					url: "https://rap.is.autonavi.com/rap",
					supportsMultipathTCP: false
				},
				offlineDataBatchListURL: {
					url: "https://ods.is.autonavi.com/api/batchesForRegion",
					supportsMultipathTCP: false
				},
				offlineDataSizeURL: {
					url: "https://ods.is.autonavi.com/api/sizeForRegion",
					supportsMultipathTCP: false
				},
				analyticsShortSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				alternateResourcesURL: [
					{
						url: "https://cdn.apple-mapkit.com/rap",
						supportsMultipathTCP: false
					},
					{
						url: "https://limit-rule.is.autonavi.com/lpr/rules/download",
						supportsMultipathTCP: false
					}
				],
				abExperimentURL: {
					url: "https://gsp-ssl.ls.apple.com/cn/ab.arpc",
					supportsMultipathTCP: false
				},
				logMessageUsageURL: {
					url: "https://gsp64-ssl.ls.apple.com/a/v2/use",
					supportsMultipathTCP: false
				},
				rapWebBundleURL: {
					url: "https://cdn.apple-mapkit.com/rap",
					supportsMultipathTCP: false
				},
				dispatcherURL: {
					url: "https://dispatcher.is.autonavi.com/dispatcher",
					supportsMultipathTCP: false
				},
				simpleETAURL: {
					url: "https://direction2.is.autonavi.com/direction",
					supportsMultipathTCP: false
				},
				analyticsLongSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				backgroundDispatcherURL: {
					url: "https://dispatcher.is.autonavi.com/dispatcher",
					supportsMultipathTCP: false
				},
				webModuleBaseURL: {
					url: "https://placecard-server-wm.is.autonavi.com",
					supportsMultipathTCP: false
				},
				directionsURL: {
					url: "https://direction2.is.autonavi.com/direction",
					supportsMultipathTCP: false
				},
				logMessageUsageV3URL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				announcementsURL: {
					url: "https://gspe35-ssl.ls.apple.com/config/announcements?environment=prod-cn",
					supportsMultipathTCP: false
				}
			}
		],
		muninBucket: [
			{
				bucketID: 2,
				bucketURL: "https://gspe72-cn-ssl.ls.apple.com/mnn_us"
			},
			{
				bucketID: 6,
				bucketURL: "https://gspe72-cn-ssl.ls.apple.com/mnn_us"
			}
		]
	},
	XX: {
		attribution: [
			{
				region: [
				],
				name: "‎",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-279.html",
				resource: [
				],
				linkDisplayStringIndex: 0,
				plainTextURL: "https://gspe21-ssl.ls.apple.com/html/attribution-278.txt",
				plainTextURLSHA256Checksum: {
					"0": 124,
					"1": 102,
					"2": 134,
					"3": 184,
					"4": 40,
					"5": 189,
					"6": 231,
					"7": 39,
					"8": 109,
					"9": 244,
					"10": 228,
					"11": 192,
					"12": 151,
					"13": 223,
					"14": 17,
					"15": 129,
					"16": 158,
					"17": 253,
					"18": 70,
					"19": 5,
					"20": 123,
					"21": 187,
					"22": 50,
					"23": 87,
					"24": 25,
					"25": 122,
					"26": 38,
					"27": 36,
					"28": 33,
					"29": 149,
					"30": 18,
					"31": 234
				}
			},
			{
				region: [
					{
						maxX: 183,
						minZ: 8,
						minX: 176,
						maxY: 122,
						minY: 110,
						maxZ: 21
					},
					{
						maxX: 188,
						minZ: 8,
						minX: 178,
						maxY: 107,
						minY: 107,
						maxZ: 21
					},
					{
						maxX: 183,
						minZ: 8,
						minX: 178,
						maxY: 109,
						minY: 108,
						maxZ: 21
					},
					{
						maxX: 180,
						minZ: 8,
						minX: 180,
						maxY: 106,
						minY: 105,
						maxZ: 21
					},
					{
						maxX: 183,
						minZ: 8,
						minX: 181,
						maxY: 106,
						minY: 104,
						maxZ: 21
					},
					{
						maxX: 182,
						minZ: 8,
						minX: 182,
						maxY: 103,
						minY: 103,
						maxZ: 21
					},
					{
						maxX: 184,
						minZ: 8,
						minX: 184,
						maxY: 106,
						minY: 104,
						maxZ: 21
					},
					{
						maxX: 195,
						minZ: 8,
						minX: 184,
						maxY: 110,
						minY: 108,
						maxZ: 21
					},
					{
						maxX: 194,
						minZ: 8,
						minX: 184,
						maxY: 111,
						minY: 111,
						maxZ: 21
					},
					{
						maxX: 191,
						minZ: 8,
						minX: 184,
						maxY: 120,
						minY: 112,
						maxZ: 21
					},
					{
						maxX: 184,
						minZ: 8,
						minX: 184,
						maxY: 121,
						minY: 121,
						maxZ: 21
					},
					{
						maxX: 185,
						minZ: 8,
						minX: 185,
						maxY: 106,
						minY: 105,
						maxZ: 21
					},
					{
						maxX: 190,
						minZ: 8,
						minX: 190,
						maxY: 107,
						minY: 107,
						maxZ: 21
					},
					{
						maxX: 194,
						minZ: 8,
						minX: 193,
						maxY: 123,
						minY: 118,
						maxZ: 21
					},
					{
						maxX: 195,
						minZ: 8,
						minX: 195,
						maxY: 118,
						minY: 118,
						maxZ: 21
					}
				],
				linkDisplayStringIndex: 0,
				name: "MMI",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-279.html",
				resource: [
					{
						region: [
						],
						filter: [
						],
						checksum: {
							"0": 35,
							"1": 54,
							"2": 2,
							"3": 219,
							"4": 218,
							"5": 184,
							"6": 124,
							"7": 50,
							"8": 35,
							"9": 32,
							"10": 86,
							"11": 20,
							"12": 147,
							"13": 223,
							"14": 7,
							"15": 41,
							"16": 209,
							"17": 238,
							"18": 32,
							"19": 41
						},
						updateMethod: 0,
						validationMethod: 0,
						filename: "mmi-mask-2.png",
						resourceType: 5
					},
					{
						region: [
						],
						filter: [
						],
						checksum: {
							"0": 5,
							"1": 160,
							"2": 112,
							"3": 185,
							"4": 3,
							"5": 255,
							"6": 7,
							"7": 75,
							"8": 78,
							"9": 139,
							"10": 52,
							"11": 81,
							"12": 151,
							"13": 231,
							"14": 143,
							"15": 29,
							"16": 187,
							"17": 109,
							"18": 220,
							"19": 80
						},
						updateMethod: 0,
						validationMethod: 0,
						filename: "mmi-mask-2@2x.png",
						resourceType: 5
					},
					{
						region: [
						],
						filter: [
						],
						checksum: {
							"0": 240,
							"1": 170,
							"2": 204,
							"3": 91,
							"4": 161,
							"5": 113,
							"6": 81,
							"7": 101,
							"8": 136,
							"9": 205,
							"10": 115,
							"11": 2,
							"12": 192,
							"13": 97,
							"14": 106,
							"15": 34,
							"16": 227,
							"17": 214,
							"18": 74,
							"19": 220
						},
						updateMethod: 0,
						validationMethod: 0,
						filename: "mmi-mask-2@3x.png",
						resourceType: 5
					}
				]
			},
			{
				region: [
					{
						maxX: 225,
						minZ: 8,
						minX: 218,
						maxY: 104,
						minY: 102,
						maxZ: 21
					},
					{
						maxX: 228,
						minZ: 8,
						minX: 221,
						maxY: 101,
						minY: 98,
						maxZ: 21
					},
					{
						maxX: 231,
						minZ: 8,
						minX: 226,
						maxY: 97,
						minY: 91,
						maxZ: 21
					}
				],
				linkDisplayStringIndex: 0,
				name: "© GeoTechnologies, Inc.",
				url: "https://gspe21-ssl.ls.apple.com/html/attribution-279.html",
				resource: [
				]
			}
		],
		releaseInfo: "PROD (24.20)",
		tileSet: [
			{
				scale: 0,
				style: 1,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf?flags=8"
			},
			{
				scale: 0,
				style: 1,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf?flags=8"
			},
			{
				scale: 1,
				style: 7,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 1,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
							{
								resourceIndex: 1971,
								textureIndex: 0,
								tileType: 2
							}
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 22
							}
						],
						identifier: 9751
					}
				]
			},
			{
				scale: 2,
				style: 7,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 1,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
							{
								resourceIndex: 1971,
								textureIndex: 0,
								tileType: 2
							}
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 22
							}
						],
						identifier: 9751
					}
				]
			},
			{
				scale: 0,
				style: 11,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf?flags=1"
			},
			{
				scale: 0,
				style: 11,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf?flags=1"
			},
			{
				scale: 0,
				style: 12,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16388440,
						timeToLiveSeconds: 120,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe12-ssl.ls.apple.com/traffic"
			},
			{
				scale: 0,
				style: 12,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16389156,
						timeToLiveSeconds: 120,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe12-kittyhawk-ssl.ls.apple.com/traffic"
			},
			{
				scale: 0,
				style: 13,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf?flags=2"
			},
			{
				scale: 0,
				style: 13,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf?flags=2"
			},
			{
				scale: 0,
				style: 14,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
						],
						identifier: 1
					}
				]
			},
			{
				scale: 0,
				style: 15,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
						],
						identifier: 1
					}
				]
			},
			{
				scale: 0,
				style: 16,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
						],
						identifier: 1
					}
				]
			},
			{
				scale: 0,
				style: 17,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							}
						],
						identifier: 0
					}
				]
			},
			{
				scale: 1,
				style: 17,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 1,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 2583,
								minZ: 13,
								minX: 408,
								maxY: 3659,
								minY: 2760,
								maxZ: 13
							},
							{
								maxX: 4535,
								minZ: 13,
								minX: 3848,
								maxY: 3235,
								minY: 2332,
								maxZ: 13
							}
						],
						identifier: 32
					}
				]
			},
			{
				scale: 0,
				style: 18,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 18,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 20,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 20,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 22,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 22,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 30,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 262143,
								minZ: 18,
								minX: 0,
								maxY: 262143,
								minY: 0,
								maxZ: 18
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 30,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 262143,
								minZ: 18,
								minX: 0,
								maxY: 262143,
								minY: 0,
								maxZ: 18
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 1,
				style: 33,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 1,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 7
							}
						],
						identifier: 4
					}
				]
			},
			{
				scale: 0,
				style: 37,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf?flags=2"
			},
			{
				scale: 0,
				style: 37,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf?flags=2"
			},
			{
				scale: 0,
				style: 42,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
						],
						identifier: 1
					}
				]
			},
			{
				scale: 0,
				style: 43,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
						],
						identifier: 1
					}
				]
			},
			{
				scale: 0,
				style: 44,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
						],
						identifier: 1
					}
				]
			},
			{
				scale: 0,
				style: 47,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 47,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 48,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 11201196
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 48,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 11201196
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 52,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
						],
						identifier: 1
					}
				]
			},
			{
				scale: 0,
				style: 53,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 53,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 54,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 13658945
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 54,
				checksumType: 0,
				requestStyle: 1,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 13659050
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 56,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 56,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 57,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe76-ssl.ls.apple.com/api/tile",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 0,
						timeToLiveSeconds: 3600,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 58,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 58,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 59,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/asset/v3/model"
			},
			{
				scale: 0,
				style: 59,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/asset/v3/model"
			},
			{
				scale: 0,
				style: 60,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/asset/v3/material"
			},
			{
				scale: 0,
				style: 60,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/asset/v3/material"
			},
			{
				scale: 0,
				style: 61,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 61,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 62,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 62,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 64,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 64,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 65,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe79-ssl.ls.apple.com/65/v1",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							}
						],
						identifier: 2,
						timeToLiveSeconds: 3600,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 66,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 66,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 67,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 67,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
					{
						countryCode: "AE",
						region: "AE"
					},
					{
						countryCode: "AE",
						region: "SA"
					},
					{
						countryCode: "IN",
						region: ""
					},
					{
						countryCode: "JP",
						region: "JP"
					},
					{
						countryCode: "KR",
						region: "KR"
					},
					{
						countryCode: "MA",
						region: "MA"
					},
					{
						countryCode: "RU",
						region: "RU"
					},
					{
						countryCode: "SA",
						region: "AE"
					},
					{
						countryCode: "SA",
						region: "SA"
					},
					{
						countryCode: "VN",
						region: "VN"
					}
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 68,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 68,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 69,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 69,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 70,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe76-ssl.ls.apple.com/api/vltile",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							}
						],
						identifier: 1,
						timeToLiveSeconds: 86400,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 71,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe92-ssl.ls.apple.com",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 2097151,
								minZ: 21,
								minX: 0,
								maxY: 2097151,
								minY: 0,
								maxZ: 21
							}
						],
						identifier: 1
					}
				]
			},
			{
				scale: 0,
				style: 72,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe79-ssl.ls.apple.com/72/v2",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							}
						],
						identifier: 2,
						timeToLiveSeconds: 3600,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 73,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 73,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 74,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe79-ssl.ls.apple.com/pbz/v1",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2097151,
								minZ: 21,
								minX: 0,
								maxY: 2097151,
								minY: 0,
								maxZ: 21
							}
						],
						identifier: 0,
						timeToLiveSeconds: 86400,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 76,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe79-ssl.ls.apple.com/sis/v1",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 524287,
								minZ: 19,
								minX: 0,
								maxY: 524287,
								minY: 0,
								maxZ: 19
							}
						],
						identifier: 0,
						timeToLiveSeconds: 86400,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 78,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 78,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 79,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 79,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 80,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe79-ssl.ls.apple.com/sdm/v1",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							}
						],
						identifier: 0,
						timeToLiveSeconds: 86400,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 82,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/asset/v3/model-occlusion"
			},
			{
				scale: 0,
				style: 82,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/asset/v3/model-occlusion"
			},
			{
				scale: 0,
				style: 83,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 0,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16357893
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 83,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 0,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16361517
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 84,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16388440,
						timeToLiveSeconds: 1800,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-2-ssl.ls.apple.com/poi_update"
			},
			{
				scale: 0,
				style: 84,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							},
							{
								maxX: 65535,
								minZ: 16,
								minX: 0,
								maxY: 65535,
								minY: 0,
								maxZ: 16
							},
							{
								maxX: 131071,
								minZ: 17,
								minX: 0,
								maxY: 131071,
								minY: 0,
								maxZ: 17
							}
						],
						identifier: 16389156,
						timeToLiveSeconds: 1800,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-2-ssl.ls.apple.com/poi_update"
			},
			{
				scale: 0,
				style: 85,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-2-ssl.ls.apple.com/live_tile.vf"
			},
			{
				scale: 0,
				style: 85,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-2-ssl.ls.apple.com/live_tile.vf"
			},
			{
				scale: 0,
				style: 87,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 87,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
					{
						language: [
							"ar",
							"ca",
							"cs",
							"da",
							"de",
							"el",
							"en",
							"en-AU",
							"en-GB",
							"es",
							"es-MX",
							"es-US",
							"fi",
							"fr",
							"fr-CA",
							"he",
							"hi",
							"hr",
							"hu",
							"id",
							"it",
							"ja",
							"ko",
							"ms",
							"nb",
							"nl",
							"pl",
							"pt",
							"pt-PT",
							"ro",
							"ru",
							"sk",
							"sv",
							"th",
							"tr",
							"uk",
							"vi",
							"zh-Hans",
							"zh-Hant",
							"zh-HK"
						],
						identifier: 1
					}
				],
				validVersion: [
					{
						supportedLanguagesVersion: 1,
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							},
							{
								maxX: 31,
								minZ: 5,
								minX: 0,
								maxY: 31,
								minY: 0,
								maxZ: 5
							},
							{
								maxX: 63,
								minZ: 6,
								minX: 0,
								maxY: 63,
								minY: 0,
								maxZ: 6
							},
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 255,
								minZ: 8,
								minX: 0,
								maxY: 255,
								minY: 0,
								maxZ: 8
							},
							{
								maxX: 511,
								minZ: 9,
								minX: 0,
								maxY: 511,
								minY: 0,
								maxZ: 9
							},
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							},
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 16383,
								minZ: 14,
								minX: 0,
								maxY: 16383,
								minY: 0,
								maxZ: 14
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156,
						genericTile: [
						]
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 88,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 88,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 4095,
								minZ: 12,
								minX: 0,
								maxY: 4095,
								minY: 0,
								maxZ: 12
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 89,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 1,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe79-ssl.ls.apple.com/ray/v1",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 262143,
								minZ: 18,
								minX: 0,
								maxY: 262143,
								minY: 0,
								maxZ: 18
							}
						],
						identifier: 1,
						timeToLiveSeconds: 86400,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 90,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 0,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16388440
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 90,
				checksumType: 0,
				requestStyle: 0,
				supportsMultipathTCP: false,
				dataSet: 1,
				size: 2,
				supportedLanguage: [
				],
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 8191,
								minZ: 13,
								minX: 0,
								maxY: 8191,
								minY: 0,
								maxZ: 13
							},
							{
								maxX: 32767,
								minZ: 15,
								minX: 0,
								maxY: 32767,
								minY: 0,
								maxZ: 15
							}
						],
						identifier: 16389156
					}
				],
				deviceSKUWhitelist: [
				],
				countryRegionWhitelist: [
				],
				baseURL: "https://gspe19-kittyhawk-ssl.ls.apple.com/tile.vf"
			},
			{
				scale: 0,
				style: 91,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl-vss.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							}
						],
						identifier: 2
					}
				]
			},
			{
				scale: 1,
				style: 92,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 1,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl-vss.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 127,
								minZ: 7,
								minX: 0,
								maxY: 127,
								minY: 0,
								maxZ: 7
							},
							{
								maxX: 2047,
								minZ: 11,
								minX: 0,
								maxY: 2047,
								minY: 0,
								maxZ: 11
							},
							{
								maxX: 2583,
								minZ: 13,
								minX: 408,
								maxY: 3659,
								minY: 2760,
								maxZ: 13
							},
							{
								maxX: 4535,
								minZ: 13,
								minX: 3848,
								maxY: 3235,
								minY: 2332,
								maxZ: 13
							}
						],
						identifier: 32
					}
				]
			},
			{
				scale: 0,
				style: 94,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 0,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe79-ssl.ls.apple.com/ccc/v1",
				validVersion: [
					{
						availableTiles: [
							{
								maxX: 1023,
								minZ: 10,
								minX: 0,
								maxY: 1023,
								minY: 0,
								maxZ: 10
							},
							{
								maxX: 262143,
								minZ: 18,
								minX: 0,
								maxY: 262143,
								minY: 0,
								maxZ: 18
							}
						],
						identifier: 1,
						timeToLiveSeconds: 86400,
						genericTile: [
						]
					}
				]
			},
			{
				scale: 0,
				style: 95,
				checksumType: 0,
				countryRegionWhitelist: [
				],
				size: 2,
				requestStyle: 0,
				deviceSKUWhitelist: [
				],
				supportedLanguage: [
				],
				supportsMultipathTCP: false,
				baseURL: "https://gspe11-ssl-vss.ls.apple.com/tile",
				validVersion: [
					{
						genericTile: [
						],
						availableTiles: [
							{
								maxX: 1,
								minZ: 1,
								minX: 0,
								maxY: 1,
								minY: 0,
								maxZ: 1
							},
							{
								maxX: 3,
								minZ: 2,
								minX: 0,
								maxY: 3,
								minY: 0,
								maxZ: 2
							},
							{
								maxX: 7,
								minZ: 3,
								minX: 0,
								maxY: 7,
								minY: 0,
								maxZ: 3
							},
							{
								maxX: 15,
								minZ: 4,
								minX: 0,
								maxY: 15,
								minY: 0,
								maxZ: 4
							}
						],
						identifier: 1
					}
				]
			}
		],
		dataSet: [
			{
				identifier: 0,
				dataSetDescription: "TomTom"
			},
			{
				identifier: 1,
				dataSetDescription: "KittyHawk"
			}
		],
		urlInfoSet: [
			{
				backgroundRevGeoURL: {
					url: "https://gsp57-ssl-revgeo.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: false
				},
				announcementsURL: {
					url: "https://gspe35-ssl.ls.apple.com/config/announcements?environment=prod",
					supportsMultipathTCP: false
				},
				searchAttributionManifestURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/search-attribution-1322",
					supportsMultipathTCP: false
				},
				analyticsSessionlessURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				proactiveAppClipURL: {
					url: "https://gspe79-ssl.ls.apple.com/72/v2",
					supportsMultipathTCP: false
				},
				enrichmentSubmissionURL: {
					url: "https://sundew.ls.apple.com/v1/feedback/submission.arpc",
					supportsMultipathTCP: false
				},
				wifiConnectionQualityProbeURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/wcq",
					supportsMultipathTCP: false
				},
				poiBusynessActivityCollectionURL: {
					url: "https://gsp53-ssl.ls.apple.com/hvr/rt_poi_activity",
					supportsMultipathTCP: false
				},
				offlineDataDownloadBaseURL: {
					url: "https://gspe121-ssl.ls.apple.com",
					supportsMultipathTCP: false
				},
				etaURL: {
					url: "https://gsp-ssl.ls.apple.com/directions.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				analyticsCohortSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				resourcesURL: {
					url: "https://gspe21-ssl.ls.apple.com/",
					supportsMultipathTCP: false
				},
				problemOptInURL: {
					url: "https://sundew.ls.apple.com/grp/oi",
					supportsMultipathTCP: false
				},
				proactiveRoutingURL: {
					url: "https://gsp-ssl-commute.ls.apple.com/directions.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				feedbackLookupURL: {
					url: "https://gsp-ssl.ls.apple.com/feedback.arpc",
					supportsMultipathTCP: false
				},
				bluePOIDispatcherURL: {
					url: "https://gsp57-ssl-locus.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				batchTrafficProbeURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/v2/loc",
					supportsMultipathTCP: false
				},
				batchReverseGeocoderURL: {
					url: "https://gsp36-ssl.ls.apple.com/revgeo.arpc",
					supportsMultipathTCP: false
				},
				spatialLookupURL: {
					url: "https://gsp51-ssl.ls.apple.com/api/v1.0/poi/data",
					supportsMultipathTCP: false
				},
				realtimeTrafficProbeURL: {
					url: "https://gsp9-ssl.apple.com/hvr/v2/rtloc",
					supportsMultipathTCP: false
				},
				addressCorrectionTaggedLocationURL: {
					url: "https://gsp47-ssl.ls.apple.com/ac",
					supportsMultipathTCP: false
				},
				problemSubmissionURL: {
					url: "https://sundew.ls.apple.com/v1/feedback/submission.arpc",
					supportsMultipathTCP: false
				},
				reverseGeocoderVersionsURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/revgeo-version-11.plist",
					supportsMultipathTCP: false
				},
				wifiQualityTileURL: {
					url: "https://gspe85-ssl.ls.apple.com/wifi_request_tile",
					supportsMultipathTCP: false
				},
				problemCategoriesURL: {
					url: "https://gspe21-ssl.ls.apple.com/config/com.apple.GEO.BusinessLocalizedCategories-482.plist",
					supportsMultipathTCP: false
				},
				batchReverseGeocoderPlaceRequestURL: {
					url: "https://gsp36-ssl.ls.apple.com/revgeo_pr.arpc",
					supportsMultipathTCP: false
				},
				wifiQualityURL: {
					url: "https://gsp85-ssl.ls.apple.com/wifi_request",
					supportsMultipathTCP: false
				},
				problemStatusURL: {
					url: "https://sundew.ls.apple.com/grp/st",
					supportsMultipathTCP: false
				},
				feedbackSubmissionURL: {
					url: "https://sundew.ls.apple.com/v1/feedback/submission.arpc",
					supportsMultipathTCP: false
				},
				pressureProbeDataURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/cpr",
					supportsMultipathTCP: false
				},
				offlineDataBatchListURL: {
					url: "https://gspe121-ssl.ls.apple.com/api/batchesForRegion",
					supportsMultipathTCP: false
				},
				offlineDataSizeURL: {
					url: "https://gspe121-ssl.ls.apple.com/api/sizeForRegion",
					supportsMultipathTCP: false
				},
				analyticsShortSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				bcxDispatcherURL: {
					url: "https://gsp57-ssl-bcx.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: false
				},
				alternateResourcesURL: [
					{
						url: "https://cdn.apple-mapkit.com/rap",
						supportsMultipathTCP: false
					}
				],
				abExperimentURL: {
					url: "https://gsp-ssl.ls.apple.com/ab.arpc",
					supportsMultipathTCP: false
				},
				logMessageUsageURL: {
					url: "https://gsp64-ssl.ls.apple.com/a/v2/use",
					supportsMultipathTCP: false
				},
				addressCorrectionInitURL: {
					url: "https://gsp47-ssl.ls.apple.com/ac",
					supportsMultipathTCP: false
				},
				dispatcherURL: {
					url: "https://gsp-ssl.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				ugcLogDiscardURL: {
					url: "https://sundew.ls.apple.com/v1/log_message",
					supportsMultipathTCP: false
				},
				rapWebBundleURL: {
					url: "https://cdn.apple-mapkit.com/rap",
					supportsMultipathTCP: false
				},
				networkSelectionHarvestURL: {
					url: "https://gsp10-ssl.ls.apple.com/hvr/strn",
					supportsMultipathTCP: false
				},
				simpleETAURL: {
					url: "https://gsp-ssl.ls.apple.com/directions.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				businessPortalBaseURL: {
					url: "https://mapsconnect.apple.com/business/ui/claimPlace",
					supportsMultipathTCP: false
				},
				analyticsLongSessionURL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				},
				backgroundDispatcherURL: {
					url: "https://gsp57-ssl-background.ls.apple.com/dispatcher.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				webModuleBaseURL: {
					url: "https://maps.apple.com",
					supportsMultipathTCP: false
				},
				directionsURL: {
					url: "https://gsp-ssl.ls.apple.com/directions.arpc",
					supportsMultipathTCP: true,
					alternativeMultipathTCPPort: 5228
				},
				addressCorrectionUpdateURL: {
					url: "https://gsp47-ssl.ls.apple.com/ac",
					supportsMultipathTCP: false
				},
				logMessageUsageV3URL: {
					url: "https://gsp64-ssl.ls.apple.com/hvr/v3/use",
					supportsMultipathTCP: false
				}
			}
		],
		muninBucket: [
			{
				bucketID: 2,
				bucketURL: "https://gspe72-ssl.ls.apple.com/mnn_us"
			},
			{
				bucketID: 6,
				bucketURL: "https://gspe72-ssl.ls.apple.com/mnn_us"
			}
		]
	}
};
var Maps = {
	Settings: Settings$5,
	Configs: Configs$2
};

var Maps$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Configs: Configs$2,
	Settings: Settings$5,
	default: Maps
});

var Settings$4 = {
	Switch: true,
	CountryCode: "US",
	NewsPlusUser: true
};
var News$1 = {
	Settings: Settings$4
};

var News$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Settings: Settings$4,
	default: News$1
});

var Settings$3 = {
	Switch: true,
	CountryCode: "US",
	canUse: true
};
var PrivateRelay = {
	Settings: Settings$3
};

var PrivateRelay$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Settings: Settings$3,
	default: PrivateRelay
});

var Settings$2 = {
	Switch: true,
	CountryCode: "SG",
	Domains: [
		"web",
		"itunes",
		"app_store",
		"movies",
		"restaurants",
		"maps"
	],
	Functions: [
		"flightutilities",
		"lookup",
		"mail",
		"messages",
		"news",
		"safari",
		"siri",
		"spotlight",
		"visualintelligence"
	],
	Safari_Smart_History: true
};
var Configs$1 = {
	VisualIntelligence: {
		enabled_domains: [
			"pets",
			"media",
			"books",
			"art",
			"nature",
			"landmarks"
		],
		supported_domains: [
			"ART",
			"BOOK",
			"MEDIA",
			"LANDMARK",
			"ANIMALS",
			"BIRDS",
			"FOOD",
			"SIGN_SYMBOL",
			"AUTO_SYMBOL",
			"DOGS",
			"NATURE",
			"NATURAL_LANDMARK",
			"INSECTS",
			"REPTILES",
			"ALBUM",
			"STOREFRONT",
			"LAUNDRY_CARE_SYMBOL",
			"CATS",
			"OBJECT_2D",
			"SCULPTURE",
			"SKYLINE",
			"MAMMALS"
		]
	}
};
var Siri = {
	Settings: Settings$2,
	Configs: Configs$1
};

var Siri$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Configs: Configs$1,
	Settings: Settings$2,
	default: Siri
});

var Settings$1 = {
	Switch: "true",
	CountryCode: "US",
	MultiAccount: "false",
	Universal: "true"
};
var TestFlight = {
	Settings: Settings$1
};

var TestFlight$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Settings: Settings$1,
	default: TestFlight
});

var Settings = {
	Switch: true,
	"Third-Party": false,
	HLSUrl: "play-edge.itunes.apple.com",
	ServerUrl: "play.itunes.apple.com",
	Tabs: [
		"WatchNow",
		"Originals",
		"MLS",
		"Sports",
		"Kids",
		"Store",
		"Movies",
		"TV",
		"ChannelsAndApps",
		"Library",
		"Search"
	],
	CountryCode: {
		Configs: "AUTO",
		Settings: "AUTO",
		View: [
			"SG",
			"TW"
		],
		WatchNow: "AUTO",
		Channels: "AUTO",
		Originals: "AUTO",
		Sports: "US",
		Kids: "US",
		Store: "AUTO",
		Movies: "AUTO",
		TV: "AUTO",
		Persons: "SG",
		Search: "AUTO",
		Others: "AUTO"
	}
};
var Configs = {
	Locale: [
		[
			"AU",
			"en-AU"
		],
		[
			"CA",
			"en-CA"
		],
		[
			"GB",
			"en-GB"
		],
		[
			"KR",
			"ko-KR"
		],
		[
			"HK",
			"yue-Hant"
		],
		[
			"JP",
			"ja-JP"
		],
		[
			"MO",
			"zh-Hant"
		],
		[
			"TW",
			"zh-Hant"
		],
		[
			"US",
			"en-US"
		],
		[
			"SG",
			"zh-Hans"
		]
	],
	Tabs: [
		{
			title: "主页",
			type: "WatchNow",
			universalLinks: [
				"https://tv.apple.com/watch-now",
				"https://tv.apple.com/home"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_watchnow",
				type: "Root",
				url: "https://tv.apple.com/watch-now"
			},
			isSelected: true
		},
		{
			title: "Apple TV+",
			type: "Originals",
			universalLinks: [
				"https://tv.apple.com/channel/tvs.sbd.4000",
				"https://tv.apple.com/atv"
			],
			destinationType: "Target",
			target: {
				id: "tvs.sbd.4000",
				type: "Brand",
				url: "https://tv.apple.com/us/channel/tvs.sbd.4000"
			}
		},
		{
			title: "MLS Season Pass",
			type: "MLS",
			universalLinks: [
				"https://tv.apple.com/mls"
			],
			destinationType: "Target",
			target: {
				id: "tvs.sbd.7000",
				type: "Brand",
				url: "https://tv.apple.com/us/channel/tvs.sbd.7000"
			}
		},
		{
			title: "体育节目",
			type: "Sports",
			universalLinks: [
				"https://tv.apple.com/sports"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_sports",
				type: "Root",
				url: "https://tv.apple.com/sports"
			}
		},
		{
			title: "儿童",
			type: "Kids",
			universalLinks: [
				"https://tv.apple.com/kids"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_kids",
				type: "Root",
				url: "https://tv.apple.com/kids"
			}
		},
		{
			title: "电影",
			type: "Movies",
			universalLinks: [
				"https://tv.apple.com/movies"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_movies",
				type: "Root",
				url: "https://tv.apple.com/movies"
			}
		},
		{
			title: "电视节目",
			type: "TV",
			universalLinks: [
				"https://tv.apple.com/tv-shows"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_tvshows",
				type: "Root",
				url: "https://tv.apple.com/tv-shows"
			}
		},
		{
			title: "商店",
			type: "Store",
			universalLinks: [
				"https://tv.apple.com/store"
			],
			destinationType: "SubTabs",
			subTabs: [
				{
					title: "电影",
					type: "Movies",
					universalLinks: [
						"https://tv.apple.com/movies"
					],
					destinationType: "Target",
					target: {
						id: "tahoma_movies",
						type: "Root",
						url: "https://tv.apple.com/movies"
					}
				},
				{
					title: "电视节目",
					type: "TV",
					universalLinks: [
						"https://tv.apple.com/tv-shows"
					],
					destinationType: "Target",
					target: {
						id: "tahoma_tvshows",
						type: "Root",
						url: "https://tv.apple.com/tv-shows"
					}
				}
			]
		},
		{
			title: "频道和 App",
			destinationType: "SubTabs",
			subTabsPlacementType: "ExpandedList",
			type: "ChannelsAndApps",
			subTabs: [
			]
		},
		{
			title: "资料库",
			type: "Library",
			destinationType: "Client"
		},
		{
			title: "搜索",
			type: "Search",
			universalLinks: [
				"https://tv.apple.com/search"
			],
			destinationType: "Target",
			target: {
				id: "tahoma_search",
				type: "Root",
				url: "https://tv.apple.com/search"
			}
		}
	],
	i18n: {
		WatchNow: [
			[
				"en",
				"Home"
			],
			[
				"zh",
				"主页"
			],
			[
				"zh-Hans",
				"主頁"
			],
			[
				"zh-Hant",
				"主頁"
			]
		],
		Movies: [
			[
				"en",
				"Movies"
			],
			[
				"zh",
				"电影"
			],
			[
				"zh-Hans",
				"电影"
			],
			[
				"zh-Hant",
				"電影"
			]
		],
		TV: [
			[
				"en",
				"TV"
			],
			[
				"zh",
				"电视节目"
			],
			[
				"zh-Hans",
				"电视节目"
			],
			[
				"zh-Hant",
				"電視節目"
			]
		],
		Store: [
			[
				"en",
				"Store"
			],
			[
				"zh",
				"商店"
			],
			[
				"zh-Hans",
				"商店"
			],
			[
				"zh-Hant",
				"商店"
			]
		],
		Sports: [
			[
				"en",
				"Sports"
			],
			[
				"zh",
				"体育节目"
			],
			[
				"zh-Hans",
				"体育节目"
			],
			[
				"zh-Hant",
				"體育節目"
			]
		],
		Kids: [
			[
				"en",
				"Kids"
			],
			[
				"zh",
				"儿童"
			],
			[
				"zh-Hans",
				"儿童"
			],
			[
				"zh-Hant",
				"兒童"
			]
		],
		Library: [
			[
				"en",
				"Library"
			],
			[
				"zh",
				"资料库"
			],
			[
				"zh-Hans",
				"资料库"
			],
			[
				"zh-Hant",
				"資料庫"
			]
		],
		Search: [
			[
				"en",
				"Search"
			],
			[
				"zh",
				"搜索"
			],
			[
				"zh-Hans",
				"搜索"
			],
			[
				"zh-Hant",
				"蒐索"
			]
		]
	}
};
var TV = {
	Settings: Settings,
	Configs: Configs
};

var TV$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Configs: Configs,
	Settings: Settings,
	default: TV
});

var Database$1 = Database = {
	"Default": Default$1,
	"Location": Location$1,
	"Maps": Maps$1,
	"News": News$2,
	"PrivateRelay": PrivateRelay$1,
	"Siri": Siri$1,
	"TestFlight": TestFlight$1,
	"TV": TV$1,
};

/**
 * Get Storage Variables
 * @link https://github.com/NanoCat-Me/ENV/blob/main/getStorage.mjs
 * @author VirgilClyne
 * @param {String} key - Persistent Store Key
 * @param {Array} names - Platform Names
 * @param {Object} database - Default Database
 * @return {Object} { Settings, Caches, Configs }
 */
function getStorage(key, names, database) {
    //console.log(`☑️ ${this.name}, Get Environment Variables`, "");
    /***************** BoxJs *****************/
    // 包装为局部变量，用完释放内存
    // BoxJs的清空操作返回假值空字符串, 逻辑或操作符会在左侧操作数为假值时返回右侧操作数。
    let BoxJs = $Storage.getItem(key, database);
    //console.log(`🚧 ${this.name}, Get Environment Variables`, `BoxJs类型: ${typeof BoxJs}`, `BoxJs内容: ${JSON.stringify(BoxJs)}`, "");
    /***************** Argument *****************/
    let Argument = {};
    if (typeof $argument !== "undefined") {
        if (Boolean($argument)) {
            //console.log(`🎉 ${this.name}, $Argument`);
            let arg = Object.fromEntries($argument.split("&").map((item) => item.split("=").map(i => i.replace(/\"/g, ''))));
            //console.log(JSON.stringify(arg));
            for (let item in arg) Lodash.set(Argument, item, arg[item]);
            //console.log(JSON.stringify(Argument));
        }        //console.log(`✅ ${this.name}, Get Environment Variables`, `Argument类型: ${typeof Argument}`, `Argument内容: ${JSON.stringify(Argument)}`, "");
    }    /***************** Store *****************/
    const Store = { Settings: database?.Default?.Settings || {}, Configs: database?.Default?.Configs || {}, Caches: {} };
    if (!Array.isArray(names)) names = [names];
    //console.log(`🚧 ${this.name}, Get Environment Variables`, `names类型: ${typeof names}`, `names内容: ${JSON.stringify(names)}`, "");
    for (let name of names) {
        Store.Settings = { ...Store.Settings, ...database?.[name]?.Settings, ...Argument, ...BoxJs?.[name]?.Settings };
        Store.Configs = { ...Store.Configs, ...database?.[name]?.Configs };
        if (BoxJs?.[name]?.Caches && typeof BoxJs?.[name]?.Caches === "string") BoxJs[name].Caches = JSON.parse(BoxJs?.[name]?.Caches);
        Store.Caches = { ...Store.Caches, ...BoxJs?.[name]?.Caches };
    }    //console.log(`🚧 ${this.name}, Get Environment Variables`, `Store.Settings类型: ${typeof Store.Settings}`, `Store.Settings: ${JSON.stringify(Store.Settings)}`, "");
    traverseObject(Store.Settings, (key, value) => {
        //console.log(`🚧 ${this.name}, traverseObject`, `${key}: ${typeof value}`, `${key}: ${JSON.stringify(value)}`, "");
        if (value === "true" || value === "false") value = JSON.parse(value); // 字符串转Boolean
        else if (typeof value === "string") {
            if (value.includes(",")) value = value.split(",").map(item => string2number(item)); // 字符串转数组转数字
            else value = string2number(value); // 字符串转数字
        }        return value;
    });
    //console.log(`✅ ${this.name}, Get Environment Variables`, `Store: ${typeof Store.Caches}`, `Store内容: ${JSON.stringify(Store)}`, "");
    return Store;

    /***************** function *****************/
    function traverseObject(o, c) { for (var t in o) { var n = o[t]; o[t] = "object" == typeof n && null !== n ? traverseObject(n, c) : c(t, n); } return o }
    function string2number(string) { if (string && !isNaN(string)) string = parseInt(string, 10); return string }
}

/**
 * Set Environment Variables
 * @author VirgilClyne
 * @param {Object} $ - ENV
 * @param {String} name - Persistent Store Key
 * @param {Array} platforms - Platform Names
 * @param {Object} database - Default DataBase
 * @return {Object} { Settings, Caches, Configs }
 */
function setENV(name, platforms, database) {
	console.log(`☑️ Set Environment Variables`, "");
	let { Settings, Caches, Configs } = getStorage(name, platforms, database);
	/***************** Settings *****************/
	if (Settings?.Tabs && !Array.isArray(Settings?.Tabs)) Lodash.set(Settings, "Tabs", (Settings?.Tabs) ? [Settings.Tabs.toString()] : []);
	if (Settings?.Domains && !Array.isArray(Settings?.Domains)) Lodash.set(Settings, "Domains", (Settings?.Domains) ? [Settings.Domains.toString()] : []);
	if (Settings?.Functions && !Array.isArray(Settings?.Functions)) Lodash.set(Settings, "Functions", (Settings?.Functions) ? [Settings.Functions.toString()] : []);
	console.log(`✅ Set Environment Variables, Settings: ${typeof Settings}, Settings内容: ${JSON.stringify(Settings)}`, "");
	/***************** Caches *****************/
	//console.log(`✅ Set Environment Variables, Caches: ${typeof Caches}, Caches内容: ${JSON.stringify(Caches)}`, "");
	/***************** Configs *****************/
	Configs.Storefront = new Map(Configs.Storefront);
	if (Configs.Locale) Configs.Locale = new Map(Configs.Locale);
	if (Configs.i18n) for (let type in Configs.i18n) Configs.i18n[type] = new Map(Configs.i18n[type]);
	return { Settings, Caches, Configs };
}

const SIZEOF_INT = 4;
const FILE_IDENTIFIER_LENGTH = 4;
const SIZE_PREFIX_LENGTH = 4;

const int32 = new Int32Array(2);
const float32 = new Float32Array(int32.buffer);
const float64 = new Float64Array(int32.buffer);
const isLittleEndian = new Uint16Array(new Uint8Array([1, 0]).buffer)[0] === 1;

var Encoding;
(function (Encoding) {
    Encoding[Encoding["UTF8_BYTES"] = 1] = "UTF8_BYTES";
    Encoding[Encoding["UTF16_STRING"] = 2] = "UTF16_STRING";
})(Encoding || (Encoding = {}));

class ByteBuffer {
    /**
     * Create a new ByteBuffer with a given array of bytes (`Uint8Array`)
     */
    constructor(bytes_) {
        this.bytes_ = bytes_;
        this.position_ = 0;
        this.text_decoder_ = new TextDecoder();
    }
    /**
     * Create and allocate a new ByteBuffer with a given size.
     */
    static allocate(byte_size) {
        return new ByteBuffer(new Uint8Array(byte_size));
    }
    clear() {
        this.position_ = 0;
    }
    /**
     * Get the underlying `Uint8Array`.
     */
    bytes() {
        return this.bytes_;
    }
    /**
     * Get the buffer's position.
     */
    position() {
        return this.position_;
    }
    /**
     * Set the buffer's position.
     */
    setPosition(position) {
        this.position_ = position;
    }
    /**
     * Get the buffer's capacity.
     */
    capacity() {
        return this.bytes_.length;
    }
    readInt8(offset) {
        return this.readUint8(offset) << 24 >> 24;
    }
    readUint8(offset) {
        return this.bytes_[offset];
    }
    readInt16(offset) {
        return this.readUint16(offset) << 16 >> 16;
    }
    readUint16(offset) {
        return this.bytes_[offset] | this.bytes_[offset + 1] << 8;
    }
    readInt32(offset) {
        return this.bytes_[offset] | this.bytes_[offset + 1] << 8 | this.bytes_[offset + 2] << 16 | this.bytes_[offset + 3] << 24;
    }
    readUint32(offset) {
        return this.readInt32(offset) >>> 0;
    }
    readInt64(offset) {
        return BigInt.asIntN(64, BigInt(this.readUint32(offset)) + (BigInt(this.readUint32(offset + 4)) << BigInt(32)));
    }
    readUint64(offset) {
        return BigInt.asUintN(64, BigInt(this.readUint32(offset)) + (BigInt(this.readUint32(offset + 4)) << BigInt(32)));
    }
    readFloat32(offset) {
        int32[0] = this.readInt32(offset);
        return float32[0];
    }
    readFloat64(offset) {
        int32[isLittleEndian ? 0 : 1] = this.readInt32(offset);
        int32[isLittleEndian ? 1 : 0] = this.readInt32(offset + 4);
        return float64[0];
    }
    writeInt8(offset, value) {
        this.bytes_[offset] = value;
    }
    writeUint8(offset, value) {
        this.bytes_[offset] = value;
    }
    writeInt16(offset, value) {
        this.bytes_[offset] = value;
        this.bytes_[offset + 1] = value >> 8;
    }
    writeUint16(offset, value) {
        this.bytes_[offset] = value;
        this.bytes_[offset + 1] = value >> 8;
    }
    writeInt32(offset, value) {
        this.bytes_[offset] = value;
        this.bytes_[offset + 1] = value >> 8;
        this.bytes_[offset + 2] = value >> 16;
        this.bytes_[offset + 3] = value >> 24;
    }
    writeUint32(offset, value) {
        this.bytes_[offset] = value;
        this.bytes_[offset + 1] = value >> 8;
        this.bytes_[offset + 2] = value >> 16;
        this.bytes_[offset + 3] = value >> 24;
    }
    writeInt64(offset, value) {
        this.writeInt32(offset, Number(BigInt.asIntN(32, value)));
        this.writeInt32(offset + 4, Number(BigInt.asIntN(32, value >> BigInt(32))));
    }
    writeUint64(offset, value) {
        this.writeUint32(offset, Number(BigInt.asUintN(32, value)));
        this.writeUint32(offset + 4, Number(BigInt.asUintN(32, value >> BigInt(32))));
    }
    writeFloat32(offset, value) {
        float32[0] = value;
        this.writeInt32(offset, int32[0]);
    }
    writeFloat64(offset, value) {
        float64[0] = value;
        this.writeInt32(offset, int32[isLittleEndian ? 0 : 1]);
        this.writeInt32(offset + 4, int32[isLittleEndian ? 1 : 0]);
    }
    /**
     * Return the file identifier.   Behavior is undefined for FlatBuffers whose
     * schema does not include a file_identifier (likely points at padding or the
     * start of a the root vtable).
     */
    getBufferIdentifier() {
        if (this.bytes_.length < this.position_ + SIZEOF_INT +
            FILE_IDENTIFIER_LENGTH) {
            throw new Error('FlatBuffers: ByteBuffer is too short to contain an identifier.');
        }
        let result = "";
        for (let i = 0; i < FILE_IDENTIFIER_LENGTH; i++) {
            result += String.fromCharCode(this.readInt8(this.position_ + SIZEOF_INT + i));
        }
        return result;
    }
    /**
     * Look up a field in the vtable, return an offset into the object, or 0 if the
     * field is not present.
     */
    __offset(bb_pos, vtable_offset) {
        const vtable = bb_pos - this.readInt32(bb_pos);
        return vtable_offset < this.readInt16(vtable) ? this.readInt16(vtable + vtable_offset) : 0;
    }
    /**
     * Initialize any Table-derived type to point to the union at the given offset.
     */
    __union(t, offset) {
        t.bb_pos = offset + this.readInt32(offset);
        t.bb = this;
        return t;
    }
    /**
     * Create a JavaScript string from UTF-8 data stored inside the FlatBuffer.
     * This allocates a new string and converts to wide chars upon each access.
     *
     * To avoid the conversion to string, pass Encoding.UTF8_BYTES as the
     * "optionalEncoding" argument. This is useful for avoiding conversion when
     * the data will just be packaged back up in another FlatBuffer later on.
     *
     * @param offset
     * @param opt_encoding Defaults to UTF16_STRING
     */
    __string(offset, opt_encoding) {
        offset += this.readInt32(offset);
        const length = this.readInt32(offset);
        offset += SIZEOF_INT;
        const utf8bytes = this.bytes_.subarray(offset, offset + length);
        if (opt_encoding === Encoding.UTF8_BYTES)
            return utf8bytes;
        else
            return this.text_decoder_.decode(utf8bytes);
    }
    /**
     * Handle unions that can contain string as its member, if a Table-derived type then initialize it,
     * if a string then return a new one
     *
     * WARNING: strings are immutable in JS so we can't change the string that the user gave us, this
     * makes the behaviour of __union_with_string different compared to __union
     */
    __union_with_string(o, offset) {
        if (typeof o === 'string') {
            return this.__string(offset);
        }
        return this.__union(o, offset);
    }
    /**
     * Retrieve the relative offset stored at "offset"
     */
    __indirect(offset) {
        return offset + this.readInt32(offset);
    }
    /**
     * Get the start of data of a vector whose offset is stored at "offset" in this object.
     */
    __vector(offset) {
        return offset + this.readInt32(offset) + SIZEOF_INT; // data starts after the length
    }
    /**
     * Get the length of a vector whose offset is stored at "offset" in this object.
     */
    __vector_len(offset) {
        return this.readInt32(offset + this.readInt32(offset));
    }
    __has_identifier(ident) {
        if (ident.length != FILE_IDENTIFIER_LENGTH) {
            throw new Error('FlatBuffers: file identifier must be length ' +
                FILE_IDENTIFIER_LENGTH);
        }
        for (let i = 0; i < FILE_IDENTIFIER_LENGTH; i++) {
            if (ident.charCodeAt(i) != this.readInt8(this.position() + SIZEOF_INT + i)) {
                return false;
            }
        }
        return true;
    }
    /**
     * A helper function for generating list for obj api
     */
    createScalarList(listAccessor, listLength) {
        const ret = [];
        for (let i = 0; i < listLength; ++i) {
            const val = listAccessor(i);
            if (val !== null) {
                ret.push(val);
            }
        }
        return ret;
    }
    /**
     * A helper function for generating list for obj api
     * @param listAccessor function that accepts an index and return data at that index
     * @param listLength listLength
     * @param res result list
     */
    createObjList(listAccessor, listLength) {
        const ret = [];
        for (let i = 0; i < listLength; ++i) {
            const val = listAccessor(i);
            if (val !== null) {
                ret.push(val.unpack());
            }
        }
        return ret;
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
var ComparisonType;
(function (ComparisonType) {
    ComparisonType[ComparisonType["UNKNOWN"] = 0] = "UNKNOWN";
    ComparisonType[ComparisonType["UNKNOWN1"] = 1] = "UNKNOWN1";
    ComparisonType[ComparisonType["WORSE"] = 2] = "WORSE";
    ComparisonType[ComparisonType["SAME"] = 3] = "SAME";
    ComparisonType[ComparisonType["BETTER"] = 4] = "BETTER";
    ComparisonType[ComparisonType["UNKNOWN5"] = 5] = "UNKNOWN5";
})(ComparisonType || (ComparisonType = {}));

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
var SourceType;
(function (SourceType) {
    SourceType[SourceType["APPLE_INTERNAL"] = 0] = "APPLE_INTERNAL";
    SourceType[SourceType["MODELED"] = 1] = "MODELED";
    SourceType[SourceType["STATION"] = 2] = "STATION";
})(SourceType || (SourceType = {}));

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class Metadata {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsMetadata(bb, obj) {
        return (obj || new Metadata()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsMetadata(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new Metadata()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    attributionUrl(optionalEncoding) {
        const offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
    }
    expireTime() {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    language(optionalEncoding) {
        const offset = this.bb.__offset(this.bb_pos, 8);
        return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
    }
    latitude() {
        const offset = this.bb.__offset(this.bb_pos, 10);
        return offset ? this.bb.readFloat32(this.bb_pos + offset) : 0.0;
    }
    longitude() {
        const offset = this.bb.__offset(this.bb_pos, 12);
        return offset ? this.bb.readFloat32(this.bb_pos + offset) : 0.0;
    }
    unknown5() {
        const offset = this.bb.__offset(this.bb_pos, 14);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    providerName(optionalEncoding) {
        const offset = this.bb.__offset(this.bb_pos, 16);
        return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
    }
    readTime() {
        const offset = this.bb.__offset(this.bb_pos, 18);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    reportedTime() {
        const offset = this.bb.__offset(this.bb_pos, 20);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    unknown9() {
        const offset = this.bb.__offset(this.bb_pos, 22);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    sourceType() {
        const offset = this.bb.__offset(this.bb_pos, 24);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : SourceType.APPLE_INTERNAL;
    }
    unknown11() {
        const offset = this.bb.__offset(this.bb_pos, 26);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    unknown12() {
        const offset = this.bb.__offset(this.bb_pos, 28);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    unknown13() {
        const offset = this.bb.__offset(this.bb_pos, 30);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    unknown14() {
        const offset = this.bb.__offset(this.bb_pos, 32);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    unknown15() {
        const offset = this.bb.__offset(this.bb_pos, 34);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    static startMetadata(builder) {
        builder.startObject(16);
    }
    static addAttributionUrl(builder, attributionUrlOffset) {
        builder.addFieldOffset(0, attributionUrlOffset, 0);
    }
    static addExpireTime(builder, expireTime) {
        builder.addFieldInt32(1, expireTime, 0);
    }
    static addLanguage(builder, languageOffset) {
        builder.addFieldOffset(2, languageOffset, 0);
    }
    static addLatitude(builder, latitude) {
        builder.addFieldFloat32(3, latitude, 0.0);
    }
    static addLongitude(builder, longitude) {
        builder.addFieldFloat32(4, longitude, 0.0);
    }
    static addUnknown5(builder, unknown5) {
        builder.addFieldInt32(5, unknown5, 0);
    }
    static addProviderName(builder, providerNameOffset) {
        builder.addFieldOffset(6, providerNameOffset, 0);
    }
    static addReadTime(builder, readTime) {
        builder.addFieldInt32(7, readTime, 0);
    }
    static addReportedTime(builder, reportedTime) {
        builder.addFieldInt32(8, reportedTime, 0);
    }
    static addUnknown9(builder, unknown9) {
        builder.addFieldInt32(9, unknown9, 0);
    }
    static addSourceType(builder, sourceType) {
        builder.addFieldInt8(10, sourceType, SourceType.APPLE_INTERNAL);
    }
    static addUnknown11(builder, unknown11) {
        builder.addFieldInt32(11, unknown11, 0);
    }
    static addUnknown12(builder, unknown12) {
        builder.addFieldInt32(12, unknown12, 0);
    }
    static addUnknown13(builder, unknown13) {
        builder.addFieldInt32(13, unknown13, 0);
    }
    static addUnknown14(builder, unknown14) {
        builder.addFieldInt32(14, unknown14, 0);
    }
    static addUnknown15(builder, unknown15) {
        builder.addFieldInt32(15, unknown15, 0);
    }
    static endMetadata(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createMetadata(builder, attributionUrlOffset, expireTime, languageOffset, latitude, longitude, unknown5, providerNameOffset, readTime, reportedTime, unknown9, sourceType, unknown11, unknown12, unknown13, unknown14, unknown15) {
        Metadata.startMetadata(builder);
        Metadata.addAttributionUrl(builder, attributionUrlOffset);
        Metadata.addExpireTime(builder, expireTime);
        Metadata.addLanguage(builder, languageOffset);
        Metadata.addLatitude(builder, latitude);
        Metadata.addLongitude(builder, longitude);
        Metadata.addUnknown5(builder, unknown5);
        Metadata.addProviderName(builder, providerNameOffset);
        Metadata.addReadTime(builder, readTime);
        Metadata.addReportedTime(builder, reportedTime);
        Metadata.addUnknown9(builder, unknown9);
        Metadata.addSourceType(builder, sourceType);
        Metadata.addUnknown11(builder, unknown11);
        Metadata.addUnknown12(builder, unknown12);
        Metadata.addUnknown13(builder, unknown13);
        Metadata.addUnknown14(builder, unknown14);
        Metadata.addUnknown15(builder, unknown15);
        return Metadata.endMetadata(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
var PollutantType;
(function (PollutantType) {
    PollutantType[PollutantType["NOT_AVAILABLE"] = 0] = "NOT_AVAILABLE";
    PollutantType[PollutantType["C6H6"] = 1] = "C6H6";
    PollutantType[PollutantType["NH3"] = 2] = "NH3";
    PollutantType[PollutantType["NMHC"] = 3] = "NMHC";
    PollutantType[PollutantType["NO"] = 4] = "NO";
    PollutantType[PollutantType["NO2"] = 5] = "NO2";
    PollutantType[PollutantType["NOX"] = 6] = "NOX";
    PollutantType[PollutantType["OZONE"] = 7] = "OZONE";
    PollutantType[PollutantType["PM2_5"] = 8] = "PM2_5";
    PollutantType[PollutantType["SO2"] = 9] = "SO2";
    PollutantType[PollutantType["PM10"] = 10] = "PM10";
    PollutantType[PollutantType["CO"] = 11] = "CO";
    PollutantType[PollutantType["UNKNOWN12"] = 12] = "UNKNOWN12";
    PollutantType[PollutantType["UNKNOWN13"] = 13] = "UNKNOWN13";
})(PollutantType || (PollutantType = {}));

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
var UnitType;
(function (UnitType) {
    UnitType[UnitType["PARTS_PER_BILLION"] = 0] = "PARTS_PER_BILLION";
    UnitType[UnitType["MICROGRAMS_PER_CUBIC_METER"] = 1] = "MICROGRAMS_PER_CUBIC_METER";
})(UnitType || (UnitType = {}));

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class Pollutant {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsPollutant(bb, obj) {
        return (obj || new Pollutant()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsPollutant(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new Pollutant()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    pollutantType() {
        const offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : PollutantType.NOT_AVAILABLE;
    }
    amount() {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? this.bb.readFloat32(this.bb_pos + offset) : 0.0;
    }
    units() {
        const offset = this.bb.__offset(this.bb_pos, 8);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : UnitType.PARTS_PER_BILLION;
    }
    static startPollutant(builder) {
        builder.startObject(3);
    }
    static addPollutantType(builder, pollutantType) {
        builder.addFieldInt8(0, pollutantType, PollutantType.NOT_AVAILABLE);
    }
    static addAmount(builder, amount) {
        builder.addFieldFloat32(1, amount, 0.0);
    }
    static addUnits(builder, units) {
        builder.addFieldInt8(2, units, UnitType.PARTS_PER_BILLION);
    }
    static endPollutant(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createPollutant(builder, pollutantType, amount, units) {
        Pollutant.startPollutant(builder);
        Pollutant.addPollutantType(builder, pollutantType);
        Pollutant.addAmount(builder, amount);
        Pollutant.addUnits(builder, units);
        return Pollutant.endPollutant(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class AirQuality {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsAirQuality(bb, obj) {
        return (obj || new AirQuality()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsAirQuality(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new AirQuality()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    metadata(obj) {
        const offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? (obj || new Metadata()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    categoryIndex() {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : 0;
    }
    index() {
        const offset = this.bb.__offset(this.bb_pos, 8);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : 0;
    }
    isSignificant() {
        const offset = this.bb.__offset(this.bb_pos, 10);
        return offset ? !!this.bb.readInt8(this.bb_pos + offset) : false;
    }
    pollutants(index, obj) {
        const offset = this.bb.__offset(this.bb_pos, 12);
        return offset ? (obj || new Pollutant()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
    }
    pollutantsLength() {
        const offset = this.bb.__offset(this.bb_pos, 12);
        return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
    }
    previousDayComparison() {
        const offset = this.bb.__offset(this.bb_pos, 14);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : ComparisonType.UNKNOWN;
    }
    primaryPollutant() {
        const offset = this.bb.__offset(this.bb_pos, 16);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : PollutantType.NOT_AVAILABLE;
    }
    scale(optionalEncoding) {
        const offset = this.bb.__offset(this.bb_pos, 18);
        return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
    }
    static startAirQuality(builder) {
        builder.startObject(8);
    }
    static addMetadata(builder, metadataOffset) {
        builder.addFieldOffset(0, metadataOffset, 0);
    }
    static addCategoryIndex(builder, categoryIndex) {
        builder.addFieldInt8(1, categoryIndex, 0);
    }
    static addIndex(builder, index) {
        builder.addFieldInt8(2, index, 0);
    }
    static addIsSignificant(builder, isSignificant) {
        builder.addFieldInt8(3, +isSignificant, +false);
    }
    static addPollutants(builder, pollutantsOffset) {
        builder.addFieldOffset(4, pollutantsOffset, 0);
    }
    static createPollutantsVector(builder, data) {
        builder.startVector(4, data.length, 4);
        for (let i = data.length - 1; i >= 0; i--) {
            builder.addOffset(data[i]);
        }
        return builder.endVector();
    }
    static startPollutantsVector(builder, numElems) {
        builder.startVector(4, numElems, 4);
    }
    static addPreviousDayComparison(builder, previousDayComparison) {
        builder.addFieldInt8(5, previousDayComparison, ComparisonType.UNKNOWN);
    }
    static addPrimaryPollutant(builder, primaryPollutant) {
        builder.addFieldInt8(6, primaryPollutant, PollutantType.NOT_AVAILABLE);
    }
    static addScale(builder, scaleOffset) {
        builder.addFieldOffset(7, scaleOffset, 0);
    }
    static endAirQuality(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createAirQuality(builder, metadataOffset, categoryIndex, index, isSignificant, pollutantsOffset, previousDayComparison, primaryPollutant, scaleOffset) {
        AirQuality.startAirQuality(builder);
        AirQuality.addMetadata(builder, metadataOffset);
        AirQuality.addCategoryIndex(builder, categoryIndex);
        AirQuality.addIndex(builder, index);
        AirQuality.addIsSignificant(builder, isSignificant);
        AirQuality.addPollutants(builder, pollutantsOffset);
        AirQuality.addPreviousDayComparison(builder, previousDayComparison);
        AirQuality.addPrimaryPollutant(builder, primaryPollutant);
        AirQuality.addScale(builder, scaleOffset);
        return AirQuality.endAirQuality(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
var ForecastToken;
(function (ForecastToken) {
    ForecastToken[ForecastToken["CLEAR"] = 0] = "CLEAR";
    ForecastToken[ForecastToken["START"] = 1] = "START";
    ForecastToken[ForecastToken["STOP"] = 2] = "STOP";
    ForecastToken[ForecastToken["START_STOP"] = 3] = "START_STOP";
    ForecastToken[ForecastToken["STOP_START"] = 4] = "STOP_START";
    ForecastToken[ForecastToken["CONSTANT"] = 5] = "CONSTANT";
    ForecastToken[ForecastToken["UNKNOWN6"] = 6] = "UNKNOWN6";
})(ForecastToken || (ForecastToken = {}));

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
var ParameterType;
(function (ParameterType) {
    ParameterType[ParameterType["FIRST_AT"] = 0] = "FIRST_AT";
    ParameterType[ParameterType["SECOND_AT"] = 1] = "SECOND_AT";
    ParameterType[ParameterType["UNKNOWN2"] = 2] = "UNKNOWN2";
    ParameterType[ParameterType["UNKNOWN3"] = 3] = "UNKNOWN3";
    ParameterType[ParameterType["UNKNOWN4"] = 4] = "UNKNOWN4";
    ParameterType[ParameterType["UNKNOWN5"] = 5] = "UNKNOWN5";
})(ParameterType || (ParameterType = {}));

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class Parameter {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsParameter(bb, obj) {
        return (obj || new Parameter()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsParameter(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new Parameter()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    type() {
        const offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : ParameterType.FIRST_AT;
    }
    date() {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    static startParameter(builder) {
        builder.startObject(2);
    }
    static addType(builder, type) {
        builder.addFieldInt8(0, type, ParameterType.FIRST_AT);
    }
    static addDate(builder, date) {
        builder.addFieldInt32(1, date, 0);
    }
    static endParameter(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createParameter(builder, type, date) {
        Parameter.startParameter(builder);
        Parameter.addType(builder, type);
        Parameter.addDate(builder, date);
        return Parameter.endParameter(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
var WeatherCondition;
(function (WeatherCondition) {
    WeatherCondition[WeatherCondition["CLEAR"] = 0] = "CLEAR";
    WeatherCondition[WeatherCondition["TEMPERATURE_MAX"] = 1] = "TEMPERATURE_MAX";
    WeatherCondition[WeatherCondition["PRECIPITATION"] = 2] = "PRECIPITATION";
    WeatherCondition[WeatherCondition["UNKNOWN3"] = 3] = "UNKNOWN3";
    WeatherCondition[WeatherCondition["UNKNOWN4"] = 4] = "UNKNOWN4";
    WeatherCondition[WeatherCondition["HEAVY_RAIN"] = 5] = "HEAVY_RAIN";
    WeatherCondition[WeatherCondition["RAIN"] = 6] = "RAIN";
    WeatherCondition[WeatherCondition["DRIZZLE"] = 7] = "DRIZZLE";
    WeatherCondition[WeatherCondition["POSSIBLE_DRIZZLE"] = 8] = "POSSIBLE_DRIZZLE";
    WeatherCondition[WeatherCondition["UNKNOWN9"] = 9] = "UNKNOWN9";
    WeatherCondition[WeatherCondition["UNKNOWN10"] = 10] = "UNKNOWN10";
    WeatherCondition[WeatherCondition["UNKNOWN11"] = 11] = "UNKNOWN11";
    WeatherCondition[WeatherCondition["UNKNOWN12"] = 12] = "UNKNOWN12";
    WeatherCondition[WeatherCondition["UNKNOWN13"] = 13] = "UNKNOWN13";
    WeatherCondition[WeatherCondition["UNKNOWN14"] = 14] = "UNKNOWN14";
    WeatherCondition[WeatherCondition["SNOW"] = 15] = "SNOW";
    WeatherCondition[WeatherCondition["UNKNOWN16"] = 16] = "UNKNOWN16";
    WeatherCondition[WeatherCondition["UNKNOWN17"] = 17] = "UNKNOWN17";
    WeatherCondition[WeatherCondition["UNKNOWN18"] = 18] = "UNKNOWN18";
})(WeatherCondition || (WeatherCondition = {}));

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class Condition {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsCondition(bb, obj) {
        return (obj || new Condition()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsCondition(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new Condition()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    startTime() {
        const offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    endTime() {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    forecastToken() {
        const offset = this.bb.__offset(this.bb_pos, 8);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : ForecastToken.CLEAR;
    }
    beginCondition() {
        const offset = this.bb.__offset(this.bb_pos, 10);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : WeatherCondition.CLEAR;
    }
    endCondition() {
        const offset = this.bb.__offset(this.bb_pos, 12);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : WeatherCondition.CLEAR;
    }
    parameters(index, obj) {
        const offset = this.bb.__offset(this.bb_pos, 14);
        return offset ? (obj || new Parameter()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
    }
    parametersLength() {
        const offset = this.bb.__offset(this.bb_pos, 14);
        return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
    }
    static startCondition(builder) {
        builder.startObject(6);
    }
    static addStartTime(builder, startTime) {
        builder.addFieldInt32(0, startTime, 0);
    }
    static addEndTime(builder, endTime) {
        builder.addFieldInt32(1, endTime, 0);
    }
    static addForecastToken(builder, forecastToken) {
        builder.addFieldInt8(2, forecastToken, ForecastToken.CLEAR);
    }
    static addBeginCondition(builder, beginCondition) {
        builder.addFieldInt8(3, beginCondition, WeatherCondition.CLEAR);
    }
    static addEndCondition(builder, endCondition) {
        builder.addFieldInt8(4, endCondition, WeatherCondition.CLEAR);
    }
    static addParameters(builder, parametersOffset) {
        builder.addFieldOffset(5, parametersOffset, 0);
    }
    static createParametersVector(builder, data) {
        builder.startVector(4, data.length, 4);
        for (let i = data.length - 1; i >= 0; i--) {
            builder.addOffset(data[i]);
        }
        return builder.endVector();
    }
    static startParametersVector(builder, numElems) {
        builder.startVector(4, numElems, 4);
    }
    static endCondition(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createCondition(builder, startTime, endTime, forecastToken, beginCondition, endCondition, parametersOffset) {
        Condition.startCondition(builder);
        Condition.addStartTime(builder, startTime);
        Condition.addEndTime(builder, endTime);
        Condition.addForecastToken(builder, forecastToken);
        Condition.addBeginCondition(builder, beginCondition);
        Condition.addEndCondition(builder, endCondition);
        Condition.addParameters(builder, parametersOffset);
        return Condition.endCondition(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
var ConditionCode;
(function (ConditionCode) {
    ConditionCode[ConditionCode["CLEAR"] = 0] = "CLEAR";
    ConditionCode[ConditionCode["TEMPERATURE_MAX"] = 1] = "TEMPERATURE_MAX";
    ConditionCode[ConditionCode["PRECIPITATION"] = 2] = "PRECIPITATION";
    ConditionCode[ConditionCode["UNKNOWN3"] = 3] = "UNKNOWN3";
    ConditionCode[ConditionCode["UNKNOWN4"] = 4] = "UNKNOWN4";
    ConditionCode[ConditionCode["CLOUDY"] = 5] = "CLOUDY";
    ConditionCode[ConditionCode["DRIZZLE"] = 6] = "DRIZZLE";
    ConditionCode[ConditionCode["FLURRIES"] = 7] = "FLURRIES";
    ConditionCode[ConditionCode["FOGGY"] = 8] = "FOGGY";
    ConditionCode[ConditionCode["UNKNOWN9"] = 9] = "UNKNOWN9";
    ConditionCode[ConditionCode["UNKNOWN10"] = 10] = "UNKNOWN10";
    ConditionCode[ConditionCode["UNKNOWN11"] = 11] = "UNKNOWN11";
    ConditionCode[ConditionCode["UNKNOWN12"] = 12] = "UNKNOWN12";
    ConditionCode[ConditionCode["HAZE"] = 13] = "HAZE";
    ConditionCode[ConditionCode["HEAVY_RAIN"] = 14] = "HEAVY_RAIN";
    ConditionCode[ConditionCode["HEAVY_SNOW"] = 15] = "HEAVY_SNOW";
    ConditionCode[ConditionCode["UNKNOWN16"] = 16] = "UNKNOWN16";
    ConditionCode[ConditionCode["UNKNOWN17"] = 17] = "UNKNOWN17";
    ConditionCode[ConditionCode["UNKNOWN18"] = 18] = "UNKNOWN18";
    ConditionCode[ConditionCode["MOSTLY_CLEAR"] = 19] = "MOSTLY_CLEAR";
    ConditionCode[ConditionCode["MOSTLY_CLOUDY"] = 20] = "MOSTLY_CLOUDY";
    ConditionCode[ConditionCode["PARTLY_CLOUDY"] = 21] = "PARTLY_CLOUDY";
    ConditionCode[ConditionCode["RAIN"] = 22] = "RAIN";
    ConditionCode[ConditionCode["UNKNOWN23"] = 23] = "UNKNOWN23";
    ConditionCode[ConditionCode["UNKNOWN24"] = 24] = "UNKNOWN24";
    ConditionCode[ConditionCode["UNKNOWN25"] = 25] = "UNKNOWN25";
    ConditionCode[ConditionCode["SNOW"] = 26] = "SNOW";
    ConditionCode[ConditionCode["UNKNOWN27"] = 27] = "UNKNOWN27";
    ConditionCode[ConditionCode["UNKNOWN28"] = 28] = "UNKNOWN28";
    ConditionCode[ConditionCode["UNKNOWN29"] = 29] = "UNKNOWN29";
    ConditionCode[ConditionCode["THUNDERSTORMS"] = 30] = "THUNDERSTORMS";
    ConditionCode[ConditionCode["UNKNOWN31"] = 31] = "UNKNOWN31";
    ConditionCode[ConditionCode["WINDY"] = 32] = "WINDY";
    ConditionCode[ConditionCode["UNKNOWN33"] = 33] = "UNKNOWN33";
    ConditionCode[ConditionCode["UNKNOWN34"] = 34] = "UNKNOWN34";
    ConditionCode[ConditionCode["UNKNOWN35"] = 35] = "UNKNOWN35";
    ConditionCode[ConditionCode["UNKNOWN36"] = 36] = "UNKNOWN36";
    ConditionCode[ConditionCode["UNKNOWN37"] = 37] = "UNKNOWN37";
    ConditionCode[ConditionCode["UNKNOWN38"] = 38] = "UNKNOWN38";
    ConditionCode[ConditionCode["UNKNOWN39"] = 39] = "UNKNOWN39";
    ConditionCode[ConditionCode["UNKNOWN40"] = 40] = "UNKNOWN40";
    ConditionCode[ConditionCode["UNKNOWN41"] = 41] = "UNKNOWN41";
    ConditionCode[ConditionCode["UNKNOWN42"] = 42] = "UNKNOWN42";
    ConditionCode[ConditionCode["UNKNOWN43"] = 43] = "UNKNOWN43";
    ConditionCode[ConditionCode["UNKNOWN44"] = 44] = "UNKNOWN44";
})(ConditionCode || (ConditionCode = {}));

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class CurrentWeather {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsCurrentWeather(bb, obj) {
        return (obj || new CurrentWeather()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsCurrentWeather(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new CurrentWeather()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static startCurrentWeather(builder) {
        builder.startObject(0);
    }
    static endCurrentWeather(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createCurrentWeather(builder) {
        CurrentWeather.startCurrentWeather(builder);
        return CurrentWeather.endCurrentWeather(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class ForecastDaily {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsForecastDaily(bb, obj) {
        return (obj || new ForecastDaily()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsForecastDaily(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new ForecastDaily()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static startForecastDaily(builder) {
        builder.startObject(0);
    }
    static endForecastDaily(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createForecastDaily(builder) {
        ForecastDaily.startForecastDaily(builder);
        return ForecastDaily.endForecastDaily(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class ForecastHourly {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsForecastHourly(bb, obj) {
        return (obj || new ForecastHourly()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsForecastHourly(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new ForecastHourly()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static startForecastHourly(builder) {
        builder.startObject(0);
    }
    static endForecastHourly(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createForecastHourly(builder) {
        ForecastHourly.startForecastHourly(builder);
        return ForecastHourly.endForecastHourly(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class Minute {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsMinute(bb, obj) {
        return (obj || new Minute()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsMinute(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new Minute()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    startTime() {
        const offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    precipitationChance() {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : 0;
    }
    precipitationIntensity() {
        const offset = this.bb.__offset(this.bb_pos, 8);
        return offset ? this.bb.readFloat32(this.bb_pos + offset) : 0.0;
    }
    perceivedPrecipitationIntensity() {
        const offset = this.bb.__offset(this.bb_pos, 10);
        return offset ? this.bb.readFloat32(this.bb_pos + offset) : 0.0;
    }
    static startMinute(builder) {
        builder.startObject(4);
    }
    static addStartTime(builder, startTime) {
        builder.addFieldInt32(0, startTime, 0);
    }
    static addPrecipitationChance(builder, precipitationChance) {
        builder.addFieldInt8(1, precipitationChance, 0);
    }
    static addPrecipitationIntensity(builder, precipitationIntensity) {
        builder.addFieldFloat32(2, precipitationIntensity, 0.0);
    }
    static addPerceivedPrecipitationIntensity(builder, perceivedPrecipitationIntensity) {
        builder.addFieldFloat32(3, perceivedPrecipitationIntensity, 0.0);
    }
    static endMinute(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createMinute(builder, startTime, precipitationChance, precipitationIntensity, perceivedPrecipitationIntensity) {
        Minute.startMinute(builder);
        Minute.addStartTime(builder, startTime);
        Minute.addPrecipitationChance(builder, precipitationChance);
        Minute.addPrecipitationIntensity(builder, precipitationIntensity);
        Minute.addPerceivedPrecipitationIntensity(builder, perceivedPrecipitationIntensity);
        return Minute.endMinute(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
var PrecipitationType;
(function (PrecipitationType) {
    PrecipitationType[PrecipitationType["CLEAR"] = 0] = "CLEAR";
    PrecipitationType[PrecipitationType["RAIN"] = 1] = "RAIN";
    PrecipitationType[PrecipitationType["SNOW"] = 2] = "SNOW";
    PrecipitationType[PrecipitationType["SLEET"] = 3] = "SLEET";
    PrecipitationType[PrecipitationType["HAIL"] = 4] = "HAIL";
    PrecipitationType[PrecipitationType["MIXED"] = 5] = "MIXED";
})(PrecipitationType || (PrecipitationType = {}));

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class Summary {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsSummary(bb, obj) {
        return (obj || new Summary()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsSummary(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new Summary()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    startTime() {
        const offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    endTime() {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    condition() {
        const offset = this.bb.__offset(this.bb_pos, 8);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : PrecipitationType.CLEAR;
    }
    precipitationChance() {
        const offset = this.bb.__offset(this.bb_pos, 10);
        return offset ? this.bb.readUint8(this.bb_pos + offset) : 0;
    }
    precipitationIntensity() {
        const offset = this.bb.__offset(this.bb_pos, 12);
        return offset ? this.bb.readFloat32(this.bb_pos + offset) : 0.0;
    }
    static startSummary(builder) {
        builder.startObject(5);
    }
    static addStartTime(builder, startTime) {
        builder.addFieldInt32(0, startTime, 0);
    }
    static addEndTime(builder, endTime) {
        builder.addFieldInt32(1, endTime, 0);
    }
    static addCondition(builder, condition) {
        builder.addFieldInt8(2, condition, PrecipitationType.CLEAR);
    }
    static addPrecipitationChance(builder, precipitationChance) {
        builder.addFieldInt8(3, precipitationChance, 0);
    }
    static addPrecipitationIntensity(builder, precipitationIntensity) {
        builder.addFieldFloat32(4, precipitationIntensity, 0.0);
    }
    static endSummary(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createSummary(builder, startTime, endTime, condition, precipitationChance, precipitationIntensity) {
        Summary.startSummary(builder);
        Summary.addStartTime(builder, startTime);
        Summary.addEndTime(builder, endTime);
        Summary.addCondition(builder, condition);
        Summary.addPrecipitationChance(builder, precipitationChance);
        Summary.addPrecipitationIntensity(builder, precipitationIntensity);
        return Summary.endSummary(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class ForecastNextHour {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsForecastNextHour(bb, obj) {
        return (obj || new ForecastNextHour()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsForecastNextHour(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new ForecastNextHour()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    metadata(obj) {
        const offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? (obj || new Metadata()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    condition(index, obj) {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? (obj || new Condition()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
    }
    conditionLength() {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
    }
    summary(index, obj) {
        const offset = this.bb.__offset(this.bb_pos, 8);
        return offset ? (obj || new Summary()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
    }
    summaryLength() {
        const offset = this.bb.__offset(this.bb_pos, 8);
        return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
    }
    forecastStart() {
        const offset = this.bb.__offset(this.bb_pos, 10);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    forecastEnd() {
        const offset = this.bb.__offset(this.bb_pos, 12);
        return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
    }
    minutes(index, obj) {
        const offset = this.bb.__offset(this.bb_pos, 14);
        return offset ? (obj || new Minute()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
    }
    minutesLength() {
        const offset = this.bb.__offset(this.bb_pos, 14);
        return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
    }
    static startForecastNextHour(builder) {
        builder.startObject(6);
    }
    static addMetadata(builder, metadataOffset) {
        builder.addFieldOffset(0, metadataOffset, 0);
    }
    static addCondition(builder, conditionOffset) {
        builder.addFieldOffset(1, conditionOffset, 0);
    }
    static createConditionVector(builder, data) {
        builder.startVector(4, data.length, 4);
        for (let i = data.length - 1; i >= 0; i--) {
            builder.addOffset(data[i]);
        }
        return builder.endVector();
    }
    static startConditionVector(builder, numElems) {
        builder.startVector(4, numElems, 4);
    }
    static addSummary(builder, summaryOffset) {
        builder.addFieldOffset(2, summaryOffset, 0);
    }
    static createSummaryVector(builder, data) {
        builder.startVector(4, data.length, 4);
        for (let i = data.length - 1; i >= 0; i--) {
            builder.addOffset(data[i]);
        }
        return builder.endVector();
    }
    static startSummaryVector(builder, numElems) {
        builder.startVector(4, numElems, 4);
    }
    static addForecastStart(builder, forecastStart) {
        builder.addFieldInt32(3, forecastStart, 0);
    }
    static addForecastEnd(builder, forecastEnd) {
        builder.addFieldInt32(4, forecastEnd, 0);
    }
    static addMinutes(builder, minutesOffset) {
        builder.addFieldOffset(5, minutesOffset, 0);
    }
    static createMinutesVector(builder, data) {
        builder.startVector(4, data.length, 4);
        for (let i = data.length - 1; i >= 0; i--) {
            builder.addOffset(data[i]);
        }
        return builder.endVector();
    }
    static startMinutesVector(builder, numElems) {
        builder.startVector(4, numElems, 4);
    }
    static endForecastNextHour(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createForecastNextHour(builder, metadataOffset, conditionOffset, summaryOffset, forecastStart, forecastEnd, minutesOffset) {
        ForecastNextHour.startForecastNextHour(builder);
        ForecastNextHour.addMetadata(builder, metadataOffset);
        ForecastNextHour.addCondition(builder, conditionOffset);
        ForecastNextHour.addSummary(builder, summaryOffset);
        ForecastNextHour.addForecastStart(builder, forecastStart);
        ForecastNextHour.addForecastEnd(builder, forecastEnd);
        ForecastNextHour.addMinutes(builder, minutesOffset);
        return ForecastNextHour.endForecastNextHour(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class HistoricalComparison {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsHistoricalComparison(bb, obj) {
        return (obj || new HistoricalComparison()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsHistoricalComparison(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new HistoricalComparison()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static startHistoricalComparison(builder) {
        builder.startObject(0);
    }
    static endHistoricalComparison(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createHistoricalComparison(builder) {
        HistoricalComparison.startHistoricalComparison(builder);
        return HistoricalComparison.endHistoricalComparison(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class News {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsNews(bb, obj) {
        return (obj || new News()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsNews(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new News()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static startNews(builder) {
        builder.startObject(0);
    }
    static endNews(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createNews(builder) {
        News.startNews(builder);
        return News.endNews(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class WeatherAlert {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsWeatherAlert(bb, obj) {
        return (obj || new WeatherAlert()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsWeatherAlert(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new WeatherAlert()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static startWeatherAlert(builder) {
        builder.startObject(0);
    }
    static endWeatherAlert(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createWeatherAlert(builder) {
        WeatherAlert.startWeatherAlert(builder);
        return WeatherAlert.endWeatherAlert(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class weatherChanges {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsweatherChanges(bb, obj) {
        return (obj || new weatherChanges()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsweatherChanges(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new weatherChanges()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static startweatherChanges(builder) {
        builder.startObject(0);
    }
    static endweatherChanges(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static createweatherChanges(builder) {
        weatherChanges.startweatherChanges(builder);
        return weatherChanges.endweatherChanges(builder);
    }
}

// automatically generated by the FlatBuffers compiler, do not modify
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
class Weather {
    bb = null;
    bb_pos = 0;
    __init(i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    }
    static getRootAsWeather(bb, obj) {
        return (obj || new Weather()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    static getSizePrefixedRootAsWeather(bb, obj) {
        bb.setPosition(bb.position() + SIZE_PREFIX_LENGTH);
        return (obj || new Weather()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    }
    airQuality(obj) {
        const offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? (obj || new AirQuality()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    currentWeather(obj) {
        const offset = this.bb.__offset(this.bb_pos, 6);
        return offset ? (obj || new CurrentWeather()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    forecastDaily(obj) {
        const offset = this.bb.__offset(this.bb_pos, 8);
        return offset ? (obj || new ForecastDaily()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    forecastHourly(obj) {
        const offset = this.bb.__offset(this.bb_pos, 10);
        return offset ? (obj || new ForecastHourly()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    forecastNextHour(obj) {
        const offset = this.bb.__offset(this.bb_pos, 12);
        return offset ? (obj || new ForecastNextHour()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    news(obj) {
        const offset = this.bb.__offset(this.bb_pos, 14);
        return offset ? (obj || new News()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    weatherAlerts(obj) {
        const offset = this.bb.__offset(this.bb_pos, 16);
        return offset ? (obj || new WeatherAlert()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    weatherChanges(obj) {
        const offset = this.bb.__offset(this.bb_pos, 18);
        return offset ? (obj || new weatherChanges()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    historicalComparisons(obj) {
        const offset = this.bb.__offset(this.bb_pos, 20);
        return offset ? (obj || new HistoricalComparison()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
    }
    static startWeather(builder) {
        builder.startObject(9);
    }
    static addAirQuality(builder, airQualityOffset) {
        builder.addFieldOffset(0, airQualityOffset, 0);
    }
    static addCurrentWeather(builder, currentWeatherOffset) {
        builder.addFieldOffset(1, currentWeatherOffset, 0);
    }
    static addForecastDaily(builder, forecastDailyOffset) {
        builder.addFieldOffset(2, forecastDailyOffset, 0);
    }
    static addForecastHourly(builder, forecastHourlyOffset) {
        builder.addFieldOffset(3, forecastHourlyOffset, 0);
    }
    static addForecastNextHour(builder, forecastNextHourOffset) {
        builder.addFieldOffset(4, forecastNextHourOffset, 0);
    }
    static addNews(builder, newsOffset) {
        builder.addFieldOffset(5, newsOffset, 0);
    }
    static addWeatherAlerts(builder, weatherAlertsOffset) {
        builder.addFieldOffset(6, weatherAlertsOffset, 0);
    }
    static addWeatherChanges(builder, weatherChangesOffset) {
        builder.addFieldOffset(7, weatherChangesOffset, 0);
    }
    static addHistoricalComparisons(builder, historicalComparisonsOffset) {
        builder.addFieldOffset(8, historicalComparisonsOffset, 0);
    }
    static endWeather(builder) {
        const offset = builder.endObject();
        return offset;
    }
    static finishWeatherBuffer(builder, offset) {
        builder.finish(offset);
    }
    static finishSizePrefixedWeatherBuffer(builder, offset) {
        builder.finish(offset, undefined, true);
    }
}

const $ = new ENV(" iRingo: 🌤 WeatherKit v1.0.6(4028) response.beta");

/***************** Processing *****************/
// 解构URL
const url = new URL($request.url);
$.log(`⚠ url: ${url.toJSON()}`, "");
// 获取连接参数
const METHOD = $request.method, HOST = url.hostname, PATH = url.pathname, PATHs = url.pathname.split("/").filter(Boolean);
$.log(`⚠ METHOD: ${METHOD}, HOST: ${HOST}, PATH: ${PATH}, PATHs: ${PATHs}`, "");
// 解析格式
const FORMAT = ($response.headers?.["Content-Type"] ?? $response.headers?.["content-type"])?.split(";")?.[0];
$.log(`⚠ FORMAT: ${FORMAT}`, "");
!(async () => {
	const { Settings, Caches, Configs } = setENV("iRingo", "Weather", Database$1);
	$.log(`⚠ Settings.Switch: ${Settings?.Switch}`, "");
	switch (Settings.Switch) {
		case true:
		default:
			// 创建空数据
			let body = {};
			// 格式判断
			switch (FORMAT) {
				case undefined: // 视为无body
					break;
				case "application/x-www-form-urlencoded":
				case "text/plain":
				default:
					//$.log(`🚧 body: ${body}`, "");
					break;
				case "application/x-mpegURL":
				case "application/x-mpegurl":
				case "application/vnd.apple.mpegurl":
				case "audio/mpegurl":
					//body = M3U8.parse($response.body);
					//$.log(`🚧 body: ${JSON.stringify(body)}`, "");
					//$response.body = M3U8.stringify(body);
					break;
				case "text/xml":
				case "text/html":
				case "text/plist":
				case "application/xml":
				case "application/plist":
				case "application/x-plist":
					//body = XML.parse($response.body);
					//$.log(`🚧 body: ${JSON.stringify(body)}`, "");
					//$response.body = XML.stringify(body);
					break;
				case "text/vtt":
				case "application/vtt":
					//body = VTT.parse($response.body);
					//$.log(`🚧 body: ${JSON.stringify(body)}`, "");
					//$response.body = VTT.stringify(body);
					break;
				case "text/json":
				case "application/json":
					//body = JSON.parse($response.body ?? "{}");
					//$.log(`🚧 body: ${JSON.stringify(body)}`, "");
					//$response.body = JSON.stringify(body);
					break;
				case "application/vnd.apple.flatbuffer":
				case "application/protobuf":
				case "application/x-protobuf":
				case "application/vnd.google.protobuf":
				case "application/grpc":
				case "application/grpc+proto":
				case "application/octet-stream":
					//$.log(`🚧 $response: ${JSON.stringify($response, null, 2)}`, "");
					let rawBody = $.isQuanX() ? new Uint8Array($response.bodyBytes ?? []) : $response.body ?? new Uint8Array();
					//$.log(`🚧 isBuffer? ${ArrayBuffer.isView(rawBody)}: ${JSON.stringify(rawBody)}`, "");
					switch (FORMAT) {
						case "application/vnd.apple.flatbuffer":
							// 解析FlatBuffer
							body = new ByteBuffer(rawBody);
							let data = {};
							// 主机判断
							switch (HOST) {
								case "weatherkit.apple.com":
									// 路径判断
									switch (PATHs[0]) {
										case "api":
											switch (PATHs[1]) {
												case "v2":
													/******************  initialization start  *******************/
													/******************  initialization finish  *******************/
													switch (PATHs[2]) {
														case "weather":
															/******************  initialization start  *******************/
															let weather = Weather.getRootAsWeather(body);
															if (url.searchParams.get("dataSets").includes("airQuality")) {
																data.airQuality = {
																	"categoryIndex": weather.airQuality()?.categoryIndex(),
																	"index": weather.airQuality()?.index(),
																	"isSignificant": weather.airQuality()?.isSignificant(),
																	"metadata": {
																		"attributionUrl": weather.airQuality()?.metadata()?.attributionUrl(),
																		"expireTime": weather.airQuality()?.metadata()?.expireTime(),
																		"language": weather.airQuality()?.metadata()?.language(),
																		"latitude": weather.airQuality()?.metadata()?.latitude(),
																		"longitude": weather.airQuality()?.metadata()?.longitude(),
																		"providerName": weather.airQuality()?.metadata()?.providerName(),
																		"readTime": weather.airQuality()?.metadata()?.readTime(),
																		"reportedTime": weather.airQuality()?.metadata()?.reportedTime(),
																		"sourceType": SourceType[weather.airQuality()?.metadata()?.sourceType()],
																		//"temporarilyUnavailable": weather.airQuality()?.metadata()?.temporarilyUnavailable(),
																	},
																	"pollutants": [],
																	"previousDayComparison": ComparisonType[weather.airQuality()?.previousDayComparison()],
																	"primaryPollutant": PollutantType[weather.airQuality()?.primaryPollutant()],
																	"scale": weather.airQuality()?.scale(),
																};
																for (i = 0; i < weather.airQuality()?.pollutantsLength(); i++) data.airQuality.pollutants.push({
																	"amount": weather.airQuality()?.pollutants(i)?.amount(),
																	"pollutantType": PollutantType[weather.airQuality()?.pollutants(i)?.pollutantType()],
																	"units": UnitType[weather.airQuality()?.pollutants(i)?.units()],
																});
															}															if (url.searchParams.get("dataSets").includes("forecastNextHour")) {
																data.forecastNextHour = {
																	"condition": [],
																	"forecastEnd": weather.forecastNextHour()?.forecastEnd(),
																	"forecastStart": weather.forecastNextHour()?.forecastStart(),
																	"metadata": {
																		"attributionUrl": weather.forecastNextHour()?.metadata()?.attributionUrl(),
																		"expireTime": weather.forecastNextHour()?.metadata()?.expireTime(),
																		"language": weather.forecastNextHour()?.metadata()?.language(),
																		"latitude": weather.forecastNextHour()?.metadata()?.latitude(),
																		"longitude": weather.forecastNextHour()?.metadata()?.longitude(),
																		"providerName": weather.forecastNextHour()?.metadata()?.providerName(),
																		"readTime": weather.forecastNextHour()?.metadata()?.readTime(),
																		"reportedTime": weather.forecastNextHour()?.metadata()?.reportedTime(),
																		"sourceType": SourceType[weather.forecastNextHour()?.metadata()?.sourceType()],
																		//"temporarilyUnavailable": weather.forecastNextHour()?.metadata()?.temporarilyUnavailable(),
																	},
																	"minutes": [],
																	"summary": []
																};
																for (i = 0; i < weather.forecastNextHour()?.conditionLength(); i++) {
																	let condition = {
																		"beginCondition": WeatherCondition[weather.forecastNextHour()?.condition(i)?.beginCondition()],
																		"endCondition": WeatherCondition[weather.forecastNextHour()?.condition(i)?.endCondition()],
																		"forecastToken": ForecastToken[weather.forecastNextHour()?.condition(i)?.forecastToken()],
																		"parameters": [],
																		"startTime": weather.forecastNextHour()?.condition(i)?.startTime(),
																	};
																	for (j = 0; j < weather.forecastNextHour()?.condition(i)?.parametersLength(); j++) condition.parameters.push({
																		"date": weather.forecastNextHour()?.condition(i)?.parameters(j)?.date(),
																		"type": ParameterType[weather.forecastNextHour()?.condition(i)?.parameters(j)?.type()],
																	});
																	data.forecastNextHour.condition.push(condition);
																}																for (i = 0; i < weather.forecastNextHour()?.minutesLength(); i++) data.forecastNextHour.minutes.push({
																	"perceivedPrecipitationIntensity": weather.forecastNextHour()?.minutes(i)?.perceivedPrecipitationIntensity(),
																	"precipitationChance": weather.forecastNextHour()?.minutes(i)?.precipitationChance(),
																	"precipitationIntensity": weather.forecastNextHour()?.minutes(i)?.precipitationIntensity(),
																	"startTime": weather.forecastNextHour()?.minutes(i)?.startTime(),
																});
																for (i = 0; i < weather.forecastNextHour()?.summaryLength(); i++) data.forecastNextHour.summary.push({
																	"condition": PrecipitationType[weather.forecastNextHour()?.summary(i)?.condition()],
																	"precipitationChance": weather.forecastNextHour()?.summary(i)?.precipitationChance(),
																	"precipitationIntensity": weather.forecastNextHour()?.summary(i)?.precipitationIntensity(),
																	"startTime": weather.forecastNextHour()?.summary(i)?.startTime(),
																});
															}															/******************  initialization finish  *******************/
															$.log(`🚧 data: ${JSON.stringify(data)}`, "");
															/******************  initialization start  *******************/
															/******************  initialization finish  *******************/
															break;
													}													break;
											}											break;
									}									break;
							}							break;
					}					// 写入二进制数据
					$response.body = rawBody;
					break;
			}			break;
		case false:
			break;
	}})()
	.catch((e) => $.logErr(e))
	.finally(() => $.done($response));