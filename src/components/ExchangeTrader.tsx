import * as React from 'react';
import ccxt from 'ccxt';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Select from 'react-select';
import { Button, Input } from '@material-ui/core';
import StockChart from './StockChart';

const MINIMUM_MONTHS = 5;

class ExchangeTrader extends React.Component<{ exchange: string | null }, {}> {
	public title = 'Cryptobot';
	public sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

	public state: {
		exchange: string | null;
		markets: ccxt.Market[];
		market: ccxt.Market | null;
		trades: ccxt.OHLCV[] | null;
		days: number | null;
		min: Date;
		max: Date;
	} = {
		exchange: null,
		markets: [],
		market: null,
		trades: null,
		days: null,
		min: new Date(),
		max: new Date(),
	};

	public trader: ccxt.Exchange = new ccxt.poloniex();
	public algorithms: ({ name: string; execute: () => any })[] = [];
	public priceHistory: any[] = [];

	constructor(props: Readonly<{ exchange: string | null }>) {
		super(props);

		this.onExchangeChange = this.onExchangeChange.bind(this);
		this.onMarketChange = this.onMarketChange.bind(this);
		this.onDaysChange = this.onDaysChange.bind(this);
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

		if (this.trader.has['fetchOHLCV'] && this.trader.fetchOHLCV) {
			await this.sleep(this.trader.rateLimit);
			let now: Date = new Date();
			let date: Date = new Date();
			date.setMonth(date.getMonth() - Math.max(Math.floor(this.state.days! / 30), MINIMUM_MONTHS));
			let since: number = date.valueOf() / 1000;
			this.trader
				.fetchOHLCV(market, '1d', undefined, undefined, {
					period: 86400,
					start: since,
					end: now.valueOf() / 1000,
				})
				.then((trades: ccxt.OHLCV[]) => {
					this.setState({
						trades,
						min: date,
						max: now,
					});
				});
		}
	}

	onDaysChange() {
		this.setState({
			days: parseInt((document.getElementById("days-input") as HTMLInputElement).value),
		});
	}

	resetScreen() {
		this.setState({
			exchange: null,
			markets: [],
			market: null,
			days: null,
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
		} else if (this.state.days === null) {
			return (
				<div>
					<Typography variant="body2" component="div">
						Please enter a number of days
					</Typography>
					<Input
						key="days"
						id="days-input"
						type="text"
					/>
					<Button onClick={this.onDaysChange}>
						Ok
					</Button>
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
			return (
				<div>
					<StockChart className="tile" data={this.state.trades} min={this.state.min} max={this.state.max} daysToShow={this.state.days!} />
				</div>
			);
		}
	}

	public render() {
		return (
			<Paper className="main paper">
				<Typography variant="h2" component="h1" style={{ lineHeight: 1.2 }}>
					{this.getHeader()}
				</Typography>
				{this.renderScreen()}
				<div className="clearfix" />
				<Button onClick={this.resetScreen}>Reset</Button>
			</Paper>
		);
	}
}

export default ExchangeTrader;
