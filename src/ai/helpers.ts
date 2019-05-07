import { OHLCV } from 'ccxt';

/*
	Scaling feature using min-max normalization.
	All values will be between 0 and 1
*/
export const minMaxScaler = function(data: number[], min: number, max: number) {
	let scaledData: number[] = [];
	data.forEach((value: number) => {
		scaledData.push((value - min) / (max - min));
	});

	return {
		data: scaledData,
		min: min,
		max: max,
	};
};

/*
	Revert min-max normalization and get the real values
*/
export const minMaxInverseScaler = function(data: number[], min: number, max: number) {
	let scaledData: number[] = [];
	data.forEach((value: number) => {
		scaledData.push(value * (max - min) + min);
	});

	return {
		data: scaledData,
		min: min,
		max: max,
	};
};

export interface ProcessedData {
	size: number;
	timePortion: number;
	trainX: number[][];
	trainY: number[];
	dataMin: number[];
	dataMax: number[];
	originalData: number[][];
	indicatorsMin: number[];
	indicatorsMax: number[];
}

export const processData = function(
	data: OHLCV[],
	indicators: number[][],
	timePortion: number
): Promise<ProcessedData> {
	return new Promise(function(resolve: any, reject: any) {
		let trainX = [],
			trainY = [],
			size = data.length;

		let [timestamp, ...prices] = data;
		let scaledPrices = prices.map(p => minMaxScaler(p, getMin(p), getMax(p)));
		let scaledDataFeatures = scaledPrices.map(c => c.data);

		// Scale the values
		let scaledIndicators = [];
		let scaledIndicatorFeatures = [];
		for (let i = 0; i < indicators.length; i++) {
			scaledIndicators.push(minMaxScaler(indicators[i], getMin(indicators[i]), getMax(indicators[i])));
			scaledIndicatorFeatures.push(scaledIndicators[i].data);
		}

		let features: number[][] = [];
		for (let i = 0; i < size; i++) {
			let dataFeatures = [];
			for (let j = 0; j < scaledDataFeatures.length; j++) {
				dataFeatures.push(scaledDataFeatures[j][i] || 0);
			}

			let indicatorFeatures = [];
			for (let j = 0; j < scaledIndicatorFeatures.length; j++) {
				indicatorFeatures.push(scaledIndicatorFeatures[j][i] || 0);
			}

			features.push([...dataFeatures, ...indicatorFeatures]);
		}

		try {
			// Create the train sets
			for (let i = timePortion; i < size; i++) {
				for (let j = i - timePortion; j < i; j++) {
					trainX.push(features[j]);
				}

				trainY.push(features[i][2]);
			}
		} catch (ex) {
			reject(ex);
			console.log(ex);
		}

		let ret: ProcessedData = {
			size: size - timePortion,
			timePortion: timePortion,
			trainX: trainX,
			trainY: trainY,
			dataMin: scaledPrices.map(p => p.min),
			dataMax: scaledPrices.map(p => p.max),
			indicatorsMin: scaledIndicators.map(x => x.min),
			indicatorsMax: scaledIndicators.map(x => x.max),
			originalData: features,
		};

		return resolve(ret);
	});
};

/*
	This will take the last timePortion days from the data
	and they will be used to predict the next day stock price
*/
export const getDataForNextDayPrediction = function(data: number[][], timePortion: number): number[][] {
	let size = data.length;
	let features = [];

	for (let i = size - timePortion; i < size; i++) {
		features.push(data[i]);
	}

	return features;
};

/*
	Get min value from array
*/
export const getMin = function(data: number[]) {
	return Math.min(...data);
};

/*
	Get max value from array
*/
export const getMax = function(data: number[]) {
	return Math.max(...data);
};

/*
	Adds days to given date
*/
export const addDays = function(date: Date, days: number) {
	var date = new Date(date.valueOf());
	date.setDate(date.getDate() + days);
	return date;
};
