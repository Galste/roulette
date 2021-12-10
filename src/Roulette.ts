export type Random = typeof Math.random;
export type RouletteMethod = 'binarySearch' | 'stochasticAcceptance';

export interface Weighted<T> {
    weight: number;
    value: T;
}

export interface RouletteMethodOptions {
    random?: Random;
}

export interface RouletteOptions extends RouletteMethodOptions {
    method?: RouletteMethod;
}

export const defaultOptions: Required<RouletteOptions> = {
    random: Math.random,
    method: 'stochasticAcceptance',
};

export interface Roulette<T> {
    select(): T | undefined;
    selectMultiple(count: number): T[];
}

export function setDefaultMethod(method: RouletteMethod): void {
    defaultOptions.method = method;
}
