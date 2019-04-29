import * as Indicators from 'technicalindicators';
import CandleStickChartProps from './utils';
import ChartBase from './ChartBase';

const macdConfig = {
	fastPeriod: 12,
	slowPeriod: 26,
	signalPeriod: 9,
	SimpleMAOscillator: false,
	SimpleMASignal: false,
};

class MACD extends ChartBase {
	protected calculateChartData(props: CandleStickChartProps) {
		if (!props || !props.data) return [];

		let propsData = props.data;

		let macdResult = new Indicators.MACD({
			...macdConfig,
			values: propsData.map(x => x[3]),
		}).result;

		return [
			{
				name: 'histogram',
				data: macdResult.map((x, i) => {
					return {
						x: new Date(propsData[i][0]),
						y: x.histogram,
					};
				}),
			},
			{
				name: 'macd',
				data: macdResult.map((x, i) => {
					return {
						x: new Date(propsData[i][0]),
						y: x.MACD,
					};
				}),
			},
			{
				name: 'signal',
				data: macdResult.map((x, i) => {
					return {
						x: new Date(propsData[i][0]),
						y: x.signal,
					};
				}),
			},
		];
	}
}

export default MACD;
