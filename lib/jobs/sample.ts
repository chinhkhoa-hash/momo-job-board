import type { Brand, JobLocation, JobPost } from "./types";

/**
 * Dữ liệu mẫu cho chế độ demo. Thương hiệu là các đối tác đang có trên Merchant Job Board
 * (slug giữ nguyên như trang cũ); tin tuyển dụng, cửa hàng và mức lương là dữ liệu minh hoạ.
 */
export const SAMPLE_BRANDS: Brand[] = [
  { slug: "jollibee-viet-nam", name: "Jollibee Việt Nam", industry: "Nhà hàng thức ăn nhanh", color: "#c8102e", description: "Chuỗi nhà hàng thức ăn nhanh với hơn 200 cửa hàng trên toàn quốc. Môi trường trẻ, có lộ trình lên tổ trưởng và quản lý cửa hàng.", hotlines: [], iposVerified: true, displayOrder: 1, recruitmentUrl: "https://jollibee.com.vn" },
  { slug: "7-eleven-viet-nam", name: "7-Eleven Việt Nam", industry: "Cửa hàng tiện lợi", color: "#00704a", description: "Hệ thống cửa hàng tiện lợi mở 24/7 tại TP.HCM, Hà Nội và Bình Dương. Ca làm linh hoạt, phù hợp sinh viên.", hotlines: [], iposVerified: false, displayOrder: 2 },
  { slug: "the-coffee-house", name: "The Coffee House", industry: "Cà phê", color: "#b3541e", description: "Chuỗi cà phê Việt với không gian làm việc thân thiện. Được đào tạo pha chế bài bản từ đầu.", hotlines: [], iposVerified: true, displayOrder: 3 },
  { slug: "katinat", name: "Katinat", industry: "Cà phê & trà", color: "#1f3a5f", description: "Thương hiệu cà phê và trà với các cửa hàng ở vị trí trung tâm. Tuyển nhiều vị trí pha chế và phục vụ.", hotlines: [], iposVerified: true, displayOrder: 4 },
  { slug: "phe-la", name: "Phê La", industry: "Trà", color: "#7a4a2a", description: "Thương hiệu trà Ô long đặc sản Đà Lạt. Đội ngũ trẻ, chú trọng trải nghiệm khách hàng.", hotlines: [], iposVerified: true, displayOrder: 5 },
  { slug: "king-food-mart", name: "Kingfood Mart", industry: "Siêu thị", color: "#d4a017", description: "Chuỗi siêu thị thực phẩm sạch tại TP.HCM. Tuyển nhân viên bán hàng, thu ngân và kho.", hotlines: [], iposVerified: false, displayOrder: 6 },
  { slug: "trung-tam-anh-ngu-apollo", name: "Apollo English", industry: "Giáo dục", color: "#e4002b", description: "Trung tâm Anh ngữ với hệ thống cơ sở tại các thành phố lớn. Tuyển trợ giảng và tư vấn học vụ.", hotlines: [], iposVerified: false, displayOrder: 7 },
  { slug: "momo", name: "MoMo", industry: "Công nghệ tài chính", color: "#a50064", description: "Siêu ứng dụng thanh toán với hơn 30 triệu người dùng. Tuyển cộng tác viên và thực tập sinh.", hotlines: [], iposVerified: false, displayOrder: 8 },
];

