import * as yup from 'yup';

const optionalPhone = yup.string().transform((value) => (value === '' ? undefined : value)).optional();

export const solicitudSchema = yup.object({
  nombreCompleto: yup.string().min(5, 'Minimo 5 caracteres').required('El nombre completo es requerido'),
  fotoCedulaFrontal: yup.string().required('La foto frontal de la cedula es requerida'),
  fotoCedulaPosterior: yup.string().required('La foto posterior de la cedula es requerida'),
  telefonoCelular: optionalPhone,
  telefonoFijo: optionalPhone,
  ingresosMensuales: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .typeError('Ingrese un valor numerico')
    .positive('Los ingresos deben ser mayores a 0')
    .required('Los ingresos mensuales son requeridos'),
  fotoUbicacionAnimal: yup.string().required('La foto de ubicacion del animal es requerida'),
  viveAcompanado: yup.boolean().required('Indique si vive acompañado'),
}).test('telefono-requerido', 'Ingrese al menos un telefono', function validatePhone(value) {
  if (value.telefonoCelular || value.telefonoFijo) {
    return true;
  }

  return this.createError({ path: 'telefonoCelular', message: 'Ingrese al menos un telefono' });
});

export type SolicitudFormData = yup.InferType<typeof solicitudSchema>;
