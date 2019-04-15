import * as React from 'react';
import ccxt from 'ccxt';
import Typography from '@material-ui/core/Typography';

import ReactApexChart from 'react-apexcharts';
import MACD from '../indicators/macd';

type DivProps = JSX.IntrinsicElements['div'];
interface CandleStickChartProps extends DivProps {
	data: ccxt.OHLCV[] | null;
}

class CandleStickChart extends React.Component<
	CandleStickChartProps,
	{ chartOptionsCandlestick: any; chartOptionsBar: any; series: { candlestick: any[]; macd: any[] } }
> {
	public state: {
		chartOptionsCandlestick: any;
		chartOptionsBar: any;
		series: { candlestick: any[]; macd: any[] };
	} = {
		chartOptionsCandlestick: {
			chart: {
				id: 'candles',
				toolbar: {
					autoSelected: 'pan',
					show: false,
				},
				zoom: {
					enabled: false,
				},
			},
			plotOptions: {
				candlestick: {
					colors: {
						upward: '#3C90EB',
						downward: '#DF7D46',
					},
				},
			},
			xaxis: {
				type: 'datetime',
			},
		},
		chartOptionsBar: {
			chart: {
				height: 160,
				type: 'bar',
				brush: {
					enabled: true,
					target: 'candles',
				},
				selection: {
					enabled: true,
					fill: {
						color: '#ccc',
						opacity: 0.4,
					},
					stroke: {
						color: '#0D47A1',
					},
				},
			},
			dataLabels: {
				enabled: false,
			},
			plotOptions: {
				bar: {
					columnWidth: '80%',
					colors: {
						ranges: [
							{
								from: -1000,
								to: 0,
								color: '#F15B46',
							},
							{
								from: 1,
								to: 10000,
								color: '#FEB019',
							},
						],
					},
				},
			},
			stroke: {
				width: 0,
			},
			xaxis: {
				type: 'datetime',
				axisBorder: {
					offsetX: 13,
				},
			},
			yaxis: {
				labels: {
					show: false,
				},
			},
		},
		series: {
			candlestick: [],
			macd: [],
		},
	};
	macd: MACD = new MACD();

	componentWillReceiveProps(newProps: { data: ccxt.OHLCV[] | null }) {
		if (newProps && newProps.data) {
			this.macd.start(newProps.data);
			this.setState({
				series: {
					candlestick: [
						{
							data: newProps.data.map(point => {
								return {
									x: new Date(point[0]),
									y: [point[1], point[2], point[3], point[4]],
								};
							}),
						},
					],
					macd: [
						{
							data: newProps.data.map((point, i) => {
								return {
									x: new Date(point[0]),
									y: this.macd.getValue(i),
								};
							}),
						},
					],
				},
			});
		}
	}

	render() {
		const { data, ...otherProps } = this.props;

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
			<div id="chart" {...otherProps}>
				<ReactApexChart
					options={this.state.chartOptionsCandlestick}
					series={this.state.series.candlestick}
					type="candlestick"
					height="350"
				/>
				<ReactApexChart
					options={this.state.chartOptionsBar}
					series={this.state.series.macd}
					type="bar"
					height="160"
				/>
			</div>
		);
	}
}

export default CandleStickChart;
