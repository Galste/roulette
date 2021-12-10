import {
    defaultOptions,
    Random,
    Roulette,
    RouletteMethodOptions,
    Weighted,
} from './Roulette';

export class StochasticAcceptanceRoulette<T> implements Roulette<T> {
    public static MAX_RETRIES = 10_000;
    #items: ReadonlyArray<Weighted<T> & {chance: number}>;
    #highestWeightedValue!: T;
    #random: Random;

    public constructor(items: ReadonlyArray<Weighted<T>>, public options?: RouletteMethodOptions) {
        if (items.length === 0) {
            throw new Error('No items provided');
        }
        let maxWeight = 0;
        for (const item of items) {
            if (item.weight < 0) {
                throw new Error('Negative weights are not allowed');
            }
            if (item.weight > maxWeight) {
                maxWeight = item.weight;
                this.#highestWeightedValue = item.value;
            }
        }
        if (maxWeight === 0) {
            throw new Error('At least one item must have a weight that is greater than zero');
        }
        this.#random = options?.random ?? defaultOptions.random;
        this.#items = items.map((item) => ({
            chance: item.weight / maxWeight,
            weight: item.weight,
            value: item.value,
        }));
    }

    public select(): T {
        let retries = 0;
        while (retries++ < StochasticAcceptanceRoulette.MAX_RETRIES) {
            const selectedIdx = this.#random() * this.#items.length | 0;
            const selectedItem = this.#items[selectedIdx];
            if (this.#random() < selectedItem.chance) {
                return selectedItem.value;
            }
        }
        return this.#highestWeightedValue;
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
            const subroulette = new StochasticAcceptanceRoulette(validItems, this.options);
            selectedValues.add(subroulette.select());
        }
        return [...selectedValues];
    }
}
