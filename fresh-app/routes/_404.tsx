import ErrorPage from "../components/ErrorPage.tsx";

export default function NotFound() {
  return (
    <ErrorPage
      status={404}
      title="Página não encontrada"
      description="O endereço que você acessou não existe ou foi movido."
      showHome
      showBack
    />
  );
}
