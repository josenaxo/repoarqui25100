import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  endpoint: process.env.DYNAMO_ENDPOINT ?? "http://localhost:8000",
  region: "us-east-1",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});
const db = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME ?? "ceibbo-app-local";

// 1) GetItem: acceso directo por PK + SK
const { Item: config } = await db.send(new GetCommand({
  TableName: TABLE_NAME,
  Key: { PK: "SCHOOL#school-1", SK: "CONFIG" },
}));
console.log("Configuración del colegio:", config);

// 2) Query en GSI1: estudiantes de un colegio (consulta inversa, sin Scan)
const { Items: estudiantes } = await db.send(new QueryCommand({
  TableName: TABLE_NAME,
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :colegio AND begins_with(GSI1SK, :prefijo)",
  ExpressionAttributeValues: { ":colegio": "SCHOOL#school-1", ":prefijo": "STUDENT#" },
}));
console.log(`Estudiantes del colegio (${estudiantes.length}):`, estudiantes.map((e) => `${e.nombre} ${e.apellido}`));
