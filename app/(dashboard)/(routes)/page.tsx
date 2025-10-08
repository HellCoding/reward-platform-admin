import { redirect } from "next/navigation";

/**
 * 메인 대시보드 페이지
 * Daily Report 페이지로 리디렉션하여 통합된 관리자 대시보드 제공
 */
export default function DashboardHomePage() {
  // Daily Report 페이지로 리디렉션
  redirect('/reports');
}
