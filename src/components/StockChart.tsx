import * as React from 'react';
import ccxt from 'ccxt';
import Typography from '@material-ui/core/Typography';

import ReactApexChart from 'react-apexcharts';
import * as Indicators from 'technicalindicators';

const macdConfig = {
	fastPeriod: 12,
	slowPeriod: 26,
	signalPeriod: 9,
	SimpleMAOscillator: false,
	SimpleMASignal: false,
};

type DivProps = JSX.IntrinsicElements['div'];
interface CandleStickChartProps extends DivProps {
	data: ccxt.OHLCV[] | null;
}

class CandleStickChart extends React.Component<
	CandleStickChartProps,
	{
		chartOptionsCandlestick: any;
		chartOptionsBar: any;
		series: { candlestick: any[]; histogram: any[] };
	}
> {
	public state: {
		chartOptionsCandlestick: any;
		chartOptionsBar: any;
		series: { candlestick: any[]; histogram: any[] };
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
			// plotOptions: {
			// 	candlestick: {
			// 		colors: {
			// 			upward: '#3C90EB',
			// 			downward: '#DF7D46',
			// 		},
			// 	},
			// },
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
			histogram: [],
		},
	};
	macd: Indicators.MACD = new Indicators.MACD({
		...macdConfig,
		values: [],
	});

	componentWillReceiveProps(newProps: { data: ccxt.OHLCV[] | null }) {
		if (!newProps || !newProps.data) return;

		let data = newProps.data;

		let macdResult = new Indicators.MACD({
			...macdConfig,
			values: data.map(x => x[3]),
		}).result;
		console.log(macdResult);

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
				histogram: [
					// {
					// 	data: macdResult.map((x, i) => {
					// 		return {
					// 			x: new Date(data[i][0]),
					// 			y: x.MACD,
					// 		};
					// 	}),
					// },
					// {
					// 	data: macdResult.map((x, i) => {
					// 		return {
					// 			x: new Date(data[i][0]),
					// 			y: x.signal,
					// 		};
					// 	}),
					// },
					{
						data: macdResult.map((x, i) => {
							return {
								x: new Date(data[i][0]),
								y: x.histogram,
							};
						}),
					},
				],
			},
		});
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
					series={this.state.series.histogram}
					type="bar"
					height="160"
				/>
			</div>
		);
	}
}

export default CandleStickChart;
