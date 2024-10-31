import { Kafka, logLevel } from "kafkajs";
import { DebeziumResponse, Response } from "./models/api";
import axios from "axios";
import WebSocket, { WebSocketServer } from "ws";

const HISTORICAL_CONSUMER = "historical-consumer";
const CDC_SCHEMA = "flights.public.flight_positions";
const KAFKA_BROKER_ADDRESS = process.env.KAFKA_BROKER || "localhost:9092";

const connectorConfig = {
	name: "flights-connector",
	config: {
		"connector.class": "io.debezium.connector.postgresql.PostgresConnector",
		"plugin.name": "pgoutput",
		"database.hostname": "flights-cdm-spatial-historical-database",
		"database.port": "5432",
		"database.user": "postgres",
		"database.password": "zzz999zzz",
		"database.dbname": "postgres",
		"database.server.name": "postgres",
		"table.include.list": "public.flight_positions",
		"topic.prefix": "flights",
		"producer.max.request.size": "2097152",
		"producer.buffer.memory": "33554432",
	},
};

async function createConnector() {
	let retries = 100;
	while (retries > 0) {
		try {
			const response = await axios.post(
				"http://flights-cdm-spatial-historical-database-connect:8083/connectors",
				connectorConfig,
				{
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
			console.log("Connector added successfully:", response.data);
			break;
		} catch (error) {
			retries--;
			console.log(
				`Failed to add connector. Retrying... (${100 - retries}/100)`,
			);
			await new Promise((res) => setTimeout(res, 5000));
		}
	}

	if (retries === 0) {
		console.error("Failed to add connector after 100 retries");
	}
}

const wss = new WebSocketServer({ port: 8080 });
let clients: WebSocket[] = [];

async function consume() {
	try {
		const connectors = await axios.get(
			"http://flights-cdm-spatial-historical-database-connect:8083/connectors",
		);
		if (connectors.data.length === 0) {
			await createConnector();
		}
	} catch (error) {
		await createConnector();
	}

	const kafka = new Kafka({
		clientId: "flights-processor",
		brokers: [KAFKA_BROKER_ADDRESS],
		logLevel: logLevel.INFO,
	});

	const historicalConsumer = kafka.consumer({
		groupId: HISTORICAL_CONSUMER
	});

	await historicalConsumer.connect();
	await historicalConsumer.subscribe({ topic: CDC_SCHEMA });

	wss.on("connection", (ws: WebSocket) => {
		console.log("Client connected");
		clients.push(ws);

		ws.on("close", () => {
			console.log("Client disconnected");
		});
	});

	console.log("Creating Websocket Connection...");

	function broadcastMessage(message: Response) {
		clients.forEach((client) => {
			client.send(JSON.stringify(message));
		});
	}

	await historicalConsumer.run({
		eachMessage: async ({ message }) => {
			console.log(message);
			try {
				console.log("PROCESSOR: Recieving message from kafka");
				if (!message.value) {
					console.warn("Warning: Empty message value received.");
					return;
				}

				const response: DebeziumResponse<Response> = JSON.parse(
					message.value.toString(),
				);

				console.log("Parsed response payload:", response.payload.after);

				if (response.payload && response.payload.after) {
					broadcastMessage(response.payload.after);
				} else {
					console.warn("Warning: Empty payload data in message.");
				}
			} catch (error) {
				console.error("Error processing message:", error);
			}
		},
	});

	console.log("Flights Processor Started Successfully");
}

consume();
