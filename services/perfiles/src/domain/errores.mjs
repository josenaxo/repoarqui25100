// Errores del dominio, no saben de http. El adaptador de entrada los pasa a 400, 403, 404 o 409
export class ErrorDominio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = "ErrorDominio";
    this.codigo = codigo;
  }
}

export const CODIGOS = {
  VALIDACION: "VALIDACION",
  PROHIBIDO: "PROHIBIDO",
  NO_ENCONTRADO: "NO_ENCONTRADO",
  CONFLICTO: "CONFLICTO",
};
