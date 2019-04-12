import * as React from 'react';
import ccxt from 'ccxt';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Select from 'react-select';
import { Button } from '@material-ui/core';
import StockChart from './StockChart';

class ExchangeTrader extends React.Component<{ exchange: string | null }, {}> {
	public title = 'Cryptobot';
	public sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

	public state: {
		exchange: string | null;
		markets: ccxt.Market[];
		market: ccxt.Market | null;
		trades: ccxt.OHLCV[];
	} = {
		exchange: null,
		markets: [],
		market: null,
		trades: [],
	};

	public trader: ccxt.Exchange = new ccxt.poloniex();
	public algorithms: ({ name: string; execute: () => any })[] = [];
	public priceHistory: any[] = [];

	constructor(props: Readonly<{ exchange: string | null }>) {
		super(props);

		this.onExchangeChange = this.onExchangeChange.bind(this);
		this.onMarketChange = this.onMarketChange.bind(this);
		this.resetScreen = this.resetScreen.bind(this);
	}

	onExchangeChange(option: any) {
		const exchange = option.value;

		this.setState({
			exchange,
		});

		this.trader = new ccxt[exchange]();
		this.trader.loadMarkets().then(markets => {
			this.setState({
				markets,
			});
		});
	}

	async onMarketChange(option: any) {
		const market = option.value;

		this.setState({
			market,
		});

		if (this.trader.fetchOHLCV) {
			await this.sleep(this.trader.rateLimit);
			let date: Date = new Date();
			date.setMonth(date.getMonth() - 1);
			let since: number = date.valueOf() / 1000;
			this.trader
				.fetchOHLCV(market, '1d', undefined, undefined, {
					period: 300,
					start: since,
					end: new Date().valueOf() / 1000,
				})
				.then((trades: ccxt.OHLCV[]) => {
					this.setState({
						trades,
					});
				});
		}
	}

	resetScreen() {
		this.setState({
			exchange: null,
			markets: [],
			market: null,
		});
	}

	getHeader() {
		return [this.title, this.state.exchange, this.state.market].filter(x => x !== null).join(' - ');
	}

	renderScreen() {
		if (this.state.exchange === null) {
			const exchangeOptions = ccxt.exchanges.map(id => {
				return { value: id, label: id };
			});
			return (
				<div>
					<Typography variant="body2" component="div">
						Please select an exchange
					</Typography>
					<Select
						key="exchange-options"
						options={exchangeOptions}
						isSearchable={true}
						isClearable={true}
						onChange={this.onExchangeChange}
					/>
				</div>
			);
		} else if (this.state.market === null) {
			const marketOptions = Object.getOwnPropertyNames(this.state.markets).map(market => {
				return { value: this.state.markets[market].symbol, label: this.state.markets[market].symbol };
			});
			return (
				<div>
					<Typography variant="body2" component="div">
						Please select a market
					</Typography>
					<Select
						key="market-options"
						options={marketOptions}
						isSearchable={true}
						isClearable={true}
						onChange={this.onMarketChange}
					/>
				</div>
			);
		} else {
			console.log(this.state.trades);
			return (
				<div>
					<StockChart data={this.state.trades} />
				</div>
			);
		}
	}

	public render() {
		return (
			<Paper className="main">
				<Typography variant="h2" component="h1" style={{ lineHeight: 1.2 }}>
					{this.getHeader()}
				</Typography>
				{this.renderScreen()}
				<Button onClick={this.resetScreen}>Reset</Button>
			</Paper>
		);
	}
}

export default ExchangeTrader;
