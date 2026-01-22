import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"
function Home() {
  const {userData,serverUrl,setUserData,getGeminiResponse}=useContext(userDataContext)
  const navigate=useNavigate()
  const [listening,setListening]=useState(false)
  const [userText,setUserText]=useState("")
  const [aiText,setAiText]=useState("")
  const isSpeakingRef=useRef(false)
  const recognitionRef=useRef(null)
  const [ham,setHam]=useState(false)
  const isRecognizingRef=useRef(false)
  const synth=window.speechSynthesis

  console.log('Home component loaded, userData:', userData);

  const handleLogOut=async ()=>{
    try {
      const result=await axios.get(`${serverUrl}/api/auth/logout`,{withCredentials:true})
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error)
    }
  }

  const startRecognition = () => {
    
   if (!isSpeakingRef.current && !isRecognizingRef.current) {
    try {
      recognitionRef.current?.start();
      console.log("Recognition requested to start");
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        console.error("Start error:", error);
      }
    }
  }
    
  }

  const speak=(text)=>{
    console.log('Attempting to speak:', text);
    const utterence=new SpeechSynthesisUtterance(text)
    utterence.lang = 'hi-IN';
    const voices =window.speechSynthesis.getVoices()
    const hindiVoice = voices.find(v => v.lang === 'hi-IN');
    if (hindiVoice) {
      utterence.voice = hindiVoice;
      console.log('Using Hindi voice:', hindiVoice.name);
    } else {
      console.log('Hindi voice not found, using default');
    }


    isSpeakingRef.current=true
    utterence.onend=()=>{
        console.log('Speech ended');
        setAiText("");
  isSpeakingRef.current = false;
  setTimeout(() => {
    startRecognition(); // ⏳ Delay se race condition avoid hoti hai
  }, 800);
    }
   synth.cancel(); // 🛑 pehle se koi speech ho to band karo
synth.speak(utterence);
   console.log('Speech synthesis started');
  }

  const handleCommand=(data)=>{
    const {type,userInput,response}=data
    console.log('Handling command with type:', type, 'response:', response);
      speak(response);
      console.log('Speaking response:', response);
    
    // Handle different command types
    const openUrl = (url) => {
      console.log('Attempting to open URL:', url);
      try {
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          console.log('URL opened successfully in new window');
        } else {
          console.log('Popup blocked - trying alternative method');
          // Try to open in same window as fallback
          window.location.href = url;
        }
      } catch (error) {
        console.log('Error opening URL:', error);
        // Fallback to same window
        window.location.href = url;
      }
    };

    if (type === 'google-open') {
      console.log('Opening Google homepage');
      openUrl('https://www.google.com');
    }
    if (type === 'google-search') {
      const query = encodeURIComponent(userInput);
      console.log('Searching Google for:', userInput, 'Encoded query:', query);
      const url = `https://www.google.com/search?q=${query}`;
      console.log('Opening URL:', url);
      openUrl(url);
    }
     if (type === 'youtube-open') {
      console.log('Opening YouTube homepage');
      openUrl('https://www.youtube.com');
    }
     if (type === 'calculator-open') {
      console.log('Opening calculator');
      openUrl('https://www.google.com/search?q=calculator');
    }
     if (type === "instagram-open") {
      console.log('Opening Instagram');
      openUrl('https://www.instagram.com/');
    }
    if (type ==="facebook-open") {
      console.log('Opening Facebook');
      openUrl('https://www.facebook.com/');
    }
     if (type ==="weather-show") {
      console.log('Showing weather');
      openUrl('https://www.google.com/search?q=weather');
    }

    if (type === 'website-open') {
      // Try to construct a valid URL from the website name
      let url = userInput.toLowerCase().trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Add https:// if not present
        url = 'https://' + url;
        // Try to add .com if no extension
        if (!url.includes('.')) {
          url += '.com';
        }
      }
      console.log('Opening general website:', url);
      openUrl(url);
    } else if (type === 'calculator') {
      // Calculator results are just spoken, no action needed
      console.log('Calculator result:', response);
    } else if (type === 'navigation') {
      // Handle browser navigation
      if (userInput === 'next') {
        console.log('Navigating forward');
        window.history.forward();
      } else if (userInput === 'previous') {
        console.log('Navigating back');
        window.history.back();
      } else if (userInput === 'refresh' || userInput === 'reload') {
        console.log('Refreshing page');
        window.location.reload();
      }
    } else if (type === 'navigation') {
      console.log('Navigation command:', userInput);
      if (userInput === 'next') {
        // Simulate pressing right arrow key for next page
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true }));
        speak('Going to next page');
      } else if (userInput === 'previous') {
        // Simulate pressing left arrow key for previous page
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true }));
        speak('Going to previous page');
      } else if (userInput === 'refresh') {
        // Refresh the current page
        window.location.reload();
        speak('Refreshing page');
      }
    }

  }

