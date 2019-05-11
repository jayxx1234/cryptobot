import * as tf from '@tensorflow/tfjs';
import { OHLCV } from 'ccxt';
import { Config, cnnOptions } from './config';
import * as Indicators from './indicators';
import { minMaxScaler, minMaxInverseScaler, processData, getDataForNextDayPrediction, ProcessedData } from './helpers';

(window as any).stopCNN = false;

const epochs = 1;

let predictionResults: {
	index: number;
	loss: number;
	prediction: number;
	difference: number;
}[] = [];

let configs: Config[] = [];
let processedData = {};
let nextDayPredictions = {};

let dataColumnCount = 5;

class CNN {
	indicators: any[] = [];

	public async run(data: OHLCV[]) {
		let self = this;

		this.indicators = [...Indicators.allMACD(data), ...Indicators.allRSI(data)];

		console.clear();
		console.log('Beginning Stock Prediction ...');

		let i = 0;
		for (let configArray of cnnOptions) {
			let config = configArray;
			configs.push(config);

			// Process the data and create the train sets
			if (!processedData[config.timePortion])
				processedData[config.timePortion] = await processData(data, this.indicators, config.timePortion);

			let result = processedData[config.timePortion] as ProcessedData;

			// Create the set for stock price prediction for the next day
			if (!nextDayPredictions[result.timePortion])
				nextDayPredictions[result.timePortion] = getDataForNextDayPrediction(
					result.originalData,
					result.timePortion
				);

			let nextDayPrediction = nextDayPredictions[result.timePortion] as number[][];

			let model = await self.buildModel(config);

			// Transform the data to tensor data
			// Reshape the data in neural network input format [number_of_samples, timePortion, 1];
			let tensorData = {
				tensorTrainX: tf
					.tensor2d(result.trainX)
					.reshape([result.size, result.timePortion, this.indicators.length + dataColumnCount, 1]),
				tensorTrainY: tf.tensor1d(result.trainY),
			};
			// Rember the min and max in order to revert (min-max scaler) the scaled data later
			let allMins = [...result.dataMin, ...result.indicatorsMin];
			let allMaxs = [...result.dataMax, ...result.indicatorsMax];

			// Train the model using the tensor data
			// Repeat multiple epochs so the error rate is smaller (better fit for the data)
			let cnn = await self.cnn(model, tensorData, epochs);

			// Predict for the same train data
			// We'll show both (original, predicted) sets on the graph
			// so we can see how well our model fits the data
			var predictedX = cnn.model.predict(tensorData.tensorTrainX) as tf.Tensor<tf.Rank>;

			// Scale the next day features
			/*
				nextDayPrediction = [
					[open1, high1, low1, close1, volume1, ...indicators1],
					[open2, high2, low2, close2, volume2, ...indicators2],
					...
				];
				nextDayPredictionScaled = [
					[open1scaled, high1scaled, low1scaled, close1scaled, volume1scaled, ...],
					...
				];
			*/

			console.log(allMins);
			console.log(allMaxs);
			console.log(nextDayPrediction);

			let nextDayPredictionScaled = nextDayPrediction[0].map(
				(_, i) => minMaxScaler(nextDayPrediction.map(x => x[i]), allMins[i], allMaxs[i]).data
			);

			console.log(nextDayPredictionScaled);

			// Transform to tensor data
			let tensorNextDayPrediction = tf
				.tensor2d(nextDayPredictionScaled)
				.reshape([1, result.timePortion, this.indicators.length + dataColumnCount, 1]);
			// Predict the next day stock price
			let predictedValue = cnn.model.predict(tensorNextDayPrediction) as tf.Tensor<tf.Rank>;

			// Get the predicted data for the train set
			let predValue = await predictedValue.data();
			// Revert the scaled features, so we get the real values
			let inversePredictedValue = minMaxInverseScaler(Array.from(predValue), allMins[2], allMaxs[2]);

			// Get the next day predicted value
			let pred = await predictedX.data();
			// Revert the scaled feature
			var predictedXInverse = minMaxInverseScaler(Array.from(pred), allMins[2], allMaxs[2]);

			// Add the next day predicted stock price so it's shown on the graph
			predictedXInverse.data[predictedXInverse.data.length] = inversePredictedValue.data[0];

			// Revert the scaled labels from the trainY (original),
			// so we can compare them with the predicted one
			// var trainYInverse = minMaxInverseScaler(result.trainY, min, max);

			// Plot the original (trainY) and predicted values for the same features set (trainX)
			// plotData(trainYInverse.data, predictedXInverse.data, labels);

			// Print the predicted stock price value for the next day
			let difference = inversePredictedValue.data[0];
			let price = data[data.length - 1][3] * (1 + difference);
			const loss = cnn.history.history.loss[cnn.history.epoch.length - 1] as number;
			console.log(`Model ${i} Loss: ${loss.toFixed(20)}, Price: ${price.toFixed(20)}`);

			predictionResults.push({
				index: i,
				loss,
				prediction: price,
				difference,
			});

			i++;
			if ((window as any).stopCNN) break;
		}
		console.clear();
		console.log(configs);
		predictionResults = predictionResults.sort((a, b) => a.loss - b.loss);
		console.table(predictionResults);
		console.log(configs);
	}

	buildModel(config: Config): Promise<tf.Sequential> {
		let self = this;
		return new Promise(function(resolve, reject) {
			// Linear (sequential) stack of layers
			const model = tf.sequential();

			// Define input layer
			model.add(
				tf.layers.inputLayer({
					inputShape: [config.timePortion, self.indicators.length + dataColumnCount, 1],
				})
			);

			// Add the first convolutional layer
			model.add(
				tf.layers.conv2d({
					kernelSize: config.firstLayerKernelSize,
					filters: config.firstLayerFilters,
					strides: config.firstLayerStrides,
					useBias: config.firstLayerUseBias,
					activation: config.firstLayerActivation,
					kernelInitializer: config.firstLayerKernelInitializer,
				})
			);

			// Add the Average Pooling layer
			model.add(
				tf.layers.averagePooling2d({
					poolSize: config.firstPoolingLayerPoolSize,
					strides: config.firstPoolingLayerStrides,
				})
			);

			// Add the second convolutional layer
			model.add(
				tf.layers.conv2d({
					kernelSize: config.secondLayerKernelSize,
					filters: config.secondLayerFilters,
					strides: config.secondLayerStrides,
					useBias: config.secondLayerUseBias,
					activation: config.secondLayerActivation,
					kernelInitializer: config.secondLayerKernelInitializer,
				})
			);

			// Add the Average Pooling layer
			model.add(
				tf.layers.averagePooling2d({
					poolSize: config.secondPoolingLayerPoolSize,
					strides: config.secondPoolingLayerStrides,
				})
			);

			// Add Flatten layer, reshape input to (number of samples, number of features)
			model.add(tf.layers.flatten({}));

			// Add Dense layer
			model.add(
				tf.layers.dense({
					units: 1,
					activation: config.denseActivation,
					kernelInitializer: config.denseKernelInitializer,
				})
			);

			return resolve(model);
		});
	}

	cnn(model: tf.Sequential, data: any, epochs: number): Promise<{ model: tf.Sequential; history: tf.History }> {
		return new Promise(async function(resolve, reject) {
			try {
				// Optimize using adam (adaptive moment estimation) algorithm
				model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

				// Train the model
				let result = await model.fit(data.tensorTrainX, data.tensorTrainY, {
					epochs: epochs,
				});

				resolve({
					model,
					history: result,
				});
			} catch (ex) {
				reject(ex);
			}
		});
	}
}

export default CNN;
