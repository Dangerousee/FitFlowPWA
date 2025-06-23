import { AuthProvider } from '@contexts/AuthContext';
import '@styles/globals.css';

import ResponsiveLayout from '@components/layout/ResponsiveLayout';
import type { AppProps } from 'next/app';
// import { Roboto } from 'next/font/google';
import Head from 'next/head';

// const roboto = Roboto({
//   weight: ['400', '700'], // 사용할 폰트 두께
//   style: ['normal', 'italic'], // 사용할 스타일 (선택 사항)
//   subsets: ['latin'], // 사용할 문자 집합
//   display: 'swap', // 폰트 로딩 전략
//   variable: '--font-roboto', // CSS 변수로 사용할 이름 지정
// });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body>
        <AuthProvider>
          {/*<ResponsiveLayout className={`${roboto.variable} font-sans`}>*/}
          <ResponsiveLayout>
            <Component {...pageProps} />
          </ResponsiveLayout>
        </AuthProvider>
      </body>
    </>
  );
}
