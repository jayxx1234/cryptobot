import ccxt from 'ccxt';

class Indicator {
	protected allData: ccxt.OHLCV[] = [];
	protected indication: any[] = [];

	public start(data: ccxt.OHLCV[]) {
		this.allData = data;
		this.compute();
	}

	public run(data: ccxt.OHLCV[]) {
		console.log(this.allData);
		console.log(data);
		this.allData = this.allData.concat(data);
		this.compute();
	}

	protected compute() {
		console.log(this.indication);
	}

	public getValue(index: number): number {
		return this.indication[index];
	}
}

export default Indicator;
