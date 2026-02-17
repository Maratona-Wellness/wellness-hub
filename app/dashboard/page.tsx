import { DashboardLayout } from "@/components/layouts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { Text } from "@/components/ui/Text";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Text variant="h1" className="mb-2">
            Dashboard
          </Text>
          <Text variant="p" className="text-gray-600">
            Bem-vindo ao Wellness Hub
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-(--color-accent)">0</div>
              <p className="text-sm text-gray-600">
                Nenhum agendamento próximo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total de Sessões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-(--color-accent)">0</div>
              <p className="text-sm text-gray-600">Sessões realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">Ativo</div>
              <p className="text-sm text-gray-600">Conta ativa e funcionando</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
