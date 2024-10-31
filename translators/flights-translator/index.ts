import { Kafka, KafkaMessage, logLevel } from "kafkajs";
import { Response } from "./models/api";
import { GeoJSONService } from "./services/GeoJSONService";
import { Client } from "pg";

const OPENSKY_FLIGHT = "opensky-flight";
const FLIGHTS_CONSUMER = "flights-consumer";
const KAFKA_BROKER_ADDRESS = process.env.KAFKA_BROKER!;

const pgClient = new Client({
	user: process.env.POSTGRES_USER || "postgres",
	host: process.env.POSTGRES_HOST || "flights-cdm-spatial-historical-database",
	database: process.env.POSTGRES_DB || "postgres",
	password: process.env.POSTGRES_PASSWORD || "zzz999zzz",
	port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
});

pgClient.connect();

const kafka = new Kafka({
	clientId: "flights-translator",
	brokers: [KAFKA_BROKER_ADDRESS],
	logLevel: logLevel.ERROR,
});

const flightsConsumer = kafka.consumer({ groupId: FLIGHTS_CONSUMER });

async function translate(message: KafkaMessage) {
	const response: Response = JSON.parse(message.value?.toString() || "");
	const geojson = GeoJSONService.toFlightsPositionFeatureCollection(response);

	const query = `
        INSERT INTO flight_positions (timestamp, geojson)
        VALUES ($1, $2)
        RETURNING id;
    `;
	const values = [response.time * 1000, JSON.stringify(geojson)];

	try {
		await pgClient.query(query, values);
		console.log(`TRANSLATOR: Adding Message To Database`);
	} catch (err) {
		console.error("Error inserting into Postgres:", err);
	}
}

async function consumeAndTranslate() {
	await flightsConsumer.subscribe({ topic: OPENSKY_FLIGHT });

	await flightsConsumer.connect();

	await flightsConsumer.run({
		eachMessage: async ({ message }) => {
			await translate(message);
		},
	});

	console.log("Flights Translator Started Successfully");
}

consumeAndTranslate();
