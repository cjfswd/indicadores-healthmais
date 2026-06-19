import type { PageProps } from "fresh";
import Layout from "../components/Layout.tsx";
import EventList from "../islands/EventList.tsx";

export default function EventosPage(props: PageProps) {
  return (
    <Layout title="Eventos" currentPath={props.url.pathname}>
      <EventList />
    </Layout>
  );
}
