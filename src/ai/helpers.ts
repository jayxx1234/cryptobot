import { OHLCV } from 'ccxt';

/*
	Scaling feature using min-max normalization.
	All values will be between 0 and 1
*/
export const minMaxScaler = function(data: Float32Array, min: number, max: number) {
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

export const toNumberArray = function(arr: Float32Array) {
	return Array.from(arr);
};
export const toFloat32Array = function(arr: number[]) {
	return new Float32Array(arr);
};

/*
	Revert min-max normalization and get the real values
*/
export const minMaxInverseScaler = function(data: Float32Array, min: number, max: number) {
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
	trainX: number[];
	trainY: number[];
	min: number;
	max: number;
	originalData: Float32Array;
}

/*
	Process the Finance API response (data)
	Create the train freatures and labels for cnn
	Each prediction is base on previous timePortion days
	ex. timePortion=7, prediction for the next day is based to values of the previous 7 days
*/
export const processData = function(data: OHLCV[], timePortion: number): Promise<ProcessedData> {
	return new Promise(function(resolve: any, reject: any) {
		let trainX = [],
			trainY = [],
			size = data.length;

		let features = new Float32Array(size);
		for (let i = 0; i < size; i++) {
			features[i] = data[i][4];
		}

		// Scale the values
		var scaledData = minMaxScaler(features, getMin(features), getMax(features));
		let scaledFeatures = scaledData.data;

		try {
			// Create the train sets
			for (let i = timePortion; i < size; i++) {
				for (let j = i - timePortion; j < i; j++) {
					trainX.push(scaledFeatures[j]);
				}

				trainY.push(scaledFeatures[i]);
			}
		} catch (ex) {
			reject(ex);
			console.log(ex);
		}

		return resolve({
			size: size - timePortion,
			timePortion: timePortion,
			trainX: trainX,
			trainY: trainY,
			min: scaledData.min,
			max: scaledData.max,
			originalData: features,
		});
	});
};

/*
	This will take the last timePortion days from the data
	and they will be used to predict the next day stock price
*/
export const generateNextDayPrediction = function(data: Float32Array, timePortion: number): Float32Array {
	let size = data.length;
	let features = new Float32Array(timePortion);

	for (let i = size - timePortion; i < size; i++) {
		features[i] = data[i];
	}

	return features;
};

/*
	Get min value from array
*/
export const getMin = function(data: Float32Array) {
	return Math.min(...data);
};

/*
	Get max value from array
*/
export const getMax = function(data: Float32Array) {
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
