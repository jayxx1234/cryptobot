import fs from 'fs';
import brain from 'brain.js';
import { cursorTo } from 'readline';

let net = new brain.recurrent.LSTMTimeStep({
	iterations: 3000,
});

let loadNetwork = function () {
	let file = fs.readFileSync('./config/lstm-network.json');
	net.fromJSON(JSON.parse(file));
	console.log('Loaded network');
}
let saveNetwork = async function () {
	return new Promise(resolve => {
		let data = JSON.stringify(net.toJSON());
		fs.writeFileSync('./config/lstm-network.json', data);
		console.log('Saved network');
	});
}

let sigmoid = function (value) {
	return 1 / (1 + Math.exp(-value));
}

export default class lstm {
	constructor(options) {
		this.numValues = 1000;
		this.allTrainingValues = [];
		this.trainingValues = []; // holds last x values, resetting when trained
		this.predictionValues = []; // holds all known values
		this.prediction = null;
		this.prevValue = null;
		this.prevDiff = null;
		this.useExisting = options && options.useExisting || false; // TODO: find fix for 'TypeError: Cannot read property '0' of undefined'
		this.hasTrained = false;
		this.decimalPlaces = 3;
		this.correctPredictions = 0;
		this.totalPredictions = 0;
		this.loadedExisting = false;
		this.holdTolerance = 0.005;
	}

	async update(currentValue) {
		let decision = 'hold';

		if (this.useExisting && !this.loadedExisting) {
			loadNetwork();
			this.loadedExisting = true;
		}

		if (this.prevValue !== null) {
			let diffFromPrev = currentValue - this.prevValue;
			let percentDiff = diffFromPrev / this.prevValue;
			let sigmoidDiff = sigmoid(percentDiff * 100);
			let precision = Math.pow(10, this.decimalPlaces);
			let roundedDiff = Math.round(sigmoidDiff * precision) / precision; // so network doesn't get huge

			let currentDiff = +roundedDiff;

			if (this.prediction !== null) {
				this.totalPredictions++;

				if (this.prediction - 0.5 > 0 && currentDiff - 0.5 > 0) {
					this.correctPredictions++;
				} else if (this.prediction - 0.5 < 0 && currentDiff - 0.5 < 0) {
					this.correctPredictions++;
				} else if (Math.abs(this.prediction - 0.5) < this.holdTolerance && Math.abs(currentDiff - 0.5) < this.holdTolerance) {
					this.correctPredictions++;
				}
				console.log(`LSTM has predicted ${this.correctPredictions}/${this.totalPredictions} correct, accuracy: ${100 * this.correctPredictions / this.totalPredictions}%`);
			}

			this.trainingValues.push(currentDiff);
			this.predictionValues.push(currentDiff);

			if (!this.useExisting && this.trainingValues.length >= this.numValues) {
				console.log('Training...');
				net.train([
					this.trainingValues,
				], {
					iterations: 3000,
				});
				this.hasTrained = true;
				console.log('Finished training');
				saveNetwork();

				this.trainingValues = [];
			}

			if (this.hasTrained) {
				console.log('running prediction');
				this.prediction = +net.run(this.predictionValues, this.predictionValues.length + 1);
				if (this.prediction > 0.5 + this.holdTolerance)
					decision = 'buy';
				else if (this.prediction < 0.5 - this.holdTolerance)
					decision = 'sell';
			}

			this.prevDiff = currentDiff;
		}

		this.prevValue = currentValue;

		return decision;
	}
}
