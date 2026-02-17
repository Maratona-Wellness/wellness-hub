import { z } from "zod/v4";

/**
 * Schema de validação para login com email/senha
 */
export const loginSchema = z.object({
  email: z.email("Informe um email válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema de validação para solicitação de magic link
 */
export const magicLinkRequestSchema = z.object({
  email: z.email("Informe um email válido"),
});

export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;

/**
 * Schema de validação para verificação de magic link
 */
export const magicLinkVerifySchema = z.object({
  token: z.string().min(1, "O token é obrigatório"),
  email: z.email("Informe um email válido"),
});

export type MagicLinkVerifyInput = z.infer<typeof magicLinkVerifySchema>;

/**
 * Schema de validação para completar cadastro
 */
export const completeSignupSchema = z
  .object({
    token: z.string().min(1, "O token é obrigatório"),
    email: z.email("Informe um email válido"),
    name: z
      .string()
      .min(2, "O nome deve ter pelo menos 2 caracteres")
      .max(100, "O nome deve ter no máximo 100 caracteres"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(/[0-9]/, "A senha deve conter pelo menos 1 número")
      .regex(
        /[^a-zA-Z0-9]/,
        "A senha deve conter pelo menos 1 caractere especial",
      ),
    confirmPassword: z.string().min(1, "A confirmação de senha é obrigatória"),
    acceptTerms: z.literal(true, {
      error: "Você deve aceitar os termos de uso",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type CompleteSignupInput = z.infer<typeof completeSignupSchema>;

/**
 * Schema de validação para solicitar reset de senha
 */
export const forgotPasswordSchema = z.object({
  email: z.email("Informe um email válido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema de validação para redefinir senha
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "O token é obrigatório"),
    email: z.email("Informe um email válido"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(/[0-9]/, "A senha deve conter pelo menos 1 número")
      .regex(
        /[^a-zA-Z0-9]/,
        "A senha deve conter pelo menos 1 caractere especial",
      ),
    confirmPassword: z.string().min(1, "A confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
