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
import { GenericWinnerSlide } from './slides/GenericWinnerSlide';
import { TopStickersSlide } from './slides/TopStickersSlide';
import { StickerPeopleSlide } from './slides/StickerPeopleSlide';
import { NewPeopleSlide } from './slides/NewPeopleSlide';
import type { WrappedData } from './data';

// Intentar cargar datos de sessionStorage (desde upload)
let loadedData: WrappedData | null = null;
const storedData = sessionStorage.getItem('wrappedData');
if (storedData) {
    try {
        loadedData = JSON.parse(storedData);
        console.log('✅ Wrapped data cargado desde sessionStorage:', loadedData);
    } catch (e) {
        console.error('❌ Error parseando wrapped data:', e);
    }
}

// TODO: En el futuro, si no hay datos en sessionStorage, pedirlos a la API
// if (!loadedData) {
//     const response = await fetch('/api/wrapped/latest');
//     loadedData = await response.json();
// }

// Usar datos cargados o datos dummy
const dataToUse = loadedData || wrappedData;

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
    console.warn("⚠️ No Hash found. Using Data from sessionStorage or Dummy Data (Dev Mode)");
    data = dataToUse;
  } else {
    // Production: Redirect to Upload
    console.log("🔄 No data found. Redirecting to upload...");
    window.location.href = '/upload.html';
  }
}

if (data) {
  const story = new StoryController('app');

  // Always show intro and totals
  story.addSlide(new IntroSlide(data));
  if (data.totals) {
    story.addSlide(new TotalsSlide(data));
  }

  // Conditional: New People
  if (data.new_people && data.new_people.length > 0) {
    story.addSlide(new NewPeopleSlide(data));
  }

  // Conditional: Top senders bubble ranking sequence
  if (data.top_senders && data.top_senders.length > 0) {
    story.addSlide(new RankingBubblesSlide(data, false)); // Ranks 2-5
    story.addSlide(new SuspenseSlide("Pero alguien habló más que todos..."));
    story.addSlide(new RankingBubblesSlide(data, true));  // All + Winner reveal
  }

  // Conditional: Most frequent message
  if (data.most_frequent_message && data.most_frequent_message.length > 0) {
    story.addSlide(new MostFrequentMessageSlide(data));
  }

  // Conditional: Top words
  if (data.top_words && data.top_words.length > 0) {
    story.addSlide(new TopWordsSlide(data));
  }

  // Conditional: Top emojis
  if (data.top_emojis && data.top_emojis.length > 0) {
    story.addSlide(new EmojiSlide(data));
  }

  // Conditional: Top Stickers
  if (data.top_stickers && data.top_stickers.length > 0) {
    story.addSlide(new TopStickersSlide(data));
  }

  // Conditional: Sticker People
  if (data.top_sticker_senders && data.top_sticker_senders.length > 0) {
    story.addSlide(new StickerPeopleSlide(data));
  }

  // Conditional: Media Winners
  if (data.most_image_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_image_sender', 'images', 'El Paparazzi del Grupo', '📸', 'fotos'));
  }
  if (data.most_video_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_video_sender', 'videos', 'El Director de Cine', '🎬', 'videos'));
  }
  if (data.most_audio_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_audio_sender', 'audios', 'El Podcaster', '🎙️', 'audios'));
  }
  if (data.most_document_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_document_sender', 'documents', 'La Oficina Andante', '📁', 'archivos'));
  }
  if (data.most_location_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_location_sender', 'locations', 'El Guía Turístico', '📍', 'ubicaciones'));
  }
  if (data.most_poll_starter) {
    story.addSlide(new GenericWinnerSlide(data, 'most_poll_starter', 'polls', 'El Democrático', '📊', 'encuestas'));
  }
  if (data.most_sticker_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_sticker_sender', 'stickers', 'El Dealer de Stickers', '👾', 'stickers'));
  }

  // Conditional: Rankings (Deleters, Editors)
  if (data.top_deleters && data.top_deleters.length > 0) {
    story.addSlide(new GenericWinnerSlide(data, 'top_deleters', 'deleted', 'El Arrepentido', '🗑️', 'mensajes borrados'));
  }
  if (data.top_editors && data.top_editors.length > 0) {
    story.addSlide(new GenericWinnerSlide(data, 'top_editors', 'edited', 'El Indeciso', '✏️', 'mensajes editados'));
  }

  // Conditional: Monthly chart
  if (data.messages_per_month) {
    story.addSlide(new MonthlyChartSlide(data));
  }

  // Conditional: Peak activity day
  if (data.peak_activity_day) {
    story.addSlide(new PeakDaySlide(data));
  }

  // Conditional: Silence streak
  if (data.longest_silence_streak) {
    story.addSlide(new SilenceStreakSlide(data));
  }

  // Conditional: Activity streak
  if (data.longest_activity_streak) {
    story.addSlide(new ActivityStreakSlide(data));
  }

  // Always show outro
  story.addSlide(new OutroSlide(data));

  story.start();
}

