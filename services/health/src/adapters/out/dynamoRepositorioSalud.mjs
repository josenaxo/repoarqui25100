// Adaptador de salida: implementa el puerto RepositorioSalud con DynamoDB.
// Es la única parte de health que conoce AWS.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { comprobarPuerto } from '../../ports/comprobarPuerto.mjs'
import { METODOS_REPOSITORIO_SALUD } from '../../ports/RepositorioSalud.mjs'

// En local (Docker, B1-04) se usa DynamoDB Local; en AWS no hay endpoint y el SDK usa el real.
const endpoint = process.env.DYNAMO_ENDPOINT
const db = DynamoDBDocumentClient.from(new DynamoDBClient(endpoint ? { endpoint } : {}))

export const repositorioSaludDynamo = comprobarPuerto(
  'RepositorioSalud',
  {
    async ping() {
      try {
        await db.send(
          new GetCommand({
            TableName: process.env.TABLE_NAME,
            Key: { PK: 'HEALTH', SK: 'HEALTH' },
          }),
        )
        return true
      } catch (error) {
        console.error(
          JSON.stringify({ nivel: 'error', mensaje: 'ping a DynamoDB falló', error: String(error) }),
        )
        return false
      }
    },
  },
  METODOS_REPOSITORIO_SALUD,
)