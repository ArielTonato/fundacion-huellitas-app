import * as yup from 'yup';

const optionalNumber = yup
  .number()
  .transform((value, originalValue) => (originalValue === '' ? undefined : value))
  .typeError('Debe ser un numero')
  .integer('Debe ser un numero entero')
  .min(0, 'No puede ser negativo')
  .optional();

export const animalSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  especie: yup.string().oneOf(['perro', 'gato'], 'Seleccione una especie').required('La especie es requerida'),
  raza: yup.string().required('La raza es requerida'),
  edad: yup
    .object({
      anios: optionalNumber,
      meses: optionalNumber.max(11, 'Los meses deben estar entre 0 y 11'),
      dias: optionalNumber.max(30, 'Los dias deben estar entre 0 y 30'),
    })
    .test('edad-requerida', 'Ingrese al menos una parte de la edad', (value) =>
      Boolean(value?.anios || value?.meses || value?.dias)
    )
    .required(),
  sexo: yup.string().oneOf(['macho', 'hembra'], 'Seleccione el sexo').required('El sexo es requerido'),
  tamano: yup.string().oneOf(['pequeno', 'mediano', 'grande'], 'Seleccione el tamaño').required('El tamaño es requerido'),
  descripcion: yup.string().min(20, 'Minimo 20 caracteres').required('La descripcion es requerida'),
  estadoSalud: yup.string().required('El estado de salud es requerido'),
  vacunado: yup.boolean().required('Indique si esta vacunado'),
  esterilizado: yup.boolean().required('Indique si esta esterilizado'),
  desparasitado: yup.boolean().required('Indique si esta desparasitado'),
  fotos: yup.array().of(yup.string().required()).min(1, 'Agregue al menos una foto').max(5, 'Maximo 5 fotos').required(),
});

export type AnimalFormData = yup.InferType<typeof animalSchema>;
