// Adaptador de salida: implementa el puerto ServicioIdentidad con cognito
// no se puede probar en local (no hay cognito en docker), se prueba al desplegar en el stage rol3
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

export function crearServicioIdentidadCognito({ userPoolId = process.env.USER_POOL_ID } = {}) {
  if (!userPoolId) throw new Error("Falta USER_POOL_ID");
  const cognito = new CognitoIdentityProviderClient({});

  return {
    // si el usuario ya esta en el grupo cognito no da error, por eso se puede reintentar el registro
    async agregarAGrupo(username, grupo) {
      await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: userPoolId, Username: username, GroupName: grupo }));
    },
  };
}
