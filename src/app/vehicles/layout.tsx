import DashboardLayout from '../dashboard/layout';

export default function VehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
