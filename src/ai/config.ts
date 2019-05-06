import G from 'generatorics';

export enum Activation {
	'elu',
	'hardSigmoid',
	'linear',
	'relu',
	'relu6',
	'selu',
	'sigmoid',
	'softmax',
	'softplus',
	'softsign',
	'tanh',
}
export enum KernelInitializer {
	// 'constant', // doesn't work
	'glorotNormal',
	'glorotUniform',
	'heNormal',
	// 'identity', // doesn't work
	'leCunNormal',
	// 'ones', // awful accuracy
	// 'orthogonal', // doesn't work
	'randomNormal',
	'randomUniform',
	'truncatedNormal',
	'varianceScaling',
	'zeros',
}

const configObjectToArray = (config: {}): any[] => {
	return Object.keys(config).map(k => config[k]);
};

export const configArrayToObject = (config: any[], keys: string[]): {} => {
	let obj = {};
	keys.forEach((k, n) => (obj[k] = config[n]));
	return obj;
};

const generateCartesian = function*<T, O>(options: O): IterableIterator<T> {
	let ops = G.clone.cartesian(...configObjectToArray(options)) as IterableIterator<any[]>;
	for (let op of ops) {
		yield configArrayToObject(op, Object.keys(options)) as T;
	}
};

export interface Config {
	firstLayerKernelSize: number;
	firstLayerFilters: number;
	firstLayerStrides: number;
	firstLayerUseBias: boolean;
	firstLayerActivation: any;
	firstLayerKernelInitializer: any;
	firstPoolingLayerPoolSize: number;
	firstPoolingLayerStrides: number;
	secondLayerKernelSize: number;
	secondLayerFilters: number;
	secondLayerStrides: number;
	secondLayerUseBias: boolean;
	secondLayerActivation: any;
	secondLayerKernelInitializer: any;
	secondPoolingLayerPoolSize: number;
	secondPoolingLayerStrides: number;
	denseUnits: number;
	denseActivation: any;
	denseKernelInitializer: any;
	timePortion: number;
}

export interface ConfigOptions {
	firstLayerKernelSize: number[];
	firstLayerFilters: number[];
	firstLayerStrides: number[];
	firstLayerUseBias: boolean[];
	firstLayerActivation: any[];
	firstLayerKernelInitializer: any[];
	firstPoolingLayerPoolSize: number[];
	firstPoolingLayerStrides: number[];
	secondLayerKernelSize: number[];
	secondLayerFilters: number[];
	secondLayerStrides: number[];
	secondLayerUseBias: boolean[];
	secondLayerActivation: any[];
	secondLayerKernelInitializer: any[];
	secondPoolingLayerPoolSize: number[];
	secondPoolingLayerStrides: number[];
	denseUnits: number[];
	denseActivation: any[];
	denseKernelInitializer: any[];
	timePortion: number[];
}

export const configOptions: ConfigOptions = {
	firstLayerKernelSize: [2],
	firstLayerFilters: [128],
	firstLayerStrides: [1],
	firstLayerUseBias: [false, true],
	firstLayerActivation: Object.keys(Activation).filter(k => typeof Activation[k] === 'number'),
	firstLayerKernelInitializer: Object.keys(KernelInitializer).filter(k => typeof KernelInitializer[k] === 'number'),

	firstPoolingLayerPoolSize: [2],
	firstPoolingLayerStrides: [1],

	secondLayerKernelSize: [2],
	secondLayerFilters: [64],
	secondLayerStrides: [1],
	secondLayerUseBias: [false, true],
	secondLayerActivation: Object.keys(Activation).filter(k => typeof Activation[k] === 'number'),
	secondLayerKernelInitializer: Object.keys(KernelInitializer).filter(k => typeof KernelInitializer[k] === 'number'),

	secondPoolingLayerPoolSize: [2],
	secondPoolingLayerStrides: [1],

	denseUnits: [1],
	denseActivation: Object.keys(Activation).filter(k => typeof Activation[k] === 'number'),
	denseKernelInitializer: Object.keys(KernelInitializer).filter(k => typeof KernelInitializer[k] === 'number'),

	timePortion: [30], // 30 appears optimal
};

export interface MACDConfig {
	fastPeriod: number;
	slowPeriod: number;
	signalPeriod: number;
	SimpleMAOscillator: boolean;
	SimpleMASignal: boolean;
}

export interface MACDConfigOptions {
	fastPeriod: number[];
	slowPeriod: number[];
	signalPeriod: number[];
	SimpleMAOscillator: boolean[];
	SimpleMASignal: boolean[];
}

export interface RSIConfig {
	period: number;
}

export interface RSIConfigOptions {
	period: number[];
}

export const macdOptions: MACDConfigOptions = {
	fastPeriod: [12, 24],
	slowPeriod: [26, 52],
	signalPeriod: [9, 18],
	SimpleMAOscillator: [false],
	SimpleMASignal: [false],
};

export const rsiOptions: RSIConfigOptions = {
	period: [14],
};

export const cnnOptions = generateCartesian<Config, ConfigOptions>(configOptions);
export const macdConfigs = generateCartesian<MACDConfig, MACDConfigOptions>(macdOptions);
export const rsiConfigs = generateCartesian<RSIConfig, RSIConfigOptions>(rsiOptions);

/*
Optimal config so far appears to be: {
	denseActivation: "elu",
	denseKernelInitializer: "randomNormal",
	denseUnits: 1,
	firstLayerActivation: "elu",
	firstLayerFilters: 128,
	firstLayerKernelInitializer: "glorotNormal",
	firstLayerKernelSize: 2,
	firstLayerStrides: 1,
	firstLayerUseBias: false,
	firstPoolingLayerPoolSize: 2,
	firstPoolingLayerStrides: 1,
	secondLayerActivation: "elu",
	secondLayerFilters: 64,
	secondLayerKernelInitializer: "glorotNormal",
	secondLayerKernelSize: 2,
	secondLayerStrides: 1,
	secondLayerUseBias: false,
	secondPoolingLayerPoolSize: 2,
	secondPoolingLayerStrides: 1,
	timePortion: 30,
} with accuracy of 0.01111993566155433655

Better in longer run: {
	denseActivation: "relu",
	denseKernelInitializer: "randomNormal",
	denseUnits: 1,
	firstLayerActivation: "elu",
	firstLayerFilters: 128,
	firstLayerKernelInitializer: "glorotNormal",
	firstLayerKernelSize: 2,
	firstLayerStrides: 1,
	firstLayerUseBias: false,
	firstPoolingLayerPoolSize: 2,
	firstPoolingLayerStrides: 1,
	secondLayerActivation: "elu",
	secondLayerFilters: 64,
	secondLayerKernelInitializer: "glorotNormal",
	secondLayerKernelSize: 2,
	secondLayerStrides: 1,
	secondLayerUseBias: false,
	secondPoolingLayerPoolSize: 2,
	secondPoolingLayerStrides: 1,
	timePortion: 30,
} with accuracy of 0.011454222723841667
*/
