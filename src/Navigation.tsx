import * as React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
	return (
		<div className="links">
			<Link to="/" className="link">
				Home
			</Link>
			<Link to="/about" className="link">
				About
			</Link>
			<Link to="/contact" className="link">
				Contact Us
			</Link>
			<Link to="/admin" className="link">
				Admin
			</Link>
		</div>
	);
};

export default Navigation;
