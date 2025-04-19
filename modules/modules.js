
export const isEqual = (a, b) => {
    if (typeof a !== 'object' || typeof b !== 'object') {
      return a === b;
    }
  
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
  
    if (keysA.length !== keysB.length) {
      return false;
    }
  
    for (let key of keysA) {
      if (!keysB.includes(key) || !isEqual(a[key], b[key])) {
        return false;
      }
    }
  
    return true;
  }


  // ทำ message ให้เป็น Link
  export const isURL = (message) => {
    let url
    try {
      url = new URL(message);
    } catch (_) {
      return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
};

//ทำการสร้าง id Room โดยการ sort Data
export const createRoomID = (userID1, userID2) =>{
  const sortedIDs = [userID1, userID2].sort();
  return `${sortedIDs[0]}-${sortedIDs[1]}`;
   }


//ทำ youtube link ให้เป็น embedded video link
export const getEmbeddableUrl =(url) => {
  let videoId;
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  
  if (match && match[1]) {
    videoId = match[1];
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}


//จัดเวลาจาก timestamp 
export const convertTime = (timestamp)=>{
if(timestamp){
  //เวลาจาก timestamp
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const day = date.getDay();
  const month = date.getMonth()+1;
  const year = date.getFullYear();

      //เวลา ณ ปัจจุบัน
      const dateNow = new Date();
      const dayNow = dateNow.getDay();
      const monthNow = dateNow.getMonth()+1;
      const yearNow = dateNow.getFullYear();
  
  
    const DateOfTimestamp = `${day}/${month}/${year}`
    const DateNow = `${dayNow}/${monthNow}/${yearNow}` 
    const OverallTime = `${hours}:${parseInt(minutes) < 10?'0'+minutes:minutes} ${DateOfTimestamp === DateNow ?`Today`:`${DateOfTimestamp}`}` 

      return OverallTime
}

}

//Validate Email
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};


//ทำให้ลิงค์ขึ้นเป็นรูปภาพ เว็บเพจ
// Function to fetch metadata from a website URL
const fetchWebsiteMetadata = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const ogImage = doc.querySelector('meta[property="og:image"]');
    if (ogImage) {
      return ogImage.getAttribute('content');
    }
    return null;
  } catch (error) {
    console.error('Error fetching website metadata:', error);
    throw error; // Rethrow the error to propagate it to the caller
  }
};

//แก้ถึงตรงนี้

//Here is the result
export const websitePath = async (message) => {
  const websiteUrlRegex = /(http(s)?:\/\/[^\s]+)/g;
  const urls = message.match(websiteUrlRegex);

  if (urls) {
    const imageUrls = [];
    for (const url of urls) {
      try {
        const imageUrl = await fetchWebsiteMetadata(url);
        if (imageUrl) {
          imageUrls.push(imageUrl);
        }
      } catch (error) {
        console.error('Error fetching website metadata:', error);
      }
    }
    return imageUrls;
  }
  return null;
};

// Define a class to manage multiple audio channels for a single sound
class SoundPool {
  constructor(src, poolSize = 5, volume = 0.2) {
    this.pool = [];
    this.index = 0;
    for (let i = 0; i < poolSize; i++) {
      const audio = new Audio(src);
      audio.volume = volume;
      this.pool.push(audio);
    }
  }

  play() {
    const audio = this.pool[this.index];
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.error('Audio playback failed:', err);
    });
    this.index = (this.index + 1) % this.pool.length;
  }
}

// Initialize sound pools for each notification sound
const sound1 = new SoundPool('/notification1.wav', 5, 0.2);
const sound2 = new SoundPool('/notification2.mp3', 5, 0.2);
const sound3 = new SoundPool('/notification3.mp3', 5, 0.7);
const sound4 = new SoundPool('/notification4.mp3', 5, 0.7);

// Export functions to play each sound
export const playSound = () => sound1.play();
export const playSound2 = () => sound2.play();
export const playSound3 = () => sound3.play();
export const playSound4 = () => sound4.play();

// export const playSound = ()=>{
//   const audio = new Audio('/notification1.wav');
//   audio.volume = 0.2;
//   audio.play();
// }


// //play sound exit talkingChannel
// export const playSound2 = ()=>{
//   const audio = new Audio('/notification2.mp3');
//   audio.volume = 0.2;
//   audio.play();
// }


// //play sound exit talkingChannel
// export const playSound3 = ()=>{
//   const audio = new Audio('/notification3.mp3');
//   audio.volume = 0.7;
//   audio.play();
// }

// export const playSound4 = ()=>{
//   const audio = new Audio('/notification4.mp3');
//   audio.volume = 0.7;
//   audio.play();
// }


