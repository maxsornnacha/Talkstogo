import "@/styles/globals.css";
import { ChatToggleProvider } from "@/components/Chats/ToggleChatContext";
import Head from "next/head";






export default function App({ Component, pageProps }) {

  return(
    <>
    <Head>
       <title>Let's join being a part of us here</title>
       <meta name="description" content="website for interacting with other people through online by message and audio chatting" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-standalone" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
    </Head>
    <ChatToggleProvider>
          <Component {...pageProps} />
    </ChatToggleProvider>      
    </>
  )
 
}
