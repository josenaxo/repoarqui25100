import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  endpoint: process.env.DYNAMO_ENDPOINT ?? "http://localhost:8000",
  region: "us-east-1",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});
const db = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME ?? "ceibbo-app-local";

// Datos de prueba. Siguen la convención de claves del plan (sección 6.4)
// y reutilizan los nombres e IDs de frontend/src/lib/mock-data.ts.
const datos = [
  // Ítem que usa el servicio health para verificar la conexión
  { PK: "HEALTH", SK: "HEALTH", estado: "ok" },

  // Configuración del colegio (personalización por colegio)
  {
    PK: "SCHOOL#school-1", SK: "CONFIG",
    GSI1PK: "SCHOOLS", GSI1SK: "SCHOOL#school-1",
    nombre: "Instituto Técnico Metropolitano",
    colorPrincipal: "#0F4C5C",
    logo: "/logos/colegio.svg",
    bienvenida: "Formando líderes técnicos desde 1985",
  },

  // Perfil del usuario colegio
  { PK: "USER#school-usr", SK: "PROFILE", tipo: "colegio", colegioId: "school-1", email: "admin@itm.cl" },
  

  // Perfiles de estudiantes (GSI1 permite listar los estudiantes de un colegio)
  {
    PK: "USER#usr-1", SK: "PROFILE",
    GSI1PK: "SCHOOL#school-1", GSI1SK: "STUDENT#usr-1",
    tipo: "estudiante", colegioId: "school-1",
    nombre: "Matías", apellido: "Arancibia",
    especialidad: "Ingeniería Civil Informática", readinessScore: 82,
  },
  {
    PK: "USER#usr-2", SK: "PROFILE",
    GSI1PK: "SCHOOL#school-1", GSI1SK: "STUDENT#usr-2",
    tipo: "estudiante", colegioId: "school-1",
    nombre: "Lorena", apellido: "Ramírez",
    especialidad: "Redes y Telecomunicaciones", readinessScore: 68,
  },

  // Perfil de la empresa
  { PK: "USER#usr-10", SK: "PROFILE", tipo: "empresa", nombre: "TechCorp Chile", email: "rrhh@techcorp.cl" },

  // Oferta de la empresa (GSI1 permite listar todas las ofertas por fecha)
  {
    PK: "COMPANY#comp-1", SK: "OPPORTUNITY#opp-1",
    GSI1PK: "OPPORTUNITIES", GSI1SK: "2026-10-23",
    titulo: "Pasantía Desarrollador Frontend", tipo: "PASANTIA", ubicacion: "Santiago",
  },
];


// guarda cada item, PutCommand sobrescribe si la clave ya existe,
// asi el seed se puede correr varias veces sin duplicar datos.
for (const item of datos) {
  await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
}
console.log(`${datos.length} items cargados en ${TABLE_NAME}`);