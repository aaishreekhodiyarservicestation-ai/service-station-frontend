import DashboardLayout from '../dashboard/layout';

export default function StationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
