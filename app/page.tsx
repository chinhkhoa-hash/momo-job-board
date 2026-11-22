import { getConfig } from "@/lib/config";
import { runRelay } from "@/lib/relay";
import Dashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  let cfg;
  try {
    cfg = getConfig();
  } catch (e) {
    return <Setup title="Cấu hình chưa đúng" detail={(e as Error).message} />;
  }

  if (cfg.liveLocked) {
    return (
      <Setup
        title="Cần đặt mật khẩu trước khi dùng dữ liệu thật"
        detail="Dashboard hiển thị thông tin ứng viên. Thêm biến DASHBOARD_PASSWORD trong Vercel → Settings → Environment Variables rồi deploy lại."
      />
    );
  }
  if (!cfg.mock && cfg.jobs.length === 0) {
    return (
      <Setup
        title="Chưa có tin nào để theo dõi"
        detail="Thêm biến RELAY_JOBS dạng merchantExternalId:jobExternalId, cách nhau bằng dấu phẩy. Partner API chưa có endpoint liệt kê tin nên cần khai báo tay."
      />
    );
  }

  try {
    const report = await runRelay({ dryRun: true });
    return <Dashboard initial={report} />;
  } catch (e) {
    return <Setup title="Không đọc được dữ liệu" detail={(e as Error).message} />;
  }
}

function Setup({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="shell">
      <header className="top">
        <h1 className="brand">Chuyển hồ sơ sang iPOS</h1>
      </header>
      <section className="notice">
        <h2>{title}</h2>
        <p>{detail}</p>
      </section>
    </main>
  );
}
