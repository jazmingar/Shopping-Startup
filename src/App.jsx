import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
// I removed './App.css' because it often interferes with Tailwind colors!

function App() {
  const [count, setCount] = useState(0)

  return (
    // This div creates a dark background that fills the whole screen
    <div className="min-h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
      
      <div className="flex gap-8 mb-8">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="h-24 w-24" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="h-24 w-24 animate-spin-slow" alt="React logo" />
        </a>
      </div>

      <h1 className="text-5xl font-black text-white mb-6">
        Vite + <span className="text-cyan-400">Tailwind</span>
      </h1>

      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
        <button 
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-4"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        
        <p className="text-slate-400">
          Edit <code className="text-pink-400">src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <p className="mt-8 text-slate-500 italic">
        Click on the Vite and React logos to learn more
      </p>

      {/* This is your custom styled name box */}
      <h1 className="mt-10 text-4xl font-extrabold text-white bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl shadow-lg">
        Jazmin's App
      </h1>
      
    </div>
  )
}

export default App