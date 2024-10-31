import { Kafka, logLevel } from "kafkajs";
import { randomUUID } from "crypto";
import { OpenSkyService } from "./services/OpenSkyService.";

const OPENSKY_FLIGHT = "opensky-flight";
const KAFKA_BROKER_ADDRESS = process.env.KAFKA_BROKER!;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const kafka = new Kafka({
	clientId: "flights-producer",
	brokers: [KAFKA_BROKER_ADDRESS],
	logLevel: logLevel.ERROR,
});
const producer = kafka.producer();

async function retry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
	let retries = 0;
	while (true) {
		try {
			return await fn();
		} catch (error) {
			retries++;
			if (retries >= maxRetries) throw error;
			console.log(`Retrying... (${retries}/${maxRetries})`);
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
		}
	}
}

async function produce() {
	await producer.connect();

	setInterval(async () => {
		try {
			const response = await retry(
				() => OpenSkyService.getStates(),
				MAX_RETRIES,
			);
			await producer.send({
				topic: OPENSKY_FLIGHT,
				messages: [
					{
						key: randomUUID(),
						value: Buffer.from(JSON.stringify(response)),
					},
				],
			});
			console.log("Message sent successfully to Kafka");
		} catch (error) {
			console.error("Failed to retrieve states or send message:", error);
		}
	}, 5100);

	console.log("Flights Producer Started Successfully");
}

produce();
