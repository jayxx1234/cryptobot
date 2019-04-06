import * as React from 'react';
import ccxt from 'ccxt';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Select from 'react-select';

class App extends React.Component<{}, {}> {
	public ExchangeIds: Array<string> = ccxt.exchanges;

	public render() {
		const options = this.ExchangeIds.map(id => {
			return { value: id, label: id };
		});
		return (
			<div>
				<Paper className="main">
					<Typography variant="h1" component="h1" style={{ lineHeight: 1.2 }}>
						Cryptobot
					</Typography>
					<hr style={{ borderColor: '#282c34', opacity: 0.5 }} />
					<Typography variant="body2">Please select an exchange</Typography>
					<Select options={options} isSearchable={true} />
				</Paper>
			</div>
		);
	}
}

export default App;
