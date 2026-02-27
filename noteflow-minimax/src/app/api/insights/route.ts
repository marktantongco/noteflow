import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries, logs, analysisType } = body;

    const insights: string[] = [];
    const patterns: { label: string; value: number }[] = [];
    let riskLevel = 1;

    if (entries && entries.length > 0) {
      const avgMood = entries.reduce((sum: number, e: { mood: number }) => sum + e.mood, 0) / entries.length;
      const avgCraving = entries.reduce((sum: number, e: { cravingLevel: number }) => sum + e.cravingLevel, 0) / entries.length;

      if (analysisType === 'patterns' || analysisType === 'risk') {
        const triggerCounts: Record<string, number> = {};
        entries.forEach((e: { triggers: string[] }) => {
          e.triggers.forEach((t: string) => {
            triggerCounts[t] = (triggerCounts[t] || 0) + 1;
          });
        });
        Object.entries(triggerCounts).forEach(([label, value]) => {
          patterns.push({ label, value });
        });
      }

      if (analysisType === 'risk') {
        riskLevel = Math.min(10, Math.round(avgCraving + (logs?.length || 0) * 0.1));
      }

      if (analysisType === 'suggestions' || analysisType === 'patterns') {
        if (avgMood >= 7) {
          insights.push('Your mood has been consistently positive. Keep up the great work!');
        } else if (avgMood < 5) {
          insights.push('Your mood has been low. Consider reaching out to your support network.');
        }

        if (avgCraving <= 3) {
          insights.push('Cravings are well managed. Your coping strategies are working effectively.');
        } else if (avgCraving >= 7) {
          insights.push('High craving levels detected. Review your triggers and consider additional support.');
        }

        const dayCravings: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        entries.forEach((e: { date: string; cravingLevel: number }) => {
          const day = new Date(e.date).getDay();
          dayCravings[day].push(e.cravingLevel);
        });
        
        let maxDay = 0;
        let maxAvg = 0;
        Object.entries(dayCravings).forEach(([day, levels]) => {
          if (levels.length > 0) {
            const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
            if (avg > maxAvg) {
              maxAvg = avg;
              maxDay = parseInt(day);
            }
          }
        });

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        if (maxAvg > 5) {
          insights.push(`Cravings tend to be highest on ${days[maxDay]}s. Plan extra support for these days.`);
        }
      }
    }

    if (insights.length === 0) {
      insights.push('Keep logging your entries to receive personalized insights.');
    }

    return NextResponse.json({
      insights,
      patterns: patterns.slice(0, 6),
      riskLevel,
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
