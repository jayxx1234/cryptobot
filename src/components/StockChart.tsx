import * as React from 'react';
import Typography from '@material-ui/core/Typography';
import ccxt from 'ccxt';

import StockChartProps from './charts/utils';
import Candles from './charts/Candles';
import MACD from './charts/MACD';
import RSI from './charts/RSI';
import CNN from '../ai/prediction';

class StockChart extends React.Component<StockChartProps, { showCharts: boolean }> {
	state = {
		showCharts: false,
	};

	constructor(props: StockChartProps) {
		super(props);

		this.loadCnn(props.data);
	}

	componentWillReceiveProps(newProps: StockChartProps) {
		this.loadCnn(newProps.data);
	}

	loadCnn(data: ccxt.OHLCV[] | null) {
		if (data) {
			setTimeout(async () => {
				let cnn = new CNN();
				await cnn.run(data);
				this.setState({
					showCharts: true,
				});
			}, 0);
		}
	}

	render() {
		const { data, min, max, daysToShow, ...otherProps } = this.props;

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
		if (this.state.showCharts) {
			return (
				<div id="charts" {...otherProps}>
					<Candles data={data} min={min} max={max} daysToShow={this.props.daysToShow} />
					<MACD data={data} min={min} max={max} daysToShow={this.props.daysToShow} />
					<RSI data={data} min={min} max={max} daysToShow={this.props.daysToShow} />
				</div>
			);
		} else {
			return <div id="charts" {...otherProps} />;
		}
	}
}

export default StockChart;
