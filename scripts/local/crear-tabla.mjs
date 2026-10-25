import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
    endpoint: process.env.DYNAMO_ENDPOINT ?? "http://localhost:8000",
    region: "us-east-1",
    credentials: {accessKeyId: "local", secretAccessKey: "local"}
});
const TABLE_NAME = process.env.TABLE_NAME ?? "ceibbo-app-local";


// Se sigue plan, mismo esquema que infra/shared/serverless.yml (anexo a.1 del plan)
// Si cambia el esquema, hay que modificarlo en ambos lados

const esquema = {
  TableName: TABLE_NAME,
  BillingMode: "PAY_PER_REQUEST",
  AttributeDefinitions: [
    { AttributeName: "PK", AttributeType: "S" },
    { AttributeName: "SK", AttributeType: "S" },
    { AttributeName: "GSI1PK", AttributeType: "S" },
    { AttributeName: "GSI1SK", AttributeType: "S" },
  ],
  KeySchema: [
    { AttributeName: "PK", KeyType: "HASH" },
    { AttributeName: "SK", KeyType: "RANGE" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "GSI1",
      KeySchema: [
        { AttributeName: "GSI1PK", KeyType: "HASH" },
        { AttributeName: "GSI1SK", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
  ],
};


// Crea la tabla, si dynamo local todavia esta arrancando, reintenta (patron retry)
async function crearTabla(intentos = 10) {
  for (let i = 1; i <= intentos; i++) {
    try {
      await client.send(new CreateTableCommand(esquema));
      console.log(`Tabla ${TABLE_NAME} creada`);
      return;
    } catch (error) {
      if (error.name === "ResourceInUseException") {
        console.log(`La tabla ${TABLE_NAME} ya existe`);
        return;
      }
      if (i === intentos) throw error;
      console.log(`Dynamo local no responde (intento ${i}/${intentos}), reintentando...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

await crearTabla();