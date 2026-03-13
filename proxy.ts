import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Rotas públicas que não requerem autenticação
 */
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/signup/verify",
  "/signup/complete",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/components-showcase",
  "/molecules-showcase",
  "/layouts-showcase",
];

/**
 * Mapeamento de prefixos de rota para roles permitidas
 */
const ROUTE_ROLE_MAP: Record<string, string[]> = {
  "/superadmin": ["SUPER_ADMIN"],
  "/admin": ["TENANT_ADMIN", "SUPER_ADMIN"],
  "/therapist": ["THERAPIST", "SUPER_ADMIN"],
};

/**
 * Middleware Next.js para autenticação e autorização
 *
 * - Protege rotas que requerem autenticação
 * - Verifica permissões baseadas em roles
 * - Adiciona headers de segurança
 */
export async function proxy(request: NextRequest) {
  let { pathname } = request.nextUrl;

  // Headers de segurança (aplicados em todas as rotas)
  let response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (pathname == "/") {
    pathname = "/dashboard";
    response = NextResponse.redirect(new URL(pathname, request.url));
  }

  if (isPublicRoute) {
    return response;
  }

  // Para rotas não-API que não são públicas, verificar autenticação
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // Se é uma rota API, retornar 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Autenticação necessária" },
        { status: 401 },
      );
    }

    // Redirecionar para login com callback
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar autorização por role
  const userRole = token.role as string;

  // Redirecionar cada role de /dashboard para sua home específica
  if (pathname === "/dashboard") {
    const roleRedirects: Record<string, string> = {
      EMPLOYEE: "/appointments",
      THERAPIST: "/therapist/calendar",
      SUPER_ADMIN: "/superadmin/dashboard",
      TENANT_ADMIN: "/admin/dashboard",
    };
    const target = roleRedirects[userRole];
    if (target) {
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_ROLE_MAP)) {
    if (pathname.startsWith(routePrefix)) {
      if (!allowedRoles.includes(userRole)) {
        // Redirecionar para dashboard se não tem permissão
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  return response;
}

/**
 * Configuração do middleware
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
