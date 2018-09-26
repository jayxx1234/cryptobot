import fetch from 'node-fetch';
import finmath from 'finmath';

global.fetch = fetch;

export default class MACD {
	constructor() {
		this.averageCount = 300;
		this.values = [];
		this.tradePlaced = false;
		this.tradeType = '';
		this.prevHistogram = null;
		this.coinHeld = false;
	}

	update(currentValue) {
		this.values.push(currentValue);
		while (this.values.length > this.averageCount) {
			this.values = this.values.slice(1);
		}

		let { histogram } = finmath.macd(this.values);

		// values are pushed to the end
		let prev = this.prevHistogram;
		let current = histogram[histogram.length - 1];
		this.prevHistogram = current;

		if (histogram === null || histogram.length < 12) {
			return 'hold'; // not enough data yet
		}

		if (!this.tradePlaced) {
			// if crossing over, make trade
			if (prev < 0 && current >= 0) {
				// buy
				this.tradePlaced = true;
				this.tradeType = 'buy';
				return 'buy';
			} else if (prev > 0 && current <= 0) {
				// sell
				this.tradePlaced = true;
				this.tradeType = 'sell';
				return 'sell';
			} else if (!this.coinHeld && current > 0) {
				// buy, just to get in the market (it is currently going up)
				this.tradePlaced = true;
				this.tradeType = 'buy';
				return 'buy';
			}
		} else if (this.tradeType == 'sell') {
			// sell succeeded
			this.tradePlaced = false;
			this.coinHeld = false;
			return 'sell closed';
		} else if (this.tradeType == 'buy') {
			// buy succeeded
			this.tradePlaced = false;
			this.coinHeld = true;
			return 'buy closed';
		}

		return 'hold';
	}
}
