import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/molecules/EmptyState";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-(--color-primary) p-4">
      <div className="max-w-md w-full">
        <EmptyState
          icon={<FileQuestion />}
          title="Página não encontrada"
          description="A página que você está procurando não existe ou foi movida."
        />
        <div className="flex justify-center mt-6">
          <Link href="/dashboard">
            <Button variant="primary">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
