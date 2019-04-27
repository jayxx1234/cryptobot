import * as Indicators from 'technicalindicators';
import CandleStickChartProps from './utils';
import ChartBase from './ChartBase';

const rsiConfig = {
	period: 14,
};

class RSI extends ChartBase {
	protected calculateChartData(props: CandleStickChartProps) {
		if (!props || !props.data) return [];

		let rsiResult = new Indicators.RSI({
			...rsiConfig,
			values: props.data.map(x => x[3]),
		}).result;

		return [
			{
				name: 'rsi',
				data: rsiResult.map((x: number, i: number) => {
					return {
						x: new Date(props.data![i][0]),
						y: x,
					};
				}),
			},
		];
	}
}

export default RSI;
