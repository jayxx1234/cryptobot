import * as Indicators from 'technicalindicators';
import { OHLCV } from 'ccxt';
import { Indicator } from 'technicalindicators/declarations/indicator/indicator';
import { MACDOutput } from 'technicalindicators/declarations/moving_averages/MACD';
import { MACDConfig, RSIConfig } from './config';
import { macdConfigs, rsiConfigs } from './config';

const ADL = (data: OHLCV[]): Indicator => {
	return new Indicators.ADL({
		high: data.map(x => x[1]),
		low: data.map(x => x[2]),
		close: data.map(x => x[3]),
		volume: data.map(x => x[4]),
	});
};
export const allADL = (data: OHLCV[]): number[][] => {
	let adlResult = ADL(data).result as number[];
	return [adlResult.map(x => x || 0)];
};

const MACD = (data: OHLCV[], config: MACDConfig): Indicator => {
	return new Indicators.MACD({
		...config,
		values: data.map(x => x[3]),
	});
};
export const allMACD = (data: OHLCV[]): number[][] => {
	let indicators: number[][] = [];
	for (let conf of macdConfigs) {
		// let conf = macdConfigs[0];
		let macdResult = MACD(data, conf).result as MACDOutput[];
		indicators.push(macdResult.map(x => x.MACD || 0));
		indicators.push(macdResult.map(x => x.histogram || 0));
		indicators.push(macdResult.map(x => x.signal || 0));
	}
	return indicators;
};

const RSI = (data: OHLCV[], config: RSIConfig): Indicator => {
	return new Indicators.RSI({
		...config,
		values: data.map(x => x[3]),
	});
};
export const allRSI = (data: OHLCV[]): number[][] => {
	let indicators: number[][] = [];
	for (let conf of rsiConfigs) {
		// let conf = rsiConfigs[0];
		let rsiResult = RSI(data, conf).result as number[];
		indicators.push(rsiResult.map(x => x || 0));
	}
	return indicators;
};
