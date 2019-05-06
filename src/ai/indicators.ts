import * as Indicators from 'technicalindicators';
import { OHLCV } from 'ccxt';
import { Indicator } from 'technicalindicators/declarations/indicator/indicator';
import { MACDConfig, RSIConfig } from './config';

export const MACD = (data: OHLCV[], config: MACDConfig): Indicator => {
	return new Indicators.MACD({
		...config,
		values: data.map(x => x[3]),
	});
};

export const RSI = (data: OHLCV[], config: RSIConfig): Indicator => {
	return new Indicators.RSI({
		...config,
		values: data.map(x => x[3]),
	});
};
