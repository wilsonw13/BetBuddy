# Development Setup Guide (Windows + WSL 2)

This guide details how to set up your development environment on Windows using WSL 2 (Fedora/Ubuntu/Debian) to run the frontend, backend, and connect to an Android emulator.

## Prerequisites

Ensure you have the following installed on your **Windows machine**:

1.  **WSL 2**: Install WSL and a Linux distribution (like Fedora, Ubuntu, Debian).
    - [Official WSL Installation Guide](https://learn.microsoft.com/en-us/windows/wsl/install)
2.  **Windows 11 (Version 22H2 or higher)**: Required for WSL Mirrored Networking Mode.
    - Check version: `Win + R`, type `winver`.
3.  **WSL Version 2.0.0+**: Required for Mirrored Networking Mode.
    - Check version in PowerShell: `wsl --version`. Update if necessary: `wsl --update`.
4.  **Android Studio**: Needed to manage the Android Emulator and SDK components on Windows.
    - [Download Android Studio](https://developer.android.com/studio)
    - During setup wizard, choose **Standard** installation.
5.  **Node.js**: Install the LTS version for Windows.
    - [Download Node.js](https://nodejs.org/en/download)
6.  **Docker Desktop**: Configured to use the WSL 2 backend.
    - [Install Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
    - [Enable WSL 2 Backend](https://docs.docker.com/desktop/settings/windows/#wsl-integration)

---

## Configure WSL Networking (Mirrored Mode)

Mirrored mode simplifies networking between Windows and WSL, often eliminating manual firewall rules and port forwarding for localhost access.

1.  **Create/Edit `.wslconfig`**:
    - Open **PowerShell** (not WSL).
    - Run the following commands to ensure the correct settings are in the file:

      ```powershell
      # Create the file if it doesn't exist and add the header
      if (-not (Test-Path "$env:USERPROFILE\.wslconfig")) { '[wsl2]' | Out-File "$env:USERPROFILE\.wslconfig" -Encoding utf8 } else { if (-not (Select-String -Path "$env:USERPROFILE\.wslconfig" -Pattern '\[wsl2\]')) { '[wsl2]' | Add-Content "$env:USERPROFILE\.wslconfig" -Encoding utf8 } }

      # Remove any existing networkingMode line
      (Get-Content "$env:USERPROFILE\.wslconfig") | Where-Object { $_ -notmatch 'networkingMode=' } | Set-Content "$env:USERPROFILE\.wslconfig"

      # Add the mirrored mode setting under the [wsl2] header
      '"networkingMode=mirrored"' | Add-Content "$env:USERPROFILE\.wslconfig" -Encoding utf8
      ```

2.  **Restart WSL**:
    - In **PowerShell**: `wsl --shutdown`
    - Wait a few seconds before opening your WSL terminal for the next steps.

---

## WSL Setup

Perform these steps inside your **WSL terminal** (adjust package manager commands based on your distribution).

1.  Install Global Node Packages:
    - Install `pnpm`:
      ```bash
      npm i -g pnpm@latest
      ```

2.  Install OpenJDK 17 (Java):
    - Gradle requires a Java Development Kit.

      ```bash
      # For Fedora/RHEL-based:
      sudo dnf install java-17-openjdk-devel

      # For Debian/Ubuntu-based:
      sudo apt update && sudo apt install openjdk-17-jdk
      ```

3.  Install Android Command-Line Tools:
    - Create the SDK directory:
      ```bash
      mkdir -p ~/Android/sdk
      ```
    - Download and place the tools:
      ```bash
      cd /tmp
      wget [https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip](https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip)
      unzip commandlinetools-linux-*.zip
      mkdir -p ~/Android/sdk/cmdline-tools
      mv cmdline-tools ~/Android/sdk/cmdline-tools/latest
      ```

4.  Install Android SDK Packages:
    - Navigate to the `sdkmanager` directory:
      ```bash
      cd ~/Android/sdk/cmdline-tools/latest/bin
      ```
    - Accept licenses:
      ```bash
      ./sdkmanager --licenses
      # Press 'y' and Enter for each license
      ```
    - Install required packages:
      ```bash
      ./sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
      ```
    - Install `adb` system-wide if not already present via `platform-tools` installation PATH (step 5):

      ```bash
      # For Fedora/RHEL-based:
      sudo dnf install android-tools

      # For Debian/Ubuntu-based:
      sudo apt install adb
      ```

5.  Set Environment Variables:
    - Edit your shell configuration file (`~/.bashrc` for Bash, `~/.zshrc` for Zsh):
      ```bash
      code -r ~/.bashrc
      ```
    - Add the following lines to the end of the file. **Note**: We do _not_ set `WSL_HOST` or `ADB_SERVER_SOCKET` when using Mirrored Mode. Replace `/home/YOUR_USERNAME/` if your home directory differs.
      ```bash
      # Android SDK for Build Tools (Gradle)
      export ANDROID_HOME="/home/YOUR_USERNAME/Android/sdk"
      export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
      export PATH=$PATH:$ANDROID_HOME/platform-tools
      export PATH=$PATH:$ANDROID_HOME/emulator
      export PATH=$PATH:$ANDROID_HOME/build-tools/35.0.0 # Adjust if you installed a different build-tools version
      ```

6.  Activate Environment Variables:
    - Reload your shell configuration:

      ```bash
      # If using Bash
      source ~/.bashrc

      # If using Zsh
      source ~/.zshrc
      ```

    - Verify `ANDROID_HOME` is set:
      ```bash
      echo $ANDROID_HOME
      # Should output /home/<USERNAME>/Android/sdk
      ```

---

## Running the Project (General: Windows, macOS, Linux, WSL)

1. **Install Project Dependencies**
   - In your terminal, at the project root:
     ```bash
     pnpm install
     ```

2. **Start Docker Services**
   - Ensure Docker Desktop (or Docker Engine) is running.
   - At the project root:
     ```bash
     docker compose up -d
     ```

3. **Start Backend**
   - In your terminal:
     ```bash
     cd backend
     pnpm dev
     ```
   - _(Keep this terminal running)_

4. **Start Frontend**
   - Open a new terminal window/tab.
   - At the project root:
     ```bash
     pnpm start
     # Or pnpm start:android, pnpm start:ios, pnpm start:web (see package.json scripts)
     ```
   - For Expo/React Native, follow CLI prompts to open on your emulator/device/browser.

5. **Android Emulator (if needed)**
   - Open Android Studio and launch your emulator via **Virtual Device Manager**.
   - Ensure `adb devices` lists your emulator in your terminal.

Your application should now build and launch, connecting frontend and backend via Docker. These steps work for Windows (WSL), macOS, and Linux.
