import './style.css'
import { StoryController } from './core/StoryController';
import { decodeAndDecompress } from './utils/compression';
import { importKey, decryptData } from './utils/encryption';
import { getFromKV } from './services/kvService';
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
import { AwardsIntroSlide } from './slides/AwardsIntroSlide';
import { AwardsOutroSlide } from './slides/AwardsOutroSlide';
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

// initialize
if (!document.querySelector('#app')) throw new Error("App container not found");


let data: WrappedData | null = null;

// 1. Try to get data from URL Params (Cloudflare KV)
const urlParams = new URLSearchParams(window.location.search);
const kvKey = urlParams.get('kv');
const encKeyB64 = urlParams.get('enc');

if (kvKey && encKeyB64) {
  try {
    console.log('📡 Carga desde link compartido detectada...');
    const encrypted = await getFromKV(kvKey);
    const cryptoKey = await importKey(encKeyB64);
    const compressed = await decryptData(encrypted, cryptoKey);
    data = decodeAndDecompress(compressed);

    if (data) {
      console.log("✅ Data loaded from KV", data);
      // Guardar las llaves para que el botón de compartir sepa que ya existe el link
      sessionStorage.setItem('shareKeys', JSON.stringify({ kv: kvKey, enc: encKeyB64 }));
    } else {
      throw new Error("No se pudo decompressar la data de KV");
    }
  } catch (e) {
    console.error("❌ Failed to load from shared link", e);
    window.location.href = '/error.html';
  }
}

// 2. Try to get data from Hash (Legacy/Direct)
if (!data) {
  const hash = window.location.hash.substring(1);
  if (hash) {
    try {
      // Need to import decodeBase62 if used here
      const { decodeBase62 } = await import('./utils/base62');
      const uint8 = decodeBase62(hash);
      data = decodeAndDecompress(uint8);
      console.log("✅ Data loaded from URL Hash", data);
    } catch (e) {
      console.error("❌ Failed to decode hash", e);
    }
  }
}

// 3. Fallback to sessionStorage
if (!data) {
  if (loadedData) {
    data = loadedData;
  } else {
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
    story.addSlide(new SuspenseSlide("Pero alguien escribió más que todos los demás..."));
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

  // Awards Intro (only if there are any winners)
  const hasAnyWinner = data.most_image_sender || data.most_video_sender || data.most_audio_sender ||
    data.most_document_sender || data.most_location_sender || data.most_poll_starter ||
    data.most_sticker_sender || (data.top_deleters && data.top_deleters.length > 0) ||
    (data.top_editors && data.top_editors.length > 0);

  if (hasAnyWinner) {
    story.addSlide(new AwardsIntroSlide());
  }

  // Conditional: Media Winners
  if (data.most_image_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_image_sender', 'images', 'El Paparazzi', '📸', 'fotos'));
  }
  if (data.most_video_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_video_sender', 'videos', 'El Director', '🎬', 'videos'));
  }
  if (data.most_audio_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_audio_sender', 'audios', 'El Podcaster', '🎙️', 'audios'));
  }
  if (data.most_document_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_document_sender', 'documents', 'EL Bibliotecario', '📁', 'archivos'));
  }
  if (data.most_location_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_location_sender', 'locations', 'El Aventurero', '🗺️', 'ubicaciones'));
  }
  if (data.most_poll_starter) {
    story.addSlide(new GenericWinnerSlide(data, 'most_poll_starter', 'polls', 'El Democrático', '📊', 'encuestas'));
  }
  if (data.most_sticker_sender) {
    story.addSlide(new GenericWinnerSlide(data, 'most_sticker_sender', 'stickers', 'Stickerman', '👾', 'stickers'));
  }

  // Conditional: Rankings (Deleters, Editors)
  if (data.top_deleters && data.top_deleters.length > 0) {
    story.addSlide(new GenericWinnerSlide(data, 'top_deleters', 'deleted', 'El Arrepentido', '🗑️', 'mensajes borrados'));
  }
  if (data.top_editors && data.top_editors.length > 0) {
    story.addSlide(new GenericWinnerSlide(data, 'top_editors', 'edited', 'El Indeciso', '✏️', 'mensajes editados'));
  }

  // Awards Outro (only if there were winners)
  if (hasAnyWinner) {
    story.addSlide(new AwardsOutroSlide());
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

