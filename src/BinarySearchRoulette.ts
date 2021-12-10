import {
    defaultOptions,
    Random,
    Roulette,
    RouletteMethodOptions,
    Weighted,
} from './Roulette';

function binarySearch(haystack: readonly number[], needle: number): number {
    const lowestKey = haystack[0];
    if (needle < lowestKey) {
        return lowestKey;
    }
    const middleIdx = haystack.length >> 1;
    const middleKey = haystack[middleIdx];
    return needle < middleKey
        ? binarySearch(haystack.slice(1, middleIdx + 1), needle)
        : binarySearch(haystack.slice(middleIdx + 1), needle);
}

export class BinarySearchRoulette<T> implements Roulette<T> {
    #items: ReadonlyArray<Weighted<T>>;
    #positions: readonly number[];
    #random: Random;
    #values: ReadonlyMap<number, T>;
    #weightSum = 0;

    public constructor(items: ReadonlyArray<Weighted<T>>, public options?: RouletteMethodOptions) {
        if (items.length === 0) {
            throw new Error('No items provided');
        }
        for (const item of items) {
            if (item.weight < 0) {
                throw new Error('Negative weights are not allowed');
            }
            this.#weightSum += item.weight;
        }
        if (this.#weightSum === 0) {
            throw new Error('The sum of all weights must be greater than zero');
        }
        this.#items = items;
        this.#random = options?.random ?? defaultOptions.random;
        const positions: number[] = [];
        const values = new Map<number, T>();
        let position = 0;
        for (const item of items) {
            const itemPosition = position += item.weight;
            values.set(itemPosition, item.value);
            positions.push(itemPosition);
        }
        this.#positions = positions;
        this.#values = values;
    }

    public select(): T {
        const randomWeight = this.#random() * this.#weightSum;
        const selectedPosition = binarySearch(this.#positions, randomWeight);
        return this.#values.get(selectedPosition) as T;
    }

    public selectMultiple(count: number): T[] {
        if (count <= 0) {
            return [];
        }
        const selectedValues = new Set<T>();
        let iteration = 0;
        while (iteration++ < count) {
            if (iteration === 1) {
                selectedValues.add(this.select());
                continue;
            }
            const validItems = this.#items.filter((item) => !selectedValues.has(item.value));
            if (validItems.length === 0) {
                break;
            }
            const subroulette = new BinarySearchRoulette(validItems, this.options);
            selectedValues.add(subroulette.select());
        }
        return [...selectedValues];
    }
}
