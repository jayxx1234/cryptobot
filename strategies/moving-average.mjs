export default class MovingAverage {
	constructor(exchange) {
		this.currentBalance = 0;
		this.averageCount = 10;
		this.values = [];
		this.tradePlaced = false;
		this.tradeType = '';
		this.exchange = exchange;
	}

	update(currentValue) {
		let previousValue = this.values.length > 0 ? this.values[0] : 0;
		this.values = [
			currentValue,
			...this.values.slice(0, this.averageCount - 1),
		];

		let movingAverage = this.values.reduce((p, c) => p + c, 0) / this.values.length;

		if (!this.tradePlaced) {
			if (this.currentBalance > 0 && currentValue > movingAverage && currentValue < previousValue) {
				this.tradePlaced = true;
				this.tradeType = 'sell';
				return 'sell';
			} else if (currentValue < movingAverage && currentValue > previousValue) {
				this.tradePlaced = true;
				this.tradeType = 'buy';
				return 'buy';
			}
		} else if (this.tradeType == 'sell') {
			if (currentValue < movingAverage) {
				// market has moved down without us, too cheap to sell
				this.tradePlaced = false;
				return 'exit sell';
			}
		} else if (this.tradeType == 'buy') {
			if (currentValue > movingAverage) {
				// market has moved up without us, too expensive to buy
				this.tradePlaced = false;
				return 'exit buy';
			}
		}

		return 'hold';
	}
}