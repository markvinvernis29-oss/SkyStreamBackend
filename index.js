const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// --- USER MODEL ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- DATA ---
const localChannels = [
  {
    "id": 1,
    "name": "SuperSport Grandstand",
    "category": "Sports",
    "streamUrl": "http://dailyfunnews.bond/live/MAGDGP1QZ9/Xba4ZIy7G6/326562.m3u8",
    "logoUrl": "https://devcdn.24.co.za/files/supersport/201.png"
  },
  {
    "id": 2,
    "name": "SuperSport Rugby",
    "category": "Sports",
    "streamUrl": "http://czzhamxp.yufengdns.com/live/CZQM65V9/2SDAKY3Y/5716.m3u8",
    "logoUrl": "https://devcdn.24.co.za/files/supersport/211.png"
  },
  {
    "id": 3,
    "name": "SuperSport Cricket",
    "category": "Sports",
    "streamUrl": "http://czzhamxp.yufengdns.com/live/CZQM65V9/2SDAKY3Y/22600.m3u8",
    "logoUrl": "https://www.appcreator24.com/srv/imgs/seccs/38942109_ico.png?ts=1787949168"
  },
  {
    "id": 4,
    "name": "Supersport Football",
    "category": "Sports",
    "streamUrl": "http://4kbydreams.com/live/MAGDGP1QZ9/Xba4ZIy7G6/108902.m3u8",
    "logoUrl": "https://r2.thesportsdb.com/images/media/channel/logo/7lxofw1656964140.png"
  },
  {
    "id": 5,
    "name": "M-Net",
    "category": "Entertainment",
    "streamUrl": "http://czzhamxp.yufengdns.com/live/CZQM65V9/2SDAKY3Y/2432.m3u8",
    "logoUrl": "https://www.appcreator24.com/srv/imgs/seccs/38942030_ico.png?ts=1787997996"
  },
  {
    "id": 6,
    "name": "eNCA",
    "category": "News",
    "streamUrl": "http://4kip55.xyz/live/MAGHXW5N4R/UtgTupuOwy/308525.m3u8",
    "logoUrl": "https://www.appcreator24.com/srv/imgs/seccs/38667244_ico.png?ts=1788000975"
  },
  {
    "id": 7,
    "name": "KykNet",
    "category": "Entertainment",
    "streamUrl": "http://servicepro4.shop/live/MAGDGP1QZ9/Xba4ZIy7G6/326168.m3u8",
    "logoUrl": "https://silwerskermfees.co.za/wp-content/uploads/2024/06/kykNET-Logo_Horiztonal.png"
  },
  {
    "id": 8,
    "name": "KykNet & Kie",
    "category": "Entertainment",
    "streamUrl": "http://4kip55.xyz/live/MAGHXW5N4R/UtgTupuOwy/514606.m3u8",
    "logoUrl": "https://www.appcreator24.com/srv/imgs/seccs/39148524_ico.png?ts=1788035194"
  }
];

const movies = [
  { id: 1, title: "John Wick", year: "2014", category: "Action", poster: "https://upload.wikimedia.org/wikipedia/en/9/98/John_Wick_Teaser_Poster.jpg" },
  { id: 2, title: "Fast X", year: "2023", category: "Action", poster: "https://upload.wikimedia.org/wikipedia/en/b/b2/Fast_X_poster.jpg" },
  { id: 3, title: "The Little Mermaid", year: "2023", category: "Fantasy", poster: "https://upload.wikimedia.org/wikipedia/en/d/d4/The_Little_Mermaid_2023_poster.jpg" },
  { id: 4, title: "Guardians of the Galaxy", year: "2023", category: "Sci-Fi", poster: "https://upload.wikimedia.org/wikipedia/en/7/74/Guardians_of_the_Galaxy_Vol._3_poster.jpg" }
];

const series = [
  { id: 1, title: "The Last of Us", year: "2023", category: "Drama", poster: "https://upload.wikimedia.org/wikipedia/en/4/46/Video_Game_Cover_-_The_Last_of_Us.jpg" },
  { id: 2, title: "Game of Thrones", year: "2011", category: "Fantasy", poster: "https://upload.wikimedia.org/wikipedia/en/d/d8/Game_of_Thrones_Title_Card.jpg" },
  { id: 3, title: "Stranger Things", year: "2016", category: "Sci-Fi", poster: "https://upload.wikimedia.org/wikipedia/en/3/38/Stranger_Things_logo.png" }
];

// --- ROUTES ---
// Updated to include /api prefix to match Android app configuration
app.get('/api/channels', async (req, res) => {
  try {
    // Fetch channels directly from your GitHub raw JSON file
    const githubRawUrl = 'https://raw.githubusercontent.com/markvinvernis29-oss/SkyStreamBackend/main/channels.json';
    const response = await axios.get(githubRawUrl);

    // Send the GitHub channels back to the app
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching channels from GitHub:', error.message);
    // Fallback to local list if GitHub is unreachable
    res.json(localChannels);
  }
});

