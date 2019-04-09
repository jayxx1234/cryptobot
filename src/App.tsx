import './App.scss';

import * as React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ExchangeTrader from './components/ExchangeTrader';

const App = () => (
	<Router>
		<Switch>
			<Route path="/" component={ExchangeTrader} />
		</Switch>
	</Router>
);

export default App;
