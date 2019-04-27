const defaultChartOptions = {
	line: {
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
	candle: {
		chart: {
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
};

export default defaultChartOptions;
