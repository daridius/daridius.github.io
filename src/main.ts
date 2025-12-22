import './style.css'
import { StoryController } from './core/StoryController';
import { wrappedData } from './data';
import { decodeAndDecompress } from './utils/compression';
import { IntroSlide } from './slides/IntroSlide';
import { TotalsSlide } from './slides/TotalsSlide';
import { RankingBubblesSlide } from './slides/RankingBubblesSlide';
import { SuspenseSlide } from './slides/SuspenseSlide';
import { MostFrequentMessageSlide } from './slides/MostFrequentMessageSlide';
import { TopWordsSlide } from './slides/TopWordsSlide';
import { EmojiSlide } from './slides/EmojiSlide';
import { MonthlyChartSlide } from './slides/MonthlyChartSlide';
import { PeakDaySlide } from './slides/PeakDaySlide';
import { SilenceStreakSlide } from './slides/SilenceStreakSlide';
import { ActivityStreakSlide } from './slides/ActivityStreakSlide';
import { OutroSlide } from './slides/OutroSlide';
import type { WrappedData } from './data';

// initialize
if (!document.querySelector('#app')) throw new Error("App container not found");


let data: WrappedData | null = null;

// 1. Try to get data from Hash
const hash = window.location.hash.substring(1);
if (hash) {
  try {
    data = decodeAndDecompress(hash);
    console.log("✅ Data loaded from URL Hash", data);
  } catch (e) {
    console.error("❌ Failed to decode hash", e);
  }
}

// 2. If no hash, check for Dev Mode or Redirect
if (!data) {
  if (import.meta.env.DEV) {
    console.warn("⚠️ No Hash found. Using Dummy Data (Dev Mode)");
    data = wrappedData;
  } else {
    // Production: Redirect to Upload
    console.log("🔄 No data found. Redirecting to upload...");
    window.location.href = '/upload.html';
  }
}

if (data) {
  const story = new StoryController('app');

  story.addSlide(new IntroSlide(data));
  story.addSlide(new TotalsSlide(data));

  // New Bubble Ranking Sequence
  story.addSlide(new RankingBubblesSlide(data, false)); // Ranks 2-5
  story.addSlide(new SuspenseSlide("Pero alguien habló más que todos..."));
  story.addSlide(new RankingBubblesSlide(data, true));  // All + Winner reveal

  story.addSlide(new MostFrequentMessageSlide(data));
  story.addSlide(new TopWordsSlide(data));
  story.addSlide(new EmojiSlide(data));
  story.addSlide(new MonthlyChartSlide(data));
  story.addSlide(new PeakDaySlide(data));
  story.addSlide(new SilenceStreakSlide(data));
  story.addSlide(new ActivityStreakSlide(data));
  story.addSlide(new OutroSlide(data));

  story.start();
}

