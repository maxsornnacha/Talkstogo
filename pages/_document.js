import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <meta name="description" content="website for interacting with other people through online by message and audio chatting" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-standalone" content="yes" />
      <link rel="apple-touch-icon" sizes="60*60" href="/logo.jpg" />
      <link rel="icon" href="/logo.jpg" />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
