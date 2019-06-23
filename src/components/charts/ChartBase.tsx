import React from 'react';
import ReactApexChart from 'react-apexcharts';
import defaultChartOptions from './options';
import CandleStickChartProps from './utils';

interface ChartSeries {
	name?: string;
	data: {
		x: Date;
		y: any;
	}[];
}

interface ChartState {
	series: ChartSeries[];
}

class ChartBase extends React.Component<CandleStickChartProps, ChartState> {
	protected chartOptions: any = {
		...defaultChartOptions.line,
	};
	state: ChartState = {
		series: [],
	};

	constructor(props: CandleStickChartProps) {
		super(props);

		let allData = this.calculateChartData(props);
		allData.map(({ name, data }) => {
			return {
				name,
				data: data.slice(data.length - props.daysToShow!),
			};
		});
		this.state.series = allData.map(({ name, data }) => {
			return {
				name,
				data: data.slice(data.length - props.daysToShow!),
			};
		});
		this.chartOptions.xaxis.min = props.min;
		this.chartOptions.xaxis.max = props.max;
	}

	componentWillReceiveProps(newProps: CandleStickChartProps) {
		let allData = this.calculateChartData(newProps);
		let series = allData.slice(allData.length - newProps.daysToShow!);

		this.setState({
			series,
		});
	}

	protected calculateChartData(props: CandleStickChartProps): ChartSeries[] {
		return [];
	}

	render() {
		const { data, daysToShow, ...otherProps } = this.props;
		let { series } = this.state;

		if (!data || !data.length || !series || !series.length) {
			return null;
		}

		return (
			<div id="chart" {...otherProps}>
				<ReactApexChart
					options={this.chartOptions}
					series={series}
					type={this.chartOptions.chart.type}
					height={this.chartOptions.chart.height}
				/>
			</div>
		);
	}
}

export default ChartBase;
