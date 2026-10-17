import './garden.css';
export const metadata = { title: 'Memory Garden · 记忆花园', description: '慢慢说，花会慢慢开。一个温柔的回忆陪伴空间。' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang='zh-CN'><body>{children}</body></html>; }
