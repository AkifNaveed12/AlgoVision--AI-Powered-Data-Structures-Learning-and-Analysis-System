import AIChat from '../components/AIChat'

export default function AITutor() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Your Personal AI Tutor</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Stuck on a concept? Want to know the time complexity of QuickSort? 
          Ask the AlgoVision AI Tutor powered by Groq and LLaMA 3.
        </p>
      </div>

      <div className="glow-purple rounded-xl">
        <AIChat />
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          "Explain O(n log n) time complexity like I'm 5.",
          "What is the difference between an Array and a Linked List?",
          "How does a hash table resolve collisions?"
        ].map((prompt, i) => (
          <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
            <span className="text-violet-400 font-bold block mb-1">Try asking:</span>
            "{prompt}"
          </div>
        ))}
      </div>
    </div>
  )
}
