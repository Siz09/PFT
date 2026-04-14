import { TrendingUp, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { MOCK_WEEKLY_INSIGHT } from '../constants';

export default function Stats() {
  const { savingsRate, vsGoal, summary, topCategories, anomalies, tips } = MOCK_WEEKLY_INSIGHT;
  const highlightKeywords = ['12% lower', 'resulting in $45 monthly savings'];
  const summarySentences = summary.match(/[^.!?]+[.!?]?/g)?.map((item) => item.trim()).filter(Boolean) ?? [];
  const handleShare = () => {
    window.alert('Share summary coming soon.');
  };

  return (
    <div className="flex flex-col gap-10 pb-32">
      <header className="pt-4">
        <h1 className="text-4xl font-bold tracking-tight">Week of Apr 7–13, 2026</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="flex flex-col gap-8">
          {/* Savings Rate */}
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Weekly Savings Rate</h3>
            <div className="flex items-center gap-4">
              <span className="text-7xl font-bold tracking-tighter">{savingsRate}%</span>
              <TrendingUp size={32} className="text-black" />
            </div>
            <p className="text-sm font-medium text-gray-400">
              Excellent! You're <span className="text-black font-bold">{vsGoal}%</span> above your goal.
            </p>
          </section>

          {/* AI Summary */}
          <section className="bg-gray-50/30 rounded-3xl p-6 border border-gray-100">
            <p className="text-lg font-medium leading-relaxed text-gray-800">
              {summarySentences.map((sentence, i) => (
                <span
                  key={i}
                  className={
                    highlightKeywords.some((keyword) => sentence.includes(keyword))
                      ? 'font-bold text-black'
                      : ''
                  }
                >
                  {sentence}{' '}
                </span>
              ))}
            </p>
          </section>

          {/* Top Categories */}
          <section className="flex flex-col gap-6">
            <h3 className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Top Spending Categories</h3>
            <div className="flex flex-col gap-6">
              {topCategories.map((cat, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-lg font-medium">{cat.category}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-bold">${cat.amount.toFixed(2)}</span>
                    <span
                      className={`text-xs font-bold ${
                        cat.change > 0 ? 'text-emerald-600' : cat.change < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {cat.change > 0 ? '+' : ''}{cat.change}% vs last week
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-12">
          {/* Anomalies */}
          <section className="flex flex-col gap-6">
            <h3 className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Spending Anomalies</h3>
            <div className="flex flex-col gap-8">
              {anomalies.map((anomaly, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">{anomaly.title}</h4>
                  </div>
                  <p className="text-base text-gray-500 font-medium leading-snug">
                    {anomaly.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Actionable Tips */}
          <section className="flex flex-col gap-6">
            <h3 className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Actionable Tips</h3>
            <div className="flex flex-col gap-8">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-lg font-bold">{i + 1}.</span>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-lg">{tip.title}</h4>
                    <p className="text-base text-gray-500 font-medium leading-snug">
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-3 py-4 border border-black rounded-2xl font-bold hover:bg-black hover:text-white transition-all group"
          >
            <Share2 size={20} />
            Share Summary
          </button>
        </div>
      </div>
    </div>
  );
}
