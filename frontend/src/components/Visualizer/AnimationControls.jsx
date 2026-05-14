import { useState, useRef, useEffect } from 'react'

export default function AnimationControls({
  isPlaying,
  onPlayPause,
  onStepForward,
  onStepBack,
  onReset,
  speed,
  onSpeedChange,
  currentStep,
  totalSteps,
  hasStarted
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700 gap-4">
      {/* Playback Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          disabled={!hasStarted}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title="Reset"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={onStepBack}
          disabled={currentStep <= 0}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title="Step Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={onPlayPause}
          disabled={!hasStarted || currentStep >= totalSteps - 1}
          className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/50"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 pl-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={onStepForward}
          disabled={currentStep >= totalSteps - 1}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title="Step Forward"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div className="flex-1 w-full flex items-center gap-3 px-4">
        <span className="text-xs text-slate-400 font-mono w-8 text-right">
          {totalSteps > 0 ? currentStep + 1 : 0}
        </span>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 font-mono w-8">
          {totalSteps}
        </span>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={1500}>Slow</option>
          <option value={800}>Normal</option>
          <option value={300}>Fast</option>
          <option value={100}>Very Fast</option>
        </select>
      </div>
    </div>
  )
}