useEffect(() => {
  console.log('Setting up speech recognition...');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error('Speech recognition not supported in this browser');
    alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return;
  }
  
  console.log('Speech recognition is supported');
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognitionRef.current = recognition;

  let isMounted = true;  // flag to avoid setState on unmounted component

  // Start recognition after 1 second delay only if component still mounted
  const startTimeout = setTimeout(() => {
    console.log('Attempting to start speech recognition...');
    if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognition.start();
        console.log("Recognition requested to start - SUCCESS");
      } catch (e) {
        console.error("Recognition start error:", e);
        if (e.name !== "InvalidStateError") {
          console.error(e);
        }
      }
    } else {
      console.log('Not starting recognition - conditions not met:', { isMounted, isSpeaking: isSpeakingRef.current, isRecognizing: isRecognizingRef.current });
    }
  }, 1000);

  recognition.onstart = () => {
    console.log('Speech recognition started successfully');
    isRecognizingRef.current = true;
    setListening(true);
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
    isRecognizingRef.current = false;
    setListening(false);
    if (isMounted && !isSpeakingRef.current) {
      setTimeout(() => {
        if (isMounted) {
          try {
            recognition.start();
            console.log("Recognition restarted");
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);
          }
        }
      }, 1000);
    }
  };

  recognition.onerror = (event) => {
    console.warn("Recognition error:", event.error);
    isRecognizingRef.current = false;
    setListening(false);
    if (event.error === "not-allowed") {
      alert("Microphone access is denied. Please allow microphone access in your browser settings to use voice commands.");
      return;
    }
    if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
      setTimeout(() => {
        if (isMounted) {
          try {
            recognition.start();
            console.log("Recognition restarted after error");
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);
          }
        }
      }, 1000);
    }
  };

  recognition.onresult = async (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.trim();
    console.log('Speech result received:', transcript);
    console.log('Looking for assistant name:', userData?.assistantName?.toLowerCase());
    
    // Skip if this is the AI speaking (contains common response phrases)
    if (transcript.toLowerCase().includes('opening') || 
        transcript.toLowerCase().includes('searching') ||
        transcript.toLowerCase().includes('current time') ||
        transcript.toLowerCase().includes('today is') ||
        transcript.toLowerCase().includes('sorry') ||
        transcript.length < 3) {
      console.log('Skipping AI speech or too short input');
      return;
    }
    
    // Check if assistant name is mentioned (require at least 3 characters to avoid false positives)
    const assistantName = userData.assistantName.toLowerCase();
    if (assistantName.length >= 3 && transcript.toLowerCase().includes(assistantName)) {
      console.log('Assistant name detected, processing command');
      setAiText("");
      setUserText(transcript);
      recognition.stop();
      isRecognizingRef.current = false;
      setListening(false);
      const data = await getGeminiResponse(transcript);
      console.log('Received data from API:', data);
      handleCommand(data);
      setAiText(data.response);
      setUserText("");
    } else if (assistantName.length < 3) {
      // For short names, be more careful but still allow activation
      console.log('Short assistant name detected, processing command');
      setAiText("");
      setUserText(transcript);
      recognition.stop();
      isRecognizingRef.current = false;
      setListening(false);
      const data = await getGeminiResponse(transcript);
      console.log('Received data from API:', data);
      handleCommand(data);
      setAiText(data.response);
      setUserText("");
    } else {
      console.log('Assistant name not detected in transcript');
    }
  };


    const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}, what can I help you with?`);
    greeting.lang = 'hi-IN';
   
    window.speechSynthesis.speak(greeting);
 

  return () => {
    isMounted = false;
    clearTimeout(startTimeout);
    recognition.stop();
    setListening(false);
    isRecognizingRef.current = false;
  };
}, []);




  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(true)}/>
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham?"translate-x-0":"translate-x-full"} transition-transform`}>
 <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(false)}/>
 <button className='min-w-[150px] h-[60px]  text-black font-semibold   bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
 
      <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>

<div className='w-full h-[2px] bg-gray-400'></div>
<h1 className='text-white font-semibold text-[19px]'>History</h1>

<div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
  {userData.history?.map((his, index)=>(
    <div key={index} className='text-gray-200 text-[18px] w-full h-[30px]  '>{his}</div>
  ))}

</div>

      </div>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px]  bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>
      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
<img src={userData?.assistantImage} alt="" className='h-full object-cover'/>
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="" className='w-[200px]'/>}
      {aiText && <img src={aiImg} alt="" className='w-[200px]'/>}
    
    <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText?userText:aiText?aiText:null}</h1>
      
    </div>
  )
}

export default Home