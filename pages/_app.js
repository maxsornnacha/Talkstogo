import "@/styles/globals.css";
import { ChatToggleProvider } from "@/components/Chats/ToggleChatContext";
import Head from "next/head";




export default function App({ Component, pageProps }) {

  return(
    <>
    <Head>
       <title>Let's join being a part of us here</title>
    </Head>
    <ChatToggleProvider>
          <Component {...pageProps} />
    </ChatToggleProvider>      
    </>
  )
 
}
