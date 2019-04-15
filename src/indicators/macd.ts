import ccxt from 'ccxt';
import Indicator from './indicator';

class MACD extends Indicator {
	protected compute() {
		this.indication = this.allData.map((data: ccxt.OHLCV) => {
			return {
				timestamp: data[0],
				median: (data[1] + data[2]) / 2,
			};
		});
		super.compute();
	}
}

export default MACD;
