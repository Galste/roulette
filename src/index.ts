import {BinarySearchRoulette} from './BinarySearchRoulette';
import {StochasticAcceptanceRoulette} from './StochasticAcceptanceRoulette';
import {
    defaultOptions,
    Roulette,
    RouletteOptions,
    Weighted,
} from './Roulette';

export {setDefaultMethod} from './Roulette';

export function prepare<T>(items: ReadonlyArray<Weighted<T>>, options?: RouletteOptions): Roulette<T> {
    const method = options?.method ?? defaultOptions.method;
    switch (method) {
        case 'binarySearch':
            return new BinarySearchRoulette(items, options);
        case 'stochasticAcceptance':
        default:
            return new StochasticAcceptanceRoulette(items, options);
    }
}

export function select<T>(items: ReadonlyArray<Weighted<T>>, options?: RouletteOptions): T | undefined {
    return prepare(items, options).select();
}

export function selectMultiple<T>(items: ReadonlyArray<Weighted<T>>, count: number, options?: RouletteOptions): T[] {
    return prepare(items, options).selectMultiple(count);
}
