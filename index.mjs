import Cryptopia from 'cryptopia-api';

import MovingAverage from './strategies/moving-average';
import config from './config/config';

process.on('unhandledRejection', error => {
	// Will print "unhandledRejection err is not defined"
	console.log('unhandledRejection:', error);
	process.exit();
});

let exchange = Cryptopia();

const currentStrategy = MovingAverage;

exchange.setOptions(config);

let btcAmount = 0;

exchange.getBalance({
	Currency: 'BTC'
}).then(response => {
	btcAmount = response.Data[0].Available;
	main();
});

async function main() {
	let period = 1000;
	let pair = 'ETH_BTC';

	// amount of ETH to buy/sell per trade
	let tradeAmount = 0.001;
	let currentTradeId = null;

	let isUsingHistoricalData = true;
	let historicalData = await exchange.getMarketHistory({Market: pair, Hours: 24 * 4});
	let historicalRowNumber = 0;

	let getValue = async function() {
		if (isUsingHistoricalData)
			return await getHistoricalValue();
		else
			return await getLiveValue();
	}

	let getLiveValue = async function() {
		let response = await exchange.getMarket({Market: pair});
		let currentValue = response.Data.LastPrice;
		return currentValue;
	}

	let getHistoricalValue = async function() {
		return historicalData.Data[historicalRowNumber++].Price;
	}

	let update = async function() {
		let currentValue = await getValue();
		let action = trader.update(currentValue);

		switch (action) {
			case 'sell':
				if (!isUsingHistoricalData) {
					currentTradeId = exchange.submitTrade({
						Market: pair,
						Type: 'Sell',
						Rate: currentValue,
						Amount: tradeAmount,
					});
				}
				console.log(`Sell at ${currentValue}`);
				break;
			case 'buy':
				if (!isUsingHistoricalData) {
					currentTradeId = exchange.submitTrade({
						Market: pair,
						Type: 'Buy',
						Rate: currentValue,
						Amount: tradeAmount,
					});
				}
				console.log(`Buy at ${currentValue}`);
				break;
			case 'exit sell':
				if (!isUsingHistoricalData) {
					exchange.cancelTrade({
						Type: 'Trade',
						OrderId: currentTradeId,
					});
				}
				console.log('Exit sell');
				break;
			case 'exit buy':
				if (!isUsingHistoricalData) {
					exchange.cancelTrade({
						Type: 'Trade',
						OrderId: currentTradeId,
					});
				}
				console.log('Exit buy');
				break;
			case 'hold':
			default:
				// hold
				break;
		}

		setTimeout(update, isUsingHistoricalData ? period : 0);
	};

	// only give strategy the public api functions
	let trader = new currentStrategy({
		getCurrencies: exchange.getCurrencies,
		getTradePairs: exchange.getTradePairs,
		getMarkets: exchange.getMarkets,
		getMarket: exchange.getMarket,
		getMarketHistory: exchange.getMarketHistory,
		getMarketOrders: exchange.getMarketOrders,
		getMarketOrderGroups: exchange.getMarketOrderGroups,
	});

	setTimeout(update, isUsingHistoricalData ? period : 0);
}
