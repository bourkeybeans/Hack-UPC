# Hack-UPC - ClarityOS

- Harnessing a new level on efficiency and focus using an EEG brain scanner
  
## Inspiration
- We have always wanted to do a brain controlled project, and took the opportunity when we saw the EEG scanner.

## What it does
- Connect wirelessly through bluetooth using bleak, decoding live bluetooth binary data into EEG sample packets, these are ran through a fast fourier transform to extract and categorise types of brain waves (alpha, beta, gamma etc..) and approximate focus live. 

- Train your focus through flappy focus, a brain controlled implementation of flappy bird, that reads live EEG brain waves detecting blinking signals to enforce jumping mechanics. Control your focus, lose control and it'll flap out of control.

## How we built it
- **Hardware Communication**: We built a custom Python backend using FastAPI and Bleak to establish a Bluetooth Low Energy (BLE) connection to the headset, pulling the raw binary data across the room in real-time.
- **The Pipeline:** We set up a high-throughput WebSocket stream to bridge our backend and frontend, firing live EEG telemetry packets directly to the client through a dedicated ConnectionManager -> BrainPipeline -> MetricComputator -> Dashboard.
- **Visualizing the Mind:** We built a dashboard using React, Vite, and Tailwind CSS. We hooked up Chart.js to an HTML Canvas to render a live, rolling window of the user's brainwave data in the Neural Visualiser, Brain Wave + Focus Dashboard, and the FlappyFocus Game.
- **Blink Detection Algorithm:**  Instead of relying on a heavy machine-learning model, we wrote a lightweight frontend algorithm that monitors the AF7 (frontal) EEG channel. By calculating voltage deltas on the fly, it reliably detects the massive microvolt spikes caused by eye blinks to trigger jumps in the game.

## Challenges we ran into
- Reverse engineering headset communication protocols, to extract raw binary data and transform it into usable EEG data. 
- Processing multiple channels of brainwave data, to approximate when the user is truly focused, and compute a metric that signifies that.
- Finding a reliable and strong enough brain signal to effectively control a live game, hands free, from across the room.

## Accomplishments that we're proud of
- Reverse engineering the transmission protocol to decode raw binary data from Bluetooth into EEG channel data. 
- Performing FFT analysis to categorise brainwaves and approximate focus
- Actually then brain controlling flappy bird.
- Getting more than 10 points on said game.

## What we learned
- Techniques for analysing and interpreting brain data and characteristics of brain wave types, particularly when under focus or distraction.
- Brain waves are not reliable, difficult to work with and change hugely person to person.
- We need better hardware.

## What's next for ClarityOS
- Contact Max Wilson @UON to get some real neuro gear.
- Have permenant data and logins, to track levels of deep work across time periods + more brain controlled games as they are cool.
- Music system based on brain state would also be pretty cool!
