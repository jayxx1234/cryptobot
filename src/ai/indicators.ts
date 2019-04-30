import * as Indicators from 'technicalindicators';
import { OHLCV } from 'ccxt';

const macdConfig = {
	fastPeriod: 12,
	slowPeriod: 26,
	signalPeriod: 9,
	SimpleMAOscillator: false,
	SimpleMASignal: false,
};

export const MACD = (data: OHLCV[]) =>
	new Indicators.MACD({
		...macdConfig,
		values: data.map(x => x[3]),
	}).result;

const rsiConfig = {
	period: 14,
};

export const RSI = (data: OHLCV[]) =>
	new Indicators.RSI({
		...rsiConfig,
		values: data.map(x => x[3]),
	}).result;
