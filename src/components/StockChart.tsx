import * as React from 'react';
import ccxt from 'ccxt';
import Typography from '@material-ui/core/Typography';

import ReactApexCharts from 'react-apexcharts';

class CandleStickChart extends React.Component<{ data: ccxt.OHLCV[] }, { options: any; series: any }> {
	public state: { options: any; series: any } = {
		options: {
			title: {
				text: 'CandleStick Chart',
				align: 'left',
			},
			xaxis: {
				type: 'datetime',
			},
			yaxis: {
				tooltip: {
					enabled: true,
				},
			},
		},
		series: [
			{
				// props data is in format: timestamp, open, high, low, close, volume
				data: this.props.data.map(point => {
					return {
						x: new Date(point[0]),
						y: [point[1], point[2], point[3], point[4]],
					};
				}),
			},
		],
	};

	componentWillReceiveProps(newProps: { data: ccxt.OHLCV[] }) {
		this.setState({
			series: [
				{
					data: newProps.data.map(point => {
						return {
							x: new Date(point[0]),
							y: [point[1], point[2], point[3], point[4]],
						};
					}),
				},
			],
		});
	}

	render() {
		if (!this.props.data) {
			return (
				<Typography variant="body2" component="div">
					Loading data...
				</Typography>
			);
		} else if (!this.props.data.length) {
			return (
				<Typography variant="body2" component="div">
					No data
				</Typography>
			);
		}
		return (
			<div id="chart">
				<ReactApexCharts
					options={this.state.options}
					series={this.state.series}
					type="candlestick"
					height="350"
				/>
			</div>
		);
	}
}

export default CandleStickChart;
