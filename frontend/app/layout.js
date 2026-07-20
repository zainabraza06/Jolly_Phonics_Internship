import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PhonicNest — Learn Phonics',
  description: 'Interactive phonics learning and pronunciation grading application for children.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="mobile-wrapper">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
