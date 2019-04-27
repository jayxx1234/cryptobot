import ccxt from 'ccxt';

type DivProps = JSX.IntrinsicElements['div'];
export default interface StockChartProps extends DivProps {
	data: ccxt.OHLCV[] | null;
	min: Date;
	max: Date;
}
