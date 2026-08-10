'use client';

import { useState, FormEvent, ChangeEvent } from 'react';

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: "Hi! I'm Clippy, your Windows Assistant. Would you like to get some assistance?", sender: 'assistant' },
    { id: 2, text: "ARM64", sender: 'user' },
    { id: 3, text: "ARM64 (also known as ARMv8-A) is a 64-bit instruction set architecture (ISA) developed by ARM Holdings. It is a successor to the 32-bit ARMv7 architecture and is used in a wide range of devices, including smartphones, tablets, laptops, and servers. ARM64 offers significant improvements over its predecessor, including support for larger memory addresses, more registers, and improved floating-point performance. It also includes new instructions to improve security and reduce power consumption.", sender: 'assistant' },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for settings, renamed to match screenshot labels
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1056);
  const [directions, setDirections] = useState("You are a helpful assistant named Clippy. Write answers in Markdown blocks. For code blocks always define used language.");
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState('');
  const [format, setFormat] = useState('Markdown');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    const newUserMessage: ChatMessage = { id: Date.now(), text: inputPrompt, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputPrompt('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputPrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      const newAssistantMessage: ChatMessage = { id: Date.now() + 1, text: data.text, sender: 'assistant' };
      setMessages(prevMessages => [...prevMessages, newAssistantMessage]);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      const errorMessage: ChatMessage = { id: Date.now() + 1, text: `Error: ${error instanceof Error ? error.message : 'An error occurred'}`, sender: 'assistant' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 font-sans antialiased text-white">
      <div className="relative grid grid-cols-[80px_1fr_280px] w-full max-w-6xl h-[90vh] bg-[#2d2d30] rounded-2xl shadow-xl overflow-hidden border border-zinc-700/50">
        {/* Left Icon Sidebar */}
        <div className="flex flex-col items-center justify-between py-6 bg-[#262629] border-r border-[#3a3a3d]">
          <div className="space-y-6">
            {/* Active Chat Icon */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#4a4a50] text-blue-400 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M4.848 9.247a.75.75 0 01.439.935c-.32.715-.113 1.57.443 2.126a8.975 8.975 0 005.132 2.602 4.072 4.072 0 01-.657-.087c-1.838-.27-3.411-1.352-4.144-2.903a.75.75 0 011.057-.655c.42.24 1.134.17.152-.453a.75.75 0 01-.654-1.06zm7.502 6.162a.75.75 0 01-.657 1.057c-1.84-.27-3.413-1.352-4.146-2.903a.75.75 0 011.058-.655c.42.24 1.133.17.151-.453a.75.75 0 01-.654-1.06.75.75 0 011.057-.655c1.838.27 3.411 1.352 4.144 2.903a.75.75 0 01-1.057.655zm4.848-9.247c-.044.025-.13.061-.247.106-.728.27-.123.974.152.453a.75.75 0 01.654 1.06c-.42-.24-1.133-.17-.152.453a.75.75 0 01.657-1.057c.32.715-.113 1.57-.443 2.126a8.975 8.975 0 00-5.132 2.602 4.072 4.072 0 01.657-.087c1.838-.27 3.411-1.352 4.144-2.903a.75.75 0 01-.439-.935zM.75 8.25a.75.75 0 01.75-.75h18a.75.75 0 010 1.5H1.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
            </div>
            {/* Other Icons */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[#3a3a3d] cursor-pointer transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[#3a3a3d] cursor-pointer transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.234 7.234l2.515 2.515M10.5 19.5h.008v.008H10.5v-.008zm2.25 2.25h.008v.008H12.75v-.008zm2.25 2.25h.008v.008H15v-.008z" />
              </svg>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[#3a3a3d] cursor-pointer transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
          </div>
          <div>
            {/* Settings Icon */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[#3a3a3d] cursor-pointer transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.057-.183.18-.328.327-.442 1.396-1.124 3.657-.911 4.887.575a.177.177 0 01.023.082 2.71 2.71 0 010 .753c0 .265.021.527.062.785.112.748.513 1.427 1.139 1.989.28.257.594.472.933.639.117.054.234.103.351.147.243.09.488.169.738.242 1.066.315 2.27.426 3.473.342.33-.024.66-.041.989-.052V21.75a.75.75 0 01-.75.75H2.25a.75.75 0 01-.75-.75V6.108c-.007-.06-.013-.12-.02-.18-.037-.306-.062-.613-.075-.92a48.243 48.243 0 010-4.058C1.58 2.052 2.648 1.5 3.75 1.5c1.042 0 1.987.402 2.673 1.082A6.035 6.035 0 0110.343 3.94z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col p-6 relative bg-[#313134]">
          <div className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex items-start ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'assistant' && (
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#4a4a50] flex items-center justify-center text-xs font-bold text-gray-300 mr-3 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300">
                      <path fillRule="evenodd" d="M4.848 9.247a.75.75 0 01.439.935c-.32.715-.113 1.57.443 2.126a8.975 8.975 0 005.132 2.602 4.072 4.072 0 01-.657-.087c-1.838-.27-3.411-1.352-4.144-2.903a.75.75 0 011.057-.655c.42.24 1.134.17.152-.453a.75.75 0 01-.654-1.06zm7.502 6.162a.75.75 0 01-.657 1.057c-1.84-.27-3.413-1.352-4.146-2.903a.75.75 0 011.058-.655c.42.24 1.133.17.151-.453a.75.75 0 01-.654-1.06.75.75 0 011.057-.655c1.838.27 3.411 1.352 4.144 2.903a.75.75 0 01-1.057.655zm4.848-9.247c-.044.025-.13.061-.247.106-.728.27-.123.974.152.453a.75.75 0 01.654 1.06c-.42-.24-1.133-.17-.152.453a.75.75 0 01.657-1.057c.32.715-.113 1.57-.443 2.126a8.975 8.975 0 00-5.132 2.602 4.072 4.072 0 01.657-.087c1.838-.27 3.411-1.352 4.144-2.903a.75.75 0 01-.439-.935zM.75 8.25a.75.75 0 01.75-.75h18a.75.75 0 010 1.5H1.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[calc(100%-48px)] p-3 rounded-lg shadow-md ${message.sender === 'user'
                    ? 'bg-[#404040] text-gray-100 ml-auto'
                    : 'bg-[#404040] text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#4a4a50] flex items-center justify-center text-xs font-bold text-gray-300 ml-3 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-300">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.438-.695z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-start">
                 <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#4a4a50] flex items-center justify-center text-xs font-bold text-gray-300 mr-3 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300">
                      <path fillRule="evenodd" d="M4.848 9.247a.75.75 0 01.439.935c-.32.715-.113 1.57.443 2.126a8.975 8.975 0 005.132 2.602 4.072 4.072 0 01-.657-.087c-1.838-.27-3.411-1.352-4.144-2.903a.75.75 0 011.057-.655c.42.24 1.134.17.152-.453a.75.75 0 01-.654-1.06zm7.502 6.162a.75.75 0 01-.657 1.057c-1.84-.27-3.413-1.352-4.146-2.903a.75.75 0 011.058-.655c.42.24 1.133.17.151-.453a.75.75 0 01-.654-1.06.75.75 0 011.057-.655c1.838.27 3.411 1.352 4.144 2.903a.75.75 0 01-1.057.655zm4.848-9.247c-.044.025-.13.061-.247.106-.728.27-.123.974.152.453a.75.75 0 01.654 1.06c-.42-.24-1.133-.17-.152.453a.75.75 0 01.657-1.057c.32.715-.113 1.57-.443 2.126a8.975 8.975 0 00-5.132 2.602 4.072 4.072 0 01.657-.087c1.838-.27 3.411-1.352 4.144-2.903a.75.75 0 01-.439-.935zM.75 8.25a.75.75 0 01.75-.75h18a.75.75 0 010 1.5H1.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                  </div>
                <div className="max-w-[calc(100%-48px)] p-3 rounded-lg bg-[#404040] text-gray-100 animate-pulse shadow-md">
                  <p>Typing...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start items-start">
                 <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#4a4a50] flex items-center justify-center text-xs font-bold text-gray-300 mr-3 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300">
                      <path fillRule="evenodd" d="M4.848 9.247a.75.75 0 01.439.935c-.32.715-.113 1.57.443 2.126a8.975 8.975 0 005.132 2.602 4.072 4.072 0 01-.657-.087c-1.838-.27-3.411-1.352-4.144-2.903a.75.75 0 011.057-.655c.42.24 1.134.17.152-.453a.75.75 0 01-.654-1.06zm7.502 6.162a.75.75 0 01-.657 1.057c-1.84-.27-3.413-1.352-4.146-2.903a.75.75 0 011.058-.655c.42.24 1.133.17.151-.453a.75.75 0 01-.654-1.06.75.75 0 011.057-.655c1.838.27 3.411 1.352 4.144 2.903a.75.75 0 01-1.057.655zm4.848-9.247c-.044.025-.13.061-.247.106-.728.27-.123.974.152.453a.75.75 0 01.654 1.06c-.42-.24-1.133-.17-.152.453a.75.75 0 01.657-1.057c.32.715-.113 1.57-.443 2.126a8.975 8.975 0 00-5.132 2.602 4.072 4.072 0 01.657-.087c1.838-.27 3.411-1.352 4.144-2.903a.75.75 0 01-.439-.935zM.75 8.25a.75.75 0 01.75-.75h18a.75.75 0 010 1.5H1.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                  </div>
                <div className="max-w-[calc(100%-48px)] p-3 rounded-lg bg-red-800/30 text-red-300 shadow-md">
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-3 items-center">
            <textarea
              value={inputPrompt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputPrompt(e.target.value)}
              className="flex-grow p-3 bg-[#404040] border border-[#505055] rounded-lg text-gray-100 placeholder-[#909090] focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden outline-none shadow-inner text-sm"
              placeholder="Ask me anything"
              rows={1}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
              }}
              style={{ minHeight: '44px' }} // Set a minimum height for the textarea
              suppressHydrationWarning={true}
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="w-10 h-10 bg-[#404040] rounded-lg flex items-center justify-center text-gray-300 hover:bg-[#505055] disabled:opacity-50 transition-colors duration-200 shadow-md flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 rotate-45 transform translate-x-0.5 -translate-y-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Sidebar - Settings */}
        <div className="w-72 bg-[#262629] p-6 border-l border-[#3a3a3d] flex flex-col space-y-4 text-gray-200">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">Settings</h3>

          {/* Temperature */}
          <div className="pb-3 border-b border-[#3a3a3d]">
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-400 mb-1">Temperature:</label>
            <div className="flex items-center space-x-1">
              <input
                type="text"
                id="temperature"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="block w-full p-2 bg-[#404040] border border-[#505055] rounded-md text-gray-100 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm"
                readOnly // Make it read-only for now as values are fixed per option
                suppressHydrationWarning={true}
              />
              <div className="flex flex-col">
                <button onClick={() => setTemperature(prev => Math.min(1.0, prev + 0.1))} className="text-gray-400 hover:text-gray-200 text-sm"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg></button>
                <button onClick={() => setTemperature(prev => Math.max(0.0, prev - 0.1))} className="text-gray-400 hover:text-gray-200 text-sm"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
              </div>
            </div>
          </div>

          {/* Max tokens */}
          <div className="pb-3 border-b border-[#3a3a3d]">
            <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-400 mb-1">Max tokens:</label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                id="maxTokens"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                min="1"
                className="block w-full p-2 bg-[#404040] border border-[#505055] rounded-md text-gray-100 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm"
                suppressHydrationWarning={true}
              />
              <div className="flex flex-col">
                <button onClick={() => setMaxTokens(prev => prev + 1)} className="text-gray-400 hover:text-gray-200 text-sm"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg></button>
                <button onClick={() => setMaxTokens(prev => Math.max(1, prev - 1))} className="text-gray-400 hover:text-gray-200 text-sm"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
              </div>
            </div>
          </div>

          {/* Directions */}
          <div className="pb-3 border-b border-[#3a3a3d]">
            <label htmlFor="directions" className="block text-sm font-medium text-gray-400 mb-1">Directions:</label>
            <textarea
              id="directions"
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              rows={5}
              className="block w-full p-2 bg-[#404040] border border-[#505055] rounded-md text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 resize-y outline-none shadow-sm text-sm"
              suppressHydrationWarning={true}
            />
          </div>

          {/* Model */}
          <div className="pb-3 border-b border-[#3a3a3d]">
            <label htmlFor="model" className="block text-sm font-medium text-gray-400 mb-1">Model:</label>
            <input
              type="text"
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="block w-full p-2 bg-[#404040] border border-[#505055] rounded-md text-gray-100 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm"
              suppressHydrationWarning={true}
            />
          </div>

          {/* Api key */}
          <div className="pb-3 border-b border-[#3a3a3d]">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400 mb-1">Api key:</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="block w-full p-2 bg-[#404040] border border-[#505055] rounded-md text-gray-100 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm"
              placeholder="Override OpenAI api key"
              suppressHydrationWarning={true}
            />
          </div>

          {/* Format */}
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-400 mb-1">Format:</label>
            <div className="relative">
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="block w-full p-2 pr-10 bg-[#404040] border border-[#505055] rounded-md text-gray-100 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm appearance-none text-sm"
                suppressHydrationWarning={true}
              >
                <option value="Markdown">Markdown</option>
                <option value="Summary">Summary</option>
                <option value="Detailed">Detailed</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.096 6.924 4.682 8.338z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}