import * as yup from 'yup';

export const registerSchema = yup.object({
  nombre: yup
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .required('El nombre es requerido'),
  email: yup
    .string()
    .email('Ingrese un correo electronico valido')
    .required('El correo electronico es requerido'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es requerida'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Confirme su contraseña'),
  telefono: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Ingrese un numero de telefono valido de 10 digitos')
    .notRequired()
    .default(''),
  aceptaPrivacidad: yup
    .boolean()
    .oneOf([true], 'Debe aceptar la política de privacidad para registrarse')
    .required('Debe aceptar la política de privacidad'),
});

export type RegisterFormData = yup.InferType<typeof registerSchema>;
