"use client";

import React, { useState } from "react";
import { Text } from "@/components/ui";
import {
  Alert,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  DatePicker,
  Dropdown,
  EmptyState,
  FormField,
  Modal,
  ModalFooter,
  Pagination,
  SearchBar,
  Tabs,
  TimePicker,
  ToastContainer,
  useToast,
} from "@/components/molecules";
import { Button } from "@/components/ui/Button";
import { User, Settings, LogOut, FileText, Mail, Inbox } from "lucide-react";

export default function MoleculesShowcase() {
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [country, setCountry] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Search state
  const [searchValue, setSearchValue] = useState("");

  // Alert state
  const [showAlert, setShowAlert] = useState(true);

  // Toast
  const toast = useToast();

  return (
    <div className="min-h-screen bg-(--color-primary) p-8">
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Page Title */}
        <div>
          <Text variant="h1" className="mb-2">
            Molecule Components
          </Text>
          <Text variant="p" className="text-gray-600">
            Componentes compostos que combinam múltiplos átomos
          </Text>
        </div>

        {/* Alerts */}
        <section className="space-y-4">
          <Text variant="h2">Alerts</Text>
          <div className="space-y-4">
            <Alert variant="info" title="Informação">
              Esta é uma mensagem informativa para o usuário.
            </Alert>
            <Alert variant="success" title="Sucesso!">
              Operação realizada com sucesso.
            </Alert>
            <Alert variant="warning" title="Atenção">
              Você deve revisar as informações antes de continuar.
            </Alert>
            <Alert variant="error" title="Erro">
              Ocorreu um erro ao processar sua solicitação.
            </Alert>
            {showAlert && (
              <Alert
                variant="info"
                title="Dismissible Alert"
                onClose={() => setShowAlert(false)}
              >
                Este alerta pode ser fechado clicando no X.
              </Alert>
            )}
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <Text variant="h2">Cards</Text>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Card Padrão</CardTitle>
                <CardDescription>
                  Descrição do card com borda simples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Conteúdo do card vai aqui. Pode incluir qualquer elemento.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" size="sm">
                  Ação
                </Button>
              </CardFooter>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Card Outlined</CardTitle>
                <CardDescription>Card com borda mais grossa</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Este card tem uma borda mais destacada.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Card Elevated</CardTitle>
                <CardDescription>Card com shadow elevada</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Este card tem uma sombra mais pronunciada.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Form Fields */}
        <section className="space-y-4">
          <Text variant="h2">Form Fields</Text>
          <Card>
            <CardContent>
              <div className="space-y-4">
                <FormField
                  type="input"
                  label="Email"
                  required
                  helpText="Digite seu email corporativo"
                  inputProps={{
                    type: "email",
                    placeholder: "seu@email.com",
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    leftIcon: <Mail className="h-5 w-5" />,
                  }}
                />

                <FormField
                  type="input"
                  label="Senha"
                  required
                  error={
                    password && password.length < 8
                      ? "A senha deve ter pelo menos 8 caracteres"
                      : undefined
                  }
                  inputProps={{
                    type: "password",
                    placeholder: "••••••••",
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                  }}
                />

                <FormField
                  type="select"
                  label="País"
                  required
                  selectProps={{
                    placeholder: "Selecione seu país",
                    value: country,
                    onChange: (e) => setCountry(e.target.value),
                    options: [
                      { value: "br", label: "Brasil" },
                      { value: "us", label: "Estados Unidos" },
                      { value: "pt", label: "Portugal" },
                    ],
                  }}
                />

                <FormField
                  type="checkbox"
                  label="Aceito os termos e condições"
                  required
                  checkboxProps={{
                    checked: agreeTerms,
                    onChange: (e) => setAgreeTerms(e.target.checked),
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Date & Time Pickers */}
        <section className="space-y-4">
          <Text variant="h2">Date & Time Pickers</Text>
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data</label>
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    placeholder="Selecione uma data"
                  />
                  {selectedDate && (
                    <p className="text-sm text-gray-600 mt-2">
                      Data selecionada:{" "}
                      {selectedDate.toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Horário
                  </label>
                  <TimePicker
                    value={selectedTime}
                    onChange={setSelectedTime}
                    placeholder="Selecione um horário"
                    interval={30}
                  />
                  {selectedTime && (
                    <p className="text-sm text-gray-600 mt-2">
                      Horário selecionado: {selectedTime}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dropdown */}
        <section className="space-y-4">
          <Text variant="h2">Dropdown</Text>
          <Card>
            <CardContent>
              <div className="flex gap-4">
                <Dropdown
                  trigger={
                    <Button variant="secondary" rightIcon={<User />}>
                      Menu do Usuário
                    </Button>
                  }
                  options={[
                    { label: "Perfil", value: "profile", icon: <User /> },
                    {
                      label: "Configurações",
                      value: "settings",
                      icon: <Settings />,
                    },
                    { divider: true, label: "", value: "divider" },
                    { label: "Sair", value: "logout", icon: <LogOut /> },
                  ]}
                  onSelect={(value) => toast.info(`Selecionado: ${value}`)}
                />

                <Dropdown
                  trigger={<Button variant="ghost">Ações</Button>}
                  options={[
                    { label: "Editar", value: "edit" },
                    { label: "Duplicar", value: "duplicate" },
                    { label: "Arquivar", value: "archive" },
                    { divider: true, label: "", value: "divider" },
                    { label: "Deletar", value: "delete" },
                  ]}
                  onSelect={(value) => toast.warning(`Ação: ${value}`)}
                  align="right"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Search Bar */}
        <section className="space-y-4">
          <Text variant="h2">Search Bar</Text>
          <Card>
            <CardContent>
              <SearchBar
                value={searchValue}
                onChange={setSearchValue}
                onSearch={(value) => toast.info(`Buscando por: ${value}`)}
                placeholder="Buscar pacientes, terapeutas..."
              />
              {searchValue && (
                <p className="text-sm text-gray-600 mt-2">
                  Buscando por: {searchValue}
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Modal */}
        <section className="space-y-4">
          <Text variant="h2">Modal</Text>
          <Card>
            <CardContent>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Abrir Modal
              </Button>
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Confirmar Ação"
                description="Você tem certeza que deseja realizar esta ação?"
                size="md"
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Esta é uma ação irreversível e não poderá ser desfeita.
                    Todos os dados relacionados serão permanentemente removidos.
                  </p>
                  <Alert variant="warning" title="Atenção">
                    Esta operação não pode ser desfeita.
                  </Alert>
                </div>
                <ModalFooter>
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      toast.success("Ação confirmada!");
                      setIsModalOpen(false);
                    }}
                  >
                    Confirmar
                  </Button>
                </ModalFooter>
              </Modal>
            </CardContent>
          </Card>
        </section>

        {/* Pagination */}
        <section className="space-y-4">
          <Text variant="h2">Pagination</Text>
          <Card>
            <CardContent>
              <Pagination
                currentPage={currentPage}
                totalPages={10}
                totalItems={243}
                itemsPerPage={25}
                onPageChange={setCurrentPage}
                showInfo
                maxVisiblePages={5}
              />
            </CardContent>
          </Card>
        </section>

        {/* Tabs */}
        <section className="space-y-4">
          <Text variant="h2">Tabs</Text>
          <Card>
            <CardContent>
              <Tabs
                tabs={[
                  {
                    id: "profile",
                    label: "Perfil",
                    icon: <User className="h-4 w-4" />,
                    content: (
                      <div className="py-4">
                        <Text variant="p">
                          Conteúdo da aba de perfil. Aqui você pode editar suas
                          informações pessoais.
                        </Text>
                      </div>
                    ),
                  },
                  {
                    id: "documents",
                    label: "Documentos",
                    icon: <FileText className="h-4 w-4" />,
                    content: (
                      <div className="py-4">
                        <Text variant="p">
                          Lista de documentos enviados e pendentes.
                        </Text>
                      </div>
                    ),
                  },
                  {
                    id: "settings",
                    label: "Configurações",
                    icon: <Settings className="h-4 w-4" />,
                    content: (
                      <div className="py-4">
                        <Text variant="p">
                          Configurações gerais da conta e preferências.
                        </Text>
                      </div>
                    ),
                  },
                ]}
                variant="default"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Tabs
                tabs={[
                  {
                    id: "all",
                    label: "Todos",
                    content: <div className="py-4">Todos os itens</div>,
                  },
                  {
                    id: "active",
                    label: "Ativos",
                    content: <div className="py-4">Itens ativos</div>,
                  },
                  {
                    id: "archived",
                    label: "Arquivados",
                    content: <div className="py-4">Itens arquivados</div>,
                  },
                ]}
                variant="pills"
              />
            </CardContent>
          </Card>
        </section>

        {/* Empty State */}
        <section className="space-y-4">
          <Text variant="h2">Empty State</Text>
          <Card>
            <EmptyState
              icon={<Inbox />}
              title="Nenhum agendamento encontrado"
              description="Você ainda não tem nenhum agendamento. Comece criando seu primeiro agendamento."
              action={{
                label: "Novo Agendamento",
                onClick: () => toast.info("Criar novo agendamento"),
              }}
            />
          </Card>
        </section>

        {/* Toasts */}
        <section className="space-y-4">
          <Text variant="h2">Toast Notifications</Text>
          <Card>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  onClick={() =>
                    toast.info("Esta é uma notificação informativa")
                  }
                >
                  Info Toast
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    toast.success("Operação realizada com sucesso!")
                  }
                >
                  Success Toast
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast.warning("Atenção! Revise os dados.")}
                >
                  Warning Toast
                </Button>
                <Button
                  variant="danger"
                  onClick={() => toast.error("Erro ao processar a requisição")}
                >
                  Error Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
