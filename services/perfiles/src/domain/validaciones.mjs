// Validaciones comunes. Los datos vienen del usuario asi que se revisa el tipo y el largo de todo
import { ErrorDominio, CODIGOS } from "./errores.mjs";

export function esTextoNoVacio(valor) {
  return typeof valor === "string" && valor.trim() !== "";
}

export function validarTexto(campo, valor, largoMaximo) {
  if (typeof valor !== "string") {
    throw new ErrorDominio(CODIGOS.VALIDACION, `El campo ${campo} debe ser texto`);
  }
  const limpio = valor.trim();
  if (limpio.length > largoMaximo) {
    throw new ErrorDominio(CODIGOS.VALIDACION, `El campo ${campo} supera ${largoMaximo} caracteres`);
  }
  return limpio;
}

// Solo links http(s), o rutas internas (/logos/x.svg) si se permite
// asi no se guarda un "javascript:..." que el front mostraria como link (xss)
export function validarEnlace(campo, valor, largoMaximo, { permitirRuta = false } = {}) {
  const limpio = validarTexto(campo, valor, largoMaximo);
  if (limpio === "") return limpio;
  if (permitirRuta && limpio.startsWith("/") && !limpio.startsWith("//")) return limpio;
  let url;
  try {
    url = new URL(limpio);
  } catch {
    throw new ErrorDominio(CODIGOS.VALIDACION, `El campo ${campo} debe ser una URL válida`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ErrorDominio(CODIGOS.VALIDACION, `El campo ${campo} debe empezar con http:// o https://`);
  }
  return limpio;
}
