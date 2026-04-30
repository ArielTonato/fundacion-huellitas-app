import {setGlobalOptions} from "firebase-functions";

setGlobalOptions({maxInstances: 10, region: "us-central1"});

export {generarImagenAdopcion} from "./gemini.js";
export {eliminarCuenta} from "./eliminarCuenta.js";
export {notificarReporte, enviarNotificacionPrueba} from "./notifications.js";
export {crearPersonal, editarPersonal, desactivarPersonal, reactivarPersonal} from "./users.js";
