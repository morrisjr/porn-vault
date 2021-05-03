## 0.27.0

### Highlights

#### ✨ Initial transcoding support
More files can now be scanned and played in the app thanks to cpu/gpu transcoding. The supported extensions are `.m4v, .mp4, .mov, .wmv, .avi, .mpg, .mpeg, .rmvb, .rm, .flv, .asf, .mkv, .webm,`.  
Scenes can be played via multiple streaming methods:
- `direct play:` the file is sent straight to the browser
- `mkv direct stream:` an MKV file an MP4 compatible video stream is remuxed to MP4. Low cpu requirements
- `mp4 transcode:` hardware acceleration possible (`transcode.h264` in config)
- `webm transcode:` cpu acceleration only (`transcode.webm` in config)

Scenes will attempt to play in this order, going to the next streaming method if the browser fails to play the current stream.  

🚧 ATTENTION: This feature is still in development and may not work exactly perfectly. For large files, this may not be fast enough. You can try adjusting the new transcode settings in your config file.  
Additionally only the `vaapi, amf, qsv` methods have been tested by only a couple of people. Feel free to test and report your setup.


#### ✨ Improved video player
Added playback rate controls, fit width/height, theater mode, improved scrubbing experience, better touch support, tap to seek.  
> The scrubbing hover zone is bigger  
> ![Peek 2021-04-05 16-47](https://user-images.githubusercontent.com/17180727/113587189-b8525e80-962e-11eb-915b-6ad6eadc16e0.gif)

#### ✨ New markers page
There is now a new markers page to manage all the markers created. You can also jump directly to the scene's page at the marker's time.

#### ✨ Initial data support in plugins
Plugins can now access the initial state of items for richer queries or data manipulation.  
For plugin developers, this means that you can now access more data such as a scene's studio, its actors, its movies...
For example, a scene matcher plugin can use the scene's studio in its queries, or a renamer plugin can use these values to insert them into the filename.  
From the user's standpoint, nothing changes but your plugins can only get better !

### 💥 Migration guide

- `$cheerio` has been removed from the plugin function context. Any plugin that uses cheerio must be updated and will not be backwards compatible with 0.26
- - Plugin devs: you must now import it directly: `import cheerio from "cheerio"`
- - Plugin users: you should download updated versions of your plugins

### 🐛 Bug fixes
- **ui:** video previews were offset by 2% in video player ([#1254](https://github.com/porn-vault/porn-vault/pull/1254))
- **ui:** only show custom fields applicable to actors on Actors List page ([b1b091c](https://github.com/porn-vault/porn-vault/commit/b1b091c6e9c8e89dca64530bce6e0f9447efc7a5))
- **ui** app bar would disappear when navigating backwards ([#1369](https://github.com/porn-vault/porn-vault/pull/1369))
- **ui** scene hover preview could show two images at once ([#1378](https://github.com/porn-vault/porn-vault/pull/1378))))
- **ui** show studio name as fallback when no thumbnail exists in scene,movie details ([#1378](https://github.com/porn-vault/porn-vault/pull/1378))
- **processing** processing would fail when using a self-signed https cert ([#1368](https://github.com/porn-vault/porn-vault/pull/1368))
- **scene:** prevent changing a scene's path to another scene's path ([8f361c](https://github.com/porn-vault/porn-vault/commit/8f361c405bdd669c38822cec3f60de65521c9d94))
- **scene:** deleting the first screenshot would delete the thumbnail ([#1318](https://github.com/porn-vault/porn-vault/pull/1318))
- **scene:** moving a scene in the `sceneCreated` event would cause thumbnail/preview generation to fail ([753968](https://github.com/porn-vault/porn-vault/commit/75396899447c537c876c514c290b687a4eae4c43))
- **movie:** could not delete a movie ([#1341](https://github.com/porn-vault/porn-vault/pull/1341))
- **label:** only match the created label ([#1317](https://github.com/porn-vault/porn-vault/pull/1317))
- **logs:** log files could exceed the max ([#1319](https://github.com/porn-vault/porn-vault/pull/1319))

### ⚡️ Enhancements
- **scanner/player:** scan more video formats, transcode on demand ([#1287](https://github.com/porn-vault/porn-vault/pull/1287)) ([#1436](https://github.com/porn-vault/porn-vault/pull/1436))
- **ui:** various video player enhancements ([#1254](https://github.com/porn-vault/porn-vault/pull/1254))
- - add playback rate controls
- - add theater mode
- - add fit width/height button
- - show scrubbing time under preview
- - add play/pause & scrubbing touch support
- - tap to seek backwards/forwards on the left/right 25% of the video
- - facilitate scrubbing by increasing the hover zone height
- **ui:** show aliases of actors and studios in combobox options ([#1380](https://github.com/porn-vault/porn-vault/pull/1380))
- **ui** reorganize settings page ([#927](https://github.com/porn-vault/porn-vault/pull/927))
- **ui** automatic light/dark theme (when no theme has been selected) ([#927](https://github.com/porn-vault/porn-vault/pull/927))
- **ui** new markers page ([#822](https://github.com/porn-vault/porn-vault/pull/822))
- **player** configure jump duration in ui settings ([#927](https://github.com/porn-vault/porn-vault/pull/927))
- **search:** don't add default filter values to url ([#1384](https://github.com/porn-vault/porn-vault/pull/1384))
- **plugins:** add `util` as `ctx.$util`
- **plugins:** add plugin metadata support ([#1424](https://github.com/porn-vault/porn-vault/pull/1424))
- **logs:** log graphql errors ([#1360](https://github.com/porn-vault/porn-vault/pull/1360))
