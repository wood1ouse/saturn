import { Kafka, KafkaMessage, logLevel } from "kafkajs";
import { randomUUID } from "crypto";
import { FlightsResponse } from "./models/api";
import { GeoJSONService } from "./services/GeoJSONService";
import { Client } from "pg";  // Postgres library

const RANDOM_FLIGHT = "random-flight";
const CDM_POINT = "cdm-point";
const FLIGHTS_CONSUMER = "flights-consumer";
const CDM_CONSUMER = "cdm-consumer";
const KAFKA_BROKER_ADDRESS = process.env.KAFKA_BROKER!;

const pgClient = new Client({
    user: process.env.POSTGRES_USER || "postgres",
    host: process.env.POSTGRES_HOST || "flihgts-cdm-spatial-historical-database",
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
const cdmConsumer = kafka.consumer({ groupId: CDM_CONSUMER });

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
        const res = await pgClient.query(query, values);
        console.log(`Inserted into Postgres with id: ${res.rows[0].id}`);
    } catch (err) {
        console.error('Error inserting into Postgres:', err);
    }

	// await producer.send({
	// 	topic: CDM_POINT,
	// 	messages: [
	// 		{
	// 			key: randomUUID(),
	// 			value: Buffer.from(JSON.stringify(geojson)),
	// 		},
	// 	],
	// });
}

async function consumeAndProduce() {
	await flightsConsumer.subscribe({ topic: RANDOM_FLIGHT });
	await cdmConsumer.subscribe({ topic: CDM_POINT });

	await producer.connect();
	await flightsConsumer.connect();
	await cdmConsumer.connect();

	await flightsConsumer.run({
		eachMessage: async ({ message }) => {
			await produce(message);
		},
	});

	await cdmConsumer.run({
		eachMessage: async ({ message }) => {
			console.log({
				key: message.key?.toString(),
				value: message.value?.toString(),
			});
		},
	});

	console.log('Flights Translator Started Successfully');
}

consumeAndProduce();