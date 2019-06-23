import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';
import { OHLCV } from 'ccxt';
import { Config, cnnOptions, exchangeConfig } from './config';
import * as Indicators from './indicators';
import { processData, ProcessedData, getRangeForAllPredictions } from './helpers';

(window as any).stopCNN = false;

const epochs = 1;

let configs: Config[] = [];
let processedData = {};
let predictionRangeSets = {};
let modelProfits: {
	modelIndex: number;
	actionIndex: number;
	profit: number;
}[] = [];

let dataColumnCount = 10; // 5 original data values, 5 diff values

let predictOnlyCount = 100;

// NOTE: without this, Tensorflow will run on the GPU (which is around 100x faster), but memory management is hard, and the computer will
// shutdown instantly if the GPU runs out of memory.
// tf.setBackend('cpu');

class CNN {
	indicators: any[] = [];

	public async run(data: OHLCV[]) {
		let self = this;

		this.indicators = [...Indicators.allMACD(data), ...Indicators.allRSI(data)];

		let ohlcvData = data.map(([t, o, h, l, c, v]) => [o, h, l, c, v]);

		const metrics = ['acc'];
		const container = {
			name: 'Model Accuracy',
			tab: 'Training',
		};
		const callbacks = tfvis.show.fitCallbacks(container, metrics);

		// console.clear();
		console.log('##############################');
		console.log('Beginning Stock Prediction ...');

		let i = 0;
		for (let configArray of cnnOptions) {
			let config = configArray;
			configs.push(config);

			// Process the data and create the train sets
			if (!processedData[config.timePortion])
				processedData[config.timePortion] = await processData(
					ohlcvData,
					this.indicators,
					config.timePortion,
					predictOnlyCount
				);

			let result = processedData[config.timePortion] as ProcessedData;

			let model = await self.buildModel(config);

			// Transform the data to tensor data
			// Reshape the data in neural network input format [number_of_samples, timePortion, number_of_columns_per_sample, 1];
			let tensorData = {
				tensorTrainX: tf
					.tensor2d(result.trainX)
					.reshape([result.trainSize, result.timePortion, this.indicators.length + dataColumnCount, 1]),
				tensorTrainY: tf.tensor1d(result.trainY),
			};

			console.log('result trainX, result trainY');
			console.log(result.trainX);
			console.log(result.trainY);

			// Train the model using the tensor data
			// Repeat multiple epochs so the error rate is smaller (better fit for the data)
			let cnn = await self.cnn(model, tensorData, epochs, callbacks);

			// Predict for the same train data so we can see how well our model fits the data
			// var predictedX = cnn.model.predict(tensorData.tensorTrainX) as tf.Tensor<tf.Rank>;

			// Create the set for stock price prediction for the next day
			if (!predictionRangeSets[result.timePortion])
				predictionRangeSets[result.timePortion] = getRangeForAllPredictions(
					result.originalData,
					result.timePortion,
					predictOnlyCount
				);

			// the last predictionSet will have one more data point after it, which is the actual result for the last prediction
			let predictionSets = predictionRangeSets[result.timePortion] as { start: number; end: number }[];

			let priceIndex = 0;
			let totalProfit = 0;
			let profitablePredictions = 0;
			let neutralPredictions = 0;
			let unprofitablePredictions = 0;
			let totalPredictions = 0;
			for (let predictionSet of predictionSets) {
				let actualNextDay = ohlcvData[predictionSet.end + 1];

				// Scale the next day features
				let nextDayPredictionData = result.originalData.slice(predictionSet.start, predictionSet.end);
				// let nextDayPredictionScaled = nextDayPredictionData[0].map((_, i) =>
				// 	nextDayPredictionData.map(x => x[i])
				// );
				console.log(nextDayPredictionData);
				// Transform to tensor data
				let tensorNextDayPrediction = tf
					.tensor2d(nextDayPredictionData)
					.reshape([1, result.timePortion, this.indicators.length + dataColumnCount, 1]);
				// Predict the next day stock price
				let predictedValue = cnn.model.predict(tensorNextDayPrediction) as tf.Tensor<tf.Rank>;

				// Get the predicted data for the train set
				let predValue = await predictedValue.data();

				console.log(`predValue: ${predValue}`);
				let difference = predValue[0];
				let price = ohlcvData[predictionSet.end][3] * difference;

				console.log(`Difference: ${difference}, Price: ${price}`);
				let { profit, action } = this.takeAction({
					previous: ohlcvData[predictionSet.end][3],
					prediction: price,
					actual: actualNextDay[3],
				});
				totalProfit += profit;

				if (profit > 0) profitablePredictions++;
				else if (profit == 0) neutralPredictions++;
				else if (profit < 0) unprofitablePredictions++;

				totalPredictions++;

				console.log(
					`Model ${i}, PriceIndex: ${priceIndex}, Predicted: ${price.toFixed(20)}, Actual: ${
						actualNextDay[3]
					}, Action: ${action}, Profit: ${profit}`
				);

				predictedValue.dispose();
				tensorNextDayPrediction.dispose();
				priceIndex++;
			}

			console.log(
				`Model ${i}, Total profit: ${totalProfit.toFixed(20)}, Gain: ${(
					(totalProfit * 100) /
					ohlcvData[ohlcvData.length - 1][3]
				).toFixed(2)}%`
			);
			let buyAndHoldProfit = ohlcvData[ohlcvData.length - 1][3] - ohlcvData[predictionSets[0].start][3];
			console.log(
				`Buy-and-hold profit: ${buyAndHoldProfit.toFixed(20)}, Gain: ${(
					(buyAndHoldProfit * 100) /
					ohlcvData[predictionSets[0].start][3]
				).toFixed(2)}%`
			);
			console.log(
				`Prediction accuracy: +${((100 * profitablePredictions) / totalPredictions).toFixed(0)}%, =${(
					(100 * neutralPredictions) /
					totalPredictions
				).toFixed(0)}%, -${((100 * unprofitablePredictions) / totalPredictions).toFixed(0)}%`
			);

			// predictedX.dispose();
			tensorData.tensorTrainX.dispose();
			tensorData.tensorTrainY.dispose();
			cnn.model.dispose();

			i++;
			if ((window as any).stopCNN) return model;
		}
		return undefined;
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

	cnn(
		model: tf.Sequential,
		data: any,
		epochs: number,
		callbacks: any
	): Promise<{ model: tf.Sequential; history: tf.History }> {
		return new Promise(async function(resolve, reject) {
			try {
				// Optimize using adam (adaptive moment estimation) algorithm
				model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

				// Train the model
				let result = await model.fit(data.tensorTrainX, data.tensorTrainY, {
					epochs: epochs,
					callbacks: callbacks,
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

	takeAction(data: {
		previous: number;
		prediction: number;
		actual: number;
	}): { profit: number; action: 'buy' | 'sell' | 'hold' } {
		// account for exchange fees on both transactions
		let fees = -exchangeConfig.fee.maker * data.previous + -exchangeConfig.fee.taker * data.actual;
		let actionThreshold = 2 * fees;

		if (data.prediction - data.previous > actionThreshold) {
			// long
			return { profit: /*fees +*/ data.actual - data.previous, action: 'buy' };
		} else if (data.previous - data.prediction > actionThreshold) {
			// short
			return { profit: /*fees +*/ data.previous - data.actual, action: 'sell' };
		} else {
			// no transactions
			return { profit: 0, action: 'hold' };
		}
	}
}

export default CNN;
