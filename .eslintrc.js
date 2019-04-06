module.exports = {
	env: {
		browser: true,
		node: true,
		es6: true,
	},
	parser: '@typescript-eslint/parser',
	plugins: ['typescript'],
	extends: ['plugin:shopify/typescript', 'plugin:shopify/prettier'],
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 2016,
		sourceType: 'module',
	},
	rules: {
		'linebreak-style': ['error', 'unix'],
		'no-console': ['warn'],
		'consistent-return': ['warn'],
		'babel/object-curly-spacing': 'off',
		'no-warning-comments': 'off',
		'lines-around-comment': 'off',
		'no-return-await': ['error'],
	},
	overrides: [],
};
