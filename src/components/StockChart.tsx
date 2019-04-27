import * as React from 'react';
import Typography from '@material-ui/core/Typography';
import StockChartProps from './charts/utils';
import '@tensorflow/tfjs';

import Candles from './charts/Candles';
import MACD from './charts/MACD';
import RSI from './charts/RSI';

class StockChart extends React.Component<StockChartProps, {}> {
	render() {
		const { data, min, max, ...otherProps } = this.props;

		if (!data) {
			return (
				<Typography variant="body2" component="div">
					Loading data...
				</Typography>
			);
		} else if (!data.length) {
			return (
				<Typography variant="body2" component="div">
					No data
				</Typography>
			);
		}

		return (
			<div id="charts" {...otherProps}>
				<Candles data={data} min={min} max={max} />
				<MACD data={data} min={min} max={max} />
				<RSI data={data} min={min} max={max} />
			</div>
		);
	}
}

export default StockChart;
