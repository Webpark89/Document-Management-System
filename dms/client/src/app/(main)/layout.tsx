import { DashboardLayout } from '@views/components/shared';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
