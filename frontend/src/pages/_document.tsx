import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="talentapp:project_verification" content="7646666f96098537be943bfe62838d7a3fa116811118fb52c2528603305aadd4048c11b94334ce580659936142f2b2437a4a7ad559fcf010a3796a11ebaa2f99" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
