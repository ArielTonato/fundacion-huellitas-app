import * as yup from 'yup';

export const reporteSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  especie: yup.string().oneOf(['perro', 'gato'], 'Seleccione una especie').required('La especie es requerida'),
  sexo: yup.string().oneOf(['macho', 'hembra'], 'Seleccione el sexo').required('El sexo es requerido'),
  descripcion: yup.string().min(20, 'Minimo 20 caracteres').required('La descripcion es requerida'),
  fotos: yup.array().of(yup.string().required()).min(1, 'Agregue al menos una foto').max(3, 'Maximo 3 fotos').required(),
  ultimaUbicacion: yup.object({
    latitude: yup.number().required('Seleccione una ubicacion'),
    longitude: yup.number().required('Seleccione una ubicacion'),
    direccion: yup.string().required('La direccion es requerida'),
    placeId: yup.string().optional(),
  }).required(),
  telefonoContacto: yup.string().matches(/^[0-9]{10}$/, 'Ingrese un telefono de 10 digitos').required('El telefono es requerido'),
});

export type ReporteFormData = yup.InferType<typeof reporteSchema>;
