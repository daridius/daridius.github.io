import './style.css'
import { StoryController } from './core/StoryController';
import { wrappedData } from './data';
import { IntroSlide } from './slides/IntroSlide';
import { TotalsSlide } from './slides/TotalsSlide';
import { RankingSlide } from './slides/RankingSlide';
import { MostFrequentMessageSlide } from './slides/MostFrequentMessageSlide';
import { TopWordsSlide } from './slides/TopWordsSlide';
import { EmojiSlide } from './slides/EmojiSlide';
import { MonthlyChartSlide } from './slides/MonthlyChartSlide';
import { PeakDaySlide } from './slides/PeakDaySlide';
import { SilenceStreakSlide } from './slides/SilenceStreakSlide';
import { ActivityStreakSlide } from './slides/ActivityStreakSlide';
import { OutroSlide } from './slides/OutroSlide';

// Initialize Controller
const story = new StoryController('app');

// Add Slides
story.addSlide(new IntroSlide(wrappedData));
story.addSlide(new TotalsSlide(wrappedData));
story.addSlide(new RankingSlide(wrappedData));
story.addSlide(new MostFrequentMessageSlide(wrappedData));
story.addSlide(new TopWordsSlide(wrappedData));
story.addSlide(new EmojiSlide(wrappedData));
story.addSlide(new MonthlyChartSlide(wrappedData));
story.addSlide(new PeakDaySlide(wrappedData));
story.addSlide(new SilenceStreakSlide(wrappedData));
story.addSlide(new ActivityStreakSlide(wrappedData));
story.addSlide(new OutroSlide(wrappedData));

// Start
story.start();
