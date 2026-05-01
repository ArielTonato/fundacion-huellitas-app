import * as yup from 'yup';

export const personalSchema = yup.object({
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
    .required('Confirme la contraseña'),
  telefono: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Ingrese un numero de telefono valido de 10 digitos')
    .notRequired()
    .default(''),
});

export type PersonalFormData = yup.InferType<typeof personalSchema>;

export const personalEditSchema = yup.object({
  uid: yup.string().required('El usuario es requerido'),
  nombre: yup
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .required('El nombre es requerido'),
  email: yup
    .string()
    .email('Ingrese un correo electronico valido')
    .required('El correo electronico es requerido'),
  telefono: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Ingrese un numero de telefono valido de 10 digitos')
    .notRequired()
    .default(''),
});

export type PersonalEditFormData = yup.InferType<typeof personalEditSchema>;
