# TaskPilot AI ⚡

> **An intelligent, voice-powered task manager and smart scheduler built with React Native and Expo.**

TaskPilot AI transforms the everyday productivity workflow with **Techna**, an AI voice assistant designed to capture, schedule, and organize tasks effortlessly through voice or intuitive touch controls.

---

## ✨ Key Features

### 🎙️ Techna AI Voice Assistant
- **Interactive Multi-Modal Creation**: Add tasks through voice commands or keyboard input seamlessly.
- **3-Step Guided Dialogue**:
  1. **Task Title**: Natural speech recognition identifies the task title and category.
  2. **Smart Scheduling**: Extracts spoken dates (*"Tomorrow"*, *"Next Monday"*, *"Oct 15"*) and times (*"10 AM"*, *"6 PM"*).
  3. **Priority & Confirmation**: Assigns priority levels (*Urgent*, *High*, *Medium*, *Low*) with visual `"Done ✓"` status milestones.
- **Animated Techna Orb**: Vibrant ambient glowing aura, pulsing animations, and live audio frequency wave visualization.
- **Voice Feedback & Synthesis**: Speaks back confirmations and prompts using speech synthesis.

### 📅 Smart Scheduling & Conflict Resolution
- **Automatic Collision Checking**: Detects if your requested time slot overlaps with an existing task.
- **🔄 Shift Occupied Slot**: If your desired time slot is already taken, you can either pick from suggested alternative slots or **shift the occupied task** to the next available free slot with a single tap or voice command (*"shift"*, *"move it"*).
- **Free Slot Recommendations**: Intelligently computes and recommends open time windows throughout the day.
- **Always-On Notifications**: Visual confirmation that alerts and reminders are enabled for every created task.

### 🛡️ Pure User-Driven Data (Zero Mock Data)
- **Zero Static / Demo Data**: No hardcoded mock events or dummy tasks. The calendar and task list reflect only real, user-created data.
- **Persistent Local Storage**: Powered by `@react-native-async-storage/async-storage` with automatic legacy cache purging and workspace multi-client readiness.

### 🎨 Modern Dark-Mode & Twilight Aesthetics
- **Custom Design System**: Deep obsidian background (`#0D0D11`) with warm peach/amber twilight glow gradients.
- **Real-Time Live Clock & Calendar**: Dynamic header pill displaying current date, month, year, and live ticking seconds.
- **Date Capsule Strip**: Quick horizontal date selector with day numbers and calendar navigation.
- **Swipe-to-Delete with Audio**: Smooth card swipe with authentic macOS trash crumple sound effect.
- **Haptic & Sound Feedback**: Subtle acoustic feedback across picker wheels, toggles, and buttons.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 57](https://expo.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Animations**: React Native Animated API, `expo-linear-gradient`, `@expo/vector-icons`
- **Audio & Voice**: `expo-audio`, `expo-speech`, Web Speech API / Voice recognition
- **Storage**: `@react-native-async-storage/async-storage`
- **Design**: Modern glassmorphism, responsive safe area insets

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Expo Go](https://expo.dev/go) app on your mobile device (iOS / Android) or simulator

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/harsh1523/taskpilot-ai.git
   cd taskpilot-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on target platform:**
   - Press `i` to open in iOS simulator
   - Press `a` to open in Android emulator
   - Press `w` to open in web browser
   - Scan the QR code with Expo Go on your physical iOS or Android device

---

## 📁 Project Structure

```text
taskpilot-ai/
├── assets/                 # App icons, splash screens, and images
├── src/
│   ├── components/         # UI components & screens
│   │   ├── common/             # Reusable design system atoms
│   │   │   ├── CalendarPickerView.tsx   # Interactive month matrix & jump presets
│   │   │   ├── CircleIconButton.tsx     # Standardized acoustic circle icon button
│   │   │   ├── PrioritySelector.tsx     # Reusable priority pills & selector
│   │   │   ├── TechnaOrb.tsx            # Animated glowing orb & soundwave visualizer
│   │   │   └── TimeSlotPicker.tsx       # Duration chips & slot collision detector
│   │   ├── CreateTaskModal.tsx          # Task creation modal container
│   │   ├── CreateTaskScreen.tsx         # Detailed task customization screen
│   │   ├── DateCapsulePicker.tsx        # Horizontal date strip picker
│   │   ├── Header.tsx                   # Live real-time clock & filter segment
│   │   ├── IsometricCubeIllustration.tsx # Geometric 3D vector illustration
│   │   ├── ModernTimePicker.tsx         # Wheel time & duration picker
│   │   ├── OnboardingScreen.tsx         # Welcome & introduction screen
│   │   ├── SplashScreenView.tsx         # Branded startup animated splash
│   │   ├── TaskItem.tsx                 # Swipeable task card with delete sound
│   │   ├── TechnaDisplayBorderGlow.tsx  # Dynamic border aura animation
│   │   └── VoiceTaskModal.tsx           # Techna AI voice assistant modal
│   ├── services/           # Business logic & audio/storage engines
│   │   ├── soundEffects.ts              # Synthesized ticks & Techna TTS
│   │   ├── taskStorage.ts               # Local persistence engine
│   │   ├── trashSoundData.ts            # High-fidelity macOS trash audio data
│   │   ├── voiceParser.ts               # NLP date/time & priority parser
│   │   └── voiceRecognition.ts          # Cross-platform speech-to-text
│   ├── theme/
│   │   └── colors.ts                    # Harmonious palette & styling tokens
│   ├── types/
│   │   └── task.ts                      # Data models & TypeScript interfaces
│   └── utils/
│       └── scheduleUtils.ts             # Centralized schedule, conflict & date utilities
├── App.tsx                 # Root application container & state orchestration
├── app.json                # Expo application configuration
├── package.json            # Project dependencies & scripts
└── tsconfig.json           # TypeScript configuration
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npx expo start` | Starts the Expo development server |
| `npx expo start --ios` | Launches the app in the iOS Simulator |
| `npx expo start --android` | Launches the app in the Android Emulator |
| `npx expo start --web` | Starts the web version in your browser |
| `npx tsc --noEmit` | Runs TypeScript typecheck |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
