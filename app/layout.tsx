import './garden.css';
import './entrance.css';
import './cognitive.css';
export const metadata = { title: 'Memory Garden', description: 'A quiet garden for your stories and the people you hold dear.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang='en'><body>{children}</body></html>; }