const S: Record<string, JobLocation> = {
  hcmQ1: { name: "CN Nguyễn Huệ", address: "72 Nguyễn Huệ", district: "Quận 1", city: "TP. Hồ Chí Minh", lat: 10.7745, lng: 106.7038 },
  hcmQ1b: { name: "CN Bến Thành", address: "18 Lê Lợi", district: "Quận 1", city: "TP. Hồ Chí Minh", lat: 10.7725, lng: 106.6992 },
  hcmQ3: { name: "CN Võ Văn Tần", address: "120 Võ Văn Tần", district: "Quận 3", city: "TP. Hồ Chí Minh", lat: 10.7769, lng: 106.6890 },
  hcmBT: { name: "CN Điện Biên Phủ", address: "250 Điện Biên Phủ", district: "Bình Thạnh", city: "TP. Hồ Chí Minh", lat: 10.8010, lng: 106.7140 },
  hcmPN: { name: "CN Phan Xích Long", address: "95 Phan Xích Long", district: "Phú Nhuận", city: "TP. Hồ Chí Minh", lat: 10.8008, lng: 106.6890 },
  hcmTB: { name: "CN Cộng Hoà", address: "310 Cộng Hoà", district: "Tân Bình", city: "TP. Hồ Chí Minh", lat: 10.8015, lng: 106.6455 },
  hcmGV: { name: "CN Quang Trung", address: "45 Quang Trung", district: "Gò Vấp", city: "TP. Hồ Chí Minh", lat: 10.8352, lng: 106.6655 },
  hcmTD: { name: "CN Võ Văn Ngân", address: "12 Võ Văn Ngân", district: "Thủ Đức", city: "TP. Hồ Chí Minh", lat: 10.8506, lng: 106.7588 },
  hcmQ7: { name: "CN Nguyễn Thị Thập", address: "400 Nguyễn Thị Thập", district: "Quận 7", city: "TP. Hồ Chí Minh", lat: 10.7380, lng: 106.7130 },
  hnCG: { name: "CN Xuân Thuỷ", address: "88 Xuân Thuỷ", district: "Cầu Giấy", city: "Hà Nội", lat: 21.0368, lng: 105.7828 },
  hnDD: { name: "CN Chùa Bộc", address: "36 Chùa Bộc", district: "Đống Đa", city: "Hà Nội", lat: 21.0075, lng: 105.8270 },
  hnHBT: { name: "CN Bạch Mai", address: "150 Bạch Mai", district: "Hai Bà Trưng", city: "Hà Nội", lat: 21.0040, lng: 105.8505 },
  hnHK: { name: "CN Hàng Bài", address: "21 Hàng Bài", district: "Hoàn Kiếm", city: "Hà Nội", lat: 21.0230, lng: 105.8530 },
  hnTX: { name: "CN Nguyễn Trãi", address: "230 Nguyễn Trãi", district: "Thanh Xuân", city: "Hà Nội", lat: 20.9990, lng: 105.8100 },
  dnHC: { name: "CN Bạch Đằng", address: "60 Bạch Đằng", district: "Hải Châu", city: "Đà Nẵng", lat: 16.0700, lng: 108.2240 },
  dnST: { name: "CN Võ Nguyên Giáp", address: "15 Võ Nguyên Giáp", district: "Sơn Trà", city: "Đà Nẵng", lat: 16.0710, lng: 108.2460 },
  bdTDM: { name: "CN Yersin", address: "77 Yersin", district: "Thủ Dầu Một", city: "Bình Dương", lat: 10.9800, lng: 106.6520 },
  bdDA: { name: "CN Dĩ An", address: "5 Trần Hưng Đạo", district: "Dĩ An", city: "Bình Dương", lat: 10.9070, lng: 106.7690 },
};

const crew = {
  desc: ["Đón tiếp, ghi nhận order và phục vụ khách tại quầy.", "Giữ khu vực làm việc sạch sẽ theo tiêu chuẩn vệ sinh an toàn thực phẩm.", "Phối hợp với bếp để món ra đúng thời gian."],
  req: ["Từ 18 tuổi, có CCCD.", "Làm tối thiểu 4 ca/tuần.", "Không cần kinh nghiệm, được đào tạo từ đầu."],
  ben: ["Lương trả qua ví MoMo vào ngày 5 hằng tháng.", "Bao ăn trong ca.", "Thưởng chuyên cần và thưởng lễ Tết."],
};

