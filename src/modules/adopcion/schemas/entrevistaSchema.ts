import * as yup from 'yup';

export const entrevistaSchema = yup.object({
  fecha: yup
    .date()
    .typeError('Seleccione una fecha valida')
    .min(new Date(), 'La fecha debe ser futura')
    .required('La fecha es requerida'),
  hora: yup.string().required('La hora es requerida'),
  notas: yup.string().optional(),
});

export type EntrevistaFormData = yup.InferType<typeof entrevistaSchema>;
