'use strict';
const roulette = require('../dist/index.js');

const items = [
    {value: 'a', weight: 1},
    {value: 'b', weight: 2},
    {value: 'c', weight: 3},
    {value: 'd', weight: 4},
    {value: 'e', weight: 5},
];

function getRandomSearchStub() {
    const totalWeightSum = items.reduce((acc, item) => acc + item.weight, 0);
    let count = 0;
    return () => {
        const nextItemIdx = count++ % items.length;
        let weightSum = 0;
        for (let idx = 0; idx < nextItemIdx; idx++) {
            weightSum += items[idx].weight;
        }
        return weightSum / totalWeightSum;
    };
}

function getRandomAcceptanceStub() {
    const maxWeight = items.reduce((max, item) => Math.max(max, item.weight), 0);
    let count = 0;
    let selectionType = 0;
    return () => {
        selectionType ^= 1;
        if (selectionType === 1) {
            const nextItemIdx = count % items.length;
            const nextSelectionRandom = nextItemIdx / items.length;
            return nextSelectionRandom;
        }
        const currentItemIdx = count++ % items.length;
        const nextAcceptanceRandom = items[currentItemIdx].weight / maxWeight - Number.EPSILON;
        return nextAcceptanceRandom;
    };
}

function getInfiniteRandomAcceptanceStub() {
    let selectionType = 0;
    return () => {
        selectionType ^= 1;
        if (selectionType === 1) {
            return Math.random();
        }
        return Infinity;
    };
}

describe('binary search roulette', () => {
    describe('prepare', () => {
        test('should return an instance of BinarySearchRoulette as default', () => {
            roulette.setDefaultMethod('binarySearch');
            const r = roulette.prepare(items);
            expect(r.constructor.name).toBe('BinarySearchRoulette');
        });
        test('should return an instance of BinarySearchRoulette', () => {
            const r = roulette.prepare(items, {method: 'binarySearch'});
            expect(r.constructor.name).toBe('BinarySearchRoulette');
        });
    });
    describe('select', () => {
        test('should select a random value by weight', () => {
            const random = getRandomSearchStub();
            const value = roulette.select(items, {random});
            expect(value).toBe('a');
        });
        test('prepared roulette should select a random value by weight', () => {
            const random = getRandomSearchStub();
            const r = roulette.prepare(items, {random});
            expect(r.select()).toBe('a');
            expect(r.select()).toBe('b');
            expect(r.select()).toBe('c');
            expect(r.select()).toBe('d');
            expect(r.select()).toBe('e');
        });
    });

    describe('selectMultiple', () => {
        test('should select multiple unique random values by weight', () => {
            const random = getRandomSearchStub();
            const values = roulette.selectMultiple(items, 3, {random});
            expect(values).toEqual(['a', 'b', 'c']);
        });
        test('should select nothing when the count is zero', () => {
            const random = getRandomSearchStub();
            const values = roulette.selectMultiple(items, 0, {random});
            expect(values).toEqual([]);
        });
        test('should select all values if count is greater than items length', () => {
            const random = getRandomSearchStub();
            const values = roulette.selectMultiple(items, 999, {random});
            expect(values).toEqual(['a', 'b', 'c', 'd', 'e']);
        });
        test('prepared roulette should select multiple unique random values by weight', () => {
            const random = getRandomSearchStub();
            const r = roulette.prepare(items, {random});
            expect(r.selectMultiple(3)).toEqual(['a', 'b', 'c']);
            expect(r.selectMultiple(3)).toEqual(['d', 'e', 'a']);
        });
    });

    describe('errors', () => {
        test('should throw if no items are passed', () => {
            expect(() => roulette.select([])).toThrow();
        });
        test('should throw if an item has a negative weight', () => {
            expect(() => roulette.select([{value: 'a', weight: -1}])).toThrow();
        });
        test('should throw if the weight sum of all items is zero', () => {
            expect(() => roulette.select([{value: 'a', weight: 0}, {value: 'b', weight: 0}])).toThrow();
        });
    });
});

describe('stochastic acceptance roulette', () => {
    describe('prepare', () => {
        test('should return an instance of StochasticAcceptanceRoulette as default', () => {
            roulette.setDefaultMethod('stochasticAcceptance');
            const r = roulette.prepare(items);
            expect(r.constructor.name).toBe('StochasticAcceptanceRoulette');
        });
        test('should return an instance of StochasticAcceptanceRoulette', () => {
            const r = roulette.prepare(items, {method: 'stochasticAcceptance'});
            expect(r.constructor.name).toBe('StochasticAcceptanceRoulette');
        });
    });
    describe('select', () => {
        test('should select a random value by weight', () => {
            const random = getRandomAcceptanceStub();
            const value = roulette.select(items, {random});
            expect(value).toBe('a');
        });
        test('prepared roulette should select a random value by weight', () => {
            const random = getRandomAcceptanceStub();
            const r = roulette.prepare(items, {random});
            expect(r.select()).toBe('a');
            expect(r.select()).toBe('b');
            expect(r.select()).toBe('c');
            expect(r.select()).toBe('d');
            expect(r.select()).toBe('e');
        });
        test('should return the highest weighted value if all acceptance tries fail', () => {
            const random = getInfiniteRandomAcceptanceStub();
            const value = roulette.select([{value: 'x', weight: 999}, ...items], {random});
            expect(value).toBe('x');
        });
    });

    describe('selectMultiple', () => {
        test('should select multiple unique random values by weight', () => {
            const random = getRandomAcceptanceStub();
            const values = roulette.selectMultiple(items, 3, {random});
            expect(values).toEqual(['a', 'b', 'd']);
        });
        test('should select nothing when the count is zero', () => {
            const random = getRandomAcceptanceStub();
            const values = roulette.selectMultiple(items, 0, {random});
            expect(values).toEqual([]);
        });
        test('should select all values if count is greater than items length', () => {
            const random = getRandomSearchStub();
            const values = roulette.selectMultiple(items, 999, {random});
            expect(values).toEqual(['a', 'd', 'b', 'c', 'e']);
        });
        test('prepared roulette should select multiple unique random values by weight', () => {
            const random = getRandomAcceptanceStub();
            const r = roulette.prepare(items, {random});
            expect(r.selectMultiple(3)).toEqual(['a', 'b', 'd']);
            expect(r.selectMultiple(3)).toEqual(['d', 'e', 'a']);
        });
    });

    describe('errors', () => {
        test('should throw if no items are passed', () => {
            expect(() => roulette.select([])).toThrow();
        });
        test('should throw if an item has a negative weight', () => {
            expect(() => roulette.select([{value: 'a', weight: -1}])).toThrow();
        });
        test('should throw if no item has a weight greater than zero', () => {
            expect(() => roulette.select([{value: 'a', weight: 0}, {value: 'b', weight: 0}])).toThrow();
        });
    });
});

describe('immutability', () => {
    test('should not mutate the original items array', () => {
        expect(items).toEqual([
            {value: 'a', weight: 1},
            {value: 'b', weight: 2},
            {value: 'c', weight: 3},
            {value: 'd', weight: 4},
            {value: 'e', weight: 5},
        ]);
    });
});
