import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Kế Hoạch Kiểm Tra - Quản Lý Chất Lượng",
  description: "Ứng dụng import và hiển thị file Excel kế hoạch nhóm Kiểm tra. Hỗ trợ nhiều sheet, hiển thị dữ liệu giống Excel.",
  keywords: ["kế hoạch", "kiểm tra", "excel", "quản lý chất lượng", "AMJ"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
