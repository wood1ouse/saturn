import { Kafka, logLevel } from "kafkajs";
import { RandomService } from "./services/RandomService";

import { randomUUID } from "crypto";

const RANDOM_FLIGHT = "random-flight";
const KAFKA_BROKER_ADDRESS = process.env.KAFKA_BROKER!;

const kafka = new Kafka({
	clientId: 'flights-producer',
	brokers: [KAFKA_BROKER_ADDRESS],
	logLevel: logLevel.ERROR,
});
const producer = kafka.producer();

async function produce() {
	await producer.connect();

	process.on("SIGTERM", async () => {
		await producer.disconnect();
		process.exit(0);
	});

	setInterval(async () => {
		const lat = RandomService.getRandomInRange(-180, 180, 3);
		const lng = RandomService.getRandomInRange(-180, 180, 3);

		await producer.send({
			topic: RANDOM_FLIGHT,
			messages: [
				{
					key: randomUUID(),
					value: Buffer.from(JSON.stringify({ date: Date.now(), lat, lng })),
				},
			],
		});
	}, 3000);

	console.log("Flights Producer Started Successsfully");
}

produce();
