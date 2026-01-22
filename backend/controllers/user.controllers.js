 import User from "../models/user.model.js"
 import uploadOnCloudinary from "../config/cloudinary.js"
 import geminiResponse from "../gemini.js"
//  import moment from "moment/moment.js"
 import moment from "moment"
 export const getCurrentUser = async(req,res)=>{
    try {
        const userId=req.userId
        const user=await User.findById(userId).select("-password")
        if(!user){
            return res.status(400).json({message:"user not found"})
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(400).json({message:"get current user error"})
        
    }
 }


 export const updateAssistant=async (req,res)=>{
   try {
     const {assistantName,imageUrl}=req.body
      let assistantImage;
 if(req.file){
    assistantImage=await uploadOnCloudinary(req.file.path)
 }else{
    assistantImage=imageUrl
  }

const user=await User.findByIdAndUpdate(req.userId,{
   assistantName,assistantImage
},{new:true}).select("-password")
return res.status(200).json(user)

      
   } catch (error) {
       return res.status(400).json({message:"updateAssistantError user error"}) 
   }
}


 export const askToAssistant=async (req,res)=>{
    try {
       const {command}=req.body
       const user=await User.findById(req.userId);
       if(!user){
        return res.status(400).json({response:"User not found"})
       }
       user.history.push(command)
       user.save()
      const userName=user.name
       const assistantName=user.assistantName

       // Check if command needs local processing (specific actions like open, search, time, etc.)
       const cmd = command.toLowerCase();
       const needsLocal = cmd.includes('open') || cmd.includes('खोल') || cmd.includes('search') || cmd.includes('time') || cmd.includes('date') || cmd.includes('day') || cmd.includes('month') || cmd.includes('weather') || cmd.includes('calculator') || cmd.includes('next') || cmd.includes('previous') || cmd.includes('refresh') || /\d+\s*[\+\-\*\/]\s*\d+/.test(cmd) || cmd.includes('how much') || cmd.includes('kitna') || cmd.includes('कितना');

       if (!needsLocal) {
         // Use Gemini API for general queries
         const geminiResult = await geminiResponse(command, assistantName, userName);
         const data = JSON.parse(geminiResult);
         console.log('Gemini Response:', data);
         return res.json(data);
       } else {
         // Local processing for specific commands
         let response = "";
         let type = "general";
         let userInput = command;

         // Handle math calculations
         const mathMatch = cmd.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
         if (mathMatch) {
           const num1 = parseFloat(mathMatch[1]);
           const operator = mathMatch[2];
           const num2 = parseFloat(mathMatch[3]);
           let result;
           switch (operator) {
             case '+': result = num1 + num2; break;
             case '-': result = num1 - num2; break;
             case '*': result = num1 * num2; break;
             case '/': result = num2 !== 0 ? num1 / num2 : 'undefined (division by zero)'; break;
           }
           type = 'calculator';
           response = `${num1} ${operator} ${num2} equals ${result}`;
         }
         // Handle "how much" questions (math)
         else if (cmd.includes('how much') || cmd.includes('kitna') || cmd.includes('कितना')) {
           const numberMatch = cmd.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
           if (numberMatch) {
             const num1 = parseFloat(numberMatch[1]);
             const operator = numberMatch[2];
             const num2 = parseFloat(numberMatch[3]);
             let result;
             switch (operator) {
               case '+': result = num1 + num2; break;
               case '-': result = num1 - num2; break;
               case '*': result = num1 * num2; break;
               case '/': result = num2 !== 0 ? num1 / num2 : 'undefined (division by zero)'; break;
             }
             type = 'calculator';
             response = `${num1} ${operator} ${num2} equals ${result}`;
           }
         }
         // Handle flexible website opening
         else if (cmd.includes('open') || cmd.includes('खोल')) {
           if (cmd.includes('google')) {
             type = 'google-open';
             response = 'Opening Google for you.';
           } else if (cmd.includes('youtube') || cmd.includes('यूट्यूब')) {
             type = 'youtube-open';
             response = 'Opening YouTube for you.';
           } else if (cmd.includes('calculator') || cmd.includes('कैलकुलेटर')) {
             type = 'calculator-open';
             response = 'Opening calculator for you.';
           } else if (cmd.includes('instagram') || cmd.includes('इंस्टाग्राम')) {
             type = 'instagram-open';
             response = 'Opening Instagram for you.';
           } else if (cmd.includes('facebook') || cmd.includes('फेसबुक')) {
             type = 'facebook-open';
             response = 'Opening Facebook for you.';
           } else {
             let websiteName = cmd.replace(/ram\s*/i, '').replace(/open\s*/i, '').replace(/खोल\s*/i, '').replace(/website\s*/i, '').replace(/the\s*/i, '').trim();
             if (websiteName) {
               type = 'website-open';
               userInput = websiteName;
               response = `Opening ${websiteName} for you.`;
             } else {
               response = "Please specify which website you want to open.";
             }
           }
         }
         else if ((cmd.includes('search') && cmd.includes('google')) || (cmd.includes('google') && cmd.includes('search'))) {
           type = 'google-search';
           let searchTerm = cmd.replace(/ram\s*/i, '').replace(/search\s*/i, '').replace(/google\s*/i, '').replace(/for\s*/i, '').replace(/on\s*/i, '').trim();
           userInput = searchTerm || 'latest news';
           response = `Searching Google for ${userInput}.`;
         } else if (cmd.includes('open youtube') || cmd.includes('youtube open')) {
           type = 'youtube-open';
           response = 'Opening YouTube for you.';
         } else if ((cmd.includes('search') && cmd.includes('youtube')) || (cmd.includes('youtube') && cmd.includes('search'))) {
           type = 'youtube-search';
           let searchTerm = cmd.replace(/ram\s*/i, '').replace(/search\s*/i, '').replace(/youtube\s*/i, '').replace(/for\s*/i, '').trim();
           userInput = searchTerm || 'trending videos';
           response = `Searching YouTube for ${userInput}.`;
         } else if (cmd.includes('open calculator') || cmd.includes('calculator open')) {
           type = 'calculator-open';
           response = 'Opening calculator for you.';
         } else if (cmd.includes('open instagram') || cmd.includes('instagram open')) {
           type = 'instagram-open';
           response = 'Opening Instagram for you.';
         } else if (cmd.includes('open facebook') || cmd.includes('facebook open')) {
           type = 'facebook-open';
           response = 'Opening Facebook for you.';
         } else if (cmd.includes('weather') || cmd.includes('show weather')) {
           type = 'weather-show';
           response = 'Showing weather information.';
         } else if (cmd.includes('time') || cmd.includes('what time')) {
           type = 'get-time';
           response = `Current time is ${new Date().toLocaleTimeString()}.`;
         } else if (cmd.includes('date') || cmd.includes('what date')) {
           type = 'get-date';
           response = `Today's date is ${new Date().toLocaleDateString()}.`;
         } else if (cmd.includes('day') || cmd.includes('what day')) {
           type = 'get-day';
           response = `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.` ;
         } else if (cmd.includes('month') || cmd.includes('what month')) {
           type = 'get-month';
           response = `Current month is ${new Date().toLocaleDateString('en-US', { month: 'long' })}.` ;
         } else if (cmd.includes('next') || cmd.includes('अगला') || cmd.includes('आगे')) {
           type = 'navigation';
           userInput = 'next';
           response = 'Navigating to next page.';
         } else if (cmd.includes('previous') || cmd.includes('back') || cmd.includes('पिछला') || cmd.includes('पीछे')) {
           type = 'navigation';
           userInput = 'previous';
           response = 'Going back to previous page.';
         } else if (cmd.includes('refresh') || cmd.includes('reload') || cmd.includes('रीफ्रेश')) {
           type = 'navigation';
           userInput = 'refresh';
           response = 'Refreshing the page.';
         } else if (cmd.includes('home') || cmd.includes('go home') || cmd.includes('back to home') || cmd.includes('go back')) {
           type = 'navigation';
           userInput = 'home';
           response = 'Going back to home page.';
         }

         console.log('Local Response:', { type, userInput, response });
         return res.json({ type, userInput, response });
       }
   } catch (error) {
     return res.status(500).json({ response: "ask assistant error" })
   }
}