app.get('/api/movies', async (req, res) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
    const tmdbMovies = response.data.results;

    // For now, we'll return the movie list and fetch trailers individually on the client or via a new endpoint
    const formattedMovies = tmdbMovies.map(m => ({
      id: m.id,
      title: m.title,
      year: m.release_date ? m.release_date.split('-')[0] : "N/A",
      category: "Movie",
      poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
      // Constructing a search-based trailer link as a backup
      trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(m.title + " trailer")}`
    }));

    res.json(formattedMovies);
  } catch (error) {
    console.error('TMDB Movie Fetch Error:', error.message);
    res.json(movies);
  }
});

app.get('/api/movies/:id/trailer', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_API_KEY}`);
    const videos = response.data.results;
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');

    if (trailer) {
      res.json({ success: true, trailerUrl: `https://www.youtube.com/watch?v=${trailer.key}` });
    } else {
      res.status(404).json({ success: false, message: "Trailer not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/series', async (req, res) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
    const tmdbSeries = response.data.results;

    const formattedSeries = tmdbSeries.map(s => ({
      id: s.id,
      title: s.name,
      year: s.first_air_date ? s.first_air_date.split('-')[0] : "N/A",
      category: "Series",
      poster: `https://image.tmdb.org/t/p/w500${s.poster_path}`
    }));

    res.json(formattedSeries);
  } catch (error) {
    console.error('TMDB Series Fetch Error:', error.message);
    res.json(series);
  }
});

// --- AUTH ---
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const newUser = new User({ email, password, name });
    await newUser.save();

    console.log(`New user registered: ${email}`);
    res.json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });

    if (user) {
      res.json({ success: true, message: "Login successful", user: { name: user.name, email: user.email } });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

// TODO: Install google-auth-library (npm install google-auth-library)
// const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = "601404488630-8nvshuqt8iim764chj7t6l0j88c7444c.apps.googleusercontent.com";
// const client = new OAuth2Client(GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body;

  try {
    // Placeholder for Google Token Verification
    console.log("Received Google ID Token:", idToken);

    // In a real app, you would verify it like this:
    /*
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    */

    res.json({ success: true, message: "Login successful", user: { name: "Google User" } });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// Transcoding route for ExoPlayer
app.get('/api/transcode', (req, res) => {
  const streamUrl = req.query.url;
  const resolution = req.query.res || '360';

  if (!streamUrl) {
    console.error('Transcode attempt with no URL');
    return res.status(400).send('No URL provided');
  }

  console.log(`Transcoding starting: ${resolution}p for ${streamUrl}`);

  let scale = '640:360';
  let videoBitrate = '400k';
  let audioBitrate = '64k';

  if (resolution === '720') {
    scale = '1280:720';
    videoBitrate = '1500k';
    audioBitrate = '128k';
  } else if (resolution === '480') {
    scale = '854:480';
    videoBitrate = '800k';
    audioBitrate = '96k';
  }

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'video/mp2t');

  const command = ffmpeg(streamUrl)
    .inputOptions([
        '-user_agent', 'Mozilla/5.0',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '2'
    ])
    .videoFilters(`scale=${scale}`)
    .videoCodec('libx264')
    .audioCodec('aac')
    .format('mpegts')
    // Using outputOptions for bitrates to be more robust
    .outputOptions([
        '-preset ultrafast',
        '-tune zerolatency',
        '-g 15',
        `-b:v ${videoBitrate}`,
        `-b:a ${audioBitrate}`,
        '-maxrate ' + videoBitrate,
        '-bufsize ' + (parseInt(videoBitrate) * 2) + 'k'
    ])
    .on('start', (commandLine) => {
        console.log('Spawned FFmpeg with command: ' + commandLine);
    })
    .on('error', (err) => {
        console.error('FFmpeg Error: ' + err.message);
        if (!res.headersSent) {
            res.status(500).send('Transcoding failed: ' + err.message);
        }
    });

  command.pipe(res, { end: true });

  req.on('close', () => {
    console.log('Client disconnected, killing FFmpeg');
    command.kill('SIGKILL');
  });
});

// Debug route to check FFmpeg installation
app.get('/api/debug/ffmpeg', (req, res) => {
  ffmpeg.getAvailableCodecs((err, codecs) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message, message: "FFmpeg might not be installed" });
    } else {
      res.json({ success: true, message: "FFmpeg is installed and working", codecCount: Object.keys(codecs).length });
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sky Stream backend running on http://localhost:${PORT}`);
});
