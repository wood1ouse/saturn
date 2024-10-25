import { Kafka, logLevel } from "kafkajs";
import { DebeziumResponse, FlightsResponse } from "./models/api";
import axios from "axios";
import WebSocket, { WebSocketServer } from "ws"; // WebSocket Typescript import

const HISTORICAL_CONSUMER = "historical-consumer";
const CDC_SCHEMA = "flights.public.cdm_points";
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
    "table.include.list": "public.cdm_points",
    "topic.prefix": "flights",
  },
};

async function createConnector() {
  let retries = 5;
  while (retries > 0) {
    try {
      const response = await axios.post(
        "http://flights-cdm-spatial-historical-database-connect:8083/connectors",
        connectorConfig,
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      console.log("Connector added successfully:", response.data);
      break;
    } catch (error) {
      retries--;
      console.log(`Failed to add connector. Retrying... (${5 - retries}/5)`);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  if (retries === 0) {
    console.error("Failed to add connector after 5 retries");
  }
}

const kafka = new Kafka({
  clientId: "flights-processor",
  brokers: [KAFKA_BROKER_ADDRESS],
  logLevel: logLevel.ERROR,
});

const historicalConsumer = kafka.consumer({ groupId: HISTORICAL_CONSUMER });

const wss = new WebSocketServer({ port: 8080 });
let clients: WebSocket[] = [];

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  clients.push(ws);

  ws.on("close", () => {
    console.log("Client disconnected");
    clients = clients.filter((client) => client !== ws);
  });
});

function broadcastMessage(message: FlightsResponse) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

async function consume() {
  await createConnector();
  await historicalConsumer.connect();
  await historicalConsumer.subscribe({ topic: CDC_SCHEMA });

  await historicalConsumer.run({
    eachMessage: async ({ message }) => {
      const response: DebeziumResponse<FlightsResponse> = JSON.parse(
        message.value?.toString() || ""
      );
      console.log(response.payload.after);

      broadcastMessage(response.payload.after);
    },
  });

  console.log("Flights Processor Started Successfully");
}

consume();