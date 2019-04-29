import * as tf from '@tensorflow/tfjs';
import moment from 'moment';
import { OHLCV } from 'ccxt';
import { allConfigs } from './config';
import {
	minMaxScaler,
	minMaxInverseScaler,
	addDays,
	processData,
	generateNextDayPrediction,
	toFloat32Array,
} from './helpers';

class CNN {
	epochs = 100;
	timePortion = 7;

	public async run(data: OHLCV[]) {
		let self = this;
		// Initialize the graph
		// plotData([], []);

		console.clear();
		console.log('Beginning Stock Prediction ...');

		// Get the datetime labels use in graph
		let labels = data.map(val => val[0]);

		// Process the data and create the train sets
		let result = await processData(data, self.timePortion);
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
			let model = await self.cnn(built.model, tensorData, self.epochs);
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
			let price = inversePredictedValue.data[0].toFixed(3);
			console.log(`Predicted Stock Price for ${dateString} is: $${price}`);
		});
	}

	buildModels(data: any) {
		let promises: Promise<{ model: tf.Sequential; data: any }>[] = [];
		for (let config of allConfigs) {
			promises.push(
				new Promise(function(resolve, reject) {
					// Linear (sequential) stack of layers
					const model = tf.sequential();

					// Define input layer
					model.add(
						tf.layers.inputLayer({
							inputShape: [config[0], config[1]],
						})
					);

					// Add the first convolutional layer
					model.add(
						tf.layers.conv1d({
							kernelSize: config[2],
							filters: config[3],
							strides: config[4],
							useBias: config[5],
							activation: config[6],
							kernelInitializer: config[7],
						})
					);

					// Add the Average Pooling layer
					model.add(
						tf.layers.averagePooling1d({
							poolSize: config[8],
							strides: config[9],
						})
					);

					// Add the second convolutional layer
					model.add(
						tf.layers.conv1d({
							kernelSize: config[10],
							filters: config[11],
							strides: config[12],
							useBias: config[13],
							activation: config[14],
							kernelInitializer: config[15],
						})
					);

					// Add the Average Pooling layer
					model.add(
						tf.layers.averagePooling1d({
							poolSize: config[16],
							strides: config[17],
						})
					);

					// Add Flatten layer, reshape input to (number of samples, number of features)
					model.add(tf.layers.flatten({}));

					// Add Dense layer,
					model.add(
						tf.layers.dense({
							units: config[18],
							activation: config[19],
							kernelInitializer: config[20],
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

	cnn(model: tf.Sequential, data: any, epochs: number = 100): Promise<tf.Sequential> {
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
				/*for (let i = result.epoch.length-1; i < result.epoch.length; ++i) {
						print("Loss after Epoch " + i + " : " + result.history.loss[i]);
					}*/
				console.log(
					`Loss after last Epoch (${result.epoch.length}) is: ${result.history.loss[result.epoch.length - 1]}`
				);
				resolve(model);
			} catch (ex) {
				reject(ex);
			}
		});
	}
}

export default CNN;
