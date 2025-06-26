# 🎥 Video Diary MVP  
*A voice-first journaling experience.*

This is a minimal, functional MVP for a voice/video diary app that helps users **record thoughts**, **transcribe them instantly**, and **review them clearly** — all in one calming, clean space. The core idea is simple:

> Talk to your phone → Get your words back → See your mind more clearly.

---

## 🧩 Core Workflow

1. **Record** an audio (or video) entry — just tap and speak naturally.
2. The app uses **OpenAI Whisper** to transcribe your voice to text.
3. A **GPT model** automatically adds punctuation, paragraphs, and structure.
4. You can **toggle between the raw and cleaned-up versions** of your transcript.
5. All entries are saved in a **scrollable list**, organized by date.

---

## 🧠 Long-Term Vision

This app is built on a simple insight:  
> We think better when we speak — and even better when we can read it back.

By turning spontaneous thoughts into structured reflections, this tool can evolve into:

- 🧘‍♂️ A private **therapy companion**  
- 🙏 A space for **prayers or spiritual journaling**  
- 📚 A tool for **students or interns** to record meetings  
- 🎙️ A creator’s **voice notebook**  
- 💬 A habit-forming **self-talk space**

The possibilities grow from one core loop: **record → transcribe → reflect.**

---

## 🎨 Design Principles

- **Calm and minimal** — inspired by Apple Notes
- **Warm and clear** — like being alone in a white room with a mirror
- **Typography**: Instrument Serif for titles, Inter or Satoshi for body text
- **Colors**: Soft ivory background, charcoal text, no distractions
- **Layout**: White space, rounded corners, cozy tab switch between raw and cleaned-up views

---

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo
- **Audio recording**: `expo-av`
- **Transcription**: OpenAI Whisper API
- **Text cleanup**: OpenAI GPT (or placeholder function)
- **Storage**: AsyncStorage or SQLite (local only for MVP)

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/haojiw/video-diary.git
cd video-diary
````

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file with your own api keys:

```
OPENAI_API_KEY=sk-...
```

### 4. Run the app

```bash
npx expo start
```

---

## 📍 Roadmap

* [ ] Support for video recording (with audio extraction)
* [ ] Timeline or calendar view
* [ ] Search/filter by topic or emotion
* [ ] “Mirror” AI assistant that references your past thoughts
* [ ] Multilingual transcription (Chinese support)
* [ ] Export options (journal, PDF, content archive)

---

## ✍️ Why build this?

Because voice is the most natural way we think.
Because your thoughts deserve structure, not chaos.
Because talking to yourself — done right — is powerful.

---

## 📫 Contact

Made by [@haojiw](https://github.com/haojiw)
Inspired by real voice notes, long drives, and late-night self-reflection.
