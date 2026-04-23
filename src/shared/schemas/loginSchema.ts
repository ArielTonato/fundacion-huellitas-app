import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Ingrese un correo electronico valido')
    .required('El correo electronico es requerido'),
  password: yup
    .string()
    .min(6, 'La contrasena debe tener al menos 6 caracteres')
    .required('La contrasena es requerida'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
