import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata: Metadata = { title: "Câu hỏi thường gặp" };

/** Nội dung lấy từ sheet Tracking, tab FAQ. */
const FAQ: { group: string; items: [string, string][] }[] = [
  {
    group: "Thông tin chung",
    items: [
      ["Săn Job là gì?", "Săn Job là nền tảng đăng tin và tìm kiếm việc làm trên MoMo, giúp bạn khám phá các cơ hội việc làm từ nhiều nhà tuyển dụng và ứng tuyển trực tiếp trên ứng dụng."],
      ["Sử dụng Săn Job có mất phí không?", "Không. Săn Job hoàn toàn miễn phí cho ứng viên — bạn không cần trả bất kỳ khoản phí nào để tìm việc, ứng tuyển hay theo dõi trạng thái hồ sơ."],
      ["Tôi cần điều kiện gì để sử dụng Săn Job?", "Bạn cần có tài khoản MoMo đang hoạt động. Chỉ cần đăng nhập vào ứng dụng MoMo và truy cập mục Săn Job để bắt đầu tìm việc."],
    ],
  },
  {
    group: "Ứng tuyển",
    items: [
      ["Làm sao để ứng tuyển một công việc?", "Chọn tin tuyển dụng bạn quan tâm, kiểm tra thông tin mô tả công việc, sau đó nhấn \"Ứng tuyển\" và hoàn thiện hồ sơ theo yêu cầu của nhà tuyển dụng."],
      ["Tôi có thể ứng tuyển nhiều công việc cùng lúc không?", "Có. Bạn có thể ứng tuyển vào nhiều vị trí khác nhau mà không giới hạn số lượng."],
      ["Sau khi ứng tuyển, quy trình xét duyệt diễn ra như thế nào?", "Nhà tuyển dụng sẽ xem xét hồ sơ của bạn. Nếu hồ sơ phù hợp, nhà tuyển dụng sẽ liên hệ trực tiếp với bạn trong vòng 7 ngày làm việc kể từ thời điểm bạn ứng tuyển."],
      ["Nếu sau 7 ngày làm việc tôi không nhận được phản hồi thì sao?", "Điều đó có nghĩa là hồ sơ của bạn chưa phù hợp với vị trí này ở thời điểm hiện tại. Bạn vẫn có thể tiếp tục ứng tuyển các vị trí khác phù hợp hơn trên Săn Job."],
      ["Tôi có thể theo dõi trạng thái hồ sơ đã ứng tuyển ở đâu?", "Hiện tại bạn chưa thể xem trạng thái hồ sơ ứng tuyển tại mục Săn Job."],
    ],
  },
  {
    group: "Hồ sơ và thông tin cá nhân",
    items: [
      ["Thông tin hồ sơ của tôi có được bảo mật không?", "Có. Thông tin ứng tuyển của bạn chỉ được chia sẻ với nhà tuyển dụng của vị trí bạn ứng tuyển, phục vụ mục đích xét duyệt tuyển dụng."],
      ["Tôi có thể chỉnh sửa hồ sơ sau khi đã nộp không?", "Bạn có thể gửi ứng tuyển lại một lần nữa với thông tin đúng. Hoặc thông báo cần cập nhật khi được nhà tuyển dụng liên hệ."],
    ],
  },
  {
    group: "Hỗ trợ",
    items: [
      ["Tôi gặp vấn đề khi sử dụng, liên hệ ai để được hỗ trợ?", "Nếu liên quan về mặt kỹ thuật như không ứng tuyển được, bạn liên hệ MoMo qua mục \"Trợ giúp\" trên ứng dụng để được giải đáp. Nếu liên quan đến quy trình tuyển dụng, bạn liên hệ nhà tuyển dụng để được giải đáp (trong trường hợp nhà tuyển dụng đã liên hệ bạn)."],
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <SiteHeader active="faq" />
      <main className="s-wrap faq">
        <h1>Câu hỏi thường gặp</h1>
        {FAQ.map((g) => (
          <section key={g.group} className="faq-group">
            <h2>{g.group}</h2>
            {g.items.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
