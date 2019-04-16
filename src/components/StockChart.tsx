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
		chartOptions: any[];
		series: any[][];
	}
> {
	public state: {
		chartOptions: any[];
		series: any[][];
	} = {
		chartOptions: [
			{
				chart: {
					id: 'candles',
					type: 'candlestick',
					zoom: {
						enabled: false,
					},
				},
				xaxis: {
					type: 'datetime',
				},
				yaxis: {
					labels: {
						minWidth: 50,
					},
				},
			},
			{
				chart: {
					type: 'line',
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
		],
		series: [[], []],
	};
	macd: Indicators.MACD = new Indicators.MACD({
		...macdConfig,
		values: [],
	});

	componentWillReceiveProps(newProps: { data: ccxt.OHLCV[] | null }) {
		if (!newProps || !newProps.data) return;

		let propsData = newProps.data;

		let macdResult = new Indicators.MACD({
			...macdConfig,
			values: propsData.map(x => x[3]),
		}).result;

		this.setState({
			series: [
				[
					{
						data: newProps.data.map(point => {
							return {
								x: new Date(point[0]),
								y: [point[1], point[2], point[3], point[4]],
							};
						}),
					},
				],
				[
					{
						name: 'macd',
						data: macdResult.map((x, i) => {
							return {
								x: new Date(propsData[i][0]),
								y: x.MACD,
							};
						}),
					},
					{
						name: 'signal',
						data: macdResult.map((x, i) => {
							return {
								x: new Date(propsData[i][0]),
								y: x.signal,
							};
						}),
					},
					{
						name: 'histogram',
						data: macdResult.map((x, i) => {
							return {
								x: new Date(propsData[i][0]),
								y: x.histogram,
							};
						}),
					},
				],
			],
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
				{this.state.series.map((series, i) => {
					return (
						<ReactApexChart
							key={'chart-' + i}
							options={this.state.chartOptions[i]}
							series={series}
							type={this.state.chartOptions[i].chart.type}
							height={this.state.chartOptions[i].chart.height}
						/>
					);
				})}
			</div>
		);
	}
}

export default CandleStickChart;
