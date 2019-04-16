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
		chartOptionsLine: any;
		series: { candlestick: any[]; histogram: any[] };
	}
> {
	public state: {
		chartOptionsCandlestick: any;
		chartOptionsLine: any;
		series: { candlestick: any[]; histogram: any[] };
	} = {
		chartOptionsCandlestick: {
			chart: {
				id: 'candles',
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
			yaxis: {
				labels: {
					minWidth: 50,
				},
			},
		},
		chartOptionsLine: {
			chart: {
				height: 160,
				zoom: {
					enabled: false,
				},
			},
			dataLabels: {
				enabled: false,
			},
			stroke: {
				width: 1,
			},
			xaxis: {
				type: 'datetime',
			},
			yaxis: {
				labels: {
					show: false,
					minWidth: 50,
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

		let propsData = newProps.data;
		console.log(propsData);

		let macdResult = new Indicators.MACD({
			...macdConfig,
			values: propsData.map(x => x[3]),
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
					// 			x: new Date(propsData[i][0]),
					// 			y: x.MACD,
					// 		};
					// 	}),
					// },
					// {
					// 	data: macdResult.map((x, i) => {
					// 		return {
					// 			x: new Date(propsData[i][0]),
					// 			y: x.signal,
					// 		};
					// 	}),
					// },
					{
						data: macdResult.map((x, i) => {
							return {
								x: new Date(propsData[i][0]),
								y: x.histogram,
							};
						}),
					},
				],
			},
			chartOptionsCandlestick: {
				...this.state.chartOptionsCandlestick,
				xaxis: {
					...this.state.chartOptionsCandlestick.xaxis,
					min: new Date(newProps.data[0][0]).getTime(),
					max: new Date(newProps.data[newProps.data.length - 1][0]).getTime(),
				},
			},
			chartOptionsLine: {
				...this.state.chartOptionsLine,
				xaxis: {
					...this.state.chartOptionsLine.xaxis,
					min: new Date(newProps.data[0][0]).getTime(),
					max: new Date(newProps.data[newProps.data.length - 1][0]).getTime(),
				},
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
					options={this.state.chartOptionsLine}
					series={this.state.series.histogram}
					type="line"
					height="160"
				/>
			</div>
		);
	}
}

export default CandleStickChart;
