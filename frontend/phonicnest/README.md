# React Native App with Expo SDK 53

A beautiful React Native application built with Expo SDK 53, featuring animated screens and smooth navigation.

## Features

- **Splash Screen**: Animated bouncing emoji with app logo
- **Welcome Screen**: Animated kid using laptop with welcome message
- **Sign Up Screen**: Complete registration form with email, password fields
- **Login Screen**: User authentication with email and password
- **Forgot Password Screen**: Password recovery via email
- **Recovery Password Screen**: Password reset with code verification
- **Login Success Screen**: Success confirmation with welcome message
- **Smooth Navigation**: React Navigation stack for seamless screen transitions
- **Responsive Design**: Optimized for both iOS and Android
- **Pixel-Perfect UI**: Exact implementation of Figma designs

## Project Structure

```
myApp/
├── assets/                 # Images and icons
├── components/            # Reusable UI components
│   └── AppNavigator.js   # Navigation setup
├── screens/              # Application screens
│   ├── SplashScreen.js   # Animated splash screen
│   ├── WelcomeScreen.js  # Welcome with animated kid
│   ├── SignUpScreen.js   # User registration
│   ├── LoginScreen.js    # User authentication
│   ├── ForgotPasswordScreen.js    # Password recovery
│   ├── RecoveryPasswordScreen.js  # Password reset
│   ├── LoginSuccessScreen.js     # Login success confirmation
│   ├── SignUpSuccessScreen.js    # Sign up success confirmation
│   ├── StudentDashboard.js       # Main student dashboard
│   └── StudentDashboard2.js      # Sidebar menu dashboard
├── App.js                # Main application component
├── package.json          # Dependencies and scripts
└── README.md            # Project documentation
```

## Screen Details

### 1. SplashScreen
- **Features**: Animated bouncing, scaling, and rotating emoji character
- **Navigation**: Automatically navigates to Welcome screen after 3 seconds
- **Design**: Dark blue background (#2D479D) with centered content

### 2. WelcomeScreen
- **Features**: Animated kid using laptop, welcome text, action buttons
- **Navigation**: 
  - "I'm new at app_name" → SignUpScreen
  - "I have an Account" → LoginScreen
- **Design**: Dark blue background with light gray content area

### 3. SignUpScreen
- **Features**: Email, password, confirm password fields, sign up button, Google sign up
- **Navigation**: On success → SignUpSuccessScreen
- **Design**: Dark blue background with light gray form card

### 4. LoginScreen
- **Features**: Email, password fields, forgot password link, login button
- **Navigation**: On success → LoginSuccessScreen
- **Design**: Dark blue background with light gray content area

### 5. ForgotPasswordScreen
- **Features**: Email input, send email button, other options text
- **Navigation**: On press → RecoveryPasswordScreen
- **Design**: Dark blue background with white form card

### 6. RecoveryPasswordScreen
- **Features**: Reset code, new password, confirm password fields, done button
- **Navigation**: On press → LoginSuccessScreen
- **Design**: Dark blue background with light gray form card

### 7. LoginSuccessScreen
- **Features**: Success message and welcome text
- **Design**: Dark blue background with white horizontal divider and centered text

### 8. SignUpSuccessScreen
- **Features**: Success message and welcome text
- **Design**: Dark blue background with white horizontal divider and centered text

### 9. StudentDashboard
- **Features**: Main dashboard with four interactive cards (Record Video, Tasks, Progress, Upload Video)
- **Navigation**: 
  - Hamburger menu → StudentDashboard2
  - All cards have interactive functionality
- **Design**: Dark blue header (#2D479D) with light gray content area and 2x2 card grid

### 10. StudentDashboard2
- **Features**: Sidebar menu with navigation options and two main cards
- **Navigation**: 
  - Back button → StudentDashboard
  - Menu items: Dashboard, Profile, Contact, Complaints, Help, Settings, Log Out
- **Design**: Split layout with white sidebar and light gray content area

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd myApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your preferred platform**
   - **iOS**: Press `i` in terminal (requires Xcode on Mac)
   - **Android**: Press `a` in terminal (requires Android Studio)
   - **Web**: Press `w` in terminal
   - **Physical Device**: Scan QR code with Expo Go app

## Dependencies

- **Expo SDK 53**: Core framework
- **React Navigation**: Screen navigation
- **React Native**: Mobile app framework
- **Animated API**: Smooth animations and transitions

## Animation Details

### SplashScreen Animations
- **Emoji Bounce**: Continuous up-down movement
- **Emoji Scale**: Subtle size pulsing
- **Emoji Rotation**: Gentle spinning motion

### WelcomeScreen Animations
- **Kid Bounce**: Gentle up-down movement
- **Laptop Glow**: Subtle scaling effect
- **Button Press**: Scale animation on touch

## Color Palette

- **Primary Blue**: #2D479D (Background)
- **Secondary Blue**: #4A70E2 (Buttons, Links)
- **Light Gray**: #E8E8E8 (Content Areas)
- **White**: #FFFFFF (Cards, Text)
- **Black**: #000000 (Text, Labels)

## Navigation Flow

```
Splash → Welcome → SignUp → SignUpSuccess → StudentDashboard
           ↓
        Login → LoginSuccess → StudentDashboard
           ↓
    ForgotPassword → RecoveryPassword → LoginSuccess → StudentDashboard
           ↓
    StudentDashboard ↔ StudentDashboard2 (hamburger menu)
```

## Development Notes

- All screens use `StyleSheet` for styling
- Responsive design using `Dimensions` API
- Clean component structure with proper separation of concerns
- Consistent navigation patterns throughout the app
- Pixel-perfect implementation matching Figma designs

## Contributing

1. Follow the existing code style
2. Ensure all screens maintain the design consistency
3. Test navigation flows thoroughly
4. Update documentation for any new features

## License

This project is licensed under the MIT License.
