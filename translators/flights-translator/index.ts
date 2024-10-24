import { Kafka, KafkaMessage, logLevel } from "kafkajs";
import { FlightsResponse } from "./models/api";
import { GeoJSONService } from "./services/GeoJSONService";
import { Client } from "pg";

const RANDOM_FLIGHT = "random-flight";
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
    clientId: 'flights-translator',
	brokers: [KAFKA_BROKER_ADDRESS],
	logLevel: logLevel.ERROR,
});

const producer = kafka.producer();
const flightsConsumer = kafka.consumer({ groupId: FLIGHTS_CONSUMER });

async function produce(message: KafkaMessage) {
	const response: FlightsResponse = JSON.parse(message.value?.toString() || "");
	const geojson = GeoJSONService.toPointGeoJSON(response.lat, response.lng);

    const query = `
        INSERT INTO cdm_points (date, location)
        VALUES ($1, $2)
        RETURNING id;
    `;
    const values = [Date.now(), JSON.stringify(geojson)];
    
    try {
        await pgClient.query(query, values);
    } catch (err) {
        console.error('Error inserting into Postgres:', err);
    }
}

async function consumeAndProduce() {
	await flightsConsumer.subscribe({ topic: RANDOM_FLIGHT });

	await producer.connect();
	await flightsConsumer.connect();

	await flightsConsumer.run({
		eachMessage: async ({ message }) => {
			await produce(message);
		},
	});

	console.log('Flights Translator Started Successfully');
}

consumeAndProduce();