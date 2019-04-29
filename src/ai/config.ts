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
	'identity',
	'leCunNormal',
	'ones',
	'orthogonal',
	'randomNormal',
	'randomUniform',
	'truncatedNormal',
	'varianceScaling',
	'zeros',
}

export const ranges = [
	/* inputShapeFirst: */ [7],
	/* inputShapeSecond: */ [1],

	/* firstLayerKernelSize: */ [2],
	/* firstLayerFilters: */ [128],
	/* firstLayerStrides: */ [1],
	/* firstLayerUseBias: */ [false, true],
	/* firstLayerActivation: */ Object.keys(Activation).filter(k => typeof Activation[k] === 'number'),
	/* firstLayerKernelInitializer: */ Object.keys(KernelInitializer).filter(
		k => typeof KernelInitializer[k] === 'number'
	),

	/* firstPoolingLayerPoolSize: */ [2],
	/* firstPoolingLayerStrides: */ [1],

	/* secondLayerKernelSize: */ [2],
	/* secondLayerFilters: */ [64],
	/* secondLayerStrides: */ [1],
	/* secondLayerUseBias: */ [false, true],
	/* secondLayerActivation: */ Object.keys(Activation).filter(k => typeof Activation[k] === 'number'),
	/* secondLayerKernelInitializer: */ Object.keys(KernelInitializer).filter(
		k => typeof KernelInitializer[k] === 'number'
	),

	/* secondPoolingLayerPoolSize: */ [2],
	/* secondPoolingLayerStrides: */ [1],

	/* denseUnits: */ [1],
	/* denseActivation: */ Object.keys(Activation).filter(k => typeof Activation[k] === 'number'),
	/* denseKernelInitializer: */ Object.keys(KernelInitializer).filter(k => typeof KernelInitializer[k] === 'number'),
];

const initialConfig = [
	/* inputShapeFirst: */ 7,
	/* inputShapeSecond: */ 1,

	/* firstLayerKernelSize: */ 2,
	/* firstLayerFilters: */ 128,
	/* firstLayerStrides: */ 1,
	/* firstLayerUseBias: */ 1,
	/* firstLayerActivation: */ 3,
	/* firstLayerKernelInitializer: */ 11,

	/* firstPoolingLayerPoolSize: */ 2,
	/* firstPoolingLayerStrides: */ 1,

	/* secondLayerKernelSize: */ 2,
	/* secondLayerFilters: */ 64,
	/* secondLayerStrides: */ 1,
	/* secondLayerUseBias: */ 1,
	/* secondLayerActivation: */ 3,
	/* secondLayerKernelInitializer: */ 11,

	/* secondPoolingLayerPoolSize: */ 2,
	/* secondPoolingLayerStrides: */ 1,

	/* denseUnits: */ 1,
	/* denseKernelInitializer: */ 11,
	/* denseActivation: */ 2,
];

export const allConfigs = G.clone.cartesian(...ranges) as IterableIterator<any[]>;
// console.log([...allConfigs]);

export default initialConfig;
