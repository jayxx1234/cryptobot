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

const scaleDataFromPrevious = function(data: number[]) {
	return data.map((value, index) => (index == 0 ? 1 : value / data[index - 1]));
};
const scaleDataFromMinMax = function(data: number[]) {
	const min = getMin(data);
	const max = getMax(data);
	return minMaxScaler(data, min, max);
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
	trainSize: number;
	timePortion: number;
	trainX: number[][];
	trainY: number[];
	originalData: number[][];
}

export const processData = function(
	data: number[][],
	indicators: number[][],
	timePortion: number,
	predictOnlyCount: number
): Promise<ProcessedData> {
	return new Promise(function(resolve: any, reject: any) {
		let trainX = [],
			trainY = [],
			size = data.length;

		let features: number[][] = [];
		for (let i = 0; i < size; i++) {
			let dataFeatures: number[] = [];
			for (let j = 0; j < data[0].length; j++) {
				dataFeatures.push(+(data[i][j] || 0).toPrecision(4));
			}

			// get the difference between current open and previous open (1 == same, 1.5 = 50% increase, etc)
			let dataDiffFeatures: number[] = [];
			for (let j = 0; j < data[0].length; j++) {
				if (i == 0) dataDiffFeatures.push(1);
				else dataDiffFeatures.push(+(data[i][j] / (data[i - 1][j] || 1)).toPrecision(4));
			}

			let indicatorFeatures: number[] = [];
			for (let j = 0; j < indicators.length; j++) {
				indicatorFeatures.push(+(indicators[j][i] || 0).toPrecision(4));
			}

			// each feature will be [
			//	open, high, low, close, volume,
			//	openDiff, highDiff, lowDiff, closeDiff, volumeDiff,
			//	indicator1value1, indicator1value2, indicator2value1, ...
			// ]
			features.push([...dataFeatures, ...dataDiffFeatures, ...indicatorFeatures]);
		}

		try {
			// Create the train sets
			// e.g.
			// full data for date range 0-49 as input, close for date 50 as output,
			// full data for date range 1-50 as input, close for date 51 as output,
			// full data for date range 2-51 as input, close for date 52 as output,
			// etc
			for (let i = timePortion; i < size - predictOnlyCount; i++) {
				for (let j = i - timePortion; j < i; j++) {
					trainX.push(features[j]);
				}

				// feature[8] == closeDiff
				trainY.push(features[i][8]);
			}
		} catch (ex) {
			reject(ex);
			console.log(ex);
		}

		let ret: ProcessedData = {
			size: size - timePortion,
			trainSize: size - timePortion - predictOnlyCount,
			timePortion: timePortion,
			trainX: trainX,
			trainY: trainY,
			originalData: features,
		};

		return resolve(ret);
	});
};

/*
	This will take the last timePortion days from the data
	and they will be used to predict the next day stock price
*/
export const getRangeForNextDayPrediction = function(data: number[][], timePortion: number): number[] {
	return [data.length - timePortion - 1, data.length - 1];
};

export const getRangeForAllPredictions = function(
	data: number[][],
	timePortion: number,
	predictOnlyCount: number
): { start: number; end: number }[] {
	let size = data.length - 1;
	let predictions = [];

	for (let start = size - predictOnlyCount - timePortion; start < size - timePortion; start++) {
		predictions.push({ start, end: start + timePortion });
	}

	return predictions;
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
