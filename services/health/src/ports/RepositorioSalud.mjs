// Puerto de salida: lo que el caso de uso necesita de la base de datos.
// Lo implementa el adaptador de DynamoDB (adapters/out) y, en las pruebas, uno falso.
// En TypeScript sería una interface; aquí se documenta y se revisa con comprobarPuerto.
//
// ping() -> Promise<boolean>: true si la base de datos responde, false si no.
export const METODOS_REPOSITORIO_SALUD = Object.freeze(['ping'])