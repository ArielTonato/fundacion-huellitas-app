import {setGlobalOptions} from "firebase-functions";

setGlobalOptions({maxInstances: 10, region: "us-central1"});

export {generarImagenAdopcion} from "./gemini.js";
export {eliminarCuenta} from "./eliminarCuenta.js";
