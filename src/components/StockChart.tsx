import * as React from 'react';
import ccxt from 'ccxt';
import Typography from '@material-ui/core/Typography';
import { ChartCanvas, Chart } from 'react-stockcharts';
import { CandlestickSeries } from 'react-stockcharts/lib/series';
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
import { fitWidth } from 'react-stockcharts/lib/helper';
import { timeIntervalBarWidth } from 'react-stockcharts/lib/utils';
import { TypeChooser } from 'react-stockcharts/lib/helper';

import { scaleTime } from 'd3-scale';
import { utcDay } from 'd3-time';

class StockChart extends React.Component<{ width: number; data: ccxt.Ticker[]; ratio: number }, {}> {
	public render() {
		const { width, data, ratio } = this.props;
		if (!data || !data.length) {
			return (
				<Typography variant="body2" component="div">
					No data
				</Typography>
			);
		}
		console.log(data);
		const xAccessor = (d: ccxt.Ticker) => d.timestamp;
		const xExtents = [xAccessor(data[data.length - 1]), xAccessor(data[0])];

		return (
			<TypeChooser>
				{(type: string) => (
					<ChartCanvas
						height={400}
						ratio={ratio}
						width={width}
						margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
						type={type}
						seriesName={data && data.length && data[0].symbol}
						data={data}
						xAccessor={xAccessor}
						xScale={scaleTime()}
						xExtents={xExtents}
					>
						<Chart id={1} yExtents={(d: any) => [d.price - 10, d.price + 10]}>
							<XAxis axisAt="bottom" orient="bottom" ticks={6} />
							<YAxis axisAt="left" orient="left" ticks={5} />
							<CandlestickSeries width={timeIntervalBarWidth(utcDay)} />
						</Chart>
					</ChartCanvas>
				)}
			</TypeChooser>
		);
	}
}

export default fitWidth(StockChart);
