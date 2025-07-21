# 🎙️ OBS Studio Setup Guide for Radio Staff

This guide will help radio staff set up OBS Studio for live streaming to Iconic FM.

## 📥 Download and Install OBS Studio

1. Visit [obsproject.com](https://obsproject.com/)
2. Download OBS Studio for your operating system
3. Install following the setup wizard
4. Launch OBS Studio

## 🔧 Initial Setup

### Step 1: Configure Stream Settings
1. Click **Settings** in the bottom-right corner
2. Select **Stream** from the left menu
3. Configure as follows:
   - **Service**: Custom
   - **Server**: `rtmp://your-domain.com:1935/live`
   - **Stream Key**: (get this from the admin panel)
4. Click **OK**

### Step 2: Configure Output Settings
1. In Settings, select **Output**
2. Set **Output Mode** to "Simple"
3. Configure **Streaming** settings:
   - **Video Bitrate**: 2500 Kbps (or lower if internet is slow)
   - **Audio Bitrate**: 128 (recommended for radio)
4. Click **OK**

### Step 3: Configure Audio Settings
1. In Settings, select **Audio**
2. Set **Sample Rate** to 44.1 kHz
3. Set **Channels** to Stereo
4. Click **OK**

## 🎤 Setting Up Audio Sources

### Adding a Microphone
1. In the **Sources** box, click the **+** button
2. Select **Audio Input Capture**
3. Create new source, name it "Microphone"
4. Select your microphone device
5. Click **OK**

### Adding Music/System Audio
1. Click **+** in Sources
2. Select **Audio Output Capture**
3. Create new source, name it "Music/System Audio"
4. Select your default audio device
5. Click **OK**

### Adding External Audio (DJ Mixer, etc.)
1. Click **+** in Sources
2. Select **Audio Input Capture**
3. Create new source, name it "DJ Mixer" or similar
4. Select your audio interface/mixer
5. Click **OK**

## 🎛️ Audio Mixing

### Adjusting Levels
- Use the **Audio Mixer** panel to adjust volume levels
- Keep levels in the green/yellow range (avoid red)
- Aim for consistent audio levels throughout your show

### Audio Filters (Optional)
1. Right-click on an audio source
2. Select **Filters**
3. Add filters like:
   - **Noise Suppression** (for microphones)
   - **Compressor** (to even out levels)
   - **EQ** (to adjust tone)

## 🔴 Going Live

### Before You Start
1. **Get your Stream Key** from the admin panel
2. **Test your audio levels** - speak into the mic and play music
3. **Check your internet connection** - streaming requires stable upload
4. **Prepare your content** - have music and talking points ready

### Starting Your Stream
1. Click **Start Streaming** in the bottom-right
2. OBS will connect to the server
3. Check the admin panel to confirm your stream is live
4. You should see viewer count start to appear

### During Your Show
1. **Monitor audio levels** - keep them consistent
2. **Update metadata** in the admin panel (Now Playing info)
3. **Watch for connection issues** - red square means problems
4. **Interact with listeners** through chat or social media

### Ending Your Stream
1. Click **Stop Streaming** when finished
2. Your recording will be automatically saved
3. Check the admin panel for stream statistics

## 🎵 Best Practices for Radio

### Audio Quality
- **Use a good microphone** - USB mics work well for beginners
- **Control your environment** - minimize background noise
- **Monitor your levels** - consistent audio is professional audio
- **Use headphones** - prevent feedback and monitor your sound

### Content Flow
- **Plan your show** - have a rough outline
- **Prepare music** - queue up songs in advance
- **Update metadata** - let listeners know what's playing
- **Engage your audience** - talk to your listeners

### Technical Tips
- **Stable internet** - wired connection is better than WiFi
- **Close unnecessary programs** - free up computer resources
- **Have backup content** - in case of technical issues
- **Test before going live** - do a quick sound check

## 🛠️ Troubleshooting

### Can't Connect to Server
- **Check stream key** - make sure it's copied correctly
- **Verify server URL** - ensure it matches exactly
- **Check internet** - test your upload speed
- **Contact admin** - they can check server status

### Audio Issues
- **No sound**: Check audio sources are enabled and not muted
- **Distorted audio**: Lower audio levels or bitrate
- **Echo/feedback**: Use headphones, check for duplicate sources
- **Choppy audio**: Lower bitrate or check internet connection

### Stream Keeps Dropping
- **Internet connection**: Test stability, consider wired connection
- **Lower bitrate**: Reduce video/audio quality settings
- **Close other programs**: Free up bandwidth and CPU
- **Check server status**: Contact admin if issues persist

## 📱 Mobile Streaming (Advanced)

### Using OBS on Mobile
- **iOS**: Use OBS Camera app (limited features)
- **Android**: Use third-party RTMP apps
- **Quality**: Mobile streaming has limitations
- **Backup option**: Good for emergency broadcasts

## 🎯 Quick Reference

### Essential OBS Settings
```
Stream Settings:
- Service: Custom
- Server: rtmp://your-domain.com:1935/live
- Stream Key: [from admin panel]

Output Settings:
- Video Bitrate: 2500 Kbps
- Audio Bitrate: 128 Kbps

Audio Settings:
- Sample Rate: 44.1 kHz
- Channels: Stereo
```

### Pre-Stream Checklist
- [ ] Stream key entered correctly
- [ ] Audio sources added and tested
- [ ] Levels adjusted properly
- [ ] Internet connection stable
- [ ] Content prepared
- [ ] Admin panel accessible

### During Stream Checklist
- [ ] Monitor audio levels
- [ ] Update Now Playing info
- [ ] Watch connection status
- [ ] Engage with audience
- [ ] Have backup content ready

## 🆘 Getting Help

### If You Need Support
1. **Check this guide first** - most issues are covered here
2. **Test with simple setup** - one mic, one music source
3. **Contact technical support** - provide error messages
4. **Have backup plan** - phone-in or pre-recorded content

### Contact Information
- **Technical Support**: [your-support-email]
- **Admin Panel**: [your-admin-url]
- **Emergency Contact**: [emergency-number]

---

## 🎉 You're Ready to Broadcast!

With OBS Studio configured, you can now:
- Stream live audio to Iconic FM
- Mix multiple audio sources
- Monitor your broadcast quality
- Engage with your audience
- Create professional radio shows

Remember: **Practice makes perfect!** Do a few test streams to get comfortable with the software before your first live show.

Happy broadcasting! 🎙️📻