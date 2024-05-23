import { createContext , useContext, useState } from "react";

//เพื่อทำให้สามารถเปิดแต่เพียงแชทเดียวเท่านั้น

const ChatToggleContext = createContext();

//Provider
export const ChatToggleProvider = ({children}) =>{
    const [isToggled1, setToggled1] = useState(false)
    const [isToggled2, setToggled2] = useState(false)
    const [isToggled3, setToggled3] = useState(false)

    const setToggle1 = ()=>{
        setToggled1(true)
        setToggled2(false)
        setToggled3(false)
    }

    const setToggle2 = ()=>{
        setToggled1(false)
        setToggled2(true)
        setToggled3(false)
    }

    const setToggle3 = ()=>{
        setToggled1(false)
        setToggled2(false)
        setToggled3(true)
    }
    //Toggle1 = Messenger chat , Toggle2 = menuOnRight > currentContactwith chat , Toggle3 = FriendList chat
    return (
    <ChatToggleContext.Provider value={{isToggled1,isToggled2,isToggled3,setToggle1,setToggle2,setToggle3}}>
    {children}
    </ChatToggleContext.Provider>
    )
}


//useContext
export const useToggle = ()=>{
    const context = useContext(ChatToggleContext)
    if(!context){
        throw new Error('You can using this context in Toggle Provider only')
    }
    return context
}