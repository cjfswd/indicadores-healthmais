import type { PageProps } from "fresh";
import Layout from "../components/Layout.tsx";
import PatientList from "../islands/PatientList.tsx";

export default function PacientesPage(props: PageProps) {
  return (
    <Layout title="Pacientes" currentPath={props.url.pathname}>
      <PatientList />
    </Layout>
  );
}
