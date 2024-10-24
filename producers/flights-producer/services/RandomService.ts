export class RandomService {
	static getRandomInRange(from: number, to: number, fixed: number): number {
		return Number((Math.random() * (to - from) + from).toFixed(fixed));
	}
}
