import _ from './ENV/Lodash.mjs'
import $Storage from './ENV/$Storage.mjs'
import ENV from "./ENV/ENV.mjs";

import Database from "./database/index.mjs";
import setENV from "./function/setENV.mjs";
import providerNameToLogo from "./function/providerNameToLogo.mjs";
import WeatherKit2 from "./class/WeatherKit2.mjs";
import WAQI from "./class/WAQI.mjs";
import ColorfulClouds from "./class/ColorfulClouds.mjs";

import * as flatbuffers from 'flatbuffers';

const $ = new ENV(" iRingo: 🌤 WeatherKit v1.4.0(4130) response");

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
	const { Settings, Caches, Configs } = setENV("iRingo", "WeatherKit", Database);
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
					break;
				case "application/x-mpegURL":
				case "application/x-mpegurl":
				case "application/vnd.apple.mpegurl":
				case "audio/mpegurl":
					break;
				case "text/xml":
				case "text/html":
				case "text/plist":
				case "application/xml":
				case "application/plist":
				case "application/x-plist":
					break;
				case "text/vtt":
				case "application/vtt":
					break;
				case "text/json":
				case "application/json":
					body = JSON.parse($response.body ?? "{}");
					switch (HOST) {
						case "weatherkit.apple.com":
							// 路径判断
							if (PATH.startsWith("/api/v1/availability/")) {
								$.log(`🚧 body: ${JSON.stringify(body)}`, "");
								body = ["airQuality", "currentWeather", "forecastDaily", "forecastHourly", "forecastPeriodic", "historicalComparisons", "weatherChanges", "forecastNextHour", "weatherAlerts", "weatherAlertNotifications", "news"];
							};
							break;
					};
					$response.body = JSON.stringify(body);
					break;
				case "application/vnd.apple.flatbuffer":
				case "application/protobuf":
				case "application/x-protobuf":
				case "application/vnd.google.protobuf":
				case "application/grpc":
				case "application/grpc+proto":
				case "application/octet-stream":
					let rawBody = $.isQuanX() ? new Uint8Array($response.bodyBytes ?? []) : $response.body ?? new Uint8Array();
					switch (FORMAT) {
						case "application/vnd.apple.flatbuffer":
							// 解析FlatBuffer
							const ByteBuffer = new flatbuffers.ByteBuffer(rawBody);
							const Builder = new flatbuffers.Builder();
							// 主机判断
							switch (HOST) {
								case "weatherkit.apple.com":
									// 路径判断
									if (PATH.startsWith("/api/v2/weather/")) {
										const weatherKit2 = new WeatherKit2({ "bb": ByteBuffer, "builder": Builder });
										body = weatherKit2.decode("all");
										if (url.searchParams.get("dataSets").includes("airQuality")) {
											if (Settings.AQI.ReplaceProviders.includes(body?.airQuality?.metadata?.providerName)) body = await InjectAirQuality(url, body, Settings);
											if (body?.airQuality?.metadata?.providerName && !body?.airQuality?.metadata?.providerLogo) body.airQuality.metadata.providerLogo = providerNameToLogo(body?.airQuality?.metadata?.providerName, "v2");
										};
										if (url.searchParams.get("dataSets").includes("forecastNextHour")) {
											$.log(`🚧 body.forecastNextHour: ${JSON.stringify(body?.forecastNextHour, null, 2)}`, "");
											if (!body?.forecastNextHour) body = await InjectForecastNextHour(url, body, Settings);
											if (body?.forecastNextHour?.metadata?.providerName && !body?.forecastNextHour?.metadata?.providerLogo) body.forecastNextHour.metadata.providerLogo = providerNameToLogo(body?.forecastNextHour?.metadata?.providerName, "v2");
										};
										const WeatherData = weatherKit2.encode("all", body);
										Builder.finish(WeatherData);
										break;
									};
									break;
							};
							rawBody = Builder.asUint8Array(); // Of type `Uint8Array`.
							break;
						case "application/protobuf":
						case "application/x-protobuf":
						case "application/vnd.google.protobuf":
							break;
						case "application/grpc":
						case "application/grpc+proto":
							break;
						case "application/octet-stream":
							break;
					};
					// 写入二进制数据
					$response.body = rawBody;
					break;
			};
			break;
		case false:
			break;
	};
})()
	.catch((e) => $.logErr(e))
	.finally(() => $.done($response))

async function InjectAirQuality(url, body, Settings) {
	$.log(`☑️ InjectAirQuality`, "");
	let airQuality;
	let metadata;
	switch (Settings?.AQI?.Provider) {
		case "WeatherKit":
			break;
		case "QWeather":
			break;
		case "ColorfulClouds":
			break;
		case "WAQI":
		default:
			const Waqi = new WAQI($, { "url": url });
			if (Settings?.API?.WAQI?.Token) {
				airQuality = await Waqi.AQI2(Settings?.API?.WAQI?.Token);
				metadata = airQuality?.metadata;
				airQuality = airQuality;
			} else {
				const Nearest = await Waqi.Nearest();
				const Token = await Waqi.Token(Nearest?.metadata?.stationId);
				//Caches.WAQI.set(stationId, Token);
				airQuality = await Waqi.AQI(Nearest?.metadata?.stationId, Token);
				metadata = { ...Nearest?.metadata, ...airQuality?.metadata };
				airQuality = { ...Nearest, ...airQuality };
			}
			break;
	};
	if (metadata) {
		metadata = { ...body?.airQuality?.metadata, ...metadata };
		body.airQuality = { ...body?.airQuality, ...airQuality };
		body.airQuality.metadata = metadata;
		if (!body?.airQuality?.pollutants) body.airQuality.pollutants = [];
	};
	$.log(`✅ InjectAirQuality`, "");
	return body;
};

async function InjectForecastNextHour(url, body, Settings) {
	$.log(`☑️ InjectForecastNextHour`, "");
	let forecastNextHour;
	let metadata;
	switch (Settings?.NextHour?.Provider) {
		case "WeatherKit":
			break;
		case "WeatherOL":
		default:
			break;
		case "QWeather":
			break;
		case "ColorfulClouds":
			const colorfulClouds = new ColorfulClouds($, { "url": url });
			forecastNextHour = await colorfulClouds.Minutely(Settings?.API?.ColorfulClouds?.Token || "Y2FpeXVuX25vdGlmeQ==");
			metadata = forecastNextHour?.metadata;
			break;
	};
	if (metadata) {
		metadata = { ...body?.forecastNextHour?.metadata, ...metadata };
		body.forecastNextHour = { ...body?.forecastNextHour, ...forecastNextHour };
		body.forecastNextHour.metadata = metadata;
	};
	$.log(`✅ InjectForecastNextHour`, "");
	return body;
};