export const SAMPLE_JOBS: JobPost[] = [
  { id: "jb-2001", brandSlug: "jollibee-viet-nam", title: "Nhân viên phục vụ", employmentType: "part_time", salaryType: "hourly", salaryMin: 25000, salaryMax: 28000, schedule: "Ca 4–8 tiếng, xoay ca sáng/chiều/tối", description: crew.desc, requirements: crew.req, benefits: crew.ben, locations: [S.hcmQ1, S.hcmBT, S.hcmGV], postedAt: "2026-11-20", deadline: "2026-12-31", careerTitle: "Nhân viên phục vụ", sortOrder: 1 },
  { id: "jb-2002", brandSlug: "jollibee-viet-nam", title: "Tổ trưởng ca", employmentType: "full_time", salaryType: "monthly", salaryMin: 9000000, salaryMax: 11000000, experience: "Từ 1 năm ở vị trí tương đương", schedule: "48 giờ/tuần, nghỉ 1 ngày", description: ["Điều phối nhân viên trong ca, phân công vị trí.", "Kiểm soát chất lượng món và tốc độ phục vụ.", "Báo cáo doanh thu và tồn kho cuối ca."], requirements: ["Có kinh nghiệm F&B từ 1 năm.", "Kỹ năng giao tiếp và xử lý tình huống tốt."], benefits: ["Lương tháng 13.", "BHXH đầy đủ.", "Lộ trình lên Quản lý cửa hàng sau 12 tháng."], locations: [S.hcmQ3, S.hcmTB], postedAt: "2026-11-18", deadline: "2026-12-20", requireEmail: true, careerTitle: "Quản lý ca", sortOrder: 2 },
  { id: "jb-2003", brandSlug: "jollibee-viet-nam", title: "Nhân viên bếp", employmentType: "shift", salaryType: "shift", salaryMin: 170000, salaryMax: 200000, schedule: "Ca 6 tiếng", description: ["Sơ chế, chế biến món theo công thức chuẩn.", "Kiểm tra nhiệt độ bảo quản nguyên liệu."], requirements: ["Từ 18 tuổi.", "Chịu được môi trường bếp nóng."], benefits: crew.ben, locations: [S.dnHC, S.dnST], postedAt: "2026-11-15", deadline: "2026-12-15", sortOrder: 3 },
  { id: "jb-2004", brandSlug: "jollibee-viet-nam", title: "Nhân viên phục vụ", employmentType: "part_time", salaryType: "hourly", salaryMin: 24000, salaryMax: 26000, schedule: "Ca 4–6 tiếng", description: crew.desc, requirements: crew.req, benefits: crew.ben, locations: [S.hnDD, S.hnHBT], postedAt: "2026-11-21", deadline: "2027-01-10", careerTitle: "Nhân viên phục vụ", sortOrder: 4 },

  { id: "se-3101", brandSlug: "7-eleven-viet-nam", title: "Nhân viên bán hàng ca tối", employmentType: "shift", salaryType: "hourly", salaryMin: 26000, salaryMax: 30000, schedule: "Ca 18:00–23:00 hoặc 23:00–7:00", description: ["Tính tiền, tư vấn sản phẩm cho khách.", "Sắp xếp hàng hoá, kiểm tra hạn sử dụng.", "Chuẩn bị đồ ăn nóng tại quầy."], requirements: ["Từ 18 tuổi.", "Làm được ca đêm là lợi thế."], benefits: ["Phụ cấp ca đêm 30%.", "Giảm giá mua hàng tại cửa hàng."], locations: [S.hcmQ1b, S.hcmPN, S.hcmQ7], postedAt: "2026-11-22", deadline: "2026-12-31", sortOrder: 1 },
  { id: "se-3102", brandSlug: "7-eleven-viet-nam", title: "Nhân viên bán hàng bán thời gian", employmentType: "part_time", salaryType: "hourly", salaryMin: 25000, schedule: "Tối thiểu 20 giờ/tuần", description: ["Phục vụ khách, thanh toán.", "Giữ cửa hàng sạch sẽ."], requirements: ["Sinh viên năm 1–4 là lợi thế."], benefits: ["Đăng ký ca theo tuần."], locations: [S.bdTDM, S.bdDA], postedAt: "2026-11-10", deadline: "2026-12-10", sortOrder: 2 },
  { id: "se-3103", brandSlug: "7-eleven-viet-nam", title: "Cửa hàng trưởng", employmentType: "full_time", salaryType: "monthly", salaryMin: 14000000, salaryMax: 18000000, experience: "Từ 2 năm quản lý bán lẻ", description: ["Quản lý vận hành và nhân sự cửa hàng.", "Chịu trách nhiệm doanh thu và tồn kho."], requirements: ["Kinh nghiệm quản lý cửa hàng bán lẻ từ 2 năm."], benefits: ["Thưởng theo doanh thu.", "BHXH, khám sức khoẻ định kỳ."], locations: [S.hcmTD], postedAt: "2026-11-05", deadline: "2026-12-05", requireEmail: true, requireCv: true, directUrl: "https://www.7-eleven.vn", sortOrder: 3 },

  { id: "tch-4101", brandSlug: "the-coffee-house", title: "Barista bán thời gian", employmentType: "part_time", salaryType: "hourly", salaryMin: 25000, salaryMax: 27000, schedule: "Ca 4–8 tiếng", description: ["Pha chế đồ uống theo công thức.", "Tư vấn món cho khách."], requirements: ["Không cần kinh nghiệm."], benefits: ["Được đào tạo barista miễn phí.", "Đồ uống miễn phí trong ca."], locations: [S.hcmQ3, S.hcmBT], postedAt: "2026-11-19", deadline: "2026-12-25", careerTitle: "Barista", sortOrder: 1 },
  { id: "tch-4102", brandSlug: "the-coffee-house", title: "Barista", employmentType: "full_time", salaryType: "monthly", salaryMin: 7000000, salaryMax: 8500000, schedule: "8 tiếng/ngày, xoay ca", description: ["Pha chế, kiểm soát chất lượng đồ uống.", "Hướng dẫn nhân viên mới."], requirements: ["Có kinh nghiệm pha chế 6 tháng."], benefits: ["BHXH.", "Thưởng KPI hằng quý."], locations: [S.hnCG, S.hnHK], postedAt: "2026-11-12", deadline: "2026-12-12", careerTitle: "Barista", sortOrder: 2 },

  { id: "kt-5101", brandSlug: "katinat", title: "Nhân viên pha chế", employmentType: "part_time", salaryType: "hourly", salaryMin: 26000, salaryMax: 30000, schedule: "Ca 5 tiếng", description: ["Pha chế cà phê, trà theo chuẩn.", "Vệ sinh dụng cụ, quầy bar."], requirements: ["Từ 18 tuổi."], benefits: ["Thưởng doanh số theo cửa hàng."], locations: [S.hcmQ1, S.hcmTD], postedAt: "2026-11-23", deadline: "2027-01-15", careerTitle: "Barista", sortOrder: 1 },
  { id: "kt-5102", brandSlug: "katinat", title: "Nhân viên phục vụ thời vụ Tết", employmentType: "seasonal", salaryType: "hourly", salaryMin: 30000, salaryMax: 35000, schedule: "15/12/2026 – 15/2/2027", description: ["Phục vụ khách trong mùa cao điểm Tết."], requirements: ["Làm liên tục trong thời gian thời vụ."], benefits: ["Thưởng Tết cho nhân viên thời vụ."], locations: [S.hcmQ1b, S.hcmQ7, S.hcmPN], postedAt: "2026-11-21", deadline: "2026-12-14", sortOrder: 2 },

  { id: "pl-6101", brandSlug: "phe-la", title: "Nhân viên pha chế", employmentType: "part_time", salaryType: "hourly", salaryMin: 25000, salaryMax: 28000, description: ["Pha chế trà Ô long theo quy trình.", "Giới thiệu sản phẩm cho khách."], requirements: ["Yêu thích trà và giao tiếp."], benefits: ["Đào tạo về trà đặc sản."], locations: [S.hnHK, S.hnTX], postedAt: "2026-11-17", deadline: "2026-12-30", careerTitle: "Barista", sortOrder: 1 },
  { id: "pl-6102", brandSlug: "phe-la", title: "Quản lý cửa hàng", employmentType: "full_time", salaryType: "negotiable", experience: "Từ 2 năm quản lý F&B", description: ["Vận hành cửa hàng, đào tạo đội ngũ."], requirements: ["Kinh nghiệm quản lý F&B 2 năm."], benefits: ["Lương thoả thuận theo năng lực."], locations: [S.hcmQ3], postedAt: "2026-11-08", deadline: "2026-12-08", requireEmail: true, requireCv: true, careerTitle: "Quản lý cửa hàng", sortOrder: 2 },

  { id: "kfm-7101", brandSlug: "king-food-mart", title: "Thu ngân", employmentType: "shift", salaryType: "shift", salaryMin: 180000, schedule: "Ca 8 tiếng", description: ["Thanh toán, xuất hoá đơn cho khách.", "Kiểm đếm tiền cuối ca."], requirements: ["Cẩn thận, trung thực."], benefits: ["Phụ cấp gửi xe."], locations: [S.hcmQ7, S.hcmTB], postedAt: "2026-11-14", deadline: "2026-12-20", sortOrder: 1 },
  { id: "kfm-7102", brandSlug: "king-food-mart", title: "Nhân viên kho", employmentType: "full_time", salaryType: "monthly", salaryMin: 8000000, salaryMax: 9000000, description: ["Nhận, kiểm hàng và sắp xếp kho."], requirements: ["Sức khoẻ tốt."], benefits: ["BHXH, cơm trưa."], locations: [S.hcmGV], postedAt: "2026-11-11", deadline: "2026-12-11", sortOrder: 2 },

  { id: "apl-8101", brandSlug: "trung-tam-anh-ngu-apollo", title: "Trợ giảng tiếng Anh", employmentType: "part_time", salaryType: "hourly", salaryMin: 60000, salaryMax: 80000, schedule: "Tối các ngày trong tuần và cuối tuần", description: ["Hỗ trợ giáo viên trong lớp.", "Chấm bài, theo dõi tiến độ học viên."], requirements: ["IELTS 6.5 trở lên.", "Sinh viên năm 2 trở lên."], benefits: ["Học phí ưu đãi cho người thân."], locations: [S.hcmPN, S.hnCG], postedAt: "2026-11-16", deadline: "2026-12-31", requireEmail: true, requireCv: true, careerTitle: "Trợ giảng", sortOrder: 1 },

  { id: "mm-9101", brandSlug: "momo", title: "Cộng tác viên hỗ trợ khách hàng", employmentType: "part_time", salaryType: "monthly", salaryMin: 5000000, salaryMax: 6000000, schedule: "4 tiếng/ngày", description: ["Hỗ trợ khách hàng qua chat.", "Ghi nhận và chuyển tiếp yêu cầu."], requirements: ["Gõ phím nhanh, giao tiếp tốt."], benefits: ["Làm việc tại văn phòng Quận 7."], locations: [S.hcmQ7], postedAt: "2026-11-09", deadline: "2026-12-09", requireEmail: true, careerTitle: "Chăm sóc khách hàng", sortOrder: 1 },
];
