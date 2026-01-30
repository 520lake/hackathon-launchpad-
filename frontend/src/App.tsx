import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Navbar */}
      <nav className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">VibeBuild</div>
          <div className="space-x-4">
            <button className="px-4 py-2 text-sm font-medium hover:text-blue-600 transition">登录</button>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg">注册</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 dark:bg-blue-900/30 rounded-full">
          AI 驱动的黑客松生态
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          让创意
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mx-2">
            触手可及
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          赋能每一个创造者，将伟大的想法变为现实。连接创意、人才与机会，推动黑客松文化走向大众。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            发起活动
          </button>
          <button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm hover:shadow-md">
            探索黑客松
          </button>
        </div>
      </header>

      {/* Features Grid (Simple) */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">为什么选择 VibeBuild?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:border-blue-500/30 transition group">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition">🤖</div>
            <h3 className="text-xl font-bold mb-3">AI 智能副驾</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">一键生成活动策划、文案与规则，让组织黑客松变得前所未有的简单。</p>
          </div>
          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:border-purple-500/30 transition group">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition">🤝</div>
            <h3 className="text-xl font-bold mb-3">智能组队匹配</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">基于技能与兴趣的 AI 匹配算法，助你找到最合拍的队友。</p>
          </div>
          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:border-green-500/30 transition group">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition">💡</div>
            <h3 className="text-xl font-bold mb-3">创意创新套件</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">从创意风暴到商业计划书，全流程 AI 辅助，加速想法落地。</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 mt-12">
        <p>© 2024 VibeBuild. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
