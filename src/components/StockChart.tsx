import * as React from 'react';
import Typography from '@material-ui/core/Typography';
import ccxt from 'ccxt';
import '@tensorflow/tfjs';

import StockChartProps from './charts/utils';
import Candles from './charts/Candles';
import MACD from './charts/MACD';
import RSI from './charts/RSI';
import CNN from '../ai/prediction';

class StockChart extends React.Component<StockChartProps, {}> {
	constructor(props: StockChartProps) {
		super(props);

		this.loadCnn(props.data);
	}

	componentWillReceiveProps(newProps: StockChartProps) {
		this.loadCnn(newProps.data);
	}

	loadCnn(data: ccxt.OHLCV[] | null) {
		if (data) {
			setTimeout(() => {
				let cnn = new CNN();
				cnn.run(data);
			}, 0);
		}
	}

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
