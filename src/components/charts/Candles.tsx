import CandleStickChartProps from './utils';
import ChartBase from './ChartBase';
import defaultChartOptions from './options';

class Candles extends ChartBase {
	protected chartOptions: any = {
		...defaultChartOptions.candle,
	};

	protected calculateChartData(props: CandleStickChartProps) {
		if (!props || !props.data) return [];

		return [
			{
				data: props.data.map(point => {
					return {
						x: new Date(point[0]),
						y: [point[1], point[2], point[3], point[4]],
					};
				}),
			},
		];
	}
}

export default Candles;
