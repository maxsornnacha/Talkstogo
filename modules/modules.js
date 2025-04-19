
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



//play sound Notifications
const audio1 = new Audio('/notification1.wav');
const audio2 = new Audio('/notification2.mp3');
const audio3 = new Audio('/notification3.mp3');
const audio4 = new Audio('/notification4.mp3');
function unlockAudio() {
  [audio1, audio2, audio3, audio4].forEach(audio => {
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(error => {
      console.error('Audio unlock failed:', error);
    });
  });
  document.body.removeEventListener('touchstart', unlockAudio);
  document.body.removeEventListener('click', unlockAudio);
}
document.body.addEventListener('touchstart', unlockAudio, false);
document.body.addEventListener('click', unlockAudio, false);

export const playSound = () => {
  audio1.volume = 0.2;
  audio1.play();
}

export const playSound2 = () => {
  audio2.volume = 0.2;
  audio2.play();
}

export const playSound3 = () => {
  audio3.volume = 0.2;
  audio3.play();
}

export const playSound4 = () => {
  audio4.volume = 0.2;
  audio4.play();
}

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


