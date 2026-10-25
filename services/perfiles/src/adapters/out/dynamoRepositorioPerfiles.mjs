// Adaptador de salida: implementa el puerto RepositorioPerfiles con dynamo
// las claves (PK, SK, GSI1) salen de docs/datos/perfiles.md y solo se conocen aca, el dominio no las ve
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const CLAVES = ["PK", "SK", "GSI1PK", "GSI1SK"];

function clavesPerfil(perfil) {
  const claves = { PK: `USER#${perfil.userId}`, SK: "PROFILE" };
  // solo los estudiantes con colegio entran al indice, para poder listar los de un colegio
  if (perfil.tipo === "estudiante" && perfil.colegioId) {
    claves.GSI1PK = `SCHOOL#${perfil.colegioId}`;
    claves.GSI1SK = `STUDENT#${perfil.userId}`;
  }
  return claves;
}

function clavesColegio(colegioId) {
  // GSI1PK = SCHOOLS es lo que permite listar todos los colegios sin scan
  return { PK: `SCHOOL#${colegioId}`, SK: "CONFIG", GSI1PK: "SCHOOLS", GSI1SK: `SCHOOL#${colegioId}` };
}

function sinClaves(item) {
  const datos = { ...item };
  for (const clave of CLAVES) delete datos[clave];
  return datos;
}

// el userId y el id del colegio se sacan de la PK, asi funciona tambien con los datos del seed
function aPerfil(item) {
  return { ...sinClaves(item), userId: item.PK.slice("USER#".length) };
}

function aConfig(item) {
  return { id: item.PK.slice("SCHOOL#".length), ...sinClaves(item) };
}

function esCondicionFallida(error) {
  return error?.name === "ConditionalCheckFailedException";
}

export function crearRepositorioDynamo({ tableName = process.env.TABLE_NAME, endpoint = process.env.DYNAMO_ENDPOINT } = {}) {
  if (!tableName) throw new Error("Falta TABLE_NAME");
  // con endpoint es dynamo local (docker), que pide credenciales aunque sean inventadas
  const opciones = endpoint
    ? { endpoint, region: "us-east-1", credentials: { accessKeyId: "local", secretAccessKey: "local" } }
    : {};
  const db = DynamoDBDocumentClient.from(new DynamoDBClient(opciones), {
    marshallOptions: { removeUndefinedValues: true },
  });

  // query que sigue pidiendo paginas hasta traer todo (dynamo corta en 1 MB por respuesta)
  async function consultarTodo(params) {
    const items = [];
    let ExclusiveStartKey;
    do {
      const respuesta = await db.send(new QueryCommand({ TableName: tableName, ...params, ExclusiveStartKey }));
      items.push(...(respuesta.Items ?? []));
      ExclusiveStartKey = respuesta.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  }

  async function obtenerPerfil(userId) {
    const { Item } = await db.send(new GetCommand({ TableName: tableName, Key: { PK: `USER#${userId}`, SK: "PROFILE" } }));
    return Item ? aPerfil(Item) : null;
  }

  async function crearPerfil(perfil) {
    try {
      await db.send(new PutCommand({
        TableName: tableName,
        Item: { ...perfil, ...clavesPerfil(perfil) },
        ConditionExpression: "attribute_not_exists(PK)",
      }));
      return true;
    } catch (error) {
      if (esCondicionFallida(error)) return false;
      throw error;
    }
  }

  // UpdateItem solo con los campos que llegan, para no pisar otros (ej. readinessScore)
  async function actualizarPerfil(userId, campos) {
    const nombres = {};
    const valores = {};
    const sets = [];
    const removes = [];
    Object.entries(campos).forEach(([campo, valor], i) => {
      nombres[`#c${i}`] = campo;
      valores[`:v${i}`] = valor;
      sets.push(`#c${i} = :v${i}`);
    });
    // si cambia el colegio hay que mover al estudiante en el indice (o sacarlo si queda sin colegio)
    if (Object.hasOwn(campos, "colegioId")) {
      if (campos.colegioId) {
        sets.push("GSI1PK = :gsi1pk", "GSI1SK = :gsi1sk");
        valores[":gsi1pk"] = `SCHOOL#${campos.colegioId}`;
        valores[":gsi1sk"] = `STUDENT#${userId}`;
      } else {
        removes.push("GSI1PK", "GSI1SK");
      }
    }
    if (sets.length === 0) return obtenerPerfil(userId);

    const partes = [`SET ${sets.join(", ")}`];
    if (removes.length > 0) partes.push(`REMOVE ${removes.join(", ")}`);
    try {
      const { Attributes } = await db.send(new UpdateCommand({
        TableName: tableName,
        Key: { PK: `USER#${userId}`, SK: "PROFILE" },
        UpdateExpression: partes.join(" "),
        ExpressionAttributeNames: nombres,
        ExpressionAttributeValues: valores,
        ConditionExpression: "attribute_exists(PK)",
        ReturnValues: "ALL_NEW",
      }));
      return aPerfil(Attributes);
    } catch (error) {
      if (esCondicionFallida(error)) return null;
      throw error;
    }
  }

  async function obtenerConfigColegio(colegioId) {
    const { Item } = await db.send(new GetCommand({ TableName: tableName, Key: { PK: `SCHOOL#${colegioId}`, SK: "CONFIG" } }));
    return Item ? aConfig(Item) : null;
  }

  // PutItem reemplaza el item completo, por eso se vuelven a poner las claves del indice
  async function actualizarConfigColegio(colegioId, config) {
    try {
      await db.send(new PutCommand({
        TableName: tableName,
        Item: { ...config, ...clavesColegio(colegioId) },
        ConditionExpression: "attribute_exists(PK)",
      }));
      return true;
    } catch (error) {
      if (esCondicionFallida(error)) return false;
      throw error;
    }
  }

  async function listarColegios() {
    const items = await consultarTodo({
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": "SCHOOLS" },
    });
    return items.map((item) => {
      const { id, nombre, logo } = aConfig(item);
      return { id, nombre, logo };
    });
  }

  async function listarEstudiantesColegio(colegioId) {
    const items = await consultarTodo({
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :prefijo)",
      ExpressionAttributeValues: { ":pk": `SCHOOL#${colegioId}`, ":prefijo": "STUDENT#" },
    });
    return items.map(aPerfil);
  }

  return {
    obtenerPerfil,
    crearPerfil,
    actualizarPerfil,
    obtenerConfigColegio,
    actualizarConfigColegio,
    listarColegios,
    listarEstudiantesColegio,
  };
}
