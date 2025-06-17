import {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from 'next/document';
import Document from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="ko">
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png"></link>
          <meta name="theme-color" content="#000000" />
          {/*<meta name="viewport" content="width=device-width, initial-scale=1" />*/}
        </Head>
        <body>
        <Main />
        <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
