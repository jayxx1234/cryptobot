import * as tf from '@tensorflow/tfjs';
import moment from 'moment';
import { OHLCV } from 'ccxt';
import { allConfigs, configArrayToObject } from './config';
import * as Indicators from './indicators';
import {
	minMaxScaler,
	minMaxInverseScaler,
	addDays,
	processData,
	generateNextDayPrediction,
	toFloat32Array,
} from './helpers';

const epochs = 100;
const timePortion = 100;

let baseAmount = 0;
let initialBaseAmount = 0;
let coinAmount = 0;

class CNN {
	async getIndicators(data: OHLCV[]) {
		return await {
			MACD: Indicators.MACD(data).map(x => x.histogram),
		};
	}

	public async run(data: OHLCV[]) {
		let self = this;
		// Initialize the graph
		// plotData([], []);

		console.clear();
		console.log('Beginning Stock Prediction ...');

		// Get the datetime labels use in graph
		let labels = data.map(val => val[0]);

		// Process the data and create the train sets
		let result = await processData(data, timePortion);
		// Create the set for stock price prediction for the next day
		let nextDayPrediction = generateNextDayPrediction(result.originalData, result.timePortion);
		// Get the last date from the data set
		let predictDate = addDays(new Date(labels[labels.length - 1]), 1);

		let models = await self.buildModels(result);

		models.forEach(async built => {
			// Transform the data to tensor data
			// Reshape the data in neural network input format [number_of_samples, timePortion, 1];
			let tensorData = {
				tensorTrainX: tf.tensor1d(built.data.trainX).reshape([built.data.size, built.data.timePortion, 1]),
				tensorTrainY: tf.tensor1d(built.data.trainY),
			};
			// Rember the min and max in order to revert (min-max scaler) the scaled data later
			let max = built.data.max;
			let min = built.data.min;

			// Train the model using the tensor data
			// Repeat multiple epochs so the error rate is smaller (better fit for the data)
			let model = await self.cnn(built.model, tensorData, epochs);
			// Predict for the same train data
			// We'll show both (original, predicted) sets on the graph
			// so we can see how well our model fits the data
			var predictedX = model.predict(tensorData.tensorTrainX) as tf.Tensor<tf.Rank>;

			// Scale the next day features
			let nextDayPredictionScaled = minMaxScaler(nextDayPrediction, min, max);
			// Transform to tensor data
			let tensorNextDayPrediction = tf
				.tensor1d(nextDayPredictionScaled.data)
				.reshape([1, built.data.timePortion, 1]);
			// Predict the next day stock price
			let predictedValue = model.predict(tensorNextDayPrediction) as tf.Tensor<tf.Rank>;

			// Get the predicted data for the train set
			let predValue = await predictedValue.data();
			// Revert the scaled features, so we get the real values
			let inversePredictedValue = minMaxInverseScaler(predValue as Float32Array, min, max);

			// Get the next day predicted value
			let pred = await predictedX.data();
			// Revert the scaled feature
			var predictedXInverse = minMaxInverseScaler(pred as Float32Array, min, max);

			// Add the next day predicted stock price so it's shown on the graph
			predictedXInverse.data[predictedXInverse.data.length] = inversePredictedValue.data[0];

			// Revert the scaled labels from the trainY (original),
			// so we can compare them with the predicted one
			var trainYInverse = minMaxInverseScaler(toFloat32Array(built.data.trainY), min, max);

			// Plot the original (trainY) and predicted values for the same features set (trainX)
			// plotData(trainYInverse.data, predictedXInverse.data, labels);

			// Print the predicted stock price value for the next day
			let dateString = moment(predictDate).format('DD-MM-YYYY');
			let difference = inversePredictedValue.data[0];
			let price = data[data.length - 1][4] + difference;
			console.log(`Predicted Stock Price for ${dateString} is: ${price}`);
		});
	}

	buildModels(data: any) {
		let promises: Promise<{ model: tf.Sequential; data: any }>[] = [];
		for (let config of allConfigs) {
			let configObject = configArrayToObject(config);
			promises.push(
				new Promise(function(resolve, reject) {
					// Linear (sequential) stack of layers
					const model = tf.sequential();

					// Define input layer
					model.add(
						tf.layers.inputLayer({
							inputShape: [timePortion, 1],
						})
					);

					// Add the first convolutional layer
					model.add(
						tf.layers.conv1d({
							kernelSize: configObject.firstLayerKernelSize,
							filters: configObject.firstLayerFilters,
							strides: configObject.firstLayerStrides,
							useBias: configObject.firstLayerUseBias,
							activation: configObject.firstLayerActivation,
							kernelInitializer: configObject.firstLayerKernelInitializer,
						})
					);

					// Add the Average Pooling layer
					model.add(
						tf.layers.averagePooling1d({
							poolSize: configObject.firstPoolingLayerPoolSize,
							strides: configObject.firstPoolingLayerStrides,
						})
					);

					// Add the second convolutional layer
					model.add(
						tf.layers.conv1d({
							kernelSize: configObject.secondLayerKernelSize,
							filters: configObject.secondLayerFilters,
							strides: configObject.secondLayerStrides,
							useBias: configObject.secondLayerUseBias,
							activation: configObject.secondLayerActivation,
							kernelInitializer: configObject.secondLayerKernelInitializer,
						})
					);

					// Add the Average Pooling layer
					model.add(
						tf.layers.averagePooling1d({
							poolSize: configObject.secondPoolingLayerPoolSize,
							strides: configObject.secondPoolingLayerStrides,
						})
					);

					// Add Flatten layer, reshape input to (number of samples, number of features)
					model.add(tf.layers.flatten({}));

					// Add Dense layer,
					model.add(
						tf.layers.dense({
							units: configObject.denseUnits,
							activation: configObject.denseActivation,
							kernelInitializer: configObject.denseKernelInitializer,
						})
					);

					return resolve({
						model: model,
						data: data,
					});
				})
			);
			break;
		}
		return Promise.all(promises);
	}

	cnn(model: tf.Sequential, data: any, epochs: number): Promise<tf.Sequential> {
		console.log('MODEL SUMMARY: ');
		model.summary();

		return new Promise(async function(resolve, reject) {
			try {
				// Optimize using adam (adaptive moment estimation) algorithm
				model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

				// Train the model
				let result = await model.fit(data.tensorTrainX, data.tensorTrainY, {
					epochs: epochs,
				});

				for (let i = 0; i < result.epoch.length; i++) {
					console.log('Loss after Epoch ' + (i + 1) + ' : ' + result.history.loss[i]);
				}

				resolve(model);
			} catch (ex) {
				reject(ex);
			}
		});
	}
}

export default CNN;
