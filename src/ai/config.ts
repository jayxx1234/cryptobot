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
	// 'constant',
	'glorotNormal',
	'glorotUniform',
	'heNormal',
	// 'identity',
	'leCunNormal',
	'ones',
	// 'orthogonal',
	'randomNormal',
	'randomUniform',
	'truncatedNormal',
	'varianceScaling',
	'zeros',
}

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
}

export const ranges: ConfigOptions = {
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
};

export const configObjectToArray = (config: Config | ConfigOptions): any[] => {
	return [
		config.firstLayerKernelSize,
		config.firstLayerFilters,
		config.firstLayerStrides,
		config.firstLayerUseBias,
		config.firstLayerActivation,
		config.firstLayerKernelInitializer,
		config.firstPoolingLayerPoolSize,
		config.firstPoolingLayerStrides,
		config.secondLayerKernelSize,
		config.secondLayerFilters,
		config.secondLayerStrides,
		config.secondLayerUseBias,
		config.secondLayerActivation,
		config.secondLayerKernelInitializer,
		config.secondPoolingLayerPoolSize,
		config.secondPoolingLayerStrides,
		config.denseUnits,
		config.denseActivation,
		config.denseKernelInitializer,
	];
};

export const configArrayToObject = (config: any[]): Config => {
	return {
		firstLayerKernelSize: config[0],
		firstLayerFilters: config[1],
		firstLayerStrides: config[2],
		firstLayerUseBias: config[3],
		firstLayerActivation: config[4],
		firstLayerKernelInitializer: config[5],
		firstPoolingLayerPoolSize: config[6],
		firstPoolingLayerStrides: config[7],
		secondLayerKernelSize: config[8],
		secondLayerFilters: config[9],
		secondLayerStrides: config[10],
		secondLayerUseBias: config[11],
		secondLayerActivation: config[12],
		secondLayerKernelInitializer: config[13],
		secondPoolingLayerPoolSize: config[14],
		secondPoolingLayerStrides: config[15],
		denseUnits: config[16],
		denseActivation: config[17],
		denseKernelInitializer: config[18],
	};
};

export const allConfigs = G.clone.cartesian(...configObjectToArray(ranges)) as IterableIterator<any[]>;
