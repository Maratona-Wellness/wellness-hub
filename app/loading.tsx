import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-(--color-primary)">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}
