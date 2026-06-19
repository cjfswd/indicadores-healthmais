import type { PageProps } from "fresh";
import Layout from "../components/Layout.tsx";
import DashboardCharts from "../islands/DashboardCharts.tsx";
import SubindicatorCharts from "../islands/SubindicatorCharts.tsx";
export default function DashboardPage(props: PageProps) {
  return (
    <Layout title="Painel" currentPath={props.url.pathname}>
      <div class="space-y-6">
        <DashboardCharts />
        <SubindicatorCharts />
      </div>
    </Layout>
  );
}
